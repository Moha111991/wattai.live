"""
Quick test of multi-season training
"""
from train_agents import train_multi_season_agent

if __name__ == "__main__":
    print("Testing multi-season RL training with reduced episodes...")
    
    # Train with just 10 episodes per season for testing
    agent, summary = train_multi_season_agent(
        agent_type='DQN',
        episodes_per_season=10,
        save_to_db=True,
        verbose=True
    )
    
    print(f"\nTraining completed successfully!")
    print(f"Total episodes: {summary['total_episodes']}")
    print(f"Best reward: {summary['best_reward']:.2f}")
