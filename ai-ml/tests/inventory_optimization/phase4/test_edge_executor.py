"""
Tests for Edge Decision Executor
"""

import pytest
import sys
import os
from datetime import datetime

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.inventory_optimization.deployment_integration.edge_executor import (
    EdgeDecisionExecutor
)
from models.inventory_optimization.deployment_integration.hitl_interface import (
    HITLInterface,
    OverrideType
)


class TestEdgeDecisionExecutor:
    """Test cases for EdgeDecisionExecutor."""
    
    def test_initialization(self):
        """Test executor initialization."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        assert executor.store_id == 1
        assert len(executor.decision_cache) == 0
    
    def test_make_replenishment_decision(self):
        """Test making replenishment decision."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        decision = executor.make_replenishment_decision(
            sku_id=1,
            current_inventory=150.0,  # Above reorder point
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        assert decision.sku_id == 1
        assert decision.store_id == 1
        assert decision.order_quantity == 0.0  # Above reorder point, no order needed
        assert decision.decision_source == 'automated'
    
    def test_make_replenishment_decision_below_reorder(self):
        """Test decision when below reorder point."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        decision = executor.make_replenishment_decision(
            sku_id=1,
            current_inventory=50.0,
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        # Should order when below reorder point
        decision2 = executor.make_replenishment_decision(
            sku_id=1,
            current_inventory=80.0,  # Below reorder point
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        assert decision2.order_quantity > 0
    
    def test_execute_decision(self):
        """Test decision execution."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        decision = executor.make_replenishment_decision(
            sku_id=1,
            current_inventory=50.0,
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        result = executor.execute_decision(decision.decision_id)
        
        assert result is True
        assert executor.decision_cache[decision.decision_id].execution_status == 'executed'
    
    def test_cancel_decision(self):
        """Test decision cancellation."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        decision = executor.make_replenishment_decision(
            sku_id=1,
            current_inventory=50.0,
            demand_forecast=10.0,
            reorder_point=100.0,
            order_up_to_level=200.0
        )
        
        result = executor.cancel_decision(decision.decision_id, reason="Changed mind")
        
        assert result is True
        assert executor.decision_cache[decision.decision_id].execution_status == 'cancelled'
    
    def test_get_pending_decisions(self):
        """Test getting pending decisions."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        decision1 = executor.make_replenishment_decision(
            sku_id=1, current_inventory=50.0, demand_forecast=10.0,
            reorder_point=100.0, order_up_to_level=200.0
        )
        
        decision2 = executor.make_replenishment_decision(
            sku_id=2, current_inventory=50.0, demand_forecast=10.0,
            reorder_point=100.0, order_up_to_level=200.0
        )
        
        executor.execute_decision(decision1.decision_id)
        
        pending = executor.get_pending_decisions()
        
        assert len(pending) == 1
        assert pending[0].decision_id == decision2.decision_id
    
    def test_get_store_statistics(self):
        """Test getting store statistics."""
        executor = EdgeDecisionExecutor(store_id=1)
        
        # Make some decisions
        decision1 = executor.make_replenishment_decision(
            sku_id=1, current_inventory=50.0, demand_forecast=10.0,
            reorder_point=100.0, order_up_to_level=200.0
        )
        
        executor.execute_decision(decision1.decision_id)
        
        stats = executor.get_store_statistics()
        
        assert stats['store_id'] == 1
        assert stats['total_decisions'] == 1
        assert stats['executed'] == 1
        assert stats['pending'] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

