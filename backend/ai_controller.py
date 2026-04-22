"""
AI-basierter Energie-Controller
================================

Integriert DQN/PPO Agenten für Echtzeit-Energiesteuerung.
"""

import os
import sys
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
import numpy as np
import pandas as pd

# Add missing import for EnergySystem
from energy_system import EnergySystem

# Projekt-Module importieren
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from dqn_agent import DQNAgent, PPOAgent
from rl_environment import EnergyManagementEnv
from data_generator import TimeSeriesGenerator

logger = logging.getLogger(__name__)


class AIEnergyController:
    """
    KI-basierter Energie-Controller für Echtzeit-Steuerung
    
    Nutzt vortrainierte DQN/PPO Modelle für intelligente
    Lade-/Entlade-Entscheidungen basierend auf:
    - Aktuellem PV-Ertrag
    - Grid-Preisen
    - SOC von EV und Batterie
    - Haushaltsverbrauch
    - Wetterbedingungen
    """
    
    def __init__(
        self,
        agent_type: str = "dqn",  # 'dqn' oder 'ppo'
        model_path: Optional[str] = None,
        pv_capacity: float = 10.0,  # kW
        battery_capacity: float = 13.5,  # kWh
        ev_capacity: float = 75.0,  # kWh
        household_base_load: float = 0.3,  # kW
        location: str = "Berlin"
    ):
        self.agent_type = agent_type.lower()
        self.model_path = model_path
        
        # System-Konfiguration
        self.pv_capacity = pv_capacity
        self.battery_capacity = battery_capacity
        self.ev_capacity = ev_capacity
        self.household_base_load = household_base_load
        self.location = location
        
        # AI Agent
        self.agent = None
        self.env = None
        self.is_trained = False
        
        # Aktueller Zustand
        self.current_state = None
        self.last_action = None
        self.last_decision_time = None
    
    async def initialize(self):
        """Initialisiert den AI-Controller"""
        try:
            logger.info(f"🤖 Initialisiere AI-Controller (Typ: {self.agent_type})")
            
            # Umgebung erstellen
            self.env = self._create_environment()
            
            # Agent erstellen
            state_dim = self.env.observation_space.shape[0]
            action_dim = self.env.action_space.n
            
            if self.agent_type == "dqn":
                self.agent = DQNAgent(
                    state_dim=state_dim,
                    action_dim=action_dim,
                    learning_rate=0.001,
                    gamma=0.99,
                    epsilon=0.1  # Niedrig für Produktion
                )
            elif self.agent_type == "ppo":
                self.agent = PPOAgent(
                    state_dim=state_dim,
                    action_dim=action_dim,
                    learning_rate=0.0003
                )
            else:
                raise ValueError(f"Unbekannter Agent-Typ: {self.agent_type}")
            
            # Modell laden falls vorhanden
            if self.model_path and os.path.exists(self.model_path):
                self.agent.load(self.model_path)
                self.is_trained = True
                logger.info(f"✅ Modell geladen: {self.model_path}")
            else:
                logger.warning("⚠️  Kein vortrainiertes Modell - Agent arbeitet im Lernmodus")
            
            logger.info("✅ AI-Controller initialisiert")
            
        except Exception as e:
            # Wichtig: Fehler loggen, aber Controller in sicherem Fallback-Zustand belassen
            logger.error(f"❌ Fehler bei Initialisierung des AI-Controllers: {e}")
            self.agent = None
            self.env = None
            self.is_trained = False
    
    def _create_environment(self) -> EnergyManagementEnv:
        """Erstellt die RL-Umgebung"""
        # Dummy TimeSeriesGenerator für Struktur
        # Create EnergySystem with required parameters
        # Mapping der Parameter auf EnergySystem
        # Beispielwerte für Standort Berlin, Kapazitäten und Lasten
        energy_system = EnergySystem(
            location_lat=52.52,
            location_lon=13.41,
            building_area_m2=100,
            building_volume_m3=250,
            specific_heat_demand_kw_per_m2=0.08
        )
       
        
        energy_system.timeseries_data = echte_zeitdaten
        
        env = EnergyManagementEnv(
            energy_system=energy_system,
            start_date=datetime.now(),
            timeseries_data=echte_zeitdaten,
            pv_capacity_kw=self.pv_capacity,
            battery_capacity_kwh=self.battery_capacity,
            ev_battery_kwh=self.ev_capacity
        )
        
        return env
    
    async def get_optimal_action(
        self,
        current_data: Dict[str, Any],
        charge_window: Optional[Dict[str, int]] = None,  # z.B. {'start': 22, 'end': 6}
        max_total_power_kw: Optional[float] = 11.0,  # Peak Shaving Limit
        pv_surplus_only: bool = False
    ) -> Dict[str, Any]:
        """
        Berechnet optimale Aktion basierend auf aktuellem Zustand
        
        Args:
            current_data: Aktuelle Systemdaten
                {
                    'pv_power': 5.2,  # kW
                    'battery_soc': 65.0,  # %
                    'ev_soc': 45.0,  # %
                    'household_load': 1.5,  # kW
                    'grid_price': 0.28,  # €/kWh
                    'hour': 14,  # Stunde des Tages
                    'temperature': 22.0  # °C
                }
            charge_window: Optional Ladefenster (Stunden, 24h-Format, z.B. {'start': 22, 'end': 6})
            max_total_power_kw: Optional Gesamtleistungs-Limit (Peak Shaving)
            pv_surplus_only: Wenn True, nur PV-Überschuss laden
        Returns:
            dict: Empfohlene Aktionen
                {
                    'ev_charge_rate': 0.0-11.0,  # kW
                    'battery_charge_enable': bool,
                    'battery_discharge_enable': bool,
                    'grid_import': float,  # kW
                    'explanation': str,
                    'confidence': float
                }
        """
        try:
            # Wenn der Agent nicht initialisiert werden konnte, direkt sichere Fallback-Aktion verwenden
            if self.agent is None:
                logger.warning("⚠️ AI-Controller ohne initialisierten Agenten – verwende Fallback-Aktion")
                return self._get_fallback_action(current_data)

            # State-Vector erstellen
            state = self._create_state_vector(current_data)
            self.current_state = state
            
            # Action vom Agent erhalten
            if self.agent_type == "dqn":
                action_idx = self.agent.select_action(state, greedy=True)
            else:  # PPO
                action_idx, _ = self.agent.select_action(state)
            
            # Action in konkrete Steuerung umwandeln
            action_details = self._decode_action(action_idx, current_data)

            # --- Erweiterung: Ladefenster, PV-Überschuss, Peak Shaving ---
            hour = current_data.get('hour', datetime.now().hour)
            # Ladefenster prüfen
            if charge_window:
                start = charge_window.get('start', 22)
                end = charge_window.get('end', 6)
                in_window = False
                if start < end:
                    in_window = start <= hour < end
                else:
                    in_window = hour >= start or hour < end
                if not in_window:
                    action_details['ev_charge_rate'] = 0.0
                    action_details['explanation'] += f" | Außerhalb Ladefenster ({start}:00-{end}:00)"

            # PV-Überschuss-Laden
            if pv_surplus_only:
                pv_power = current_data.get('pv_power', 0)
                action_details['ev_charge_rate'] = min(action_details['ev_charge_rate'], max(0.0, pv_power))
                action_details['explanation'] += f" | PV-Überschuss: max {pv_power:.1f} kW"

            # Peak Shaving/Load Balancing
            if max_total_power_kw is not None:
                total = action_details['ev_charge_rate']
                if action_details.get('battery_charge_enable'):
                    total += 2.0  # Annahme: 2kW für Batterie
                if total > max_total_power_kw:
                    scaling = max_total_power_kw / total
                    action_details['ev_charge_rate'] *= scaling
                    if action_details.get('battery_charge_enable'):
                        # Batterie-Leistung anteilig reduzieren
                        action_details['battery_charge_power'] = 2.0 * scaling
                    action_details['explanation'] += f" | Peak Shaving aktiv: Gesamtleistung auf {max_total_power_kw} kW begrenzt"

            self.last_action = action_details
            self.last_decision_time = datetime.now()

            logger.info(f"🤖 AI-Entscheidung: {action_details['explanation']}")

            return action_details
            
        except Exception as e:
            logger.error(f"❌ Fehler bei AI-Entscheidung: {e}")
            # Fallback: Sichere Standard-Aktion
            return self._get_fallback_action(current_data)
    
    def _create_state_vector(self, data: Dict[str, Any]) -> np.ndarray:
        """Erstellt State-Vector aus aktuellen Daten"""
        state = np.array([
            data.get('hour', 12) / 24.0,  # Normalisiert [0, 1]
            data.get('pv_power', 0) / self.pv_capacity,  # Normalisiert
            data.get('battery_soc', 50) / 100.0,
            data.get('ev_soc', 50) / 100.0,
            data.get('household_load', 1.0) / 5.0,  # Angenommen max 5kW
            data.get('grid_price', 0.28) / 0.50,  # Normalisiert auf max 50ct/kWh
            1 if data.get('ev_connected', False) else 0,
            data.get('temperature', 20) / 40.0,  # Normalisiert -10°C bis 40°C
        ], dtype=np.float32)
        
        return state
    
    def _decode_action(
        self,
        action_idx: int,
        current_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Konvertiert Action-Index in konkrete Steuerungsbefehle
        
        Action Space (vereinfacht):
        0: Nichts tun
        1: EV laden (niedrig, 3.7kW)
        2: EV laden (mittel, 7.4kW)
        3: EV laden (hoch, 11kW)
        4: Batterie laden
        5: Batterie entladen
        6: EV + Batterie laden
        """
        pv_power = current_data.get('pv_power', 0)
        battery_soc = current_data.get('battery_soc', 50)
        ev_soc = current_data.get('ev_soc', 50)
        grid_price = current_data.get('grid_price', 0.28)
        # hour entfernt (war unused)
        # Standard-Werte
        ev_charge_rate = 0.0
        battery_charge = False
        battery_discharge = False
        explanation = ""
        confidence = 0.8 if self.is_trained else 0.5
        
        if action_idx == 0:
            explanation = "Keine Aktion - System im Gleichgewicht"
        
        elif action_idx == 1:
            ev_charge_rate = 3.7
            explanation = f"EV laden mit 3.7kW (Niedrig) - SOC: {ev_soc}%"
        
        elif action_idx == 2:
            ev_charge_rate = 7.4
            explanation = f"EV laden mit 7.4kW (Mittel) - SOC: {ev_soc}%"
        
        elif action_idx == 3:
            ev_charge_rate = 11.0
            explanation = f"EV laden mit 11kW (Hoch) - PV: {pv_power}kW verfügbar"
        
        elif action_idx == 4:
            battery_charge = True
            explanation = f"Batterie laden - SOC: {battery_soc}%, Preis: {grid_price}€/kWh"
        
        elif action_idx == 5:
            battery_discharge = True
            explanation = f"Batterie entladen - SOC: {battery_soc}%, Preis: {grid_price}€/kWh"
        
        elif action_idx == 6:
            ev_charge_rate = 7.4
            battery_charge = True
            explanation = f"EV + Batterie laden - PV: {pv_power}kW"
        
        # Grid-Import berechnen
        total_demand = (
            current_data.get('household_load', 1.0) +
            ev_charge_rate +
            (2.0 if battery_charge else 0)
        )
        grid_import = max(0, total_demand - pv_power)
        
        return {
            'ev_charge_rate': ev_charge_rate,
            'battery_charge_enable': battery_charge,
            'battery_discharge_enable': battery_discharge,
            'grid_import': grid_import,
            'grid_export': max(0, pv_power - total_demand),
            'explanation': explanation,
            'confidence': confidence,
            'action_idx': action_idx,
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_fallback_action(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sichere Fallback-Aktion bei AI-Fehler"""
        return {
            'ev_charge_rate': 0.0,
            'battery_charge_enable': False,
            'battery_discharge_enable': False,
            'grid_import': data.get('household_load', 1.0),
            'grid_export': 0.0,
            'explanation': "Fallback: Keine AI-Aktion - nur Haushaltsversorgung",
            'confidence': 0.3,
            'action_idx': 0,
            'timestamp': datetime.now().isoformat()
        }
    
    async def optimize_schedule(
        self,
        forecast_data: List[Dict[str, Any]],
        horizon_hours: int = 24
    ) -> List[Dict[str, Any]]:
        """
        Optimiert Energiemanagement für die nächsten X Stunden
        
        Args:
            forecast_data: Vorhersage-Daten für jeden Zeitschritt
            horizon_hours: Planungshorizont in Stunden
        
        Returns:
            list: Optimaler Aktionsplan
        """
        schedule = []
        
        for hour_data in forecast_data[:horizon_hours]:
            action = await self.get_optimal_action(hour_data)
            schedule.append({
                'hour': hour_data.get('hour'),
                'action': action,
                'expected_cost': self._calculate_cost(action, hour_data),
                'expected_co2': self._calculate_co2(action, hour_data)
            })
        
        return schedule
    
    def _calculate_cost(self, action: Dict, data: Dict) -> float:
        """Berechnet Kosten einer Aktion"""
        grid_price = data.get('grid_price', 0.28)
        grid_import = action.get('grid_import', 0)
        return grid_import * grid_price
    
    def _calculate_co2(self, action: Dict, data: Dict) -> float:
        """Berechnet CO2-Emissionen einer Aktion"""
        co2_intensity = data.get('grid_co2_intensity', 0.4)  # kg/kWh
        grid_import = action.get('grid_import', 0)
        return grid_import * co2_intensity
    
    def get_status(self) -> Dict[str, Any]:
        """Gibt aktuellen Controller-Status zurück"""
        return {
            'agent_type': self.agent_type,
            'is_trained': self.is_trained,
            'model_path': self.model_path,
            'last_decision': self.last_decision_time.isoformat() if self.last_decision_time else None,
            'last_action': self.last_action,
            'system_config': {
                'pv_capacity_kw': self.pv_capacity,
                'battery_capacity_kwh': self.battery_capacity,
                'ev_capacity_kwh': self.ev_capacity,
                'location': self.location
            }
        }


# Singleton-Instanz für FastAPI
_controller_instance: Optional[AIEnergyController] = None


async def get_ai_controller() -> AIEnergyController:
    """Gibt Singleton-Instanz des AI-Controllers zurück"""
    global _controller_instance
    
    if _controller_instance is None:
        _controller_instance = AIEnergyController(
            agent_type=os.getenv("AI_AGENT_TYPE", "dqn"),
            model_path=os.getenv("AI_MODEL_PATH"),
            pv_capacity=float(os.getenv("PV_CAPACITY_KW", "10.0")),
            battery_capacity=float(os.getenv("BATTERY_CAPACITY_KWH", "13.5")),
            ev_capacity=float(os.getenv("EV_CAPACITY_KWH", "75.0"))
        )
        await _controller_instance.initialize()
    
    return _controller_instance

echte_zeitdaten = pd.read_csv("data/zeitreihen.csv")
