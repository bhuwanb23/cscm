"""
Tests for Batch Optimizer
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

pytestmark = pytest.mark.skipif(not HAS_ORTOOLS, reason="ortools not available")

from models.inventory_optimization.optimization_framework.batch_optimizer import (
    PeriodicBatchOptimizer
)


class TestPeriodicBatchOptimizer:
    """Test cases for PeriodicBatchOptimizer."""
    
    def test_initialization(self):
        """Test optimizer initialization."""
        optimizer = PeriodicBatchOptimizer(
            optimizer_type='mip',
            batch_size=100,
            solver_type='ortools'
        )
        
        assert optimizer.optimizer_type == 'mip'
        assert optimizer.batch_size == 100
    
    def test_prepare_problem(self, tmp_path):
        """Test problem preparation from data."""
        # Create sample inventory data
        inventory_data = pd.DataFrame({
            'date': pd.to_datetime(['2023-01-01', '2023-01-01', '2023-01-02']),
            'sku_id': [1, 2, 1],
            'store_id': [1, 1, 1],
            'inventory_on_hand': [100.0, 50.0, 95.0],
            'max_stock_level': [500.0, 500.0, 500.0]
        })
        
        # Create sample forecast data
        forecast_data = pd.DataFrame({
            'date': pd.to_datetime(['2023-01-01', '2023-01-01']),
            'sku_id': [1, 2],
            'store_id': [1, 1],
            'forecast': [10.0, 8.0]
        })
        
        optimizer = PeriodicBatchOptimizer(optimizer_type='mip')
        
        problem = optimizer.prepare_problem(
            inventory_data,
            forecast_data,
            date=pd.to_datetime('2023-01-01')
        )
        
        assert len(problem.sku_ids) > 0
        assert len(problem.store_ids) > 0
        assert (1, 1) in problem.current_inventory
    
    def test_optimize_batch(self):
        """Test batch optimization."""
        from models.inventory_optimization.optimization_framework.mip_solver import InventoryProblem
        
        optimizer = PeriodicBatchOptimizer(optimizer_type='mip')
        
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
        
        result = optimizer.optimize_batch(problem)
        
        assert 'status' in result
        assert 'solution' in result
        assert 'timestamp' in result
    
    def test_generate_dates(self):
        """Test date generation."""
        optimizer = PeriodicBatchOptimizer()
        
        start_date = datetime(2023, 1, 1)
        end_date = datetime(2023, 1, 10)
        
        dates = optimizer._generate_dates(start_date, end_date, 'daily')
        
        assert len(dates) == 10
        assert dates[0] == start_date
        assert dates[-1] == end_date
        
        dates_weekly = optimizer._generate_dates(start_date, datetime(2023, 1, 31), 'weekly')
        assert len(dates_weekly) >= 4
    
    def test_get_statistics(self):
        """Test statistics retrieval."""
        optimizer = PeriodicBatchOptimizer()
        
        # Add some mock results
        optimizer.optimization_history = [
            {'status': 'optimal', 'objective_value': 100.0},
            {'status': 'optimal', 'objective_value': 150.0},
            {'status': 'feasible', 'objective_value': 200.0}
        ]
        
        stats = optimizer.get_statistics()
        
        assert stats['total_batches'] == 3
        assert stats['optimal_count'] == 2
        assert stats['feasible_count'] == 1
        assert stats['avg_objective_value'] == 150.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

