"""
Tests for Deep Deterministic Policy Gradient (DDPG) Agent
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

pytestmark = pytest.mark.skipif(not HAS_TORCH, reason="PyTorch not available")

from legacy_models.inventory_optimization.reinforcement_learning.ddpg import DDPGInventoryAgent
from legacy_models.inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import (
    InventorySimulator,
    InventoryState
)


class TestDDPGInventoryAgent:
    """Test cases for DDPGInventoryAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            device='cpu'
        )
        
        assert agent.state_dim == 11
        assert agent.action_dim == 1
        assert agent.max_action == 200.0
        assert agent.actor is not None
        assert agent.actor_target is not None
        assert agent.critic is not None
        assert agent.critic_target is not None
    
    def test_state_to_tensor(self):
        """Test state conversion."""
        agent = DDPGInventoryAgent(state_dim=11, action_dim=1, device='cpu')
        
        state = InventoryState(
            current_inventory=100.0,
            days_since_order=5,
            pending_order=50.0,
            days_until_arrival=3,
            demand_forecast=10.0,
            demand_std=3.0,
            holding_cost_rate=0.1,
            shortage_cost_rate=5.0,
            ordering_cost=10.0,
            lead_time=7,
            max_capacity=500.0,
            min_order_quantity=0.0,
            max_order_quantity=200.0
        )
        
        state_vector = agent.state_to_tensor(state)
        
        assert state_vector.shape == (11,)
        assert isinstance(state_vector, np.ndarray)
        assert state_vector.dtype == np.float32
    
    def test_select_action(self):
        """Test action selection."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            noise_std=0.0,  # No noise for testing
            device='cpu'
        )
        
        state = InventoryState(
            current_inventory=100.0,
            days_since_order=0,
            pending_order=0.0,
            days_until_arrival=8,
            demand_forecast=10.0,
            demand_std=3.0,
            holding_cost_rate=0.1,
            shortage_cost_rate=5.0,
            ordering_cost=10.0,
            lead_time=7,
            max_capacity=500.0,
            min_order_quantity=0.0,
            max_order_quantity=200.0
        )
        
        action = agent.select_action(state, training=False)
        
        assert isinstance(action, (int, float))
        assert -50 <= action <= 250
    
    def test_select_action_with_noise(self):
        """Test action selection with noise."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            noise_std=0.1,
            device='cpu'
        )
        
        state = InventoryState(
            current_inventory=100.0,
            days_since_order=0,
            pending_order=0.0,
            days_until_arrival=8,
            demand_forecast=10.0,
            demand_std=3.0,
            holding_cost_rate=0.1,
            shortage_cost_rate=5.0,
            ordering_cost=10.0,
            lead_time=7,
            max_capacity=500.0,
            min_order_quantity=0.0,
            max_order_quantity=200.0
        )
        
        action = agent.select_action(state, training=True)
        
        assert action >= 0
        assert action <= 200.0
    
    def test_update_noise(self):
        """Test noise update."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            noise_std=0.5,
            noise_decay=0.9,
            device='cpu'
        )
        
        initial_noise = agent.noise_std
        agent.update_noise()
        
        assert agent.noise_std < initial_noise
        assert agent.noise_std >= 0.01
    
    def test_replay_buffer(self):
        """Test replay buffer."""
        from legacy_models.inventory_optimization.reinforcement_learning.ddpg import ReplayBuffer
        
        buffer = ReplayBuffer(capacity=1000)
        
        # Add experiences
        for i in range(100):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.rand()
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = np.random.rand() > 0.9
            
            buffer.push(state, action, reward, next_state, done)
        
        assert len(buffer) == 100
        
        # Sample batch
        batch = buffer.sample(32)
        states, actions, rewards, next_states, dones = batch
        
        assert len(states) == 32
        assert len(actions) == 32
        assert len(rewards) == 32
        assert len(next_states) == 32
        assert len(dones) == 32
    
    def test_train_step_insufficient_buffer(self):
        """Test training with insufficient buffer."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            batch_size=64,
            device='cpu'
        )
        
        # Add some experiences but not enough
        for i in range(32):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.rand()
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        result = agent.train_step()
        
        assert result is None  # Should not train with insufficient buffer
    
    def test_train_step_sufficient_buffer(self):
        """Test training with sufficient buffer."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            batch_size=32,
            device='cpu'
        )
        
        # Add enough experiences
        for i in range(100):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.rand() * 200.0
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        result = agent.train_step()
        
        assert result is not None
        assert 'actor_loss' in result
        assert 'critic_loss' in result
        assert isinstance(result['actor_loss'], float)
        assert isinstance(result['critic_loss'], float)
    
    def test_save_load(self, tmp_path):
        """Test model save and load."""
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            device='cpu'
        )
        
        # Train a bit
        for i in range(100):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.rand() * 200.0
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        agent.train_step()
        
        # Save
        filepath = tmp_path / "ddpg_model.pt"
        agent.save(str(filepath))
        
        # Load
        agent2 = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            device='cpu'
        )
        agent2.load(str(filepath))
        
        # Check that networks are the same
        state = np.random.randn(11).astype(np.float32)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            a1 = agent.actor(state_tensor)
            a2 = agent2.actor(state_tensor)
        
        assert torch.allclose(a1, a2, atol=1e-6)


class TestDDPGIntegration:
    """Integration tests for DDPG with simulator."""
    
    def test_ddpg_with_simulator(self):
        """Test DDPG agent with inventory simulator."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            demand_mean=10.0,
            demand_std=3.0,
            random_seed=42
        )
        
        agent = DDPGInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            noise_std=0.1,
            device='cpu'
        )
        
        # Run episode
        state = simulator.reset()
        total_reward = 0
        
        for step in range(20):
            action = agent.select_action(state, training=True)
            next_state, reward, done, info = simulator.step(action)
            
            # Store experience
            state_vector = agent.state_to_tensor(state)
            next_state_vector = agent.state_to_tensor(next_state)
            
            agent.replay_buffer.push(
                state_vector,
                action,
                reward,
                next_state_vector,
                done
            )
            
            # Train
            if len(agent.replay_buffer) >= agent.batch_size:
                agent.train_step()
            
            state = next_state
            total_reward += reward
            
            if done:
                break
        
        assert total_reward < 0  # Negative (costs)
        assert len(agent.replay_buffer) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

