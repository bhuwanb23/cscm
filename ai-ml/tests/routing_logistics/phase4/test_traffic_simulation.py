"""
Tests for Traffic Pattern Simulator
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.routing_logistics.deployment_infrastructure.traffic_simulation import (
    TrafficPatternSimulator,
    TrafficCondition
)


class TestTrafficPatternSimulator:
    """Test cases for TrafficPatternSimulator."""
    
    def test_initialization(self):
        """Test simulator initialization."""
        simulator = TrafficPatternSimulator(base_speed=50.0)
        
        assert simulator.base_speed == 50.0
        assert len(simulator.traffic_patterns) > 0
    
    def test_get_traffic_multiplier(self):
        """Test traffic multiplier calculation."""
        simulator = TrafficPatternSimulator(base_speed=50.0)
        
        multiplier = simulator.get_traffic_multiplier(8.0, hour=8, day_of_week=0)
        
        assert 0.3 <= multiplier <= 1.2
    
    def test_get_traffic_condition(self):
        """Test traffic condition retrieval."""
        simulator = TrafficPatternSimulator(base_speed=50.0)
        
        condition = simulator.get_traffic_condition(8.0, hour=8, day_of_week=0)
        
        assert condition in [TrafficCondition.LIGHT, TrafficCondition.MODERATE, 
                             TrafficCondition.HEAVY, TrafficCondition.SEVERE]
    
    def test_add_custom_pattern(self):
        """Test adding custom traffic pattern."""
        simulator = TrafficPatternSimulator(base_speed=50.0)
        
        initial_count = len(simulator.traffic_patterns)
        
        simulator.add_custom_pattern(
            hour=12,
            day_of_week=0,
            condition=TrafficCondition.LIGHT,
            multiplier=1.0
        )
        
        assert len(simulator.traffic_patterns) == initial_count + 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

