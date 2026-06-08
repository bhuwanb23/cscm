"""
Test suite for service-level metrics
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.output_metrics.service_level_metrics import ServiceLevelMetricsCalculator


def test_service_level_metrics_initialization():
    """Test initialization of ServiceLevelMetricsCalculator."""
    calculator = ServiceLevelMetricsCalculator(target_service_level=0.95)
    assert calculator.target_service_level == 0.95


def test_calculate_stockouts_prevented():
    """Test stockout prevention calculation."""
    calculator = ServiceLevelMetricsCalculator()
    
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'forecast': np.array([100, 110, 120, 130, 140, 150, 160, 170, 180, 190])
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'actual': np.array([105, 115, 125, 135, 145, 155, 165, 175, 185, 195])
    })
    
    inventory_levels = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'inventory': np.array([90, 100, 110, 120, 130, 140, 150, 160, 170, 180])
    })
    
    metrics = calculator.calculate_stockouts_prevented(
        forecasts, actuals, inventory_levels, lead_time_days=7
    )
    
    assert 'stockouts_prevented' in metrics
    assert 'total_potential_stockouts' in metrics
    assert 'prevention_rate' in metrics
    assert 'stockouts_occurred' in metrics
    assert metrics['prevention_rate'] >= 0
    assert metrics['prevention_rate'] <= 100


def test_calculate_fill_rate_improvement():
    """Test fill-rate improvement calculation."""
    calculator = ServiceLevelMetricsCalculator()
    
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'forecast': np.array([100] * 10)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'actual': np.array([100] * 10)
    })
    
    inventory_levels = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'inventory': np.array([50] * 10)
    })
    
    orders = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'order_qty': np.array([50] * 10)
    })
    
    metrics = calculator.calculate_fill_rate_improvement(
        forecasts, actuals, inventory_levels, orders
    )
    
    assert 'fill_rate_with_forecast' in metrics
    assert 'fill_rate_without_forecast' in metrics
    assert 'improvement' in metrics
    assert 'improvement_percentage' in metrics
    assert 0 <= metrics['fill_rate_with_forecast'] <= 100
    assert 0 <= metrics['fill_rate_without_forecast'] <= 100


def test_calculate_service_level_metrics():
    """Test comprehensive service-level metrics calculation."""
    calculator = ServiceLevelMetricsCalculator()
    
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'forecast': np.array([100] * 10)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'actual': np.array([100] * 10)
    })
    
    inventory_levels = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'inventory': np.array([50] * 10)
    })
    
    orders = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'order_qty': np.array([50] * 10)
    })
    
    metrics = calculator.calculate_service_level_metrics(
        forecasts, actuals, inventory_levels, orders
    )
    
    assert 'stockout_prevention' in metrics
    assert 'fill_rate_improvement' in metrics
    assert 'forecast_accuracy_impact' in metrics
    assert 'overall_service_level' in metrics


def test_calculate_per_sku_metrics():
    """Test per-SKU service-level metrics."""
    calculator = ServiceLevelMetricsCalculator()
    
    # Create sample data for multiple SKUs
    dates = pd.date_range('2023-01-01', periods=5, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 5 + [2] * 5,
        'store_id': [1] * 10,
        'date': list(dates) * 2,
        'forecast': np.array([100] * 10)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 5 + [2] * 5,
        'store_id': [1] * 10,
        'date': list(dates) * 2,
        'actual': np.array([100] * 10)
    })
    
    inventory_levels = pd.DataFrame({
        'sku_id': [1] * 5 + [2] * 5,
        'store_id': [1] * 10,
        'date': list(dates) * 2,
        'inventory': np.array([50] * 10)
    })
    
    orders = pd.DataFrame({
        'sku_id': [1] * 5 + [2] * 5,
        'store_id': [1] * 10,
        'date': list(dates) * 2,
        'order_qty': np.array([50] * 10)
    })
    
    results = calculator.calculate_per_sku_metrics(
        forecasts, actuals, inventory_levels, orders
    )
    
    assert isinstance(results, pd.DataFrame)
    assert len(results) >= 1
    assert 'sku_id' in results.columns


if __name__ == "__main__":
    pytest.main([__file__])

