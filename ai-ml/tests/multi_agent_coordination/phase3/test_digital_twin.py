"""
Tests for Multi-Agent Digital Twin
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.multi_agent_coordination.training_deployment.digital_twin_simulator import (
    MultiAgentDigitalTwin,
    InteractionType
)


class TestMultiAgentDigitalTwin:
    """Test cases for MultiAgentDigitalTwin."""
    
    def test_initialization(self):
        """Test simulator initialization."""
        simulator = MultiAgentDigitalTwin(
            num_agents=3,
            state_dim=5,
            action_dim=3
        )
        
        assert simulator.num_agents == 3
        assert simulator.state_dim == 5
        assert simulator.action_dim == 3
    
    def test_reset(self):
        """Test simulator reset."""
        simulator = MultiAgentDigitalTwin(
            num_agents=2,
            state_dim=5,
            action_dim=3
        )
        
        states = simulator.reset()
        
        assert len(states) == 2
        assert all(s.shape == (5,) for s in states)
    
    def test_step(self):
        """Test simulator step."""
        simulator = MultiAgentDigitalTwin(
            num_agents=2,
            state_dim=5,
            action_dim=3
        )
        
        simulator.reset()
        actions = [np.random.randn(3), np.random.randn(3)]
        
        next_states, rewards, dones, info = simulator.step(actions)
        
        assert len(next_states) == 2
        assert len(rewards) == 2
        assert len(dones) == 2
        assert 'global_state' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

