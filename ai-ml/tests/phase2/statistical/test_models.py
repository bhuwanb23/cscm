"""
Test suite for statistical demand forecasting models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.statistical.models import ETSModel, ARIMAModel, StatisticalForecaster

def test_ets_model_initialization():
    """Test initialization of ETSModel."""
    model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
    assert model.trend == 'add'
    assert model.seasonal == 'add'
    assert model.seasonal_periods == 7
    assert model.is_fitted == False

def test_ets_model_fit():
    """Test fitting of ETSModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=50, freq='D')
    sales = np.random.randint(50, 200, 50) + np.sin(np.arange(50) * 2 * np.pi / 7) * 20
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
    model.fit(data)
    
    assert model.is_fitted == True
    assert model.fitted_model is not None

def test_ets_model_predict():
    """Test prediction of ETSModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100) + np.sin(np.arange(100) * 2 * np.pi / 7) * 20
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
    model.fit(data)
    
    # Make predictions
    forecast = model.predict(steps=10)
    
    assert len(forecast) == 10
    assert isinstance(forecast, np.ndarray)

def test_ets_model_predict_with_confidence():
    """Test prediction with confidence intervals of ETSModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100) + np.sin(np.arange(100) * 2 * np.pi / 7) * 20
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
    model.fit(data)
    
    # Make predictions with confidence intervals
    forecast, lower_bound, upper_bound = model.predict_with_confidence(steps=10)
    
    assert len(forecast) == 10
    assert len(lower_bound) == 10
    assert len(upper_bound) == 10
    assert isinstance(forecast, np.ndarray)
    assert isinstance(lower_bound, np.ndarray)
    assert isinstance(upper_bound, np.ndarray)

def test_arima_model_initialization():
    """Test initialization of ARIMAModel."""
    model = ARIMAModel(order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    assert model.order == (1, 1, 1)
    assert model.seasonal_order == (1, 1, 1, 12)
    assert model.is_fitted == False

def test_arima_model_fit():
    """Test fitting of ARIMAModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=50, freq='D')
    sales = np.random.randint(50, 200, 50)
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ARIMAModel(order=(1, 1, 1))
    model.fit(data)
    
    assert model.is_fitted == True
    assert model.fitted_model is not None

def test_arima_model_predict():
    """Test prediction of ARIMAModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100)
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ARIMAModel(order=(1, 1, 1))
    model.fit(data)
    
    # Make predictions
    forecast = model.predict(steps=10)
    
    assert len(forecast) == 10
    assert isinstance(forecast, np.ndarray)

def test_arima_model_predict_with_confidence():
    """Test prediction with confidence intervals of ARIMAModel."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100)
    data = pd.Series(sales, index=dates)
    
    # Create and fit model
    model = ARIMAModel(order=(1, 1, 1))
    model.fit(data)
    
    # Make predictions with confidence intervals
    forecast, lower_bound, upper_bound = model.predict_with_confidence(steps=10)
    
    assert len(forecast) == 10
    assert len(lower_bound) == 10
    assert len(upper_bound) == 10
    assert isinstance(forecast, np.ndarray)
    assert isinstance(lower_bound, np.ndarray)
    assert isinstance(upper_bound, np.ndarray)

def test_statistical_forecaster_initialization():
    """Test initialization of StatisticalForecaster."""
    # Test ETS forecaster
    ets_forecaster = StatisticalForecaster(model_type='ets', trend='add', seasonal='add', seasonal_periods=7)
    assert ets_forecaster.model_type == 'ets'
    assert isinstance(ets_forecaster.model, ETSModel)
    assert ets_forecaster.is_fitted == False
    
    # Test ARIMA forecaster
    arima_forecaster = StatisticalForecaster(model_type='arima', order=(1, 1, 1))
    assert arima_forecaster.model_type == 'arima'
    assert isinstance(arima_forecaster.model, ARIMAModel)
    assert arima_forecaster.is_fitted == False
    
    # Test SARIMA forecaster
    sarima_forecaster = StatisticalForecaster(model_type='sarima', order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    assert sarima_forecaster.model_type == 'sarima'
    assert isinstance(sarima_forecaster.model, ARIMAModel)
    assert sarima_forecaster.is_fitted == False

def test_statistical_forecaster_fit_predict():
    """Test fitting and prediction of StatisticalForecaster."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100) + np.sin(np.arange(100) * 2 * np.pi / 7) * 20
    data = pd.Series(sales, index=dates)
    
    # Test ETS forecaster
    ets_forecaster = StatisticalForecaster(model_type='ets', trend='add', seasonal='add', seasonal_periods=7)
    ets_forecaster.fit(data)
    ets_forecast = ets_forecaster.predict(steps=5)
    assert len(ets_forecast) == 5
    assert ets_forecaster.is_fitted == True
    
    # Test ARIMA forecaster
    arima_forecaster = StatisticalForecaster(model_type='arima', order=(1, 1, 1))
    arima_forecaster.fit(data)
    arima_forecast = arima_forecaster.predict(steps=5)
    assert len(arima_forecast) == 5
    assert arima_forecaster.is_fitted == True

def test_statistical_forecaster_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=10, freq='D')
    sales = np.random.randint(50, 200, 10)
    data = pd.Series(sales, index=dates)
    
    # Create forecaster (without fitting)
    forecaster = StatisticalForecaster(model_type='ets')
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(steps=5)

if __name__ == "__main__":
    pytest.main([__file__])