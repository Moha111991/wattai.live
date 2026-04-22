"""
Enhanced training script for RL agents across multiple seasons
Tracks performance metrics and saves to database
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from energy_system import EnergySystem
from rl_environment import EnergyManagementEnv
from dqn_agent import DQNAgent, PPOAgent
from database import save_training_metrics
import json


def train_multi_season_agent(agent_type='DQN', episodes_per_season=200, 
                              save_to_db=True, verbose=True):
    """
    Train an RL agent across multiple seasons with comprehensive tracking
    
    Args:
        agent_type: 'DQN' or 'PPO'
        episodes_per_season: Number of training episodes per season
        save_to_db: Whether to save metrics to database
        verbose: Print training progress
    
    Returns:
        Trained agent, metrics dictionary
    """
    
    scenarios = ['summer', 'winter', 'spring']
    all_metrics = []
    
    # Initialize agent
    if agent_type == 'DQN':
        agent = DQNAgent(
            state_dim=8,
            action_dim=3,
            learning_rate=0.001,
            gamma=0.95,
            epsilon_start=1.0,
            epsilon_end=0.01,
            epsilon_decay=0.995
        )
    else:  # PPO
        agent = PPOAgent(
            state_dim=8,
            action_dim=3,
            learning_rate=0.001,
            gamma=0.95
        )
    
    episode_number = 0
    best_reward = -float('inf')
    rewards_history = []
    
    if verbose:
        print(f"\n{'='*60}")
        print(f"Training {agent_type} Agent across Multiple Seasons")
        print(f"Episodes per season: {episodes_per_season}")
        print(f"{'='*60}\n")
    
    # Train across all seasons
    for season in scenarios:
        if verbose:
            print(f"\n--- Training on {season.upper()} scenario ---")
        
        # Create environment for this season
        energy_system = EnergySystem()
        start_date = {
            'summer': datetime(2024, 7, 1),
            'winter': datetime(2024, 1, 1),
            'spring': datetime(2024, 4, 1)
        }[season]
        
        env = EnergyManagementEnv(
            energy_system,
            start_date,
            season,
            episode_length=24 * 7  # One week episodes
        )
        
        # Train for specified episodes in this season
        for episode in range(episodes_per_season):
            state = env.reset()
            episode_reward = 0
            episode_cost = 0
            episode_co2 = 0
            done = False
            steps = 0
            
            while not done:
                # Get action
                action = agent.get_action(state, training=True)
                
                # Execute step
                next_state, reward, done, info = env.step(action)
                
                # Update agent
                agent.update(state, action, reward, next_state, done)
                
                episode_reward += reward
                episode_cost += info['state'].get('cost', 0)
                episode_co2 += info['state'].get('co2', 0)
                state = next_state
                steps += 1
            
            # Decay epsilon for DQN
            if agent_type == 'DQN':
                agent.decay_epsilon()
            
            episode_number += 1
            rewards_history.append(episode_reward)
            
            # Track best reward
            if episode_reward > best_reward:
                best_reward = episode_reward
            
            # Calculate moving average (last 100 episodes)
            avg_reward_100 = np.mean(rewards_history[-100:]) if len(rewards_history) >= 100 else np.mean(rewards_history)
            
            # Store metrics
            metric_entry = {
                'agent_type': agent_type,
                'episode': episode_number,
                'timestamp': datetime.now(),
                'episode_reward': episode_reward,
                'episode_cost': episode_cost,
                'episode_co2': episode_co2,
                'epsilon': agent.epsilon if agent_type == 'DQN' else 0.0,
                'learning_rate': agent.learning_rate,
                'avg_reward_100': avg_reward_100,
                'best_reward': best_reward,
                'config_json': {
                    'season': season,
                    'episode_in_season': episode + 1,
                    'total_steps': steps,
                    'gamma': agent.gamma
                }
            }
            all_metrics.append(metric_entry)
            
            # Verbose output
            if verbose and (episode + 1) % 20 == 0:
                print(f"  Episode {episode + 1}/{episodes_per_season} | "
                      f"Reward: {episode_reward:.2f} | "
                      f"Avg(100): {avg_reward_100:.2f} | "
                      f"Cost: {episode_cost:.2f}€ | "
                      f"CO2: {episode_co2:.2f}kg | "
                      f"ε: {agent.epsilon:.3f}" if agent_type == 'DQN' else "")
        
        if verbose:
            season_rewards = rewards_history[-episodes_per_season:]
            print(f"\n  {season.upper()} Training Complete:")
            print(f"    Mean Reward: {np.mean(season_rewards):.2f}")
            print(f"    Std Reward: {np.std(season_rewards):.2f}")
            print(f"    Best Reward: {max(season_rewards):.2f}")
    
    # Save training metrics to database
    if save_to_db:
        try:
            save_training_metrics(all_metrics)
            if verbose:
                print(f"\n✓ Saved {len(all_metrics)} training metrics to database")
        except Exception as e:
            print(f"\n✗ Failed to save training metrics: {e}")
    
    # Summary statistics
    summary = {
        'agent_type': agent_type,
        'total_episodes': episode_number,
        'final_epsilon': agent.epsilon if agent_type == 'DQN' else 0.0,
        'best_reward': best_reward,
        'final_avg_reward_100': avg_reward_100,
        'rewards_history': rewards_history,
        'metrics': all_metrics
    }
    
    if verbose:
        print(f"\n{'='*60}")
        print("Training Summary:")
        print(f"  Total Episodes: {episode_number}")
        print(f"  Best Reward: {best_reward:.2f}")
        print(f"  Final Avg(100): {avg_reward_100:.2f}")
        if agent_type == 'DQN':
            print(f"  Final Epsilon: {agent.epsilon:.4f}")
        print(f"{'='*60}\n")
    
    return agent, summary


def compare_agents_across_seasons(episodes_per_season=150):
    """
    Train and compare DQN and PPO agents across all seasons
    
    Returns:
        Dictionary with comparison results
    """
    print("\n" + "="*70)
    print("COMPARATIVE TRAINING: DQN vs PPO across Multiple Seasons")
    print("="*70)
    
    # Train DQN
    dqn_agent, dqn_summary = train_multi_season_agent(
        agent_type='DQN',
        episodes_per_season=episodes_per_season,
        save_to_db=True,
        verbose=True
    )
    
    # Train PPO
    ppo_agent, ppo_summary = train_multi_season_agent(
        agent_type='PPO',
        episodes_per_season=episodes_per_season,
        save_to_db=True,
        verbose=True
    )
    
    # Comparison
    print("\n" + "="*70)
    print("COMPARISON RESULTS")
    print("="*70)
    print(f"\nDQN Agent:")
    print(f"  Best Reward: {dqn_summary['best_reward']:.2f}")
    print(f"  Final Avg(100): {dqn_summary['final_avg_reward_100']:.2f}")
    
    print(f"\nPPO Agent:")
    print(f"  Best Reward: {ppo_summary['best_reward']:.2f}")
    print(f"  Final Avg(100): {ppo_summary['final_avg_reward_100']:.2f}")
    
    winner = "DQN" if dqn_summary['final_avg_reward_100'] > ppo_summary['final_avg_reward_100'] else "PPO"
    print(f"\n🏆 Winner (by final avg): {winner}")
    print("="*70 + "\n")
    
    return {
        'dqn': {'agent': dqn_agent, 'summary': dqn_summary},
        'ppo': {'agent': ppo_agent, 'summary': ppo_summary},
        'winner': winner
    }


def evaluate_trained_agent(agent, agent_type='DQN', scenario='summer', duration_days=30):
    """
    Evaluate a trained agent on a specific scenario
    
    Returns:
        Performance metrics and simulation results
    """
    energy_system = EnergySystem()
    start_date = {
        'summer': datetime(2024, 7, 1),
        'winter': datetime(2024, 1, 1),
        'spring': datetime(2024, 4, 1)
    }[scenario]
    
    env = EnergyManagementEnv(
        energy_system,
        start_date,
        scenario,
        episode_length=24 * duration_days
    )
    
    state = env.reset()
    results = []
    done = False
    total_reward = 0
    
    while not done:
        action = agent.get_action(state, training=False)
        state, reward, done, info = env.step(action)
        results.append(info['state'])
        total_reward += reward
    
    df = pd.DataFrame(results)
    
    metrics = {
        'scenario': scenario,
        'duration_days': duration_days,
        'total_reward': total_reward,
        'total_cost': df['cost'].sum(),
        'total_co2': df.get('co2', pd.Series([0])).sum(),
        'autarky_rate': df.get('autarky', pd.Series([0])).mean(),
        'self_consumption_rate': df.get('self_consumption_rate', pd.Series([0])).mean()
    }
    
    return metrics, df


if __name__ == "__main__":
    # Example: Train DQN agent across all seasons
    print("Starting multi-season RL agent training...")
    
    # Train single agent
    agent, summary = train_multi_season_agent(
        agent_type='DQN',
        episodes_per_season=200,
        save_to_db=True,
        verbose=True
    )
    
    # Evaluate on summer scenario
    print("\nEvaluating trained agent on 30-day summer scenario...")
    metrics, results_df = evaluate_trained_agent(
        agent,
        agent_type='DQN',
        scenario='summer',
        duration_days=30
    )
    
    print("\nEvaluation Results:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")
    
    print("\nTraining complete!")
