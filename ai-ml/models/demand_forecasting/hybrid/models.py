"""
Hybrid Models for Demand Forecasting

This module implements hybrid forecasting models that combine classical statistical methods with machine learning:
- ARIMA-ML Hybrid
- ETS-ML Hybrid
- Ensemble Hybrid
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple, List
import logging

# Import required libraries
try:
    import torch
    import torch.nn as nn
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.linear_model import LinearRegression
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    HAS_HYBRID_LIBRARIES = True
except ImportError:
    HAS_HYBRID_LIBRARIES = False
    ARIMA = None
    ExponentialSmoothing = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ARIMAMLHybridModel:
    """ARIMA-ML Hybrid model for demand forecasting."""
    
    def __init__(self, arima_order: Tuple[int, int, int] = (1, 1, 1), 
                 ml_model_type: str = 'random_forest', **kwargs):
        """
        Initialize ARIMA-ML Hybrid model.
        
        Args:
            arima_order: ARIMA order (p, d, q)
            ml_model_type: Type of ML model for residuals ('random_forest', 'linear_regression')
            **kwargs: Additional arguments for ARIMA and ML models
        """
        if not HAS_HYBRID_LIBRARIES:
            raise ImportError("Required libraries are not installed")
            
        self.arima_order = arima_order
        self.ml_model_type = ml_model_type
        self.arima_model = None
        self.ml_model = None
        self.is_fitted = False
        self.residuals = None
        self.training_data = None
        
        # Store additional parameters
        self.kwargs = kwargs
        
    def fit(self, data: pd.Series, external_features: Optional[pd.DataFrame] = None, **kwargs) -> 'ARIMAMLHybridModel':
        """
        Fit the ARIMA-ML Hybrid model to the data.
        
        Args:
            data: Time series data as a pandas Series
            external_features: External features for ML model
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting ARIMA-ML Hybrid model")
        
        # Store training data
        self.training_data = data.copy()
        
        # Fit ARIMA model
        logger.info(f"Fitting ARIMA model with order {self.arima_order}")
        self.arima_model = ARIMA(data, order=self.arima_order)
        arima_fitted = self.arima_model.fit()
        
        # Get ARIMA predictions on training data
        arima_predictions = arima_fitted.fittedvalues
        
        # Calculate residuals
        self.residuals = data.values - arima_predictions
        
        # Prepare features for ML model
        if external_features is not None:
            # Use external features
            X_ml = external_features.copy()
        else:
            # Create simple time-based features
            X_ml = pd.DataFrame({
                'time_index': np.arange(len(data)),
                'time_squared': np.arange(len(data)) ** 2
            })
            
        # Add ARIMA predictions as a feature
        X_ml['arima_prediction'] = arima_predictions
        
        # Handle NaN values in features and residuals
        # Create a mask for valid (non-NaN) values
        valid_mask = ~(np.isnan(self.residuals) | X_ml.isnull().any(axis=1))
        
        if not valid_mask.any():
            raise ValueError("No valid data points after removing NaN values")
            
        X_ml_clean = X_ml[valid_mask]
        residuals_clean = self.residuals[valid_mask]
        
        # Fit ML model on residuals
        logger.info(f"Fitting {self.ml_model_type} model on residuals")
        if self.ml_model_type == 'random_forest':
            self.ml_model = RandomForestRegressor(**self.kwargs.get('ml_kwargs', {}))
        elif self.ml_model_type == 'linear_regression':
            self.ml_model = LinearRegression(**self.kwargs.get('ml_kwargs', {}))
        else:
            raise ValueError(f"Unsupported ML model type: {self.ml_model_type}")
            
        self.ml_model.fit(X_ml_clean, residuals_clean)
        
        self.is_fitted = True
        logger.info("ARIMA-ML Hybrid model fitted successfully")
        return self
    
    def predict(self, steps: int = 1, external_features: Optional[pd.DataFrame] = None) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            external_features: External features for ML model (for future steps)
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with ARIMA-ML Hybrid model")
        
        # Get ARIMA forecast
        arima_fitted = self.arima_model.fit()
        arima_forecast = arima_fitted.forecast(steps=steps)
        
        # Prepare features for ML model
        if external_features is not None:
            # Use provided external features
            X_ml = external_features.copy()
        else:
            # Create time-based features for future steps
            last_time_index = len(self.training_data) - 1
            X_ml = pd.DataFrame({
                'time_index': np.arange(last_time_index + 1, last_time_index + 1 + steps),
                'time_squared': np.arange(last_time_index + 1, last_time_index + 1 + steps) ** 2
            })
            
        # Add ARIMA predictions as a feature (use .values to avoid index alignment issues)
        X_ml['arima_prediction'] = arima_forecast.values
        
        # Get ML predictions for residuals
        ml_residuals = self.ml_model.predict(X_ml)
        
        # Combine ARIMA forecast with ML residuals
        hybrid_predictions = arima_forecast.values + ml_residuals
        
        return hybrid_predictions

class ETSMLHybridModel:
    """ETS-ML Hybrid model for demand forecasting."""
    
    def __init__(self, ets_trend: Optional[str] = 'add', ets_seasonal: Optional[str] = 'add',
                 seasonal_periods: Optional[int] = None, ml_model_type: str = 'random_forest', **kwargs):
        """
        Initialize ETS-ML Hybrid model.
        
        Args:
            ets_trend: Type of trend component ('add', 'mul', or None)
            ets_seasonal: Type of seasonal component ('add', 'mul', or None)
            seasonal_periods: Number of periods in a season
            ml_model_type: Type of ML model for residuals ('random_forest', 'linear_regression')
            **kwargs: Additional arguments for ETS and ML models
        """
        if not HAS_HYBRID_LIBRARIES:
            raise ImportError("Required libraries are not installed")
            
        self.ets_trend = ets_trend
        self.ets_seasonal = ets_seasonal
        self.seasonal_periods = seasonal_periods
        self.ml_model_type = ml_model_type
        self.ets_model = None
        self.ml_model = None
        self.is_fitted = False
        self.residuals = None
        self.training_data = None
        
        # Store additional parameters
        self.kwargs = kwargs
        
    def fit(self, data: pd.Series, external_features: Optional[pd.DataFrame] = None, **kwargs) -> 'ETSMLHybridModel':
        """
        Fit the ETS-ML Hybrid model to the data.
        
        Args:
            data: Time series data as a pandas Series
            external_features: External features for ML model
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting ETS-ML Hybrid model")
        
        # Store training data
        self.training_data = data.copy()
        
        # Fit ETS model
        logger.info("Fitting ETS model")
        self.ets_model = ExponentialSmoothing(
            data,
            trend=self.ets_trend,
            seasonal=self.ets_seasonal,
            seasonal_periods=self.seasonal_periods
        )
        ets_fitted = self.ets_model.fit()
        
        # Get ETS predictions on training data
        ets_predictions = ets_fitted.fittedvalues
        
        # Calculate residuals
        self.residuals = data.values - ets_predictions.values  # Use .values to avoid index alignment issues
        
        # Prepare features for ML model
        if external_features is not None:
            # Use external features
            X_ml = external_features.copy()
        else:
            # Create simple time-based features
            X_ml = pd.DataFrame({
                'time_index': np.arange(len(data)),
                'time_squared': np.arange(len(data)) ** 2
            })
            
        # Add ETS predictions as a feature
        X_ml['ets_prediction'] = ets_predictions.values  # Use .values to avoid index alignment issues
        
        # Handle NaN values in features and residuals
        # Create a mask for valid (non-NaN) values
        valid_mask = ~(np.isnan(self.residuals) | X_ml.isnull().any(axis=1))
        
        if not valid_mask.any():
            raise ValueError("No valid data points after removing NaN values")
            
        # Filter using boolean indexing properly
        X_ml_clean = X_ml[valid_mask]
        residuals_clean = self.residuals[valid_mask]
        
        # Fit ML model on residuals
        logger.info(f"Fitting {self.ml_model_type} model on residuals")
        if self.ml_model_type == 'random_forest':
            self.ml_model = RandomForestRegressor(**self.kwargs.get('ml_kwargs', {}))
        elif self.ml_model_type == 'linear_regression':
            self.ml_model = LinearRegression(**self.kwargs.get('ml_kwargs', {}))
        else:
            raise ValueError(f"Unsupported ML model type: {self.ml_model_type}")
            
        self.ml_model.fit(X_ml_clean, residuals_clean)
        
        self.is_fitted = True
        logger.info("ETS-ML Hybrid model fitted successfully")
        return self
    
    def predict(self, steps: int = 1, external_features: Optional[pd.DataFrame] = None) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            external_features: External features for ML model (for future steps)
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with ETS-ML Hybrid model")
        
        # Get ETS forecast
        ets_fitted = self.ets_model.fit()
        ets_forecast = ets_fitted.forecast(steps=steps)
        
        # Prepare features for ML model
        if external_features is not None:
            # Use provided external features
            X_ml = external_features.copy()
        else:
            # Create time-based features for future steps
            last_time_index = len(self.training_data) - 1
            X_ml = pd.DataFrame({
                'time_index': np.arange(last_time_index + 1, last_time_index + 1 + steps),
                'time_squared': np.arange(last_time_index + 1, last_time_index + 1 + steps) ** 2
            })
            
        # Add ETS predictions as a feature (use .values to avoid index alignment issues)
        X_ml['ets_prediction'] = ets_forecast.values
        
        # Get ML predictions for residuals
        ml_residuals = self.ml_model.predict(X_ml)
        
        # Combine ETS forecast with ML residuals
        hybrid_predictions = ets_forecast.values + ml_residuals
        
        return hybrid_predictions

class EnsembleHybridModel:
    """Ensemble Hybrid model combining multiple forecasting approaches."""
    
    def __init__(self, models: List[Dict[str, Any]], weights: Optional[List[float]] = None):
        """
        Initialize Ensemble Hybrid model.
        
        Args:
            models: List of model configurations [{'type': 'arima_ml', 'params': {...}}, ...]
            weights: Weights for each model (default: equal weights)
        """
        if not HAS_HYBRID_LIBRARIES:
            raise ImportError("Required libraries are not installed")
            
        self.models = models
        self.weights = weights or [1.0 / len(models)] * len(models)
        self.fitted_models = []
        self.is_fitted = False
        
    def fit(self, data: pd.Series, external_features: Optional[pd.DataFrame] = None, **kwargs) -> 'EnsembleHybridModel':
        """
        Fit the Ensemble Hybrid model to the data.
        
        Args:
            data: Time series data as a pandas Series
            external_features: External features for ML models
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting Ensemble Hybrid model")
        
        # Fit each model in the ensemble
        self.fitted_models = []
        for i, model_config in enumerate(self.models):
            model_type = model_config['type']
            params = model_config.get('params', {})
            
            logger.info(f"Fitting {model_type} model ({i+1}/{len(self.models)})")
            
            if model_type == 'arima_ml':
                model = ARIMAMLHybridModel(**params)
            elif model_type == 'ets_ml':
                model = ETSMLHybridModel(**params)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
                
            # Fit the model
            model.fit(data, external_features, **kwargs)
            self.fitted_models.append(model)
        
        self.is_fitted = True
        logger.info("Ensemble Hybrid model fitted successfully")
        return self
    
    def predict(self, steps: int = 1, external_features: Optional[pd.DataFrame] = None) -> np.ndarray:
        """
        Make predictions using the fitted ensemble model.
        
        Args:
            steps: Number of steps to forecast
            external_features: External features for ML models (for future steps)
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with Ensemble Hybrid model")
        
        # Get predictions from all models
        predictions = []
        for i, model in enumerate(self.fitted_models):
            model_predictions = model.predict(steps, external_features)
            predictions.append(model_predictions)
            
        # Weighted average of predictions
        ensemble_predictions = np.average(predictions, axis=0, weights=self.weights)
        
        return ensemble_predictions

class HybridForecaster:
    """Wrapper class for hybrid forecasting models."""
    
    def __init__(self, model_type: str = 'arima_ml', **kwargs):
        """
        Initialize the hybrid forecaster.
        
        Args:
            model_type: Type of hybrid model ('arima_ml', 'ets_ml', 'ensemble')
            **kwargs: Additional arguments for the specific model
        """
        if not HAS_HYBRID_LIBRARIES:
            raise ImportError("Required libraries are not installed")
            
        self.model_type = model_type.lower()
        self.model = None
        self.is_fitted = False
        
        if self.model_type == 'arima_ml':
            self.model = ARIMAMLHybridModel(**kwargs)
        elif self.model_type == 'ets_ml':
            self.model = ETSMLHybridModel(**kwargs)
        elif self.model_type == 'ensemble':
            self.model = EnsembleHybridModel(**kwargs)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
    def fit(self, X, y=None, **kwargs) -> 'HybridForecaster':
        """
        Fit the hybrid model to the data.
        
        Args:
            X: Time series data as a pandas Series (or DataFrame with 'target' column)
            y: Not used (included for API consistency)
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} hybrid model for demand forecasting")
        
        # Handle input data
        if isinstance(X, pd.DataFrame):
            if 'target' in X.columns:
                data = X['target']
                external_features = X.drop('target', axis=1)
            else:
                # Assume first column is target
                data = X.iloc[:, 0]
                external_features = X.iloc[:, 1:] if X.shape[1] > 1 else None
        else:
            data = X
            external_features = kwargs.get('external_features', None)
        
        # Fit the model
        self.model.fit(data, external_features, **kwargs)
        self.is_fitted = True
        
        logger.info(f"{self.model_type.upper()} hybrid model fitted successfully")
        return self
    
    def predict(self, steps: int = 1, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with {self.model_type.upper()} hybrid model")
        
        # Get predictions
        predictions = self.model.predict(steps, **kwargs)
        
        return predictions

# Example usage
if __name__ == "__main__":
    # Create sample time series data
    np.random.seed(42)
    n_samples = 1000
    dates = pd.date_range('2023-01-01', periods=n_samples, freq='D')
    # Create a time series with trend and seasonality
    time = np.arange(n_samples)
    trend = 0.02 * time
    seasonal = 10 * np.sin(2 * np.pi * time / 50)  # Seasonal component with period 50
    noise = np.random.normal(0, 1, n_samples)
    data = trend + seasonal + noise
    series = pd.Series(data, index=dates)
    
    # Fit and predict with ARIMA-ML Hybrid model
    print("=== ARIMA-ML Hybrid Model ===")
    arima_ml_forecaster = HybridForecaster(model_type='arima_ml', arima_order=(1, 1, 1), ml_model_type='random_forest')
    arima_ml_forecaster.fit(series)
    arima_ml_predictions = arima_ml_forecaster.predict(steps=10)
    print(f"ARIMA-ML Hybrid Predictions: {arima_ml_predictions}")
    
    # Fit and predict with ETS-ML Hybrid model
    print("\n=== ETS-ML Hybrid Model ===")
    ets_ml_forecaster = HybridForecaster(model_type='ets_ml', ets_trend='add', ets_seasonal='add', 
                                        seasonal_periods=50, ml_model_type='random_forest')
    ets_ml_forecaster.fit(series)
    ets_ml_predictions = ets_ml_forecaster.predict(steps=10)
    print(f"ETS-ML Hybrid Predictions: {ets_ml_predictions}")
    
    # Fit and predict with Ensemble Hybrid model
    print("\n=== Ensemble Hybrid Model ===")
    ensemble_models = [
        {'type': 'arima_ml', 'params': {'arima_order': (1, 1, 1), 'ml_model_type': 'random_forest'}},
        {'type': 'ets_ml', 'params': {'ets_trend': 'add', 'ets_seasonal': 'add', 'seasonal_periods': 50, 
                                     'ml_model_type': 'linear_regression'}}
    ]
    ensemble_forecaster = HybridForecaster(model_type='ensemble', models=ensemble_models, weights=[0.6, 0.4])
    ensemble_forecaster.fit(series)
    ensemble_predictions = ensemble_forecaster.predict(steps=10)
    print(f"Ensemble Hybrid Predictions: {ensemble_predictions}")