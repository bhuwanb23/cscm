"""
Tests for CTDE Trainer
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

from legacy_models.multi_agent_coordination.training_deployment.ctde_trainer import CTDETrainer


class MockAgent:
    """Mock agent for testing."""
    
    def __init__(self, agent_id: int):
        self.agent_id = agent_id
    
    def select_action(self, state, training=False):
        return np.random.randn(3)
    
    def train_step(self, batch):
        return {'loss': 0.1}


class TestCTDETrainer:
    """Test cases for CTDETrainer."""
    
    def test_initialization(self):
        """Test trainer initialization."""
        agents = [MockAgent(i) for i in range(3)]
        trainer = CTDETrainer(agents, training_mode='maddpg')
        
        assert trainer.num_agents == 3
        assert trainer.training_mode == 'maddpg'
    
    def test_collect_experience(self):
        """Test experience collection."""
        agents = [MockAgent(i) for i in range(2)]
        trainer = CTDETrainer(agents)
        
        states = [np.random.randn(5), np.random.randn(5)]
        actions = [np.random.randn(3), np.random.randn(3)]
        rewards = [1.0, 2.0]
        next_states = [np.random.randn(5), np.random.randn(5)]
        dones = [False, False]
        
        trainer.collect_experience(states, actions, rewards, next_states, dones)
        
        assert len(trainer.centralized_buffer) == 1
    
    def test_decentralized_execution(self):
        """Test decentralized execution."""
        agents = [MockAgent(i) for i in range(2)]
        trainer = CTDETrainer(agents)
        
        states = [np.random.randn(5), np.random.randn(5)]
        actions = trainer.decentralized_execution(states, training=False)
        
        assert len(actions) == 2
        assert all(a.shape == (3,) for a in actions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

