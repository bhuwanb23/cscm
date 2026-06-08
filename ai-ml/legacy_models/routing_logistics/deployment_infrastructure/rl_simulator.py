"""
Simulator Training Environment for RL Agents

This module implements a comprehensive simulator for training RL routing agents.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import logging

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrafficCondition(Enum):
    """Traffic condition levels."""
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"


@dataclass
class RouteState:
    """Route state representation."""
    current_node: int
    visited_nodes: List[int]
    current_time: float
    total_distance: float
    total_time: float
    remaining_demand: float
    vehicle_capacity_used: float
    time_window_violations: int


class RLSimulatorEnvironment:
    """
    Simulator training environment for RL routing agents.
    
    Provides a realistic simulation environment for training RL agents
    with configurable traffic patterns, time windows, and constraints.
    """
    
    def __init__(
        self,
        locations: List[Dict[str, Any]],
        vehicles: List[Dict[str, Any]],
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None,
        traffic_simulator: Optional[Any] = None,
        random_seed: Optional[int] = None
    ):
        """
        Initialize RL simulator environment.
        
        Args:
            locations: List of location dictionaries
            vehicles: List of vehicle dictionaries
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
            traffic_simulator: Traffic pattern simulator (optional)
            random_seed: Random seed for reproducibility
        """
        self.locations = locations
        self.vehicles = vehicles
        self.num_locations = len(locations)
        self.num_vehicles = len(vehicles)
        self.distance_matrix = distance_matrix
        self.time_matrix = time_matrix
        self.traffic_simulator = traffic_simulator
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        self.reset()
    
    def reset(self, vehicle_id: int = 0) -> RouteState:
        """
        Reset environment to initial state.
        
        Args:
            vehicle_id: Vehicle to use
        
        Returns:
            Initial route state
        """
        vehicle = self.vehicles[vehicle_id]
        start_location = vehicle.get('start_location', 0)
        
        self.current_vehicle_id = vehicle_id
        self.current_route = [start_location]
        self.visited = set([start_location])
        self.current_node = start_location
        self.current_time = vehicle.get('start_time', 0.0)
        self.total_distance = 0.0
        self.total_time = 0.0
        self.vehicle_capacity_used = 0.0
        self.time_window_violations = 0
        
        # Calculate remaining demand
        remaining_demand = sum(
            self.locations[i].get('demand', 0.0)
            for i in range(self.num_locations)
            if i not in self.visited
        )
        
        state = RouteState(
            current_node=self.current_node,
            visited_nodes=self.current_route.copy(),
            current_time=self.current_time,
            total_distance=self.total_distance,
            total_time=self.total_time,
            remaining_demand=remaining_demand,
            vehicle_capacity_used=self.vehicle_capacity_used,
            time_window_violations=self.time_window_violations
        )
        
        return state
    
    def step(
        self,
        action: int,
        vehicle_id: Optional[int] = None
    ) -> Tuple[RouteState, float, bool, Dict[str, Any]]:
        """
        Execute action in environment.
        
        Args:
            action: Next node to visit
            vehicle_id: Vehicle ID (uses current if None)
        
        Returns:
            Tuple of (next_state, reward, done, info)
        """
        if vehicle_id is None:
            vehicle_id = self.current_vehicle_id
        
        vehicle = self.vehicles[vehicle_id]
        capacity = vehicle.get('capacity', float('inf'))
        
        # Validate action
        if action < 0 or action >= self.num_locations:
            reward = -100.0
            done = True
            info = {'invalid_action': True, 'error': 'Invalid node index'}
            return self.get_state(), reward, done, info
        
        if action in self.visited:
            reward = -50.0
            done = False
            info = {'invalid_action': True, 'error': 'Node already visited'}
            return self.get_state(), reward, done, info
        
        # Check capacity
        demand = self.locations[action].get('demand', 0.0)
        if self.vehicle_capacity_used + demand > capacity:
            reward = -50.0
            done = False
            info = {'invalid_action': True, 'error': 'Capacity exceeded'}
            return self.get_state(), reward, done, info
        
        # Calculate travel time/distance
        travel_time, travel_distance = self._calculate_travel(
            self.current_node, action
        )
        
        # Update state
        self.current_node = action
        self.current_route.append(action)
        self.visited.add(action)
        self.current_time += travel_time
        self.total_distance += travel_distance
        self.total_time += travel_time
        self.vehicle_capacity_used += demand
        
        # Check time window violation
        location = self.locations[action]
        time_window_start = location.get('time_window_start', 0.0)
        time_window_end = location.get('time_window_end', float('inf'))
        
        if self.current_time < time_window_start or self.current_time > time_window_end:
            self.time_window_violations += 1
        
        # Add service time
        service_time = location.get('service_time', 0.0)
        self.current_time += service_time
        
        # Calculate reward
        reward = self._calculate_reward(action, travel_time, travel_distance)
        
        # Check if done
        done = len(self.visited) == self.num_locations
        
        info = {
            'route': self.current_route.copy(),
            'time': self.current_time,
            'distance': self.total_distance,
            'capacity_used': self.vehicle_capacity_used,
            'time_window_violations': self.time_window_violations
        }
        
        return self.get_state(), reward, done, info
    
    def _calculate_travel(
        self,
        from_node: int,
        to_node: int
    ) -> Tuple[float, float]:
        """
        Calculate travel time and distance.
        
        Args:
            from_node: Source node
            to_node: Destination node
        
        Returns:
            Tuple of (travel_time, travel_distance)
        """
        # Use time matrix if available
        if self.time_matrix is not None:
            base_travel_time = self.time_matrix[from_node][to_node]
        elif self.distance_matrix is not None:
            base_travel_time = self.distance_matrix[from_node][to_node] / 50.0
        else:
            # Calculate Euclidean distance
            from_loc = self.locations[from_node]
            to_loc = self.locations[to_node]
            distance = np.sqrt(
                (from_loc['x'] - to_loc['x'])**2 +
                (from_loc['y'] - to_loc['y'])**2
            )
            base_travel_time = distance / 50.0
        
        # Apply traffic simulation if available
        if self.traffic_simulator is not None:
            traffic_multiplier = self.traffic_simulator.get_traffic_multiplier(
                self.current_time, from_node, to_node
            )
            travel_time = base_travel_time * traffic_multiplier
        else:
            travel_time = base_travel_time
        
        # Calculate distance
        if self.distance_matrix is not None:
            travel_distance = self.distance_matrix[from_node][to_node]
        else:
            from_loc = self.locations[from_node]
            to_loc = self.locations[to_node]
            travel_distance = np.sqrt(
                (from_loc['x'] - to_loc['x'])**2 +
                (from_loc['y'] - to_loc['y'])**2
            )
        
        return travel_time, travel_distance
    
    def _calculate_reward(
        self,
        action: int,
        travel_time: float,
        travel_distance: float
    ) -> float:
        """
        Calculate reward for action.
        
        Args:
            action: Action taken
            travel_time: Travel time
            travel_distance: Travel distance
        
        Returns:
            Reward value
        """
        # Base reward: negative distance/time
        reward = -travel_distance * 0.1 - travel_time * 0.5
        
        # Penalty for time window violations
        location = self.locations[action]
        time_window_start = location.get('time_window_start', 0.0)
        time_window_end = location.get('time_window_end', float('inf'))
        
        if self.current_time < time_window_start:
            # Too early
            reward -= (time_window_start - self.current_time) * 0.1
        elif self.current_time > time_window_end:
            # Too late - large penalty
            reward -= (self.current_time - time_window_end) * 10.0
        
        # Bonus for completing route
        if len(self.visited) == self.num_locations:
            reward += 100.0
        
        # Small bonus for visiting nodes
        reward += 1.0
        
        return reward
    
    def get_state(self) -> RouteState:
        """
        Get current state.
        
        Returns:
            Current route state
        """
        remaining_demand = sum(
            self.locations[i].get('demand', 0.0)
            for i in range(self.num_locations)
            if i not in self.visited
        )
        
        return RouteState(
            current_node=self.current_node,
            visited_nodes=self.current_route.copy(),
            current_time=self.current_time,
            total_distance=self.total_distance,
            total_time=self.total_time,
            remaining_demand=remaining_demand,
            vehicle_capacity_used=self.vehicle_capacity_used,
            time_window_violations=self.time_window_violations
        )
    
    def get_state_vector(self) -> np.ndarray:
        """
        Get state as vector for RL agents.
        
        Returns:
            State vector
        """
        state = np.zeros(self.num_locations * 2 + 4)
        
        state[0] = self.current_node
        state[1] = self.current_time
        state[2] = self.total_distance
        state[3] = self.vehicle_capacity_used
        
        # Visited mask
        for i in range(self.num_locations):
            state[4 + i] = 1.0 if i in self.visited else 0.0
        
        # Remaining demand
        for i in range(self.num_locations):
            if i not in self.visited:
                state[4 + self.num_locations + i] = self.locations[i].get('demand', 0.0)
        
        return state
    
    def render(self, mode: str = 'human'):
        """
        Render environment state.
        
        Args:
            mode: Rendering mode
        """
        if mode == 'human':
            print(f"Current Node: {self.current_node}")
            print(f"Visited Nodes: {sorted(self.visited)}")
            print(f"Current Time: {self.current_time:.2f}")
            print(f"Total Distance: {self.total_distance:.2f}")
            print(f"Capacity Used: {self.vehicle_capacity_used:.2f}")
            print(f"Time Window Violations: {self.time_window_violations}")

