"""
CVRPTW Solver using OR-Tools

This module implements the Capacitated Vehicle Routing Problem with Time Windows (CVRPTW)
using Google OR-Tools.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import logging

try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False
    routing_enums_pb2 = None
    pywrapcp = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Location:
    """Data class for a location (depot or customer)."""
    location_id: int
    x: float  # X coordinate
    y: float  # Y coordinate
    demand: float = 0.0  # Demand at this location
    service_time: float = 0.0  # Service time at this location
    time_window_start: float = 0.0  # Start of time window
    time_window_end: float = float('inf')  # End of time window


@dataclass
class Vehicle:
    """Data class for a vehicle."""
    vehicle_id: int
    capacity: float  # Vehicle capacity
    start_location: int = 0  # Start location (depot)
    end_location: Optional[int] = None  # End location (None = same as start)
    start_time: float = 0.0  # Vehicle start time
    max_route_time: float = float('inf')  # Maximum route time


@dataclass
class RoutingProblem:
    """Data class for routing problem."""
    locations: List[Location]  # All locations (first is depot)
    vehicles: List[Vehicle]  # Available vehicles
    distance_matrix: Optional[np.ndarray] = None  # Distance matrix (optional)
    time_matrix: Optional[np.ndarray] = None  # Time matrix (optional)
    use_time_windows: bool = True  # Whether to use time windows
    use_capacity: bool = True  # Whether to use capacity constraints


class CVRPTWSolver:
    """
    CVRPTW Solver using OR-Tools.
    
    Solves the Capacitated Vehicle Routing Problem with Time Windows.
    """
    
    def __init__(
        self,
        time_limit: int = 30,  # seconds
        first_solution_strategy: int = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC if HAS_ORTOOLS else 0,
        local_search_metaheuristic: int = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH if HAS_ORTOOLS else 0,
        verbose: bool = False
    ):
        """
        Initialize CVRPTW solver.
        
        Args:
            time_limit: Maximum solving time in seconds
            first_solution_strategy: First solution strategy
            local_search_metaheuristic: Local search metaheuristic
            verbose: Whether to print solver output
        """
        if not HAS_ORTOOLS:
            raise ImportError("ortools.constraint_solver is required for CVRPTW")
        
        self.time_limit = time_limit
        self.first_solution_strategy = first_solution_strategy
        self.local_search_metaheuristic = local_search_metaheuristic
        self.verbose = verbose
    
    def _create_distance_callback(self, manager, routing, problem: RoutingProblem):
        """Create distance callback."""
        def distance_callback(from_index, to_index):
            """Returns the distance between the two nodes."""
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            
            if problem.distance_matrix is not None:
                return int(problem.distance_matrix[from_node][to_node])
            else:
                # Euclidean distance
                loc1 = problem.locations[from_node]
                loc2 = problem.locations[to_node]
                return int(np.sqrt((loc1.x - loc2.x)**2 + (loc1.y - loc2.y)**2))
        
        return distance_callback
    
    def _create_time_callback(self, manager, routing, problem: RoutingProblem):
        """Create time callback."""
        def time_callback(from_index, to_index):
            """Returns the travel time between the two nodes."""
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            
            if problem.time_matrix is not None:
                travel_time = problem.time_matrix[from_node][to_node]
            else:
                # Use distance as proxy for time
                loc1 = problem.locations[from_node]
                loc2 = problem.locations[to_node]
                distance = np.sqrt((loc1.x - loc2.x)**2 + (loc1.y - loc2.y)**2)
                travel_time = distance / 50.0  # Assume 50 units per time unit
            
            # Add service time at origin
            service_time = problem.locations[from_node].service_time
            
            return int((travel_time + service_time) * 100)  # Scale for integer
        
        return time_callback
    
    def _create_demand_callback(self, manager, problem: RoutingProblem):
        """Create demand callback."""
        def demand_callback(from_index):
            """Returns the demand of the node."""
            from_node = manager.IndexToNode(from_index)
            return int(problem.locations[from_node].demand)
        
        return demand_callback
    
    def solve(self, problem: RoutingProblem) -> Dict[str, Any]:
        """
        Solve CVRPTW problem.
        
        Args:
            problem: Routing problem
        
        Returns:
            Dictionary with solution and metrics
        """
        logger.info(f"Solving CVRPTW with {len(problem.locations)} locations and {len(problem.vehicles)} vehicles")
        
        # Create routing index manager
        num_locations = len(problem.locations)
        num_vehicles = len(problem.vehicles)
        
        manager = pywrapcp.RoutingIndexManager(
            num_locations,
            num_vehicles,
            [v.start_location for v in problem.vehicles],
            [v.end_location if v.end_location is not None else v.start_location for v in problem.vehicles]
        )
        
        # Create routing model
        routing = pywrapcp.RoutingModel(manager)
        
        # Register distance callback
        distance_callback = self._create_distance_callback(manager, routing, problem)
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add capacity constraint
        if problem.use_capacity:
            demand_callback = self._create_demand_callback(manager, problem)
            demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
            
            for vehicle_id in range(num_vehicles):
                capacity = int(problem.vehicles[vehicle_id].capacity)
                routing.AddDimension(
                    demand_callback_index,
                    0,  # null capacity slack
                    capacity,  # vehicle maximum capacity
                    True,  # start cumul to zero
                    'Capacity'
                )
        
        # Add time window constraint
        if problem.use_time_windows:
            time_callback = self._create_time_callback(manager, routing, problem)
            time_callback_index = routing.RegisterTransitCallback(time_callback)
            
            # Add time dimension
            time_dimension_name = 'Time'
            routing.AddDimension(
                time_callback_index,
                int(max(v.start_time for v in problem.vehicles) * 100),  # slack max
                int(max(v.max_route_time for v in problem.vehicles) * 100),  # maximum time per vehicle
                False,  # don't force start cumul to zero
                time_dimension_name
            )
            
            time_dimension = routing.GetDimensionOrDie(time_dimension_name)
            
            # Add time window constraints for each location
            for location_idx, location in enumerate(problem.locations):
                if location_idx == 0:  # Skip depot
                    continue
                
                index = manager.NodeToIndex(location_idx)
                time_dimension.CumulVar(index).SetRange(
                    int(location.time_window_start * 100),
                    int(location.time_window_end * 100)
                )
            
            # Add time window constraints for vehicle start times
            for vehicle_id in range(num_vehicles):
                vehicle = problem.vehicles[vehicle_id]
                index = routing.Start(vehicle_id)
                time_dimension.CumulVar(index).SetRange(
                    int(vehicle.start_time * 100),
                    int(vehicle.start_time * 100)
                )
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = self.first_solution_strategy
        search_parameters.local_search_metaheuristic = self.local_search_metaheuristic
        search_parameters.time_limit.seconds = self.time_limit
        search_parameters.log_search = self.verbose
        
        # Solve
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            routes = []
            total_distance = 0
            total_time = 0
            
            for vehicle_id in range(num_vehicles):
                route = []
                index = routing.Start(vehicle_id)
                route_distance = 0
                route_time = 0
                
                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    route.append(node_index)
                    
                    previous_index = index
                    index = solution.Value(routing.NextVar(index))
                    
                    # Add distance
                    route_distance += routing.GetArcCostForVehicle(previous_index, index, vehicle_id)
                    
                    # Add time if time windows are used
                    if problem.use_time_windows:
                        time_dimension = routing.GetDimensionOrDie('Time')
                        route_time = solution.Value(time_dimension.CumulVar(index)) / 100.0
                
                if route:  # Only add non-empty routes
                    routes.append({
                        'vehicle_id': vehicle_id,
                        'route': route,
                        'distance': route_distance,
                        'time': route_time,
                        'demand': sum(problem.locations[node].demand for node in route)
                    })
                    total_distance += route_distance
                    total_time += route_time
            
            return {
                'status': 'optimal',
                'routes': routes,
                'total_distance': total_distance,
                'total_time': total_time,
                'num_vehicles_used': len(routes),
                'solution': solution
            }
        else:
            return {
                'status': 'no_solution',
                'routes': [],
                'total_distance': 0,
                'total_time': 0,
                'num_vehicles_used': 0,
                'solution': None
            }
    
    def solve_from_data(
        self,
        locations: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Solve CVRPTW from data dictionaries.
        
        Args:
            locations: List of location dictionaries
            vehicles: List of vehicle dictionaries
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
        
        Returns:
            Dictionary with solution and metrics
        """
        # Convert locations
        location_objects = []
        for loc in locations:
            location_objects.append(Location(
                location_id=loc.get('id', len(location_objects)),
                x=loc.get('x', 0.0),
                y=loc.get('y', 0.0),
                demand=loc.get('demand', 0.0),
                service_time=loc.get('service_time', 0.0),
                time_window_start=loc.get('time_window_start', 0.0),
                time_window_end=loc.get('time_window_end', float('inf'))
            ))
        
        # Convert vehicles
        vehicle_objects = []
        for veh in vehicles:
            vehicle_objects.append(Vehicle(
                vehicle_id=veh.get('id', len(vehicle_objects)),
                capacity=veh.get('capacity', 100.0),
                start_location=veh.get('start_location', 0),
                end_location=veh.get('end_location'),
                start_time=veh.get('start_time', 0.0),
                max_route_time=veh.get('max_route_time', float('inf'))
            ))
        
        problem = RoutingProblem(
            locations=location_objects,
            vehicles=vehicle_objects,
            distance_matrix=distance_matrix,
            time_matrix=time_matrix
        )
        
        return self.solve(problem)

