"""
Tests for Gurobi Routing Optimizer
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import gurobipy as gp
    from gurobipy import GRB
    HAS_GUROBI = True
except ImportError:
    HAS_GUROBI = False

pytestmark = pytest.mark.skipif(not HAS_GUROBI, reason="gurobipy not available")

from legacy_models.routing_logistics.classical_optimization.gurobi_routing import (
    GurobiRoutingOptimizer
)
from legacy_models.routing_logistics.classical_optimization.cvrptw_solver import (
    Location,
    Vehicle,
    RoutingProblem
)


class TestGurobiRoutingOptimizer:
    """Test cases for GurobiRoutingOptimizer."""
    
    def test_initialization(self):
        """Test optimizer initialization."""
        optimizer = GurobiRoutingOptimizer(time_limit=60)
        
        assert optimizer.time_limit == 60
        assert optimizer.mip_gap == 0.01
    
    def test_solve_simple(self):
        """Test solving a simple problem."""
        optimizer = GurobiRoutingOptimizer(time_limit=10)
        
        # Create depot
        depot = Location(location_id=0, x=0.0, y=0.0, demand=0.0)
        
        # Create customers
        customers = [
            Location(location_id=1, x=10.0, y=10.0, demand=10.0, time_window_start=0.0, time_window_end=1000.0),
            Location(location_id=2, x=20.0, y=20.0, demand=15.0, time_window_start=0.0, time_window_end=1000.0)
        ]
        
        locations = [depot] + customers
        
        # Create vehicles
        vehicles = [
            Vehicle(vehicle_id=0, capacity=50.0)
        ]
        
        problem = RoutingProblem(
            locations=locations,
            vehicles=vehicles,
            use_time_windows=True,
            use_capacity=True
        )
        
        result = optimizer.solve(problem)
        
        assert result['status'] in ['optimal', 'time_limit', 'infeasible']
        if result['status'] in ['optimal', 'time_limit']:
            assert 'routes' in result
            assert 'total_distance' in result
    
    def test_solve_with_distance_matrix(self):
        """Test solving with provided distance matrix."""
        optimizer = GurobiRoutingOptimizer(time_limit=10)
        
        # Create locations
        depot = Location(location_id=0, x=0.0, y=0.0, demand=0.0)
        customers = [
            Location(location_id=1, x=10.0, y=10.0, demand=10.0, time_window_start=0.0, time_window_end=1000.0),
            Location(location_id=2, x=20.0, y=20.0, demand=15.0, time_window_start=0.0, time_window_end=1000.0)
        ]
        locations = [depot] + customers
        
        # Create distance matrix
        distance_matrix = np.array([
            [0, 14, 28],
            [14, 0, 14],
            [28, 14, 0]
        ])
        
        vehicles = [Vehicle(vehicle_id=0, capacity=50.0)]
        
        problem = RoutingProblem(
            locations=locations,
            vehicles=vehicles,
            distance_matrix=distance_matrix,
            use_time_windows=True,
            use_capacity=True
        )
        
        result = optimizer.solve(problem)
        
        assert result['status'] in ['optimal', 'time_limit', 'infeasible']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

