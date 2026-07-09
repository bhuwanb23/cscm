"""
Test suite for prediction intervals
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.output_metrics.prediction_intervals import PredictionIntervalGenerator


def test_prediction_interval_generator_initialization():
    """Test initialization of PredictionIntervalGenerator."""
    generator = PredictionIntervalGenerator(method='quantile')
    assert generator.method == 'quantile'


def test_generate_intervals_from_samples():
    """Test generating intervals from probabilistic samples."""
    generator = PredictionIntervalGenerator()
    
    # Create sample probabilistic forecasts
    np.random.seed(42)
    n_samples = 1000
    forecast_horizon = 10
    samples = np.random.normal(100, 10, (n_samples, forecast_horizon))
    
    intervals = generator.generate_intervals_from_samples(samples, confidence_levels=[0.8, 0.95])
    
    assert 'point_forecast' in intervals
    assert 'lower_80' in intervals
    assert 'upper_80' in intervals
    assert 'lower_95' in intervals
    assert 'upper_95' in intervals
    assert len(intervals['point_forecast']) == forecast_horizon
    assert len(intervals['lower_80']) == forecast_horizon
    assert len(intervals['upper_80']) == forecast_horizon
    assert len(intervals['lower_95']) == forecast_horizon
    assert len(intervals['upper_95']) == forecast_horizon
    
    # Check that intervals are ordered correctly
    assert np.all(intervals['lower_80'] <= intervals['point_forecast'])
    assert np.all(intervals['upper_80'] >= intervals['point_forecast'])
    assert np.all(intervals['lower_95'] <= intervals['lower_80'])
    assert np.all(intervals['upper_95'] >= intervals['upper_80'])


def test_generate_intervals_analytical():
    """Test generating intervals using analytical method."""
    generator = PredictionIntervalGenerator()
    
    point_forecast = np.array([100, 105, 110, 115, 120])
    std_error = np.array([5, 5, 5, 5, 5])
    
    intervals = generator.generate_intervals_analytical(
        point_forecast, std_error, confidence_levels=[0.8, 0.95]
    )
    
    assert 'point_forecast' in intervals
    assert 'lower_80' in intervals
    assert 'upper_80' in intervals
    assert 'lower_95' in intervals
    assert 'upper_95' in intervals
    assert len(intervals['point_forecast']) == 5
    
    # Check that 95% interval is wider than 80% interval
    interval_80_width = intervals['upper_80'] - intervals['lower_80']
    interval_95_width = intervals['upper_95'] - intervals['lower_95']
    assert np.all(interval_95_width >= interval_80_width)


def test_format_output():
    """Test formatting output as DataFrame."""
    generator = PredictionIntervalGenerator()
    
    intervals = {
        'point_forecast': np.array([100, 105, 110]),
        'forecast_horizon': 3,
        'lower_80': np.array([95, 100, 105]),
        'upper_80': np.array([105, 110, 115]),
        'lower_95': np.array([90, 95, 100]),
        'upper_95': np.array([110, 115, 120])
    }
    
    df = generator.format_output(intervals, sku_id=1, store_id=1, forecast_date=datetime.now())
    
    assert isinstance(df, pd.DataFrame)
    assert 'point_forecast' in df.columns
    assert 'lower_80' in df.columns
    assert 'upper_80' in df.columns
    assert 'lower_95' in df.columns
    assert 'upper_95' in df.columns
    assert len(df) == 3
    assert df['sku_id'].iloc[0] == 1
    assert df['store_id'].iloc[0] == 1


if __name__ == "__main__":
    pytest.main([__file__])

