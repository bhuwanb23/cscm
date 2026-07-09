"""
Test suite for gradient-boosted demand forecasting models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.gradient_boosted.models import XGBoostModel, LightGBMModel, CatBoostModel, GradientBoostedForecaster

def test_xgboost_model_initialization():
    """Test initialization of XGBoostModel."""
    model = XGBoostModel(max_depth=5, learning_rate=0.1)
    assert model.params['max_depth'] == 5
    assert model.params['learning_rate'] == 0.1
    assert model.is_fitted == False

def test_lightgbm_model_initialization():
    """Test initialization of LightGBMModel."""
    model = LightGBMModel(max_depth=5, learning_rate=0.1)
    assert model.params['max_depth'] == 5
    assert model.params['learning_rate'] == 0.1
    assert model.is_fitted == False

def test_catboost_model_initialization():
    """Test initialization of CatBoostModel."""
    model = CatBoostModel(depth=5, learning_rate=0.1)
    assert model.params['depth'] == 5
    assert model.params['learning_rate'] == 0.1
    assert model.is_fitted == False

def test_xgboost_model_fit_predict():
    """Test fitting and prediction of XGBoostModel."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    })
    y = X['feature1'] * 2 + X['feature2'] * -1.5 + X['feature3'] * 0.5 + np.random.randn(n_samples) * 0.1
    
    # Create and fit model
    model = XGBoostModel(max_depth=3, learning_rate=0.1)
    model.fit(X, y, num_boost_round=10)
    
    assert model.is_fitted == True
    assert model.model is not None
    
    # Make predictions
    predictions = model.predict(X)
    assert len(predictions) == len(X)
    assert isinstance(predictions, np.ndarray)

def test_lightgbm_model_fit_predict():
    """Test fitting and prediction of LightGBMModel."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    })
    y = X['feature1'] * 2 + X['feature2'] * -1.5 + X['feature3'] * 0.5 + np.random.randn(n_samples) * 0.1
    
    # Create and fit model
    model = LightGBMModel(max_depth=3, learning_rate=0.1)
    model.fit(X, y, num_boost_round=10)
    
    assert model.is_fitted == True
    assert model.model is not None
    
    # Make predictions
    predictions = model.predict(X)
    assert len(predictions) == len(X)
    assert isinstance(predictions, np.ndarray)

def test_catboost_model_fit_predict():
    """Test fitting and prediction of CatBoostModel."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    })
    y = X['feature1'] * 2 + X['feature2'] * -1.5 + X['feature3'] * 0.5 + np.random.randn(n_samples) * 0.1
    
    # Create and fit model
    model = CatBoostModel(depth=3, learning_rate=0.1, iterations=10)
    model.fit(X, y)
    
    assert model.is_fitted == True
    assert model.model is not None
    
    # Make predictions
    predictions = model.predict(X)
    assert len(predictions) == len(X)
    assert isinstance(predictions, np.ndarray)

def test_gradient_boosted_forecaster_initialization():
    """Test initialization of GradientBoostedForecaster."""
    # Test XGBoost forecaster
    xgb_forecaster = GradientBoostedForecaster(model_type='xgboost', max_depth=5)
    assert xgb_forecaster.model_type == 'xgboost'
    assert isinstance(xgb_forecaster.model, XGBoostModel)
    assert xgb_forecaster.is_fitted == False
    
    # Test LightGBM forecaster
    lgb_forecaster = GradientBoostedForecaster(model_type='lightgbm', max_depth=5)
    assert lgb_forecaster.model_type == 'lightgbm'
    assert isinstance(lgb_forecaster.model, LightGBMModel)
    assert lgb_forecaster.is_fitted == False
    
    # Test CatBoost forecaster
    cb_forecaster = GradientBoostedForecaster(model_type='catboost', depth=5)
    assert cb_forecaster.model_type == 'catboost'
    assert isinstance(cb_forecaster.model, CatBoostModel)
    assert cb_forecaster.is_fitted == False

def test_gradient_boosted_forecaster_fit_predict():
    """Test fitting and prediction of GradientBoostedForecaster."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    })
    y = X['feature1'] * 2 + X['feature2'] * -1.5 + X['feature3'] * 0.5 + np.random.randn(n_samples) * 0.1
    
    # Test XGBoost forecaster
    xgb_forecaster = GradientBoostedForecaster(model_type='xgboost', max_depth=3)
    xgb_forecaster.fit(X, y, num_boost_round=10)
    xgb_predictions = xgb_forecaster.predict(X)
    assert len(xgb_predictions) == len(X)
    assert xgb_forecaster.is_fitted == True
    
    # Test LightGBM forecaster
    lgb_forecaster = GradientBoostedForecaster(model_type='lightgbm', max_depth=3)
    lgb_forecaster.fit(X, y, num_boost_round=10)
    lgb_predictions = lgb_forecaster.predict(X)
    assert len(lgb_predictions) == len(X)
    assert lgb_forecaster.is_fitted == True

def test_gradient_boosted_forecaster_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    # Create sample data
    np.random.seed(42)
    n_samples = 10
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
    })
    
    # Create forecaster (without fitting)
    forecaster = GradientBoostedForecaster(model_type='xgboost')
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(X)

if __name__ == "__main__":
    pytest.main([__file__])