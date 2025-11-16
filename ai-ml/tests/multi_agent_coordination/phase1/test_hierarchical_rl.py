"""
Tests for Hierarchical RL
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

from models.multi_agent_coordination.multi_agent_framework.hierarchical_rl import HierarchicalRLPlanner


class TestHierarchicalRLPlanner:
    """Test cases for HierarchicalRLPlanner."""
    
    def test_initialization(self):
        """Test planner initialization."""
        planner = HierarchicalRLPlanner(
            agent_id=0,
            state_dim=10,
            goal_dim=5,
            action_dim=3
        )
        
        assert planner.agent_id == 0
        assert planner.state_dim == 10
        assert planner.goal_dim == 5
        assert planner.action_dim == 3
    
    def test_select_goal(self):
        """Test goal selection."""
        planner = HierarchicalRLPlanner(
            agent_id=0,
            state_dim=5,
            goal_dim=3,
            action_dim=2
        )
        
        state = np.random.randn(5)
        goal = planner.select_goal(state)
        
        assert goal.shape == (3,)
        assert np.all(goal >= -1) and np.all(goal <= 1)
    
    def test_select_action(self):
        """Test action selection."""
        planner = HierarchicalRLPlanner(
            agent_id=0,
            state_dim=5,
            goal_dim=3,
            action_dim=2
        )
        
        state = np.random.randn(5)
        action = planner.select_action(state, training=True)
        
        assert action.shape == (2,)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

