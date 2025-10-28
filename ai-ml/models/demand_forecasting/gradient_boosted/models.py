"""
Gradient-Boosted Tree Models for Demand Forecasting

This module implements gradient-boosted tree models for demand forecasting:
- XGBoost
- LightGBM
- CatBoost
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple
import logging

# Import gradient boosting libraries
try:
    import xgboost as xgb
    import lightgbm as lgb
    import catboost as cb
    HAS_GBT_LIBRARIES = True
except ImportError:
    HAS_GBT_LIBRARIES = False
    xgb = None
    lgb = None
    cb = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class XGBoostModel:
    """XGBoost model for demand forecasting."""
    
    def __init__(self, **kwargs):
        """
        Initialize XGBoost model.
        
        Args:
            **kwargs: Additional arguments for XGBoost
        """
        if not HAS_GBT_LIBRARIES:
            raise ImportError("XGBoost library is not installed")
            
        self.params = {
            'objective': 'reg:squarederror',
            'eval_metric': 'mae',
            'booster': 'gbtree',
            'verbosity': 0,
            **kwargs
        }
        self.model = None
        self.is_fitted = False
        self.feature_columns = None
        
    def fit(self, X: pd.DataFrame, y: pd.Series, **kwargs) -> 'XGBoostModel':
        """
        Fit the XGBoost model to the data.
        
        Args:
            X: Feature data
            y: Target data
            **kwargs: Additional arguments for XGBoost fitting
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting XGBoost model")
        
        # Store feature columns for prediction
        self.feature_columns = X.columns.tolist()
        
        # Create DMatrix for XGBoost
        dtrain = xgb.DMatrix(X, label=y)
        
        # Fit the model
        self.model = xgb.train(
            self.params,
            dtrain,
            **kwargs
        )
        self.is_fitted = True
        
        logger.info("XGBoost model fitted successfully")
        return self
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with XGBoost model on {len(X)} samples")
        
        # Ensure X has the same columns as training data
        if self.feature_columns:
            X = X[self.feature_columns]
        
        # Create DMatrix for prediction
        dtest = xgb.DMatrix(X)
        
        # Make predictions
        predictions = self.model.predict(dtest)
        return predictions

class LightGBMModel:
    """LightGBM model for demand forecasting."""
    
    def __init__(self, **kwargs):
        """
        Initialize LightGBM model.
        
        Args:
            **kwargs: Additional arguments for LightGBM
        """
        if not HAS_GBT_LIBRARIES:
            raise ImportError("LightGBM library is not installed")
            
        self.params = {
            'objective': 'regression',
            'metric': 'mae',
            'verbose': -1,
            **kwargs
        }
        self.model = None
        self.is_fitted = False
        self.feature_columns = None
        
    def fit(self, X: pd.DataFrame, y: pd.Series, **kwargs) -> 'LightGBMModel':
        """
        Fit the LightGBM model to the data.
        
        Args:
            X: Feature data
            y: Target data
            **kwargs: Additional arguments for LightGBM fitting
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting LightGBM model")
        
        # Store feature columns for prediction
        self.feature_columns = X.columns.tolist()
        
        # Create Dataset for LightGBM
        train_data = lgb.Dataset(X, label=y)
        
        # Fit the model
        self.model = lgb.train(
            self.params,
            train_data,
            **kwargs
        )
        self.is_fitted = True
        
        logger.info("LightGBM model fitted successfully")
        return self
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with LightGBM model on {len(X)} samples")
        
        # Ensure X has the same columns as training data
        if self.feature_columns:
            X = X[self.feature_columns]
        
        # Make predictions
        predictions = self.model.predict(X)
        return predictions

class CatBoostModel:
    """CatBoost model for demand forecasting."""
    
    def __init__(self, **kwargs):
        """
        Initialize CatBoost model.
        
        Args:
            **kwargs: Additional arguments for CatBoost
        """
        if not HAS_GBT_LIBRARIES:
            raise ImportError("CatBoost library is not installed")
            
        self.params = {
            'loss_function': 'MAE',
            'verbose': False,
            **kwargs
        }
        self.model = None
        self.is_fitted = False
        self.feature_columns = None
        
    def fit(self, X: pd.DataFrame, y: pd.Series, **kwargs) -> 'CatBoostModel':
        """
        Fit the CatBoost model to the data.
        
        Args:
            X: Feature data
            y: Target data
            **kwargs: Additional arguments for CatBoost fitting
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting CatBoost model")
        
        # Store feature columns for prediction
        self.feature_columns = X.columns.tolist()
        
        # Fit the model
        self.model = cb.CatBoostRegressor(**self.params)
        self.model.fit(X, y, **kwargs)
        self.is_fitted = True
        
        logger.info("CatBoost model fitted successfully")
        return self
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with CatBoost model on {len(X)} samples")
        
        # Ensure X has the same columns as training data
        if self.feature_columns:
            X = X[self.feature_columns]
        
        # Make predictions
        predictions = self.model.predict(X)
        return predictions

class GradientBoostedForecaster:
    """Wrapper class for gradient-boosted forecasting models."""
    
    def __init__(self, model_type: str = 'xgboost', **kwargs):
        """
        Initialize the gradient-boosted forecaster.
        
        Args:
            model_type: Type of gradient-boosted model ('xgboost', 'lightgbm', 'catboost')
            **kwargs: Additional arguments for the specific model
        """
        self.model_type = model_type.lower()
        self.model = None
        self.is_fitted = False
        
        if self.model_type == 'xgboost':
            self.model = XGBoostModel(**kwargs)
        elif self.model_type == 'lightgbm':
            self.model = LightGBMModel(**kwargs)
        elif self.model_type == 'catboost':
            self.model = CatBoostModel(**kwargs)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    def fit(self, X: pd.DataFrame, y: pd.Series, **kwargs) -> 'GradientBoostedForecaster':
        """
        Fit the gradient-boosted model to the data.
        
        Args:
            X: Feature data
            y: Target data
            **kwargs: Additional arguments for model fitting
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} model for demand forecasting")
        self.model.fit(X, y, **kwargs)
        self.is_fitted = True
        return self
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
        return self.model.predict(X)

# Example usage
if __name__ == "__main__":
    # Create sample data
    np.random.seed(42)
    n_samples = 1000
    X = pd.DataFrame({
        'feature1': np.random.randn(n_samples),
        'feature2': np.random.randn(n_samples),
        'feature3': np.random.randn(n_samples),
    })
    y = X['feature1'] * 2 + X['feature2'] * -1.5 + X['feature3'] * 0.5 + np.random.randn(n_samples) * 0.1
    
    # Split data
    train_size = int(0.8 * n_samples)
    X_train, X_test = X[:train_size], X[train_size:]
    y_train, y_test = y[:train_size], y[train_size:]
    
    # Fit and predict with XGBoost model
    print("=== XGBoost Model ===")
    xgb_forecaster = GradientBoostedForecaster(model_type='xgboost')
    xgb_forecaster.fit(X_train, y_train, num_boost_round=100)
    xgb_predictions = xgb_forecaster.predict(X_test)
    print(f"XGBoost Predictions: {xgb_predictions[:5]}")
    
    # Fit and predict with LightGBM model
    print("\n=== LightGBM Model ===")
    lgb_forecaster = GradientBoostedForecaster(model_type='lightgbm')
    lgb_forecaster.fit(X_train, y_train, num_boost_round=100)
    lgb_predictions = lgb_forecaster.predict(X_test)
    print(f"LightGBM Predictions: {lgb_predictions[:5]}")
    
    # Fit and predict with CatBoost model
    print("\n=== CatBoost Model ===")
    cb_forecaster = GradientBoostedForecaster(model_type='catboost')
    cb_forecaster.fit(X_train, y_train, iterations=100)
    cb_predictions = cb_forecaster.predict(X_test)
    print(f"CatBoost Predictions: {cb_predictions[:5]}")