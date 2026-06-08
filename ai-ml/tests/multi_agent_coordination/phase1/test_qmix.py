"""
Tests for QMIX
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

from legacy_models.multi_agent_coordination.multi_agent_framework.qmix import QMIXCoordinator


class TestQMIXCoordinator:
    """Test cases for QMIXCoordinator."""
    
    def test_initialization(self):
        """Test coordinator initialization."""
        coordinator = QMIXCoordinator(
            num_agents=3,
            state_dim=10,
            action_dim=5,
            global_state_dim=20
        )
        
        assert coordinator.num_agents == 3
        assert coordinator.state_dim == 10
        assert coordinator.action_dim == 5
    
    def test_select_actions(self):
        """Test action selection."""
        coordinator = QMIXCoordinator(
            num_agents=2,
            state_dim=5,
            action_dim=3,
            global_state_dim=10
        )
        
        states = [np.random.randn(5), np.random.randn(5)]
        actions = coordinator.select_actions(states, training=True)
        
        assert len(actions) == 2
        assert all(0 <= a < 3 for a in actions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

