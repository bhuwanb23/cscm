"""
Tests for RL Routing
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

from legacy_models.routing_logistics.ml_augmented.rl_routing import (
    RoutingEnvironment,
    MADDPGRoutingAgent,
    PPORoutingAgent
)


class TestRoutingEnvironment:
    """Test cases for RoutingEnvironment."""
    
    def test_initialization(self):
        """Test environment initialization."""
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0}
        ]
        
        env = RoutingEnvironment(locations)
        
        assert env.num_locations == 3
    
    def test_reset(self):
        """Test environment reset."""
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0}
        ]
        
        env = RoutingEnvironment(locations)
        state = env.reset()
        
        assert len(state) > 0
        assert env.current_node == 0


class TestMADDPGRoutingAgent:
    """Test cases for MADDPGRoutingAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = MADDPGRoutingAgent(state_dim=10, action_dim=5)
        
        assert agent.state_dim == 10
        assert agent.action_dim == 5


class TestPPORoutingAgent:
    """Test cases for PPORoutingAgent."""
    
    def test_initialization(self):
        """Test agent initialization."""
        agent = PPORoutingAgent(state_dim=10, action_dim=5)
        
        assert agent.state_dim == 10
        assert agent.action_dim == 5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

