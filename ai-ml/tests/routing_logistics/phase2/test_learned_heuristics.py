"""
Tests for Learned Heuristics
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.routing_logistics.ml_augmented.learned_heuristics import LearnedHeuristic


# Tests will work even without torch_geometric since GNN is optional


class TestLearnedHeuristic:
    """Test cases for LearnedHeuristic."""
    
    def test_initialization(self):
        """Test heuristic initialization."""
        heuristic = LearnedHeuristic(heuristic_weight=0.5)
        
        assert heuristic.heuristic_weight == 0.5
    
    def test_nearest_neighbor_heuristic(self):
        """Test nearest neighbor heuristic."""
        heuristic = LearnedHeuristic()
        
        locations = [
            {'x': 0.0, 'y': 0.0},
            {'x': 10.0, 'y': 10.0},
            {'x': 20.0, 'y': 20.0}
        ]
        
        next_node = heuristic.nearest_neighbor_heuristic(
            locations, current_node=0, unvisited=[1, 2]
        )
        
        assert next_node in [1, 2]
    
    def test_generate_route(self):
        """Test route generation."""
        heuristic = LearnedHeuristic()
        
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0, 'service_time': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0, 'service_time': 5.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0, 'service_time': 5.0}
        ]
        
        route = heuristic.generate_route(
            locations, start_node=0, heuristic_type='nearest_neighbor'
        )
        
        assert len(route) == 3
        assert route[0] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

