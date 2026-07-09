"""
Test suite for the sliding window training framework
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta
import tempfile
import shutil

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.sliding_window.models import SlidingWindowTrainer

def test_sliding_window_trainer_initialization():
    """Test initialization of SlidingWindowTrainer."""
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=7
    )
    assert trainer.model_type == 'ets'
    assert trainer.window_size == 30
    assert trainer.step_size == 7
    assert trainer.model is None

def test_sliding_window_trainer_window_creation():
    """Test sliding window creation."""
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-03-31', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
    })
    
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=7
    )
    
    # Should work with sufficient data
    results = trainer.train_sliding_window(data)
    assert 'window_results' in results
    assert len(results['window_results']) > 0

def test_sliding_window_trainer_insufficient_data():
    """Test sliding window trainer with insufficient data."""
    # Create small dataset
    dates = pd.date_range(start='2023-01-01', end='2023-01-15', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
    })
    
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,  # Larger than available data
        step_size=7
    )
    
    # Should raise ValueError for insufficient data
    with pytest.raises(ValueError):
        trainer.train_sliding_window(data)

def test_sliding_window_trainer_different_model_types():
    """Test sliding window trainer with different model types."""
    model_types = ['ets', 'arima', 'xgboost', 'lightgbm']
    
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-06-30', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
        'promotion': np.random.binomial(1, 0.1, len(dates)),
        'weekday': pd.Series(dates).dt.dayofweek,
    })
    
    for model_type in model_types:
        trainer = SlidingWindowTrainer(
            model_type=model_type,
            window_size=30,
            step_size=15
        )
        
        # Train the model
        results = trainer.train_sliding_window(data)
        
        # Check that results contain expected keys
        assert 'window_results' in results
        assert len(results['window_results']) > 0

def test_concept_drift_detection():
    """Test concept drift detection functionality."""
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
    })
    
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=15,
        drift_threshold=0.1
    )
    
    # Train the model
    results = trainer.train_sliding_window(data)
    
    # Check drift detection status
    drift_status = trainer.get_drift_status()
    assert isinstance(drift_status, bool)

def test_window_size_adaptation():
    """Test window size adaptation functionality."""
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
    })
    
    initial_window_size = 30
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=initial_window_size,
        step_size=15
    )
    
    # Get initial window size
    initial_size = trainer.get_window_size()
    assert initial_size == initial_window_size
    
    # Train the model
    results = trainer.train_sliding_window(data)
    
    # Window size might have been adapted
    final_size = trainer.get_window_size()
    assert final_size >= trainer.min_window_size
    assert final_size <= trainer.max_window_size

def test_prediction_functionality():
    """Test prediction functionality."""
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-06-30', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
        'promotion': np.random.binomial(1, 0.1, len(dates)),
        'weekday': pd.Series(dates).dt.dayofweek,
    })
    
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=15
    )
    
    # Train the model
    results = trainer.train_sliding_window(data)
    
    # Create test data for prediction
    test_dates = pd.date_range(start='2023-07-01', end='2023-07-15', freq='D')
    test_data = pd.DataFrame({
        'price': np.random.normal(10, 2, len(test_dates)),
        'promotion': np.random.binomial(1, 0.1, len(test_dates)),
        'weekday': pd.Series(test_dates).dt.dayofweek,
    })
    
    # Make predictions
    predictions = trainer.predict(test_data)
    assert len(predictions) == len(test_data)

def test_prediction_without_training():
    """Test prediction without training should raise an error."""
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=15
    )
    
    # Create test data
    test_data = pd.DataFrame({
        'price': [10, 11, 12],
        'promotion': [0, 1, 0],
        'weekday': [1, 2, 3],
    })
    
    # Should raise ValueError when trying to predict without training
    with pytest.raises(ValueError):
        trainer.predict(test_data)

def test_performance_metrics_calculation():
    """Test performance metrics calculation."""
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-06-30', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
    })
    
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=15
    )
    
    # Create validation data
    val_dates = pd.date_range(start='2023-07-01', end='2023-07-15', freq='D')
    val_data = pd.DataFrame({
        'date': val_dates,
        'sales': np.random.normal(100, 20, len(val_dates)),
        'price': np.random.normal(10, 2, len(val_dates)),
    })
    
    X_val, y_val = trainer._prepare_features(val_data)
    validation_data = (X_val, y_val)
    
    # Train the model with validation data
    results = trainer.train_sliding_window(data, validation_data)
    
    # Check that performance metrics were calculated
    assert len(trainer.performance_history) > 0
    for metrics in trainer.performance_history:
        assert 'mae' in metrics
        assert 'rmse' in metrics
        assert 'mape' in metrics

if __name__ == "__main__":
    pytest.main([__file__])