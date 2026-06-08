"""
Tests for MADDPG
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

from legacy_models.multi_agent_coordination.multi_agent_framework.maddpg import MADDPGAgent


class TestMADDPGAgent:
    """Test cases for MADDPGAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = MADDPGAgent(
            agent_id=0,
            num_agents=3,
            state_dim=10,
            action_dim=5
        )
        
        assert agent.agent_id == 0
        assert agent.num_agents == 3
        assert agent.state_dim == 10
        assert agent.action_dim == 5
    
    def test_select_action(self):
        """Test action selection."""
        agent = MADDPGAgent(
            agent_id=0,
            num_agents=2,
            state_dim=5,
            action_dim=3
        )
        
        state = np.random.randn(5)
        action = agent.select_action(state, training=True)
        
        assert action.shape == (3,)
        assert np.all(action >= -1) and np.all(action <= 1)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

