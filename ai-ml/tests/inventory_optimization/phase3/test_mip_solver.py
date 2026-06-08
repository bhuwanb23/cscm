"""
Tests for MIP Solver
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

pytestmark = pytest.mark.skipif(not HAS_ORTOOLS, reason="ortools not available")

from legacy_models.inventory_optimization.optimization_framework.mip_solver import (
    MIPInventoryOptimizer,
    InventoryProblem
)


class TestMIPInventoryOptimizer:
    """Test cases for MIPInventoryOptimizer."""
    
    def test_initialization(self):
        """Test optimizer initialization."""
        optimizer = MIPInventoryOptimizer(
            solver_type='ortools',
            time_limit=300,
            mip_gap=0.01
        )
        
        assert optimizer.solver_type == 'ortools'
        assert optimizer.time_limit == 300
        assert optimizer.mip_gap == 0.01
    
    def test_create_problem(self):
        """Test problem creation."""
        problem = InventoryProblem(
            sku_ids=[1, 2],
            store_ids=[1, 2],
            current_inventory={(1, 1): 100.0, (1, 2): 50.0, (2, 1): 75.0, (2, 2): 25.0},
            demand_forecast={(1, 1): 10.0, (1, 2): 8.0, (2, 1): 12.0, (2, 2): 6.0},
            holding_cost={(1, 1): 0.1, (1, 2): 0.1, (2, 1): 0.1, (2, 2): 0.1},
            shortage_cost={(1, 1): 5.0, (1, 2): 5.0, (2, 1): 5.0, (2, 2): 5.0},
            ordering_cost={(1, 1): 10.0, (1, 2): 10.0, (2, 1): 10.0, (2, 2): 10.0},
            unit_cost={(1, 1): 1.0, (1, 2): 1.0, (2, 1): 1.0, (2, 2): 1.0},
            max_capacity={(1, 1): 500.0, (1, 2): 500.0, (2, 1): 500.0, (2, 2): 500.0},
            min_order_quantity={(1, 1): 0.0, (1, 2): 0.0, (2, 1): 0.0, (2, 2): 0.0},
            max_order_quantity={(1, 1): 200.0, (1, 2): 200.0, (2, 1): 200.0, (2, 2): 200.0},
            lead_time={(1, 1): 7, (1, 2): 7, (2, 1): 7, (2, 2): 7}
        )
        
        assert len(problem.sku_ids) == 2
        assert len(problem.store_ids) == 2
        assert problem.current_inventory[(1, 1)] == 100.0
    
    def test_optimize_simple(self):
        """Test simple optimization."""
        optimizer = MIPInventoryOptimizer(
            solver_type='ortools',
            time_limit=60
        )
        
        problem = InventoryProblem(
            sku_ids=[1],
            store_ids=[1],
            current_inventory={(1, 1): 100.0},
            demand_forecast={(1, 1): 10.0},
            holding_cost={(1, 1): 0.1},
            shortage_cost={(1, 1): 5.0},
            ordering_cost={(1, 1): 10.0},
            unit_cost={(1, 1): 1.0},
            max_capacity={(1, 1): 500.0},
            min_order_quantity={(1, 1): 0.0},
            max_order_quantity={(1, 1): 200.0},
            lead_time={(1, 1): 7}
        )
        
        result = optimizer.optimize(problem)
        
        assert result['status'] in ['optimal', 'feasible']
        assert result['solution'] is not None
        assert (1, 1) in result['solution']
    
    def test_optimize_with_budget(self):
        """Test optimization with budget constraint."""
        optimizer = MIPInventoryOptimizer(
            solver_type='ortools',
            time_limit=60
        )
        
        problem = InventoryProblem(
            sku_ids=[1, 2],
            store_ids=[1],
            current_inventory={(1, 1): 100.0, (2, 1): 50.0},
            demand_forecast={(1, 1): 10.0, (2, 1): 8.0},
            holding_cost={(1, 1): 0.1, (2, 1): 0.1},
            shortage_cost={(1, 1): 5.0, (2, 1): 5.0},
            ordering_cost={(1, 1): 10.0, (2, 1): 10.0},
            unit_cost={(1, 1): 1.0, (2, 1): 1.0},
            max_capacity={(1, 1): 500.0, (2, 1): 500.0},
            min_order_quantity={(1, 1): 0.0, (2, 1): 0.0},
            max_order_quantity={(1, 1): 200.0, (2, 1): 200.0},
            lead_time={(1, 1): 7, (2, 1): 7},
            budget=100.0
        )
        
        result = optimizer.optimize(problem)
        
        assert result['status'] in ['optimal', 'feasible']
        if result['solution']:
            # Check budget constraint
            total_cost = sum(
                result['solution'][(sku_id, 1)]['order_quantity'] * problem.unit_cost.get((sku_id, 1), 1.0)
                for sku_id in problem.sku_ids
            )
            assert total_cost <= problem.budget * 1.01  # Allow small tolerance
    
    def test_optimize_with_service_level(self):
        """Test optimization with service level constraint."""
        optimizer = MIPInventoryOptimizer(
            solver_type='ortools',
            time_limit=60
        )
        
        problem = InventoryProblem(
            sku_ids=[1],
            store_ids=[1],
            current_inventory={(1, 1): 50.0},
            demand_forecast={(1, 1): 10.0},
            holding_cost={(1, 1): 0.1},
            shortage_cost={(1, 1): 5.0},
            ordering_cost={(1, 1): 10.0},
            unit_cost={(1, 1): 1.0},
            max_capacity={(1, 1): 500.0},
            min_order_quantity={(1, 1): 0.0},
            max_order_quantity={(1, 1): 200.0},
            lead_time={(1, 1): 7},
            service_level=0.95
        )
        
        result = optimizer.optimize(problem)
        
        assert result['status'] in ['optimal', 'feasible', 'infeasible']


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

