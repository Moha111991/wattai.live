import numpy as np
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta


class EnergyManagementEnv:
    """
    Gymnasium-kompatibles Environment für Reinforcement Learning
    des Energiemanagementsystems
    """
    
    def __init__(self, energy_system, start_date: datetime, scenario: str = "summer", 
                 episode_length: int = 24, timeseries_data=None, pv_capacity_kw=None, battery_capacity_kwh=None, ev_battery_kwh=None):
        """
        energy_system: EnergySystem Instanz
        start_date: Startdatum der Simulation
        scenario: "summer", "winter", oder "spring"
        episode_length: Länge einer Episode in Stunden
        """
        self.energy_system = energy_system
        self.start_date = start_date
        self.scenario = scenario
        self.episode_length = episode_length
        
        self.current_step = 0
        self.current_time = start_date
        
        # Observation space: [hour, day_of_week, pv_gen, household_load, battery_soc, 
        #                     ev_soc, grid_price, ev_present]
        self.observation_space_shape = (8,)

        # Optional: timeseries data für echte Zeitreihen
        self.timeseries_data = timeseries_data
        self.pv_capacity_kw = pv_capacity_kw
        self.battery_capacity_kwh = battery_capacity_kwh
        self.ev_battery_kwh = ev_battery_kwh
        
        # Action space: [ev_charge_rate (0-1), v2g_enable (0-1), hp_enable (0-1)]
        self.action_space_shape = (3,)
        
        # Gewichtungen für Reward-Funktion
        self.cost_weight = 1.0
        self.co2_weight = 0.5
        self.autarky_weight = 0.3
        self.comfort_weight = 0.2
        
    def reset(self) -> np.ndarray:
        """
        Setzt das Environment zurück
        """
        self.current_step = 0
        self.current_time = self.start_date
        
        # System zurücksetzen
        self.energy_system.battery_soc = 0.5
        self.energy_system.ev_soc = np.random.uniform(0.3, 0.7)
        
        return self._get_observation()
    
    def _get_observation(self) -> np.ndarray:
        """
        Erstellt Observation-Vektor für den RL-Agent
        """
        hour = self.current_time.hour / 24.0  # Normalisiert
        day_of_week = self.current_time.weekday() / 7.0
        
        # Vorhersage für nächste Stunde
        pv_gen = self.energy_system.get_pv_generation(self.current_time, self.scenario) / self.energy_system.pv_power
        household_load = self.energy_system.get_household_load(self.current_time) / 5.0  # Normalisiert auf max ~5kW
        
        battery_soc = self.energy_system.battery_soc
        ev_soc = self.energy_system.ev_soc
        
        grid_price = self.energy_system.get_dynamic_grid_price(self.current_time) / 0.40  # Normalisiert
        
        _, ev_present = self.energy_system.get_ev_charging_need(self.current_time)
        ev_present_flag = 1.0 if ev_present else 0.0
        
        obs = np.array([
            hour,
            day_of_week,
            pv_gen,
            household_load,
            battery_soc,
            ev_soc,
            grid_price,
            ev_present_flag
        ], dtype=np.float32)
        
        return obs
    
    def _action_to_dict(self, action: np.ndarray) -> Dict[str, float]:
        """
        Konvertiert RL-Action zu System-Action
        action: [ev_charge_enable (0-1), v2g_enable (0-1), hp_enable (0-1)]
        """
        ev_charge_enable = action[0] > 0.5
        v2g_enable = action[1] > 0.5
        hp_enable = action[2] > 0.5
        
        return {
            'ev_charge_enable': ev_charge_enable,
            'v2g_active': v2g_enable,
            'hp_active': hp_enable
        }
    
    def _calculate_reward(self, state: Dict[str, float]) -> float:
        """
        Berechnet Reward basierend auf:
        - Kosten (minimieren)
        - CO2 (minimieren)
        - Autarkiegrad (maximieren)
        - Komfort (Batterie- und EV-SOC im optimalen Bereich)
        """
        # Kosten-Komponente (negativ, da minimieren)
        cost_reward = -state['cost'] * self.cost_weight
        
        # CO2-Komponente (negativ, da minimieren)
        co2_reward = -state['co2'] * self.co2_weight
        
        # Autarkie-Komponente (positiv, da maximieren)
        autarky_reward = state['autarky'] * self.autarky_weight
        
        # Komfort-Komponente: SOC im optimalen Bereich
        battery_comfort = 1.0 - abs(state['battery_soc'] - 0.6)  # Optimal bei 60%
        ev_comfort = 1.0 - abs(state['ev_soc'] - 0.5)  # Optimal bei 50%
        comfort_reward = (battery_comfort + ev_comfort) / 2 * self.comfort_weight
        
        # Penalty für zu niedrige SOC
        if state['battery_soc'] < 0.2:
            comfort_reward -= 0.5
        if state['ev_soc'] < 0.2:
            comfort_reward -= 0.5
        
        # Bonus für hohen Eigenverbrauch
        self_consumption_bonus = state['self_consumption_rate'] * 0.1
        
        total_reward = (cost_reward + co2_reward + autarky_reward + 
                       comfort_reward + self_consumption_bonus)
        
        return total_reward
    
    def step(self, action: np.ndarray) -> Tuple[np.ndarray, float, bool, Dict]:
        """
        Führt einen Zeitschritt aus
        
        Returns:
            observation: Neuer Zustand
            reward: Belohnung
            done: Episode beendet
            info: Zusätzliche Informationen
        """
        # Action ausführen
        action_dict = self._action_to_dict(action)
        state = self.energy_system.step(action_dict, self.current_time, self.scenario)
        
        # Reward berechnen
        reward = self._calculate_reward(state)
        
        # Zeitschritt erhöhen
        self.current_step += 1
        self.current_time += timedelta(hours=1)
        
        # Episode beendet?
        done = self.current_step >= self.episode_length
        
        # Nächste Observation
        obs = self._get_observation()
        
        # Info
        info = {
            'state': state,
            'cost': state['cost'],
            'co2': state['co2'],
            'autarky': state['autarky'],
            'self_consumption_rate': state['self_consumption_rate']
        }
        
        return obs, reward, done, info


class SimpleRLAgent:
    """
    Einfacher RL-Agent basierend auf Q-Learning Prinzipien
    (Simplified DQN ohne neuronale Netze für schnelle Demonstration)
    """
    
    def __init__(self, learning_rate: float = 0.01, epsilon: float = 0.1,
                 gamma: float = 0.95):
        self.learning_rate = learning_rate
        self.epsilon = epsilon  # Exploration rate
        self.gamma = gamma  # Discount factor
        
        # Einfache Policy-Gewichte (wird während Training angepasst)
        self.weights = np.random.randn(8, 3) * 0.1
        
    def get_action(self, observation: np.ndarray, training: bool = True) -> np.ndarray:
        """
        Wählt Action basierend auf Observation
        """
        # Epsilon-greedy Strategie
        if training and np.random.random() < self.epsilon:
            # Exploration: Zufällige Action
            action = np.random.rand(3)
        else:
            # Exploitation: Policy-basierte Action
            action = np.tanh(np.dot(observation, self.weights))
            action = (action + 1) / 2  # Normalisieren auf [0, 1]
        
        return action
    
    def update(self, observation: np.ndarray, action: np.ndarray, 
               reward: float, next_observation: np.ndarray):
        """
        Aktualisiert Agent basierend auf Erfahrung
        Einfaches Policy Gradient Update
        """
        # Berechne Gradient
        predicted_action = np.tanh(np.dot(observation, self.weights))
        predicted_action = (predicted_action + 1) / 2
        
        # Fehler
        error = action - predicted_action
        
        # Gradient Descent Update
        gradient = np.outer(observation, error * reward)
        self.weights += self.learning_rate * gradient
    
    def train(self, env: EnergyManagementEnv, episodes: int = 100):
        """
        Trainiert den Agent
        """
        total_rewards = []
        
        for episode in range(episodes):
            obs = env.reset()
            episode_reward = 0
            done = False
            
            states = []
            actions = []
            rewards = []
            
            while not done:
                # Action wählen
                action = self.get_action(obs, training=True)
                
                # Schritt ausführen
                next_obs, reward, done, info = env.step(action)
                
                # Speichern
                states.append(obs)
                actions.append(action)
                rewards.append(reward)
                
                episode_reward += reward
                obs = next_obs
            
            # Episode Update
            for i in range(len(states)):
                self.update(states[i], actions[i], rewards[i], 
                           states[i+1] if i+1 < len(states) else states[i])
            
            total_rewards.append(episode_reward)
            
            # Epsilon Decay
            self.epsilon = max(0.01, self.epsilon * 0.995)
        
        return total_rewards
