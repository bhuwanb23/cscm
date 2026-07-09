"""
Tests for Central Coordinator
"""

import pytest
import sys
import os
from datetime import datetime

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.deployment_integration.central_coordinator import (
    CentralCoordinator
)
from legacy_models.inventory_optimization.deployment_integration.edge_executor import (
    EdgeDecisionExecutor
)
from legacy_models.inventory_optimization.deployment_integration.metrics_tracker import (
    InventoryMetricsTracker
)


class TestCentralCoordinator:
    """Test cases for CentralCoordinator."""
    
    def test_initialization(self):
        """Test coordinator initialization."""
        coordinator = CentralCoordinator()
        
        assert len(coordinator.edge_executors) == 0
        assert len(coordinator.coordination_history) == 0
    
    def test_register_store(self):
        """Test store registration."""
        coordinator = CentralCoordinator()
        
        coordinator.register_store(store_id=1)
        
        assert 1 in coordinator.edge_executors
        assert coordinator.edge_executors[1].store_id == 1
    
    def test_coordinate_replenishment(self):
        """Test replenishment coordination."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        
        result = coordinator.coordinate_replenishment(
            store_id=1,
            sku_id=1,
            current_inventory=50.0,
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        assert result['status'] == 'success'
        assert 'decision_id' in result
        assert 'order_quantity' in result
    
    def test_batch_coordinate_replenishment(self):
        """Test batch coordination."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        
        store_sku_data = [
            {
                'store_id': 1,
                'sku_id': 1,
                'current_inventory': 50.0,
                'demand_forecast': 10.0,
                'reorder_point': 100.0,
                'order_up_to_level': 200.0
            },
            {
                'store_id': 1,
                'sku_id': 2,
                'current_inventory': 80.0,
                'demand_forecast': 8.0,
                'reorder_point': 100.0,
                'order_up_to_level': 200.0
            }
        ]
        
        result = coordinator.batch_coordinate_replenishment(store_sku_data)
        
        assert result['total'] == 2
        assert result['successful'] == 2
        assert len(result['results']) == 2
    
    def test_get_store_metrics(self):
        """Test getting store metrics."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        
        # Coordinate some decisions
        coordinator.coordinate_replenishment(
            store_id=1, sku_id=1,
            current_inventory=50.0, demand_forecast=10.0,
            reorder_point=100.0, order_up_to_level=200.0
        )
        
        metrics = coordinator.get_store_metrics(store_id=1)
        
        assert metrics['store_id'] == 1
        assert 'decision_statistics' in metrics
        assert 'inventory_metrics' in metrics
    
    def test_get_aggregate_metrics(self):
        """Test getting aggregate metrics."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        coordinator.register_store(store_id=2)
        
        # Coordinate decisions
        coordinator.coordinate_replenishment(
            store_id=1, sku_id=1,
            current_inventory=50.0, demand_forecast=10.0,
            reorder_point=100.0, order_up_to_level=200.0
        )
        
        aggregate = coordinator.get_aggregate_metrics()
        
        assert aggregate['total_stores'] == 2
        assert 'total_decisions' in aggregate
        assert 'inventory_metrics' in aggregate
    
    def test_sync_with_edge(self):
        """Test syncing with edge."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        
        result = coordinator.sync_with_edge(store_id=1)
        
        assert result['status'] == 'success'
        assert result['store_id'] == 1
    
    def test_sync_all_stores(self):
        """Test syncing all stores."""
        coordinator = CentralCoordinator()
        coordinator.register_store(store_id=1)
        coordinator.register_store(store_id=2)
        
        result = coordinator.sync_all_stores()
        
        assert result['total_stores'] == 2
        assert len(result['sync_results']) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

