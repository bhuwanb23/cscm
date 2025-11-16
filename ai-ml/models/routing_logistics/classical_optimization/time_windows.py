"""
Time Window Constraint Handling

This module provides utilities for handling time window constraints in routing problems.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TimeWindow:
    """Data class for a time window."""
    start: float  # Start time
    end: float  # End time
    soft: bool = False  # Whether this is a soft constraint
    penalty: float = 0.0  # Penalty for violating soft constraint


class TimeWindowHandler:
    """
    Handler for time window constraints in routing problems.
    
    Provides utilities for validating, adjusting, and managing time windows.
    """
    
    def __init__(self):
        """Initialize time window handler."""
        pass
    
    def validate_time_window(
        self,
        arrival_time: float,
        time_window: TimeWindow
    ) -> Tuple[bool, float]:
        """
        Validate if arrival time is within time window.
        
        Args:
            arrival_time: Arrival time
            time_window: Time window constraint
        
        Returns:
            Tuple of (is_valid, wait_time)
        """
        if arrival_time < time_window.start:
            # Arrive too early - need to wait
            wait_time = time_window.start - arrival_time
            if time_window.soft:
                return True, wait_time  # Soft constraint - allow with penalty
            else:
                return False, wait_time  # Hard constraint - violation
        elif arrival_time > time_window.end:
            # Arrive too late
            delay = arrival_time - time_window.end
            if time_window.soft:
                return True, -delay  # Soft constraint - allow with penalty
            else:
                return False, -delay  # Hard constraint - violation
        else:
            # Within time window
            return True, 0.0
    
    def calculate_arrival_time(
        self,
        departure_time: float,
        travel_time: float,
        service_time: float = 0.0
    ) -> float:
        """
        Calculate arrival time.
        
        Args:
            departure_time: Departure time
            travel_time: Travel time
            service_time: Service time at location
        
        Returns:
            Arrival time
        """
        return departure_time + travel_time + service_time
    
    def adjust_arrival_time(
        self,
        arrival_time: float,
        time_window: TimeWindow
    ) -> float:
        """
        Adjust arrival time to fit within time window.
        
        Args:
            arrival_time: Original arrival time
            time_window: Time window constraint
        
        Returns:
            Adjusted arrival time
        """
        if arrival_time < time_window.start:
            # Wait until window opens
            return time_window.start
        elif arrival_time > time_window.end:
            if time_window.soft:
                # Soft constraint - allow late arrival
                return arrival_time
            else:
                # Hard constraint - cannot arrive late
                return None  # Indicates infeasible
        else:
            return arrival_time
    
    def calculate_time_window_penalty(
        self,
        arrival_time: float,
        time_window: TimeWindow
    ) -> float:
        """
        Calculate penalty for time window violation.
        
        Args:
            arrival_time: Arrival time
            time_window: Time window constraint
        
        Returns:
            Penalty value
        """
        if not time_window.soft:
            return 0.0  # Hard constraints don't have penalties
        
        if arrival_time < time_window.start:
            # Early arrival penalty
            return time_window.penalty * (time_window.start - arrival_time)
        elif arrival_time > time_window.end:
            # Late arrival penalty
            return time_window.penalty * (arrival_time - time_window.end)
        else:
            return 0.0
    
    def merge_time_windows(
        self,
        time_windows: List[TimeWindow]
    ) -> Optional[TimeWindow]:
        """
        Merge multiple time windows into one.
        
        Args:
            time_windows: List of time windows
        
        Returns:
            Merged time window or None if no overlap
        """
        if not time_windows:
            return None
        
        start = max(tw.start for tw in time_windows)
        end = min(tw.end for tw in time_windows)
        
        if start > end:
            return None  # No overlap
        
        # Use soft constraint if any is soft
        soft = any(tw.soft for tw in time_windows)
        
        # Use maximum penalty
        penalty = max(tw.penalty for tw in time_windows)
        
        return TimeWindow(start=start, end=end, soft=soft, penalty=penalty)
    
    def check_feasibility(
        self,
        route: List[int],
        locations: List[Dict[str, Any]],
        time_matrix: np.ndarray,
        start_time: float = 0.0
    ) -> Tuple[bool, List[float], float]:
        """
        Check if a route is feasible with respect to time windows.
        
        Args:
            route: List of location indices in route order
            locations: List of location dictionaries with time windows
            time_matrix: Time matrix between locations
            start_time: Vehicle start time
        
        Returns:
            Tuple of (is_feasible, arrival_times, total_penalty)
        """
        if not route:
            return True, [], 0.0
        
        arrival_times = []
        current_time = start_time
        total_penalty = 0.0
        
        for i, loc_idx in enumerate(route):
            # Travel time
            if i == 0:
                travel_time = time_matrix[0][loc_idx]  # From depot
            else:
                travel_time = time_matrix[route[i-1]][loc_idx]
            
            # Arrival time
            arrival_time = current_time + travel_time
            arrival_times.append(arrival_time)
            
            # Get time window
            location = locations[loc_idx]
            time_window = TimeWindow(
                start=location.get('time_window_start', 0.0),
                end=location.get('time_window_end', float('inf')),
                soft=location.get('time_window_soft', False),
                penalty=location.get('time_window_penalty', 0.0)
            )
            
            # Validate
            is_valid, wait_time = self.validate_time_window(arrival_time, time_window)
            
            if not is_valid and not time_window.soft:
                # Hard constraint violation
                return False, arrival_times, float('inf')
            
            # Adjust arrival time
            adjusted_time = self.adjust_arrival_time(arrival_time, time_window)
            if adjusted_time is None:
                return False, arrival_times, float('inf')
            
            # Calculate penalty
            penalty = self.calculate_time_window_penalty(arrival_time, time_window)
            total_penalty += penalty
            
            # Update current time
            service_time = location.get('service_time', 0.0)
            current_time = adjusted_time + service_time
        
        return True, arrival_times, total_penalty
    
    def optimize_time_windows(
        self,
        locations: List[Dict[str, Any]],
        time_matrix: np.ndarray,
        max_route_time: float = float('inf')
    ) -> List[Dict[str, Any]]:
        """
        Optimize time windows for locations based on travel times.
        
        Args:
            locations: List of location dictionaries
            time_matrix: Time matrix between locations
            max_route_time: Maximum route time
        
        Returns:
            List of locations with optimized time windows
        """
        optimized_locations = []
        
        for i, location in enumerate(locations):
            if i == 0:  # Depot
                optimized_locations.append(location)
                continue
            
            # Calculate earliest and latest arrival times
            earliest_arrival = 0.0
            latest_arrival = max_route_time
            
            # Consider travel time from depot
            travel_from_depot = time_matrix[0][i]
            earliest_arrival = max(earliest_arrival, travel_from_depot)
            
            # Consider travel time to depot
            travel_to_depot = time_matrix[i][0]
            latest_arrival = min(latest_arrival, max_route_time - travel_to_depot)
            
            # Update time window if needed
            optimized_location = location.copy()
            if 'time_window_start' not in optimized_location:
                optimized_location['time_window_start'] = earliest_arrival
            else:
                optimized_location['time_window_start'] = max(
                    optimized_location['time_window_start'],
                    earliest_arrival
                )
            
            if 'time_window_end' not in optimized_location:
                optimized_location['time_window_end'] = latest_arrival
            else:
                optimized_location['time_window_end'] = min(
                    optimized_location['time_window_end'],
                    latest_arrival
                )
            
            optimized_locations.append(optimized_location)
        
        return optimized_locations

