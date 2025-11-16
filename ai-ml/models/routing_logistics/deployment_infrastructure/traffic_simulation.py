"""
Realistic Traffic Pattern Simulation

This module implements realistic traffic pattern simulation for routing.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TrafficCondition(Enum):
    """Traffic condition levels."""
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"


@dataclass
class TrafficPattern:
    """Traffic pattern configuration."""
    hour: int
    day_of_week: int
    condition: TrafficCondition
    multiplier: float  # Speed multiplier (1.0 = normal, <1.0 = slower)


class TrafficPatternSimulator:
    """
    Realistic traffic pattern simulator.
    
    Simulates traffic patterns based on time of day, day of week,
    weather conditions, and historical data.
    """
    
    def __init__(
        self,
        base_speed: float = 50.0,  # Base speed in units per time unit
        random_seed: Optional[int] = None
    ):
        """
        Initialize traffic pattern simulator.
        
        Args:
            base_speed: Base travel speed
            random_seed: Random seed for reproducibility
        """
        self.base_speed = base_speed
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        # Default traffic patterns (rush hours, weekends, etc.)
        self.traffic_patterns = self._initialize_default_patterns()
    
    def _initialize_default_patterns(self) -> List[TrafficPattern]:
        """Initialize default traffic patterns."""
        patterns = []
        
        # Rush hour patterns (weekdays)
        for day in range(5):  # Monday to Friday
            # Morning rush: 7-9 AM
            for hour in range(7, 10):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.HEAVY,
                    multiplier=0.6
                ))
            
            # Evening rush: 5-7 PM
            for hour in range(17, 20):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.HEAVY,
                    multiplier=0.6
                ))
            
            # Midday: 10 AM - 4 PM
            for hour in range(10, 17):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.MODERATE,
                    multiplier=0.8
                ))
            
            # Night: 8 PM - 6 AM
            for hour in list(range(20, 24)) + list(range(0, 7)):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.LIGHT,
                    multiplier=1.0
                ))
        
        # Weekend patterns
        for day in [5, 6]:  # Saturday, Sunday
            # Daytime: 10 AM - 8 PM
            for hour in range(10, 21):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.MODERATE,
                    multiplier=0.85
                ))
            
            # Night: 8 PM - 10 AM
            for hour in list(range(21, 24)) + list(range(0, 11)):
                patterns.append(TrafficPattern(
                    hour=hour,
                    day_of_week=day,
                    condition=TrafficCondition.LIGHT,
                    multiplier=1.0
                ))
        
        return patterns
    
    def get_traffic_multiplier(
        self,
        current_time: float,
        from_node: Optional[int] = None,
        to_node: Optional[int] = None,
        hour: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> float:
        """
        Get traffic speed multiplier for given time.
        
        Args:
            current_time: Current time (in hours from start)
            from_node: Source node (optional, for location-specific patterns)
            to_node: Destination node (optional, for location-specific patterns)
            hour: Hour of day (0-23), if None, calculated from current_time
            day_of_week: Day of week (0=Monday, 6=Sunday), if None, calculated
        
        Returns:
            Speed multiplier (1.0 = normal, <1.0 = slower)
        """
        # Calculate hour and day if not provided
        if hour is None:
            hour = int(current_time) % 24
        
        if day_of_week is None:
            # Assume day 0 (Monday) for simplicity
            day_of_week = (int(current_time) // 24) % 7
        
        # Find matching pattern
        for pattern in self.traffic_patterns:
            if pattern.hour == hour and pattern.day_of_week == day_of_week:
                base_multiplier = pattern.multiplier
                break
        else:
            # Default to moderate traffic
            base_multiplier = 0.8
        
        # Add random variation
        variation = np.random.normal(0, 0.1)
        multiplier = base_multiplier + variation
        
        # Clamp to reasonable range
        multiplier = np.clip(multiplier, 0.3, 1.2)
        
        return multiplier
    
    def get_traffic_condition(
        self,
        current_time: float,
        hour: Optional[int] = None,
        day_of_week: Optional[int] = None
    ) -> TrafficCondition:
        """
        Get traffic condition for given time.
        
        Args:
            current_time: Current time
            hour: Hour of day (optional)
            day_of_week: Day of week (optional)
        
        Returns:
            Traffic condition
        """
        multiplier = self.get_traffic_multiplier(current_time, hour=hour, day_of_week=day_of_week)
        
        if multiplier >= 0.9:
            return TrafficCondition.LIGHT
        elif multiplier >= 0.7:
            return TrafficCondition.MODERATE
        elif multiplier >= 0.5:
            return TrafficCondition.HEAVY
        else:
            return TrafficCondition.SEVERE
    
    def add_custom_pattern(
        self,
        hour: int,
        day_of_week: int,
        condition: TrafficCondition,
        multiplier: float
    ):
        """
        Add custom traffic pattern.
        
        Args:
            hour: Hour of day (0-23)
            day_of_week: Day of week (0=Monday, 6=Sunday)
            condition: Traffic condition
            multiplier: Speed multiplier
        """
        pattern = TrafficPattern(
            hour=hour,
            day_of_week=day_of_week,
            condition=condition,
            multiplier=multiplier
        )
        self.traffic_patterns.append(pattern)
    
    def load_historical_patterns(
        self,
        data: pd.DataFrame,
        time_column: str = 'time',
        speed_column: str = 'speed',
        location_column: Optional[str] = None
    ):
        """
        Load traffic patterns from historical data.
        
        Args:
            data: Historical traffic data
            time_column: Column name for time
            speed_column: Column name for speed
            location_column: Column name for location (optional)
        """
        # This would analyze historical data and create patterns
        # Simplified version for now
        logger.info(f"Loading historical patterns from {len(data)} records")
        
        # Group by hour and day of week
        if time_column in data.columns:
            data['hour'] = pd.to_datetime(data[time_column]).dt.hour
            data['day_of_week'] = pd.to_datetime(data[time_column]).dt.dayofweek
            
            grouped = data.groupby(['hour', 'day_of_week'])[speed_column].mean()
            
            for (hour, day), avg_speed in grouped.items():
                multiplier = avg_speed / self.base_speed
                
                if multiplier >= 0.9:
                    condition = TrafficCondition.LIGHT
                elif multiplier >= 0.7:
                    condition = TrafficCondition.MODERATE
                elif multiplier >= 0.5:
                    condition = TrafficCondition.HEAVY
                else:
                    condition = TrafficCondition.SEVERE
                
                self.add_custom_pattern(hour, day, condition, multiplier)

