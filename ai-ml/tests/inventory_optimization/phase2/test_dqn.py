"""
Tests for Deep Q-Learning (DQN) Agent
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

from models.inventory_optimization.reinforcement_learning.dqn import DQNInventoryAgent
from models.inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import (
    InventorySimulator,
    InventoryState
)


class TestDQNInventoryAgent:
    """Test cases for DQNInventoryAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            learning_rate=0.001,
            gamma=0.99,
            device='cpu'
        )
        
        assert agent.state_dim == 11
        assert agent.action_dim == 21
        assert agent.learning_rate == 0.001
        assert agent.gamma == 0.99
        assert agent.q_network is not None
        assert agent.target_network is not None
    
    def test_state_to_tensor(self):
        """Test state conversion."""
        agent = DQNInventoryAgent(state_dim=11, action_dim=21, device='cpu')
        
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
    
    def test_select_action_random(self):
        """Test action selection with random exploration."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            epsilon_start=1.0,
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
        assert action <= 200
        assert action in agent.action_space
    
    def test_select_action_greedy(self):
        """Test action selection with greedy policy."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            epsilon_start=0.0,
            epsilon_end=0.0,
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
        
        assert action >= 0
        assert action <= 200
        assert action in agent.action_space
    
    def test_update_epsilon(self):
        """Test epsilon update."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            epsilon_start=1.0,
            epsilon_end=0.01,
            epsilon_decay=0.9,
            device='cpu'
        )
        
        initial_epsilon = agent.epsilon
        agent.update_epsilon()
        
        assert agent.epsilon < initial_epsilon
        assert agent.epsilon >= agent.epsilon_end
    
    def test_replay_buffer(self):
        """Test replay buffer."""
        from models.inventory_optimization.reinforcement_learning.dqn import ReplayBuffer
        
        buffer = ReplayBuffer(capacity=1000)
        
        # Add experiences
        for i in range(100):
            state = np.random.randn(11)
            action = np.random.randint(0, 21)
            reward = np.random.randn()
            next_state = np.random.randn(11)
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
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            batch_size=64,
            device='cpu'
        )
        
        # Add some experiences but not enough
        for i in range(32):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.randint(0, 21)
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        loss = agent.train_step()
        
        assert loss is None  # Should not train with insufficient buffer
    
    def test_train_step_sufficient_buffer(self):
        """Test training with sufficient buffer."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            batch_size=32,
            device='cpu'
        )
        
        # Add enough experiences
        for i in range(100):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.randint(0, 21)
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        loss = agent.train_step()
        
        assert loss is not None
        assert isinstance(loss, float)
        assert loss >= 0
    
    def test_save_load(self, tmp_path):
        """Test model save and load."""
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            device='cpu'
        )
        
        # Train a bit
        for i in range(100):
            state = np.random.randn(11).astype(np.float32)
            action = np.random.randint(0, 21)
            reward = np.random.randn()
            next_state = np.random.randn(11).astype(np.float32)
            done = False
            
            agent.replay_buffer.push(state, action, reward, next_state, done)
        
        agent.train_step()
        
        # Save
        filepath = tmp_path / "dqn_model.pt"
        agent.save(str(filepath))
        
        # Load
        agent2 = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            device='cpu'
        )
        agent2.load(str(filepath))
        
        # Check that networks are the same
        state = np.random.randn(11).astype(np.float32)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            q1 = agent.q_network(state_tensor)
            q2 = agent2.q_network(state_tensor)
        
        assert torch.allclose(q1, q2, atol=1e-6)


class TestDQNIntegration:
    """Integration tests for DQN with simulator."""
    
    def test_dqn_with_simulator(self):
        """Test DQN agent with inventory simulator."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            demand_mean=10.0,
            demand_std=3.0,
            random_seed=42
        )
        
        agent = DQNInventoryAgent(
            state_dim=11,
            action_dim=21,
            epsilon_start=0.5,
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
            action_idx = np.where(agent.action_space == action)[0][0]
            
            agent.replay_buffer.push(
                state_vector,
                action_idx,
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

