"""
Test suite for error metrics
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.output_metrics.error_metrics import (
    ErrorMetricsCalculator, SKUConfidenceMetrics
)


def test_mae():
    """Test MAE calculation."""
    calculator = ErrorMetricsCalculator()
    
    y_true = np.array([100, 110, 120, 130, 140])
    y_pred = np.array([105, 108, 118, 132, 138])
    
    mae = calculator.mae(y_true, y_pred)
    
    assert isinstance(mae, float)
    assert mae >= 0
    # Expected MAE: mean(|100-105|, |110-108|, |120-118|, |130-132|, |140-138|)
    # = mean(5, 2, 2, 2, 2) = 2.6
    assert abs(mae - 2.6) < 0.1


def test_rmse():
    """Test RMSE calculation."""
    calculator = ErrorMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    y_pred = np.array([105, 108, 118])
    
    rmse = calculator.rmse(y_true, y_pred)
    
    assert isinstance(rmse, float)
    assert rmse >= 0
    # RMSE should be >= MAE
    mae = calculator.mae(y_true, y_pred)
    assert rmse >= mae


def test_mape():
    """Test MAPE calculation."""
    calculator = ErrorMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    y_pred = np.array([105, 108, 118])
    
    mape = calculator.mape(y_true, y_pred)
    
    assert isinstance(mape, float)
    assert mape >= 0
    # MAPE should be a percentage
    assert mape < 100  # Reasonable MAPE


def test_smape():
    """Test sMAPE calculation."""
    calculator = ErrorMetricsCalculator()
    
    y_true = np.array([100, 110, 120])
    y_pred = np.array([105, 108, 118])
    
    smape = calculator.smape(y_true, y_pred)
    
    assert isinstance(smape, float)
    assert smape >= 0
    assert smape < 100  # Reasonable sMAPE


def test_calculate_all_metrics():
    """Test calculating all error metrics."""
    calculator = ErrorMetricsCalculator()
    
    y_true = np.array([100, 110, 120, 130, 140])
    y_pred = np.array([105, 108, 118, 132, 138])
    y_train = np.array([90, 95, 100, 105, 110, 115, 120])
    
    metrics = calculator.calculate_all_metrics(y_true, y_pred, y_train)
    
    assert 'mae' in metrics
    assert 'rmse' in metrics
    assert 'mape' in metrics
    assert 'smape' in metrics
    assert 'mase' in metrics
    
    assert all(isinstance(v, float) for v in metrics.values())


def test_sku_confidence_metrics():
    """Test SKU confidence metrics calculation."""
    sku_confidence = SKUConfidenceMetrics()
    
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
    
    metrics = sku_confidence.calculate_sku_metrics(forecasts, actuals, sku_id=1, store_id=1)
    
    assert 'sku_id' in metrics
    assert 'store_id' in metrics
    assert 'error_metrics' in metrics
    assert 'confidence' in metrics
    assert 'forecast_accuracy' in metrics
    assert 0 <= metrics['confidence'] <= 1


def test_calculate_all_sku_metrics():
    """Test calculating metrics for all SKUs."""
    sku_confidence = SKUConfidenceMetrics()
    
    # Create sample data for multiple SKUs
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    forecasts = pd.DataFrame({
        'sku_id': [1] * 10 + [2] * 10,
        'store_id': [1] * 20,
        'date': list(dates) * 2,
        'forecast': np.random.normal(100, 5, 20)
    })
    
    actuals = pd.DataFrame({
        'sku_id': [1] * 10 + [2] * 10,
        'store_id': [1] * 20,
        'date': list(dates) * 2,
        'actual': np.random.normal(100, 5, 20)
    })
    
    results = sku_confidence.calculate_all_sku_metrics(forecasts, actuals)
    
    assert isinstance(results, pd.DataFrame)
    assert len(results) >= 1
    assert 'sku_id' in results.columns
    assert 'confidence' in results.columns


if __name__ == "__main__":
    pytest.main([__file__])

