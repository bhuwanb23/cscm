"""
Tests for GNN Communication
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
    from torch_geometric.data import Data
    HAS_TORCH_GEOMETRIC = True
except ImportError:
    HAS_TORCH_GEOMETRIC = False

pytestmark = pytest.mark.skipif(not HAS_TORCH_GEOMETRIC, reason="torch_geometric not available")

from models.multi_agent_coordination.communication_protocols.gnn_communication import GNNCommunication


class TestGNNCommunication:
    """Test cases for GNNCommunication."""
    
    def test_initialization(self):
        """Test communication initialization."""
        comm = GNNCommunication(
            num_agents=3,
            state_dim=10,
            message_dim=16
        )
        
        assert comm.num_agents == 3
        assert comm.state_dim == 10
        assert comm.message_dim == 16
    
    def test_communicate(self):
        """Test communication."""
        comm = GNNCommunication(
            num_agents=2,
            state_dim=5,
            message_dim=8
        )
        
        states = [np.random.randn(5), np.random.randn(5)]
        messages = comm.communicate(states)
        
        assert len(messages) == 2
        assert all(m.shape == (8,) for m in messages)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

