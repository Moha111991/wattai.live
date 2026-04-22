import numpy as np
from typing import Tuple, List, Deque
from collections import deque
import random


class ReplayBuffer:
    """
    Experience Replay Buffer für DQN
    """
    def __init__(self, capacity: int = 10000):
        self.buffer: Deque = deque(maxlen=capacity)
    
    def add(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size: int):
        batch = random.sample(self.buffer, min(batch_size, len(self.buffer)))
        states, actions, rewards, next_states, dones = zip(*batch)
        return (np.array(states), np.array(actions), np.array(rewards), 
                np.array(next_states), np.array(dones))
    
    def __len__(self):
        return len(self.buffer)


class DQNAgent:
    """
    Deep Q-Network Agent für Energiemanagement
    
    Vereinfachte Implementierung ohne Deep Learning Libraries
    Nutzt mehrschichtige lineare Approximation
    """
    
    def __init__(self, state_dim: int = 8, action_dim: int = 3,
                 learning_rate: float = 0.001, gamma: float = 0.95,
                 epsilon_start: float = 1.0, epsilon_end: float = 0.01,
                 epsilon_decay: float = 0.995):
        """
        Args:
            state_dim: Dimension des State-Space
            action_dim: Dimension des Action-Space  
            learning_rate: Lernrate
            gamma: Discount Factor
            epsilon_start: Initiale Exploration Rate
            epsilon_end: Minimale Exploration Rate
            epsilon_decay: Epsilon Decay Rate
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay
        
        # Q-Network: Zwei-Schicht Approximation
        # Layer 1: state_dim -> hidden_dim
        self.hidden_dim = 64
        self.W1 = np.random.randn(state_dim, self.hidden_dim) * 0.1
        self.b1 = np.zeros(self.hidden_dim)
        
        # Layer 2: hidden_dim -> action_dim
        self.W2 = np.random.randn(self.hidden_dim, action_dim) * 0.1
        self.b2 = np.zeros(action_dim)
        
        # Target Network (für stabiles Training)
        self.W1_target = self.W1.copy()
        self.b1_target = self.b1.copy()
        self.W2_target = self.W2.copy()
        self.b2_target = self.b2.copy()
        
        # Replay Buffer
        self.replay_buffer = ReplayBuffer(capacity=10000)
        self.batch_size = 32
        
        # Statistiken
        self.training_step = 0
        self.update_target_every = 100
        
    def _relu(self, x):
        """ReLU Aktivierungsfunktion"""
        return np.maximum(0, x)
    
    def _forward(self, state, use_target=False):
        """
        Forward Pass durch das Netzwerk
        """
        if use_target:
            h = self._relu(np.dot(state, self.W1_target) + self.b1_target)
            q_values = np.dot(h, self.W2_target) + self.b2_target
        else:
            h = self._relu(np.dot(state, self.W1) + self.b1)
            q_values = np.dot(h, self.W2) + self.b2
        return q_values, h
    
    def get_q_values(self, state):
        """Berechnet Q-Values für alle Aktionen"""
        q_values, _ = self._forward(state, use_target=False)
        return q_values
    
    def get_action(self, state, training=True):
        """
        Wählt Aktion basierend auf Epsilon-Greedy Strategie
        
        Returns: Binärer Action-Vektor [ev_charge, v2g, hp] (0 oder 1)
        """
        if training and np.random.random() < self.epsilon:
            # Exploration: Zufällige Aktion
            action = np.random.randint(0, 2, size=self.action_dim)
        else:
            # Exploitation: Beste Aktion
            q_values = self.get_q_values(state)
            # Jede Dimension unabhängig: Wähle 1 wenn Q-Value > 0
            action = (q_values > 0).astype(int)
        
        return action
    
    def update(self, state, action, reward, next_state, done):
        """
        Fügt Erfahrung zum Replay Buffer hinzu und trainiert
        """
        # Speichern
        self.replay_buffer.add(state, action, reward, next_state, done)
        
        # Training (wenn genug Samples vorhanden)
        if len(self.replay_buffer) >= self.batch_size:
            self._train_step()
            self.training_step += 1
            
            # Target Network Update
            if self.training_step % self.update_target_every == 0:
                self._update_target_network()
    
    def _train_step(self):
        """
        Trainingsschritt mit Mini-Batch
        """
        # Sample Batch
        states, actions, rewards, next_states, dones = \
            self.replay_buffer.sample(self.batch_size)
        
        # Gradient Descent
        for i in range(len(states)):
            state = states[i]
            action = actions[i]
            reward = rewards[i]
            next_state = next_states[i]
            done = dones[i]
            
            # Forward Pass für current state
            q_values, h = self._forward(state)
            
            # Target Q-Value berechnen
            next_q, _ = self._forward(next_state, use_target=True)
            
            # TD Target für jede Aktion separat
            td_targets = q_values.copy()
            
            # Nur die tatsächlich ausgeführten Aktionen updaten
            for action_idx in range(self.action_dim):
                if action[action_idx] == 1:
                    # Aktion wurde ausgeführt: Update mit Bellman-Gleichung
                    # Q(s,a) = r + γ * max Q(s',a')
                    if done:
                        td_targets[action_idx] = reward
                    else:
                        td_targets[action_idx] = reward + self.gamma * np.max(next_q)
                else:
                    # Aktion wurde nicht ausgeführt: Keine Änderung
                    td_targets[action_idx] = q_values[action_idx]
            
            # Berechne Loss und Gradienten nur für ausgeführte Aktionen
            error = q_values - td_targets
            
            # Backward Pass
            # Gradient für W2, b2
            dW2 = np.outer(h, error)
            db2 = error
            
            # Gradient für W1, b1 (Chain Rule)
            dh = np.dot(error, self.W2.T)
            dh[h <= 0] = 0  # ReLU Derivative
            dW1 = np.outer(state, dh)
            db1 = dh
            
            # Update Gewichte
            self.W2 -= self.learning_rate * dW2
            self.b2 -= self.learning_rate * db2
            self.W1 -= self.learning_rate * dW1
            self.b1 -= self.learning_rate * db1
    
    def _update_target_network(self):
        """
        Kopiert Haupt-Netzwerk zu Target-Netzwerk
        """
        self.W1_target = self.W1.copy()
        self.b1_target = self.b1.copy()
        self.W2_target = self.W2.copy()
        self.b2_target = self.b2.copy()
    
    def decay_epsilon(self):
        """
        Reduziert Exploration Rate
        """
        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)
    
    def train(self, env, episodes: int = 100, verbose: bool = False):
        """
        Trainiert den DQN Agent
        
        Args:
            env: EnergyManagementEnv
            episodes: Anzahl Episoden
            verbose: Ausgabe von Fortschritt
        
        Returns:
            Liste der Episode Rewards
        """
        episode_rewards = []
        
        for episode in range(episodes):
            state = env.reset()
            episode_reward = 0
            done = False
            
            while not done:
                # Aktion wählen
                action = self.get_action(state, training=True)
                
                # Schritt ausführen
                next_state, reward, done, info = env.step(action)
                
                # Update
                self.update(state, action, reward, next_state, done)
                
                episode_reward += reward
                state = next_state
            
            # Epsilon Decay
            self.decay_epsilon()
            
            episode_rewards.append(episode_reward)
            
            if verbose and (episode + 1) % 10 == 0:
                avg_reward = np.mean(episode_rewards[-10:])
                print(f"Episode {episode + 1}/{episodes}, "
                      f"Avg Reward (last 10): {avg_reward:.2f}, "
                      f"Epsilon: {self.epsilon:.3f}")
        
        return episode_rewards


class PPOAgent:
    """
    Proximal Policy Optimization (PPO) Agent
    Vereinfachte Implementierung
    """
    
    def __init__(self, state_dim: int = 8, action_dim: int = 3,
                 learning_rate: float = 0.001, gamma: float = 0.95,
                 epsilon_clip: float = 0.2):
        """
        Args:
            state_dim: Dimension des State-Space
            action_dim: Dimension des Action-Space
            learning_rate: Lernrate
            gamma: Discount Factor
            epsilon_clip: PPO Clipping Parameter
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon_clip = epsilon_clip
        
        # Policy Network
        self.hidden_dim = 64
        self.W1 = np.random.randn(state_dim, self.hidden_dim) * 0.1
        self.b1 = np.zeros(self.hidden_dim)
        self.W2 = np.random.randn(self.hidden_dim, action_dim) * 0.1
        self.b2 = np.zeros(action_dim)
        
        # Value Network
        self.W1_v = np.random.randn(state_dim, self.hidden_dim) * 0.1
        self.b1_v = np.zeros(self.hidden_dim)
        self.W2_v = np.random.randn(self.hidden_dim, 1) * 0.1
        self.b2_v = np.zeros(1)
        
        # Buffer für Episode
        self.episode_states = []
        self.episode_actions = []
        self.episode_rewards = []
        
    def _sigmoid(self, x):
        """Sigmoid Aktivierung"""
        return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
    
    def _relu(self, x):
        """ReLU Aktivierung"""
        return np.maximum(0, x)
    
    def _forward_policy(self, state):
        """Policy Network Forward Pass"""
        h = self._relu(np.dot(state, self.W1) + self.b1)
        logits = np.dot(h, self.W2) + self.b2
        probs = self._sigmoid(logits)
        return probs, h
    
    def _forward_value(self, state):
        """Value Network Forward Pass"""
        h = self._relu(np.dot(state, self.W1_v) + self.b1_v)
        value = np.dot(h, self.W2_v) + self.b2_v
        return value[0], h
    
    def get_action(self, state, training=True):
        """Sampelt Aktion aus Policy"""
        probs, _ = self._forward_policy(state)
        
        if training:
            # Sample aus Bernoulli-Verteilung für jede Aktion
            action = (np.random.random(self.action_dim) < probs).astype(int)
        else:
            # Greedy: Wähle wahrscheinlichste Aktion
            action = (probs > 0.5).astype(int)
        
        return action
    
    def store_transition(self, state, action, reward):
        """Speichert Transition für Episode"""
        self.episode_states.append(state)
        self.episode_actions.append(action)
        self.episode_rewards.append(reward)
    
    def update(self):
        """PPO Update nach Episode"""
        if len(self.episode_states) == 0:
            return
        
        states = np.array(self.episode_states)
        actions = np.array(self.episode_actions)
        rewards = np.array(self.episode_rewards)
        
        # Berechne Discounted Returns
        returns = np.zeros_like(rewards)
        running_return = 0
        for t in reversed(range(len(rewards))):
            running_return = rewards[t] + self.gamma * running_return
            returns[t] = running_return
        
        # Normalize Returns
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)
        
        # Update Policy und Value Network
        for state, action, ret in zip(states, actions, returns):
            # Value Network Update
            value, h_v = self._forward_value(state)
            value_error = ret - value
            
            dW2_v = h_v[:, np.newaxis] * value_error
            db2_v = value_error
            dh_v = self.W2_v.flatten() * value_error
            dh_v[h_v <= 0] = 0
            dW1_v = np.outer(state, dh_v)
            db1_v = dh_v
            
            self.W2_v += self.learning_rate * dW2_v
            self.b2_v += self.learning_rate * np.array([db2_v])
            self.W1_v += self.learning_rate * dW1_v
            self.b1_v += self.learning_rate * db1_v
            
            # Policy Network Update
            probs, h = self._forward_policy(state)
            advantage = ret - value
            
            # Policy Gradient
            for a in range(self.action_dim):
                if action[a] == 1:
                    grad = advantage * (1 - probs[a])
                else:
                    grad = -advantage * probs[a]
                
                # Update für diese Aktion
                dW2 = np.outer(h, np.eye(self.action_dim)[a] * grad)
                db2 = np.eye(self.action_dim)[a] * grad
                
                self.W2 += self.learning_rate * dW2
                self.b2 += self.learning_rate * db2
        
        # Clear Episode Buffer
        self.episode_states = []
        self.episode_actions = []
        self.episode_rewards = []
    
    def train(self, env, episodes: int = 100, verbose: bool = False):
        """Trainiert PPO Agent"""
        episode_rewards = []
        
        for episode in range(episodes):
            state = env.reset()
            episode_reward = 0
            done = False
            
            while not done:
                action = self.get_action(state, training=True)
                next_state, reward, done, info = env.step(action)
                
                self.store_transition(state, action, reward)
                episode_reward += reward
                state = next_state
            
            # Update nach Episode
            self.update()
            episode_rewards.append(episode_reward)
            
            if verbose and (episode + 1) % 10 == 0:
                avg_reward = np.mean(episode_rewards[-10:])
                print(f"Episode {episode + 1}/{episodes}, "
                      f"Avg Reward (last 10): {avg_reward:.2f}")
        
        return episode_rewards
