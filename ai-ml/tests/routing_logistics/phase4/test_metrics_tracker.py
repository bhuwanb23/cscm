"""
Tests for Routing Metrics Tracker
"""

import pytest
import numpy as np
from datetime import datetime, timedelta
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.routing_logistics.deployment_infrastructure.metrics_tracker import (
    RoutingMetricsTracker
)


class TestRoutingMetricsTracker:
    """Test cases for RoutingMetricsTracker."""
    
    def test_initialization(self):
        """Test tracker initialization."""
        tracker = RoutingMetricsTracker()
        
        assert len(tracker.route_metrics) == 0
        assert len(tracker.delivery_metrics) == 0
    
    def test_record_route(self):
        """Test route recording."""
        tracker = RoutingMetricsTracker()
        
        metrics = tracker.record_route(
            route_id='R1',
            vehicle_id=1,
            total_distance=100.0,
            total_time=120.0,
            planned_time=100.0,
            time_window_violations=0,
            capacity_utilization=0.8,
            num_stops=5
        )
        
        assert metrics.route_id == 'R1'
        assert len(tracker.route_metrics) == 1
    
    def test_record_delivery(self):
        """Test delivery recording."""
        tracker = RoutingMetricsTracker()
        
        now = datetime.now()
        metrics = tracker.record_delivery(
            delivery_id='D1',
            route_id='R1',
            location_id=1,
            planned_arrival=now,
            actual_arrival=now + timedelta(minutes=5),
            time_window_start=now - timedelta(minutes=10),
            time_window_end=now + timedelta(minutes=10)
        )
        
        assert metrics.delivery_id == 'D1'
        assert len(tracker.delivery_metrics) == 1
    
    def test_calculate_route_efficiency(self):
        """Test route efficiency calculation."""
        tracker = RoutingMetricsTracker()
        
        # Record some routes
        tracker.record_route('R1', 1, 100.0, 120.0, 100.0, 0, 0.8, 5)
        tracker.record_route('R2', 2, 150.0, 180.0, 150.0, 1, 0.9, 6)
        
        efficiency = tracker.calculate_route_efficiency()
        
        assert 'avg_distance' in efficiency
        assert 'on_time_rate' in efficiency
        assert efficiency['avg_distance'] > 0
    
    def test_calculate_on_time_delivery(self):
        """Test on-time delivery calculation."""
        tracker = RoutingMetricsTracker()
        
        now = datetime.now()
        tracker.record_delivery('D1', 'R1', 1, now, now, now, now + timedelta(hours=1))
        tracker.record_delivery('D2', 'R2', 2, now, now + timedelta(minutes=20), now, now + timedelta(hours=1))
        
        on_time = tracker.calculate_on_time_delivery()
        
        assert 'on_time_rate' in on_time
        assert 'avg_delay_minutes' in on_time
    
    def test_get_period_summary(self):
        """Test period summary."""
        tracker = RoutingMetricsTracker()
        
        now = datetime.now()
        period_start = now - timedelta(hours=24)
        period_end = now
        
        tracker.record_route('R1', 1, 100.0, 120.0, 100.0, 0, 0.8, 5, now)
        
        summary = tracker.get_period_summary(period_start, period_end)
        
        assert 'route_efficiency' in summary
        assert 'on_time_delivery' in summary
        assert 'overall_score' in summary


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

