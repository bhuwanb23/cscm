"""
Learned Heuristics with GNNs

This module implements learned heuristics for routing using Graph Neural Networks.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    F = None

from .gnn_route_planner import GNRoutePlanner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LearnedHeuristic:
    """
    Learned heuristics for routing using GNNs.
    
    Combines classical heuristics with learned GNN components.
    """
    
    def __init__(
        self,
        gnn_planner: Optional[GNRoutePlanner] = None,
        heuristic_weight: float = 0.5,  # Weight for classical heuristic vs learned
        device: Optional[str] = None
    ):
        """
        Initialize learned heuristic.
        
        Args:
            gnn_planner: GNN route planner (optional, creates new if not provided)
            heuristic_weight: Weight for classical heuristic (1-heuristic_weight for learned)
            device: Device to use
        """
        if gnn_planner is None:
            try:
                gnn_planner = GNRoutePlanner(device=device)
            except ImportError:
                # GNN not available, use None
                gnn_planner = None
        
        self.gnn_planner = gnn_planner
        self.heuristic_weight = heuristic_weight
    
    def nearest_neighbor_heuristic(
        self,
        locations: List[Dict[str, Any]],
        current_node: int,
        unvisited: List[int],
        distance_matrix: Optional[np.ndarray] = None
    ) -> int:
        """
        Nearest neighbor heuristic.
        
        Args:
            locations: List of location dictionaries
            current_node: Current node index
            unvisited: List of unvisited node indices
            distance_matrix: Distance matrix (optional)
        
        Returns:
            Next node index
        """
        if not unvisited:
            return -1
        
        if distance_matrix is not None:
            # Use distance matrix
            distances = distance_matrix[current_node][unvisited]
            next_node_idx = unvisited[np.argmin(distances)]
        else:
            # Calculate Euclidean distance
            current_loc = locations[current_node]
            min_dist = float('inf')
            next_node_idx = unvisited[0]
            
            for node_idx in unvisited:
                loc = locations[node_idx]
                dist = np.sqrt(
                    (current_loc['x'] - loc['x'])**2 +
                    (current_loc['y'] - loc['y'])**2
                )
                if dist < min_dist:
                    min_dist = dist
                    next_node_idx = node_idx
        
        return next_node_idx
    
    def time_window_heuristic(
        self,
        locations: List[Dict[str, Any]],
        current_node: int,
        unvisited: List[int],
        current_time: float,
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None
    ) -> int:
        """
        Time window priority heuristic.
        
        Args:
            locations: List of location dictionaries
            current_node: Current node index
            unvisited: List of unvisited node indices
            current_time: Current time
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
        
        Returns:
            Next node index
        """
        if not unvisited:
            return -1
        
        best_node = unvisited[0]
        best_score = float('inf')
        
        for node_idx in unvisited:
            loc = locations[node_idx]
            
            # Calculate arrival time
            if time_matrix is not None:
                travel_time = time_matrix[current_node][node_idx]
            elif distance_matrix is not None:
                travel_time = distance_matrix[current_node][node_idx] / 50.0  # Assume 50 units/time
            else:
                current_loc = locations[current_node]
                dist = np.sqrt((current_loc['x'] - loc['x'])**2 + (current_loc['y'] - loc['y'])**2)
                travel_time = dist / 50.0
            
            arrival_time = current_time + travel_time
            
            # Score based on time window urgency
            time_window_start = loc.get('time_window_start', 0.0)
            time_window_end = loc.get('time_window_end', float('inf'))
            
            if arrival_time < time_window_start:
                # Too early - wait time
                score = time_window_start - arrival_time
            elif arrival_time > time_window_end:
                # Too late - high penalty
                score = 1000 + (arrival_time - time_window_end)
            else:
                # Within window - prefer earlier windows
                score = time_window_start
            
            if score < best_score:
                best_score = score
                best_node = node_idx
        
        return best_node
    
    def hybrid_heuristic(
        self,
        locations: List[Dict[str, Any]],
        current_node: int,
        unvisited: List[int],
        current_time: float = 0.0,
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None
    ) -> int:
        """
        Hybrid heuristic combining classical and learned components.
        
        Args:
            locations: List of location dictionaries
            current_node: Current node index
            unvisited: List of unvisited node indices
            current_time: Current time
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
        
        Returns:
            Next node index
        """
        if not unvisited:
            return -1
        
        # Classical heuristic score
        nn_node = self.nearest_neighbor_heuristic(locations, current_node, unvisited, distance_matrix)
        tw_node = self.time_window_heuristic(locations, current_node, unvisited, current_time, distance_matrix, time_matrix)
        
        # Learned heuristic score (if GNN is trained)
        if self.gnn_planner is not None and self.gnn_planner.is_trained:
            learned_node = self.gnn_planner.predict_next_node(locations, [current_node], distance_matrix)
        else:
            learned_node = nn_node  # Fallback to nearest neighbor
        
        # Combine scores
        scores = {}
        for node_idx in unvisited:
            score = 0.0
            
            # Nearest neighbor component
            if node_idx == nn_node:
                score += self.heuristic_weight * 0.5
            
            # Time window component
            if node_idx == tw_node:
                score += self.heuristic_weight * 0.5
            
            # Learned component
            if node_idx == learned_node:
                score += (1 - self.heuristic_weight)
            
            scores[node_idx] = score
        
        # Select node with highest score
        best_node = max(scores, key=scores.get)
        
        return best_node
    
    def generate_route(
        self,
        locations: List[Dict[str, Any]],
        start_node: int = 0,
        current_time: float = 0.0,
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None,
        heuristic_type: str = 'hybrid'  # 'nearest_neighbor', 'time_window', 'hybrid'
    ) -> List[int]:
        """
        Generate route using learned heuristic.
        
        Args:
            locations: List of location dictionaries
            start_node: Starting node index
            current_time: Starting time
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
            heuristic_type: Type of heuristic to use
        
        Returns:
            Route as list of node indices
        """
        route = [start_node]
        unvisited = [i for i in range(len(locations)) if i != start_node]
        current_node = start_node
        time = current_time
        
        while unvisited:
            if heuristic_type == 'nearest_neighbor':
                next_node = self.nearest_neighbor_heuristic(
                    locations, current_node, unvisited, distance_matrix
                )
            elif heuristic_type == 'time_window':
                next_node = self.time_window_heuristic(
                    locations, current_node, unvisited, time, distance_matrix, time_matrix
                )
            else:  # hybrid
                next_node = self.hybrid_heuristic(
                    locations, current_node, unvisited, time, distance_matrix, time_matrix
                )
            
            if next_node == -1:
                break
            
            route.append(next_node)
            unvisited.remove(next_node)
            current_node = next_node
            
            # Update time
            if time_matrix is not None:
                time += time_matrix[route[-2]][next_node]
            elif distance_matrix is not None:
                time += distance_matrix[route[-2]][next_node] / 50.0
            else:
                prev_loc = locations[route[-2]]
                curr_loc = locations[next_node]
                dist = np.sqrt((prev_loc['x'] - curr_loc['x'])**2 + (prev_loc['y'] - curr_loc['y'])**2)
                time += dist / 50.0
            
            # Add service time
            time += locations[next_node].get('service_time', 0.0)
        
        return route

