"""
Tests for Proximal Policy Optimization (PPO) Agent
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

from models.inventory_optimization.reinforcement_learning.ppo import PPOInventoryAgent
from models.inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import (
    InventorySimulator,
    InventoryState
)


class TestPPOInventoryAgent:
    """Test cases for PPOInventoryAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            device='cpu'
        )
        
        assert agent.state_dim == 11
        assert agent.action_dim == 1
        assert agent.max_action == 200.0
        assert agent.actor_critic is not None
        assert agent.gamma == 0.99
        assert agent.clip_epsilon == 0.2
    
    def test_state_to_tensor(self):
        """Test state conversion."""
        agent = PPOInventoryAgent(state_dim=11, action_dim=1, device='cpu')
        
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
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
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
        
        action, log_prob, value = agent.select_action(state, training=True)
        
        assert isinstance(action, (int, float))
        assert -200 <= action <= 200
        assert isinstance(log_prob, float)
        assert isinstance(value, float)
    
    def test_store_transition(self):
        """Test storing transitions."""
        agent = PPOInventoryAgent(state_dim=11, action_dim=1, device='cpu')
        
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
        
        next_state = InventoryState(
            current_inventory=90.0,
            days_since_order=1,
            pending_order=0.0,
            days_until_arrival=7,
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
        
        agent.store_transition(
            state=state,
            action=50.0,
            reward=-10.0,
            next_state=next_state,
            done=False,
            log_prob=-2.0,
            value=-5.0
        )
        
        assert len(agent.rollout_buffer) == 1
        assert agent.rollout_buffer[0]['action'] == 50.0
        assert agent.rollout_buffer[0]['reward'] == -10.0
    
    def test_compute_gae(self):
        """Test GAE computation."""
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            gamma=0.99,
            gae_lambda=0.95,
            device='cpu'
        )
        
        rewards = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        values = np.array([0.5, 1.0, 1.5, 2.0, 2.5])
        dones = np.array([False, False, False, False, False])
        next_value = 3.0
        
        advantages, returns = agent.compute_gae(rewards, values, dones, next_value)
        
        assert len(advantages) == len(rewards)
        assert len(returns) == len(rewards)
        assert all(returns >= advantages)  # Returns should be >= advantages
    
    def test_train_step_insufficient_buffer(self):
        """Test training with insufficient buffer."""
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            batch_size=64,
            device='cpu'
        )
        
        # Add some transitions but not enough
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
        
        for i in range(32):
            agent.store_transition(
                state=state,
                action=50.0,
                reward=-10.0,
                next_state=state,
                done=False,
                log_prob=-2.0,
                value=-5.0
            )
        
        result = agent.train_step()
        
        assert result is None  # Should not train with insufficient buffer
    
    def test_train_step_sufficient_buffer(self):
        """Test training with sufficient buffer."""
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            batch_size=32,
            device='cpu'
        )
        
        # Add enough transitions
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
        
        for i in range(100):
            agent.store_transition(
                state=state,
                action=50.0 + np.random.randn(),
                reward=-10.0 + np.random.randn(),
                next_state=state,
                done=False,
                log_prob=-2.0 + np.random.randn(),
                value=-5.0 + np.random.randn()
            )
        
        result = agent.train_step()
        
        assert result is not None
        assert 'policy_loss' in result
        assert 'value_loss' in result
        assert 'entropy' in result
        assert isinstance(result['policy_loss'], float)
        assert isinstance(result['value_loss'], float)
        assert isinstance(result['entropy'], float)
    
    def test_clear_buffer(self):
        """Test buffer clearing."""
        agent = PPOInventoryAgent(state_dim=11, action_dim=1, device='cpu')
        
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
        
        # Add transitions
        for i in range(10):
            agent.store_transition(
                state=state,
                action=50.0,
                reward=-10.0,
                next_state=state,
                done=False,
                log_prob=-2.0,
                value=-5.0
            )
        
        assert len(agent.rollout_buffer) == 10
        
        # Clear buffer
        agent.clear_buffer()
        
        assert len(agent.rollout_buffer) == 0
    
    def test_save_load(self, tmp_path):
        """Test model save and load."""
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            device='cpu'
        )
        
        # Add some transitions and train
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
        
        for i in range(100):
            agent.store_transition(
                state=state,
                action=50.0 + np.random.randn(),
                reward=-10.0 + np.random.randn(),
                next_state=state,
                done=False,
                log_prob=-2.0 + np.random.randn(),
                value=-5.0 + np.random.randn()
            )
        
        agent.train_step()
        
        # Save
        filepath = tmp_path / "ppo_model.pt"
        agent.save(str(filepath))
        
        # Load
        agent2 = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            device='cpu'
        )
        agent2.load(str(filepath))
        
        # Check that networks are the same
        state = np.random.randn(11).astype(np.float32)
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        
        with torch.no_grad():
            a1, _, v1 = agent.actor_critic.forward(state_tensor)
            a2, _, v2 = agent2.actor_critic.forward(state_tensor)
        
        assert torch.allclose(a1, a2, atol=1e-6)
        assert torch.allclose(v1, v2, atol=1e-6)


class TestPPOIntegration:
    """Integration tests for PPO with simulator."""
    
    def test_ppo_with_simulator(self):
        """Test PPO agent with inventory simulator."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            demand_mean=10.0,
            demand_std=3.0,
            random_seed=42
        )
        
        agent = PPOInventoryAgent(
            state_dim=11,
            action_dim=1,
            max_action=200.0,
            device='cpu'
        )
        
        # Run episode
        state = simulator.reset()
        total_reward = 0
        
        for step in range(20):
            action, log_prob, value = agent.select_action(state, training=True)
            next_state, reward, done, info = simulator.step(action)
            
            # Store transition
            agent.store_transition(
                state=state,
                action=action,
                reward=reward,
                next_state=next_state,
                done=done,
                log_prob=log_prob,
                value=value
            )
            
            state = next_state
            total_reward += reward
            
            if done:
                break
        
        # Train after episode
        if len(agent.rollout_buffer) >= agent.batch_size:
            result = agent.train_step()
            assert result is not None
        
        assert total_reward < 0  # Negative (costs)
        assert len(agent.rollout_buffer) == 0 or len(agent.rollout_buffer) < agent.batch_size


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

