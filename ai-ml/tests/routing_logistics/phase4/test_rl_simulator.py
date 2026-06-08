"""
Tests for RL Simulator Environment
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.routing_logistics.deployment_infrastructure.rl_simulator import RLSimulatorEnvironment


class TestRLSimulatorEnvironment:
    """Test cases for RLSimulatorEnvironment."""
    
    def test_initialization(self):
        """Test simulator initialization."""
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0}
        ]
        
        vehicles = [
            {'id': 0, 'capacity': 50.0, 'start_location': 0}
        ]
        
        env = RLSimulatorEnvironment(locations, vehicles)
        
        assert env.num_locations == 3
        assert env.num_vehicles == 1
    
    def test_reset(self):
        """Test environment reset."""
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0}
        ]
        
        vehicles = [
            {'id': 0, 'capacity': 50.0, 'start_location': 0}
        ]
        
        env = RLSimulatorEnvironment(locations, vehicles)
        state = env.reset()
        
        assert state.current_node == 0
        assert len(state.visited_nodes) == 1
    
    def test_step(self):
        """Test environment step."""
        locations = [
            {'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'x': 10.0, 'y': 10.0, 'demand': 10.0},
            {'x': 20.0, 'y': 20.0, 'demand': 15.0}
        ]
        
        vehicles = [
            {'id': 0, 'capacity': 50.0, 'start_location': 0}
        ]
        
        env = RLSimulatorEnvironment(locations, vehicles)
        env.reset()
        
        next_state, reward, done, info = env.step(1)
        
        assert next_state.current_node == 1
        assert 1 in next_state.visited_nodes
        assert reward is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

