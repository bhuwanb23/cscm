"""
Tests for Metrics Tracker
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.inventory_optimization.deployment_integration.metrics_tracker import (
    InventoryMetricsTracker
)


class TestInventoryMetricsTracker:
    """Test cases for InventoryMetricsTracker."""
    
    def test_initialization(self):
        """Test tracker initialization."""
        tracker = InventoryMetricsTracker()
        
        assert len(tracker.metrics_history) == 0
        assert len(tracker.sku_store_metrics) == 0
    
    def test_calculate_fill_rate(self):
        """Test fill rate calculation."""
        tracker = InventoryMetricsTracker()
        
        fill_rate = tracker.calculate_fill_rate(demand=100.0, satisfied_demand=95.0)
        assert fill_rate == 0.95
        
        fill_rate = tracker.calculate_fill_rate(demand=100.0, satisfied_demand=100.0)
        assert fill_rate == 1.0
        
        fill_rate = tracker.calculate_fill_rate(demand=0.0, satisfied_demand=0.0)
        assert fill_rate == 1.0
    
    def test_calculate_days_of_supply(self):
        """Test days of supply calculation."""
        tracker = InventoryMetricsTracker()
        
        days = tracker.calculate_days_of_supply(current_inventory=100.0, average_daily_demand=10.0)
        assert days == 10.0
        
        days = tracker.calculate_days_of_supply(current_inventory=0.0, average_daily_demand=10.0)
        assert days == 0.0
        
        days = tracker.calculate_days_of_supply(current_inventory=100.0, average_daily_demand=0.0)
        assert days == float('inf')
    
    def test_calculate_inventory_turns(self):
        """Test inventory turns calculation."""
        tracker = InventoryMetricsTracker()
        
        turns = tracker.calculate_inventory_turns(cost_of_goods_sold=1000.0, average_inventory_value=500.0)
        assert turns == 2.0
        
        turns = tracker.calculate_inventory_turns(cost_of_goods_sold=0.0, average_inventory_value=500.0)
        assert turns == 0.0
        
        turns = tracker.calculate_inventory_turns(cost_of_goods_sold=1000.0, average_inventory_value=0.0)
        assert turns == 0.0
    
    def test_calculate_inventory_turns_alternative(self):
        """Test alternative inventory turns calculation."""
        tracker = InventoryMetricsTracker()
        
        turns = tracker.calculate_inventory_turns_alternative(sales_quantity=100.0, average_inventory_quantity=50.0)
        assert turns == 2.0
    
    def test_track_period_metrics(self):
        """Test period metrics tracking."""
        tracker = InventoryMetricsTracker()
        
        date = datetime.now()
        metrics = tracker.track_period_metrics(
            sku_id=1,
            store_id=1,
            date=date,
            current_inventory=100.0,
            demand=10.0,
            satisfied_demand=9.0,
            sales_quantity=9.0
        )
        
        assert metrics['sku_id'] == 1
        assert metrics['store_id'] == 1
        assert metrics['fill_rate'] == 0.9
        assert metrics['days_of_supply'] > 0
        assert len(tracker.metrics_history) == 1
    
    def test_get_aggregate_metrics(self):
        """Test aggregate metrics retrieval."""
        tracker = InventoryMetricsTracker()
        
        # Track some metrics
        for i in range(5):
            tracker.track_period_metrics(
                sku_id=1,
                store_id=1,
                date=datetime.now() + timedelta(days=i),
                current_inventory=100.0,
                demand=10.0,
                satisfied_demand=9.0
            )
        
        aggregate = tracker.get_aggregate_metrics(sku_id=1, store_id=1)
        
        assert aggregate['avg_fill_rate'] == 0.9
        assert aggregate['total_demand'] == 50.0
        assert aggregate['total_satisfied'] == 45.0
        assert aggregate['periods'] == 5
    
    def test_get_sku_store_metrics(self):
        """Test SKU-store metrics retrieval."""
        tracker = InventoryMetricsTracker()
        
        # Track metrics
        tracker.track_period_metrics(
            sku_id=1,
            store_id=1,
            date=datetime.now(),
            current_inventory=100.0,
            demand=10.0,
            satisfied_demand=9.0
        )
        
        metrics = tracker.get_sku_store_metrics(sku_id=1, store_id=1)
        
        assert metrics['sku_id'] == 1
        assert metrics['store_id'] == 1
        assert metrics['fill_rate'] == 0.9
        assert metrics['total_demand'] == 10.0
    
    def test_export_import_metrics(self, tmp_path):
        """Test metrics export and import."""
        tracker = InventoryMetricsTracker()
        
        # Track some metrics
        tracker.track_period_metrics(
            sku_id=1,
            store_id=1,
            date=datetime.now(),
            current_inventory=100.0,
            demand=10.0,
            satisfied_demand=9.0
        )
        
        # Export
        filepath = tmp_path / "metrics.csv"
        tracker.export_metrics(str(filepath))
        
        assert filepath.exists()
        
        # Import
        tracker2 = InventoryMetricsTracker()
        tracker2.load_metrics(str(filepath))
        
        assert len(tracker2.metrics_history) == 1
        assert tracker2.metrics_history[0]['sku_id'] == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

