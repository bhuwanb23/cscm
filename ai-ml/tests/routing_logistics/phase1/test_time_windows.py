"""
Tests for Time Window Handler
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.routing_logistics.classical_optimization.time_windows import (
    TimeWindowHandler,
    TimeWindow
)


class TestTimeWindowHandler:
    """Test cases for TimeWindowHandler."""
    
    def test_initialization(self):
        """Test handler initialization."""
        handler = TimeWindowHandler()
        
        assert handler is not None
    
    def test_validate_time_window(self):
        """Test time window validation."""
        handler = TimeWindowHandler()
        
        time_window = TimeWindow(start=10.0, end=20.0)
        
        # Within window
        is_valid, wait_time = handler.validate_time_window(15.0, time_window)
        assert is_valid is True
        assert wait_time == 0.0
        
        # Too early
        is_valid, wait_time = handler.validate_time_window(5.0, time_window)
        assert is_valid is False
        assert wait_time == 5.0
        
        # Too late
        is_valid, wait_time = handler.validate_time_window(25.0, time_window)
        assert is_valid is False
        assert wait_time == -5.0
    
    def test_validate_soft_time_window(self):
        """Test soft time window validation."""
        handler = TimeWindowHandler()
        
        time_window = TimeWindow(start=10.0, end=20.0, soft=True)
        
        # Too early - soft constraint allows
        is_valid, wait_time = handler.validate_time_window(5.0, time_window)
        assert is_valid is True
        assert wait_time == 5.0
        
        # Too late - soft constraint allows
        is_valid, wait_time = handler.validate_time_window(25.0, time_window)
        assert is_valid is True
        assert wait_time == -5.0
    
    def test_calculate_arrival_time(self):
        """Test arrival time calculation."""
        handler = TimeWindowHandler()
        
        arrival_time = handler.calculate_arrival_time(
            departure_time=10.0,
            travel_time=5.0,
            service_time=2.0
        )
        
        assert arrival_time == 17.0
    
    def test_adjust_arrival_time(self):
        """Test arrival time adjustment."""
        handler = TimeWindowHandler()
        
        time_window = TimeWindow(start=10.0, end=20.0)
        
        # Too early
        adjusted = handler.adjust_arrival_time(5.0, time_window)
        assert adjusted == 10.0
        
        # Within window
        adjusted = handler.adjust_arrival_time(15.0, time_window)
        assert adjusted == 15.0
        
        # Too late - hard constraint
        adjusted = handler.adjust_arrival_time(25.0, time_window)
        assert adjusted is None
    
    def test_calculate_time_window_penalty(self):
        """Test penalty calculation."""
        handler = TimeWindowHandler()
        
        time_window = TimeWindow(start=10.0, end=20.0, soft=True, penalty=1.0)
        
        # Within window
        penalty = handler.calculate_time_window_penalty(15.0, time_window)
        assert penalty == 0.0
        
        # Too early
        penalty = handler.calculate_time_window_penalty(5.0, time_window)
        assert penalty == 5.0
        
        # Too late
        penalty = handler.calculate_time_window_penalty(25.0, time_window)
        assert penalty == 5.0
    
    def test_merge_time_windows(self):
        """Test time window merging."""
        handler = TimeWindowHandler()
        
        tw1 = TimeWindow(start=10.0, end=20.0)
        tw2 = TimeWindow(start=15.0, end=25.0)
        
        merged = handler.merge_time_windows([tw1, tw2])
        
        assert merged is not None
        assert merged.start == 15.0
        assert merged.end == 20.0
    
    def test_check_feasibility(self):
        """Test route feasibility checking."""
        handler = TimeWindowHandler()
        
        locations = [
            {'id': 0, 'time_window_start': 0.0, 'time_window_end': 1000.0, 'service_time': 0.0},
            {'id': 1, 'time_window_start': 0.0, 'time_window_end': 100.0, 'service_time': 5.0},
            {'id': 2, 'time_window_start': 0.0, 'time_window_end': 200.0, 'service_time': 5.0}
        ]
        
        time_matrix = np.array([
            [0, 10, 20],
            [10, 0, 10],
            [20, 10, 0]
        ])
        
        route = [1, 2]
        is_feasible, arrival_times, penalty = handler.check_feasibility(
            route, locations, time_matrix, start_time=0.0
        )
        
        assert is_feasible is True
        assert len(arrival_times) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

