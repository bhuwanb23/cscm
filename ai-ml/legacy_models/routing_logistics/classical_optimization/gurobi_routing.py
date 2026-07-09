"""
Gurobi-based Routing Optimization

This module implements routing optimization using Gurobi MIP solver.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    import gurobipy as gp
    from gurobipy import GRB
    HAS_GUROBI = True
except ImportError:
    HAS_GUROBI = False
    gp = None
    GRB = None

from .cvrptw_solver import Location, Vehicle, RoutingProblem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GurobiRoutingOptimizer:
    """
    Gurobi-based routing optimizer.
    
    Solves routing problems using Gurobi MIP solver.
    """
    
    def __init__(
        self,
        time_limit: int = 300,  # seconds
        mip_gap: float = 0.01,  # 1% optimality gap
        verbose: bool = False
    ):
        """
        Initialize Gurobi routing optimizer.
        
        Args:
            time_limit: Maximum solving time in seconds
            mip_gap: Optimality gap tolerance
            verbose: Whether to print solver output
        """
        if not HAS_GUROBI:
            raise ImportError("gurobipy is required for Gurobi routing optimization")
        
        self.time_limit = time_limit
        self.mip_gap = mip_gap
        self.verbose = verbose
    
    def _calculate_distance_matrix(self, problem: RoutingProblem) -> np.ndarray:
        """Calculate distance matrix if not provided."""
        num_locations = len(problem.locations)
        
        if problem.distance_matrix is not None:
            return problem.distance_matrix
        
        # Calculate Euclidean distances
        distance_matrix = np.zeros((num_locations, num_locations))
        
        for i in range(num_locations):
            for j in range(num_locations):
                if i == j:
                    distance_matrix[i][j] = 0
                else:
                    loc1 = problem.locations[i]
                    loc2 = problem.locations[j]
                    distance_matrix[i][j] = np.sqrt(
                        (loc1.x - loc2.x)**2 + (loc1.y - loc2.y)**2
                    )
        
        return distance_matrix
    
    def _calculate_time_matrix(self, problem: RoutingProblem) -> np.ndarray:
        """Calculate time matrix if not provided."""
        num_locations = len(problem.locations)
        
        if problem.time_matrix is not None:
            return problem.time_matrix
        
        # Use distance as proxy for time
        distance_matrix = self._calculate_distance_matrix(problem)
        time_matrix = distance_matrix / 50.0  # Assume 50 units per time unit
        
        return time_matrix
    
    def solve(self, problem: RoutingProblem) -> Dict[str, Any]:
        """
        Solve routing problem using Gurobi.
        
        Args:
            problem: Routing problem
        
        Returns:
            Dictionary with solution and metrics
        """
        logger.info(f"Solving routing problem with Gurobi: {len(problem.locations)} locations, {len(problem.vehicles)} vehicles")
        
        num_locations = len(problem.locations)
        num_vehicles = len(problem.vehicles)
        
        # Calculate matrices
        distance_matrix = self._calculate_distance_matrix(problem)
        time_matrix = self._calculate_time_matrix(problem)
        
        # Create model
        model = gp.Model("RoutingOptimization")
        model.setParam('TimeLimit', self.time_limit)
        model.setParam('MIPGap', self.mip_gap)
        model.setParam('OutputFlag', 1 if self.verbose else 0)
        
        # Decision variables: x[i][j][k] = 1 if vehicle k travels from i to j
        x = {}
        for i in range(num_locations):
            for j in range(num_locations):
                if i != j:
                    for k in range(num_vehicles):
                        x[i, j, k] = model.addVar(
                            vtype=GRB.BINARY,
                            name=f'x_{i}_{j}_{k}'
                        )
        
        # Decision variables: u[i][k] = cumulative demand up to location i for vehicle k
        u = {}
        for i in range(num_locations):
            for k in range(num_vehicles):
                u[i, k] = model.addVar(
                    vtype=GRB.CONTINUOUS,
                    lb=0,
                    ub=problem.vehicles[k].capacity,
                    name=f'u_{i}_{k}'
                )
        
        # Decision variables: t[i][k] = arrival time at location i for vehicle k
        t = {}
        if problem.use_time_windows:
            for i in range(num_locations):
                for k in range(num_vehicles):
                    max_time = problem.vehicles[k].max_route_time
                    t[i, k] = model.addVar(
                        vtype=GRB.CONTINUOUS,
                        lb=0,
                        ub=max_time,
                        name=f't_{i}_{k}'
                    )
        
        # Objective: minimize total distance
        objective = gp.quicksum(
            distance_matrix[i][j] * x[i, j, k]
            for i in range(num_locations)
            for j in range(num_locations)
            if i != j
            for k in range(num_vehicles)
        )
        
        model.setObjective(objective, GRB.MINIMIZE)
        
        # Constraints
        
        # 1. Each customer is visited exactly once
        for j in range(1, num_locations):  # Skip depot
            model.addConstr(
                gp.quicksum(x[i, j, k] for i in range(num_locations) if i != j for k in range(num_vehicles)) == 1,
                name=f'visit_once_{j}'
            )
        
        # 2. Flow conservation: vehicles leave depot
        for k in range(num_vehicles):
            start_loc = problem.vehicles[k].start_location
            model.addConstr(
                gp.quicksum(x[start_loc, j, k] for j in range(num_locations) if j != start_loc) == 1,
                name=f'leave_depot_{k}'
            )
        
        # 3. Flow conservation: vehicles return to depot
        for k in range(num_vehicles):
            end_loc = problem.vehicles[k].end_location if problem.vehicles[k].end_location is not None else problem.vehicles[k].start_location
            model.addConstr(
                gp.quicksum(x[i, end_loc, k] for i in range(num_locations) if i != end_loc) == 1,
                name=f'return_depot_{k}'
            )
        
        # 4. Flow conservation: enter = leave for each location
        for j in range(num_locations):
            for k in range(num_vehicles):
                model.addConstr(
                    gp.quicksum(x[i, j, k] for i in range(num_locations) if i != j) ==
                    gp.quicksum(x[j, i, k] for i in range(num_locations) if i != j),
                    name=f'flow_{j}_{k}'
                )
        
        # 5. Capacity constraints
        if problem.use_capacity:
            for k in range(num_vehicles):
                capacity = problem.vehicles[k].capacity
                for i in range(num_locations):
                    for j in range(1, num_locations):  # Skip depot
                        if i != j:
                            model.addConstr(
                                u[j, k] >= u[i, k] + problem.locations[j].demand * x[i, j, k] - capacity * (1 - x[i, j, k]),
                                name=f'capacity_{i}_{j}_{k}'
                            )
                
                # Depot has zero demand
                start_loc = problem.vehicles[k].start_location
                model.addConstr(u[start_loc, k] == 0, name=f'depot_capacity_{k}')
        
        # 6. Time window constraints
        if problem.use_time_windows:
            for k in range(num_vehicles):
                vehicle = problem.vehicles[k]
                start_loc = vehicle.start_location
                
                # Vehicle start time
                model.addConstr(t[start_loc, k] == vehicle.start_time, name=f'start_time_{k}')
                
                # Time propagation
                for i in range(num_locations):
                    for j in range(num_locations):
                        if i != j:
                            travel_time = time_matrix[i][j]
                            service_time = problem.locations[i].service_time
                            
                            # Big M constraint
                            M = vehicle.max_route_time
                            model.addConstr(
                                t[j, k] >= t[i, k] + service_time + travel_time - M * (1 - x[i, j, k]),
                                name=f'time_{i}_{j}_{k}'
                            )
                
                # Time window constraints
                for i in range(1, num_locations):  # Skip depot
                    location = problem.locations[i]
                    if location.time_window_start > 0 or location.time_window_end < float('inf'):
                        model.addConstr(
                            t[i, k] >= location.time_window_start,
                            name=f'tw_start_{i}_{k}'
                        )
                        if location.time_window_end < float('inf'):
                            model.addConstr(
                                t[i, k] <= location.time_window_end,
                                name=f'tw_end_{i}_{k}'
                            )
                
                # Maximum route time
                if vehicle.max_route_time < float('inf'):
                    end_loc = vehicle.end_location if vehicle.end_location is not None else vehicle.start_location
                    model.addConstr(
                        t[end_loc, k] <= vehicle.max_route_time,
                        name=f'max_route_time_{k}'
                    )
        
        # Optimize
        model.optimize()
        
        if model.status == GRB.OPTIMAL or model.status == GRB.TIME_LIMIT:
            # Extract solution
            routes = []
            total_distance = 0
            
            for k in range(num_vehicles):
                route = []
                vehicle = problem.vehicles[k]
                current_loc = vehicle.start_location
                route_distance = 0
                
                visited = set()
                route.append(current_loc)
                
                # Follow the route
                while True:
                    found_next = False
                    for j in range(num_locations):
                        if j != current_loc and (current_loc, j, k) in x:
                            if x[current_loc, j, k].X > 0.5:
                                if j not in visited or j == vehicle.start_location:
                                    route.append(j)
                                    route_distance += distance_matrix[current_loc][j]
                                    current_loc = j
                                    visited.add(j)
                                    found_next = True
                                    break
                    
                    if not found_next or current_loc == vehicle.start_location:
                        break
                
                if len(route) > 1:  # Only add non-empty routes
                    routes.append({
                        'vehicle_id': k,
                        'route': route,
                        'distance': route_distance,
                        'demand': sum(problem.locations[node].demand for node in route if node != vehicle.start_location)
                    })
                    total_distance += route_distance
            
            return {
                'status': 'optimal' if model.status == GRB.OPTIMAL else 'time_limit',
                'routes': routes,
                'total_distance': total_distance,
                'objective_value': model.ObjVal,
                'num_vehicles_used': len(routes),
                'solution': model
            }
        else:
            return {
                'status': 'infeasible',
                'routes': [],
                'total_distance': 0,
                'objective_value': None,
                'num_vehicles_used': 0,
                'solution': None
            }

