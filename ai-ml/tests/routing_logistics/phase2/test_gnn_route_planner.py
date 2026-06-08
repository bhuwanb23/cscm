"""
Tests for GNN Route Planner
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

from legacy_models.routing_logistics.ml_augmented.gnn_route_planner import GNRoutePlanner


class TestGNRoutePlanner:
    """Test cases for GNRoutePlanner."""
    
    def test_initialization(self):
        """Test planner initialization."""
        planner = GNRoutePlanner(model_type='gcn')
        
        assert planner.model_type == 'gcn'
        assert planner.input_dim == 5
    
    def test_create_graph(self):
        """Test graph creation."""
        planner = GNRoutePlanner(model_type='gcn')
        
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0, 'time_window_start': 0.0, 'time_window_end': 100.0}
        ]
        
        graph = planner._create_graph(locations)
        
        assert graph.x.shape[0] == 3
        assert graph.x.shape[1] == 5
    
    def test_generate_route(self):
        """Test route generation."""
        planner = GNRoutePlanner(model_type='gcn')
        
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0, 'time_window_start': 0.0, 'time_window_end': 100.0}
        ]
        
        route = planner.generate_route(locations, start_node=0)
        
        assert len(route) == 3
        assert route[0] == 0  # Start at depot


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

