"""
Test suite for unified interface
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

from legacy_models.demand_forecasting.output_metrics.unified_interface import DemandForecastOutputMetrics


def test_unified_interface_initialization():
    """Test initialization of unified interface."""
    interface = DemandForecastOutputMetrics()
    
    assert interface.prediction_intervals is not None
    assert interface.nowcast_engine is not None
    assert interface.error_calculator is not None
    assert interface.sku_confidence is not None
    assert interface.probabilistic_metrics is not None
    assert interface.service_level_metrics is not None


def test_generate_forecast_with_intervals():
    """Test generating forecast with intervals."""
    interface = DemandForecastOutputMetrics()
    
    # Create sample probabilistic forecasts
    np.random.seed(42)
    samples = np.random.normal(100, 10, (1000, 10))
    
    df = interface.generate_forecast_with_intervals(
        model=None,
        samples=samples,
        sku_id=1,
        store_id=1,
        forecast_date=datetime.now()
    )
    
    assert isinstance(df, pd.DataFrame)
    assert 'point_forecast' in df.columns
    assert 'lower_80' in df.columns
    assert 'upper_80' in df.columns
    assert 'lower_95' in df.columns
    assert 'upper_95' in df.columns


def test_generate_nowcast():
    """Test generating nowcast."""
    interface = DemandForecastOutputMetrics()
    
    # Create sample data
    dates = pd.date_range(start=datetime.now() - timedelta(days=7),
                         end=datetime.now(), freq='h')
    historical_data = pd.DataFrame({
        'timestamp': dates,
        'sku_id': [1] * len(dates),
        'store_id': [1] * len(dates),
        'sales': np.random.normal(100, 10, len(dates))
    })
    
    recent_dates = pd.date_range(start=datetime.now() - timedelta(hours=1),
                                 end=datetime.now(), freq='15min')
    recent_signals = pd.DataFrame({
        'timestamp': recent_dates,
        'sku_id': [1] * len(recent_dates),
        'store_id': [1] * len(recent_dates),
        'sales': np.random.normal(100, 10, len(recent_dates))
    })
    
    nowcast = interface.generate_nowcast(
        historical_data, recent_signals,
        sku_id=1, store_id=1
    )
    
    assert 'nowcast' in nowcast
    assert 'confidence' in nowcast
    assert 'sku_id' in nowcast


def test_calculate_error_metrics():
    """Test calculating error metrics."""
    interface = DemandForecastOutputMetrics()
    
    y_true = np.array([100, 110, 120, 130, 140])
    y_pred = np.array([105, 108, 118, 132, 138])
    
    metrics = interface.calculate_error_metrics(y_true, y_pred)
    
    assert 'mae' in metrics
    assert 'rmse' in metrics
    assert 'mape' in metrics
    assert 'smape' in metrics


def test_calculate_sku_confidence_metrics():
    """Test calculating SKU confidence metrics."""
    interface = DemandForecastOutputMetrics()
    
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'forecast': np.random.normal(100, 5, 10)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'actual': np.random.normal(100, 5, 10)
    })
    
    metrics = interface.calculate_sku_confidence_metrics(
        forecasts, actuals, sku_id=1, store_id=1
    )
    
    assert 'sku_id' in metrics
    assert 'confidence' in metrics
    assert 'error_metrics' in metrics


def test_calculate_probabilistic_metrics():
    """Test calculating probabilistic metrics."""
    interface = DemandForecastOutputMetrics()
    
    np.random.seed(42)
    y_true = np.array([100, 110, 120])
    y_pred_samples = np.random.normal(100, 10, (3, 1000))
    y_pred_quantiles = np.array([
        [95, 105, 115],
        [100, 110, 120],
        [105, 115, 125]
    ]).T
    quantile_levels = [0.1, 0.5, 0.9]
    
    metrics = interface.calculate_probabilistic_metrics(
        y_true, y_pred_samples, y_pred_quantiles, quantile_levels
    )
    
    assert 'crps' in metrics
    assert 'avg_pinball_loss' in metrics


def test_generate_comprehensive_report():
    """Test generating comprehensive report."""
    interface = DemandForecastOutputMetrics()
    
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'forecast': np.random.normal(100, 5, 10)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10,
        'store_id': [1] * 10,
        'date': dates,
        'actual': np.random.normal(100, 5, 10)
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
    
    np.random.seed(42)
    y_pred_samples = np.random.normal(100, 10, (10, 1000))
    
    report = interface.generate_comprehensive_report(
        forecasts, actuals, inventory_levels, orders,
        y_pred_samples=y_pred_samples
    )
    
    assert 'timestamp' in report
    assert 'error_metrics' in report
    assert 'probabilistic_metrics' in report
    assert 'service_level_metrics' in report


if __name__ == "__main__":
    pytest.main([__file__])

