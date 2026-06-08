"""
Test suite for hybrid demand forecasting models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.hybrid.models import ARIMAMLHybridModel, ETSMLHybridModel, EnsembleHybridModel, HybridForecaster

def test_arima_ml_hybrid_model_initialization():
    """Test initialization of ARIMAMLHybridModel."""
    model = ARIMAMLHybridModel(arima_order=(1, 1, 1), ml_model_type='random_forest')
    assert model.arima_order == (1, 1, 1)
    assert model.ml_model_type == 'random_forest'
    assert model.is_fitted == False

def test_ets_ml_hybrid_model_initialization():
    """Test initialization of ETSMLHybridModel."""
    model = ETSMLHybridModel(ets_trend='add', ets_seasonal='add', seasonal_periods=12, ml_model_type='linear_regression')
    assert model.ets_trend == 'add'
    assert model.ets_seasonal == 'add'
    assert model.seasonal_periods == 12
    assert model.ml_model_type == 'linear_regression'
    assert model.is_fitted == False

def test_ensemble_hybrid_model_initialization():
    """Test initialization of EnsembleHybridModel."""
    models = [
        {'type': 'arima_ml', 'params': {'arima_order': (1, 1, 1)}},
        {'type': 'ets_ml', 'params': {'ets_trend': 'add', 'ets_seasonal': 'add'}}
    ]
    weights = [0.6, 0.4]
    model = EnsembleHybridModel(models, weights)
    assert len(model.models) == 2
    assert model.weights == [0.6, 0.4]
    assert model.is_fitted == False

def test_hybrid_forecaster_initialization():
    """Test initialization of HybridForecaster."""
    # Test ARIMA-ML hybrid forecaster
    arima_ml_forecaster = HybridForecaster(model_type='arima_ml', arima_order=(1, 1, 1), ml_model_type='random_forest')
    assert arima_ml_forecaster.model_type == 'arima_ml'
    assert isinstance(arima_ml_forecaster.model, ARIMAMLHybridModel)
    assert arima_ml_forecaster.is_fitted == False
    
    # Test ETS-ML hybrid forecaster
    ets_ml_forecaster = HybridForecaster(model_type='ets_ml', ets_trend='add', ets_seasonal='add', ml_model_type='linear_regression')
    assert ets_ml_forecaster.model_type == 'ets_ml'
    assert isinstance(ets_ml_forecaster.model, ETSMLHybridModel)
    assert ets_ml_forecaster.is_fitted == False
    
    # Test Ensemble hybrid forecaster
    ensemble_models = [
        {'type': 'arima_ml', 'params': {'arima_order': (1, 1, 1)}},
        {'type': 'ets_ml', 'params': {'ets_trend': 'add', 'ets_seasonal': 'add'}}
    ]
    ensemble_forecaster = HybridForecaster(model_type='ensemble', models=ensemble_models)
    assert ensemble_forecaster.model_type == 'ensemble'
    assert isinstance(ensemble_forecaster.model, EnsembleHybridModel)
    assert ensemble_forecaster.is_fitted == False

def test_hybrid_forecaster_fit_predict():
    """Test fitting and prediction of HybridForecaster."""
    # Create sample time series data
    np.random.seed(42)
    n_samples = 200
    dates = pd.date_range('2023-01-01', periods=n_samples, freq='D')
    # Create a time series with trend and seasonality
    time = np.arange(n_samples)
    trend = 0.02 * time
    seasonal = 10 * np.sin(2 * np.pi * time / 50)  # Seasonal component with period 50
    noise = np.random.normal(0, 1, n_samples)
    data = trend + seasonal + noise
    series = pd.Series(data, index=dates)
    
    # Test ARIMA-ML hybrid forecaster
    arima_ml_forecaster = HybridForecaster(model_type='arima_ml', arima_order=(1, 1, 1), ml_model_type='random_forest')
    arima_ml_forecaster.fit(series)
    arima_ml_predictions = arima_ml_forecaster.predict(steps=5)
    assert len(arima_ml_predictions) == 5
    assert arima_ml_forecaster.is_fitted == True
    
    # Test ETS-ML hybrid forecaster
    ets_ml_forecaster = HybridForecaster(model_type='ets_ml', ets_trend='add', ets_seasonal='add', 
                                        seasonal_periods=50, ml_model_type='linear_regression')
    ets_ml_forecaster.fit(series)
    ets_ml_predictions = ets_ml_forecaster.predict(steps=5)
    assert len(ets_ml_predictions) == 5
    assert ets_ml_forecaster.is_fitted == True

def test_hybrid_forecaster_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    dates = pd.date_range('2023-01-01', periods=n_samples, freq='D')
    data = np.random.randn(n_samples)
    series = pd.Series(data, index=dates)
    
    # Create forecaster (without fitting)
    forecaster = HybridForecaster(model_type='arima_ml', arima_order=(1, 1, 1))
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(steps=5)

if __name__ == "__main__":
    pytest.main([__file__])