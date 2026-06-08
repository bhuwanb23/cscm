"""
Tests for Heuristic Algorithms
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.optimization_framework.heuristic_algorithms import (
    ForecastDrivenHeuristic
)


class TestForecastDrivenHeuristic:
    """Test cases for ForecastDrivenHeuristic."""
    
    def test_initialization(self):
        """Test heuristic initialization."""
        heuristic = ForecastDrivenHeuristic(
            safety_stock_multiplier=1.5,
            reorder_point_multiplier=1.2
        )
        
        assert heuristic.safety_stock_multiplier == 1.5
        assert heuristic.reorder_point_multiplier == 1.2
    
    def test_calculate_safety_stock(self):
        """Test safety stock calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        safety_stock = heuristic.calculate_safety_stock(
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            service_level=0.95
        )
        
        assert safety_stock >= 0
        assert isinstance(safety_stock, float)
    
    def test_calculate_reorder_point(self):
        """Test reorder point calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        reorder_point = heuristic.calculate_reorder_point(
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            service_level=0.95
        )
        
        assert reorder_point >= 0
        assert isinstance(reorder_point, float)
    
    def test_calculate_order_quantity_eoq(self):
        """Test EOQ order quantity calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        order_qty = heuristic.calculate_order_quantity(
            current_inventory=50.0,
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            max_capacity=500.0,
            method='eoq'
        )
        
        assert order_qty >= 0
        assert order_qty <= 500.0
    
    def test_calculate_order_quantity_newsvendor(self):
        """Test Newsvendor order quantity calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        order_qty = heuristic.calculate_order_quantity(
            current_inventory=50.0,
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            max_capacity=500.0,
            method='newsvendor'
        )
        
        assert order_qty >= 0
        assert order_qty <= 500.0
    
    def test_calculate_order_quantity_forecast_based(self):
        """Test forecast-based order quantity calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        order_qty = heuristic.calculate_order_quantity(
            current_inventory=50.0,
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            max_capacity=500.0,
            method='forecast_based'
        )
        
        assert order_qty >= 0
        assert order_qty <= 500.0
    
    def test_optimize_sku_store(self):
        """Test single SKU-store optimization."""
        heuristic = ForecastDrivenHeuristic()
        
        result = heuristic.optimize_sku_store(
            current_inventory=100.0,
            demand_forecast=10.0,
            demand_std=3.0,
            lead_time=7,
            max_capacity=500.0,
            method='forecast_based'
        )
        
        assert 'order_quantity' in result
        assert 'ending_inventory' in result
        assert 'total_cost' in result
        assert 'fill_rate' in result
        assert result['order_quantity'] >= 0
        assert result['ending_inventory'] >= 0
    
    def test_optimize_batch(self):
        """Test batch optimization."""
        heuristic = ForecastDrivenHeuristic()
        
        # Create sample inventory data
        inventory_data = pd.DataFrame({
            'sku_id': [1, 2, 3],
            'store_id': [1, 1, 1],
            'inventory_on_hand': [100.0, 50.0, 75.0],
            'max_stock_level': [500.0, 500.0, 500.0]
        })
        
        # Create sample forecast data
        forecast_data = pd.DataFrame({
            'sku_id': [1, 2, 3],
            'store_id': [1, 1, 1],
            'forecast': [10.0, 8.0, 12.0]
        })
        
        results = heuristic.optimize_batch(
            inventory_data,
            forecast_data,
            method='forecast_based'
        )
        
        assert len(results) == 3
        assert 'order_quantity' in results.columns
        assert 'total_cost' in results.columns
        assert all(results['order_quantity'] >= 0)
    
    def test_get_statistics(self):
        """Test statistics calculation."""
        heuristic = ForecastDrivenHeuristic()
        
        # Create sample results
        results = pd.DataFrame({
            'order_quantity': [50.0, 30.0, 20.0],
            'total_cost': [100.0, 80.0, 60.0],
            'fill_rate': [0.95, 0.90, 0.85],
            'service_level': [0.95, 0.90, 0.85],
            'expected_shortage': [0.5, 0.8, 1.2]
        })
        
        stats = heuristic.get_statistics(results)
        
        assert 'total_orders' in stats
        assert 'avg_order_quantity' in stats
        assert 'total_cost' in stats
        assert 'avg_fill_rate' in stats
        assert stats['total_orders'] == 100.0
        assert stats['total_cost'] == 240.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

