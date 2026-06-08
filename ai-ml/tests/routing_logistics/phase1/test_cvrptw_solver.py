"""
Tests for CVRPTW Solver
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

pytestmark = pytest.mark.skipif(not HAS_ORTOOLS, reason="ortools.constraint_solver not available")

from legacy_models.routing_logistics.classical_optimization.cvrptw_solver import (
    CVRPTWSolver,
    Location,
    Vehicle,
    RoutingProblem
)


class TestCVRPTWSolver:
    """Test cases for CVRPTWSolver."""
    
    def test_initialization(self):
        """Test solver initialization."""
        solver = CVRPTWSolver(time_limit=30)
        
        assert solver.time_limit == 30
    
    def test_create_problem(self):
        """Test problem creation."""
        # Create depot
        depot = Location(location_id=0, x=0.0, y=0.0, demand=0.0)
        
        # Create customers
        customers = [
            Location(location_id=1, x=10.0, y=10.0, demand=10.0, time_window_start=0.0, time_window_end=100.0),
            Location(location_id=2, x=20.0, y=20.0, demand=15.0, time_window_start=0.0, time_window_end=100.0),
            Location(location_id=3, x=30.0, y=30.0, demand=20.0, time_window_start=0.0, time_window_end=100.0)
        ]
        
        locations = [depot] + customers
        
        # Create vehicles
        vehicles = [
            Vehicle(vehicle_id=0, capacity=50.0),
            Vehicle(vehicle_id=1, capacity=50.0)
        ]
        
        problem = RoutingProblem(
            locations=locations,
            vehicles=vehicles,
            use_time_windows=True,
            use_capacity=True
        )
        
        assert len(problem.locations) == 4
        assert len(problem.vehicles) == 2
    
    def test_solve_simple(self):
        """Test solving a simple problem."""
        solver = CVRPTWSolver(time_limit=10)
        
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
        
        result = solver.solve(problem)
        
        assert result['status'] in ['optimal', 'no_solution']
        if result['status'] == 'optimal':
            assert len(result['routes']) > 0
            assert result['total_distance'] >= 0
    
    def test_solve_with_distance_matrix(self):
        """Test solving with provided distance matrix."""
        solver = CVRPTWSolver(time_limit=10)
        
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
        
        result = solver.solve(problem)
        
        assert result['status'] in ['optimal', 'no_solution']
    
    def test_solve_from_data(self):
        """Test solving from data dictionaries."""
        solver = CVRPTWSolver(time_limit=10)
        
        locations = [
            {'id': 0, 'x': 0.0, 'y': 0.0, 'demand': 0.0},
            {'id': 1, 'x': 10.0, 'y': 10.0, 'demand': 10.0, 'time_window_start': 0.0, 'time_window_end': 1000.0},
            {'id': 2, 'x': 20.0, 'y': 20.0, 'demand': 15.0, 'time_window_start': 0.0, 'time_window_end': 1000.0}
        ]
        
        vehicles = [
            {'id': 0, 'capacity': 50.0}
        ]
        
        result = solver.solve_from_data(locations, vehicles)
        
        assert result['status'] in ['optimal', 'no_solution']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

