"""
Statistical Models for Demand Forecasting

This module implements baseline statistical models for demand forecasting:
- Exponential Smoothing (ETS)
- ARIMA/SARIMA models
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple
import logging
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ETSModel:
    """Exponential Smoothing (ETS) model for demand forecasting."""
    
    def __init__(self, trend: Optional[str] = 'add', seasonal: Optional[str] = 'add', 
                 seasonal_periods: Optional[int] = None):
        """
        Initialize ETS model.
        
        Args:
            trend: Type of trend component ('add', 'mul', or None)
            seasonal: Type of seasonal component ('add', 'mul', or None)
            seasonal_periods: Number of periods in a season
        """
        self.trend = trend
        self.seasonal = seasonal
        self.seasonal_periods = seasonal_periods
        self.model = None
        self.is_fitted = False
        self.training_data = None
        
    def fit(self, data: pd.Series, **kwargs) -> 'ETSModel':
        """
        Fit the ETS model to the data.
        
        Args:
            data: Time series data to fit the model to
            **kwargs: Additional arguments for ExponentialSmoothing
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting ETS model")
        
        # Store training data for forecasting
        self.training_data = data.copy()
        
        # Create and fit the model
        self.model = ExponentialSmoothing(
            data,
            trend=self.trend,
            seasonal=self.seasonal,
            seasonal_periods=self.seasonal_periods,
            **kwargs
        )
        
        # Fit the model
        self.fitted_model = self.model.fit()
        self.is_fitted = True
        
        logger.info("ETS model fitted successfully")
        return self
    
    def predict(self, steps: int = 1) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            
        Returns:
            np.ndarray: Forecasted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with ETS model")
        
        # Make predictions
        forecast = self.fitted_model.forecast(steps=steps)
        return forecast.values
    
    def predict_with_confidence(self, steps: int = 1, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.
        
        Args:
            steps: Number of steps to forecast
            alpha: Significance level for confidence intervals (default: 0.05 for 95% CI)
            
        Returns:
            Tuple[np.ndarray, np.ndarray, np.ndarray]: Forecast, lower bound, upper bound
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with confidence intervals using ETS model")
        
        # Make predictions with confidence intervals
        forecast_result = self.fitted_model.forecast(steps=steps)
        
        # For ETS models, we need to calculate confidence intervals manually
        # This is a simplified approach - in practice, you might want to use more sophisticated methods
        try:
            # Try to get confidence intervals if the method exists
            conf_int = self.fitted_model.conf_int(alpha=alpha)
            lower_bound = conf_int.iloc[:, 0].values[-steps:] if len(conf_int) >= steps else conf_int.iloc[:, 0].values
            upper_bound = conf_int.iloc[:, 1].values[-steps:] if len(conf_int) >= steps else conf_int.iloc[:, 1].values
        except AttributeError:
            # If conf_int method doesn't exist, use a simple approach
            forecast = forecast_result.values
            # Simple standard error estimation (this is a rough approximation)
            if self.training_data is not None:
                std_err = np.std(np.array(self.training_data.values)) * 0.1  # Rough estimate
            else:
                std_err = 0.1  # Default value
            margin_error = std_err * 1.96  # For 95% confidence interval
            lower_bound = forecast - margin_error
            upper_bound = forecast + margin_error
            # Ensure we return the forecast values
            forecast = forecast_result.values
        
        return forecast_result.values, lower_bound, upper_bound

class ARIMAModel:
    """ARIMA/SARIMA model for demand forecasting."""
    
    def __init__(self, order: Tuple[int, int, int] = (1, 1, 1), 
                 seasonal_order: Optional[Tuple[int, int, int, int]] = None):
        """
        Initialize ARIMA model.
        
        Args:
            order: ARIMA order (p, d, q)
            seasonal_order: Seasonal ARIMA order (P, D, Q, s) or None for non-seasonal
        """
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.fitted_model = None
        self.is_fitted = False
        self.training_data = None
        
    def fit(self, data: pd.Series, **kwargs) -> 'ARIMAModel':
        """
        Fit the ARIMA model to the data.
        
        Args:
            data: Time series data to fit the model to
            **kwargs: Additional arguments for ARIMA
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting ARIMA model")
        
        # Store training data for forecasting
        self.training_data = data.copy()
        
        # Create and fit the model
        if self.seasonal_order is not None:
            logger.info(f"Fitting SARIMA model with order {self.order} and seasonal order {self.seasonal_order}")
            self.model = ARIMA(data, order=self.order, seasonal_order=self.seasonal_order, **kwargs)
        else:
            logger.info(f"Fitting ARIMA model with order {self.order}")
            self.model = ARIMA(data, order=self.order, **kwargs)
        
        # Fit the model
        self.fitted_model = self.model.fit()
        self.is_fitted = True
        
        logger.info("ARIMA model fitted successfully")
        return self
    
    def predict(self, steps: int = 1) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            
        Returns:
            np.ndarray: Forecasted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with ARIMA model")
        
        # Make predictions
        forecast_result = self.fitted_model.forecast(steps=steps)
        return forecast_result.values
    
    def predict_with_confidence(self, steps: int = 1, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.
        
        Args:
            steps: Number of steps to forecast
            alpha: Significance level for confidence intervals (default: 0.05 for 95% CI)
            
        Returns:
            Tuple[np.ndarray, np.ndarray, np.ndarray]: Forecast, lower bound, upper bound
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making {steps}-step forecast with confidence intervals using ARIMA model")
        
        # Make predictions with confidence intervals
        forecast_result = self.fitted_model.get_forecast(steps=steps)
        forecast = forecast_result.predicted_mean.values
        conf_int = forecast_result.conf_int(alpha=alpha)
        lower_bound = conf_int.iloc[:, 0].values
        upper_bound = conf_int.iloc[:, 1].values
        
        return forecast, lower_bound, upper_bound

class StatisticalForecaster:
    """Wrapper class for statistical forecasting models."""
    
    def __init__(self, model_type: str = 'ets', **kwargs):
        """
        Initialize the statistical forecaster.
        
        Args:
            model_type: Type of statistical model ('ets', 'arima', 'sarima')
            **kwargs: Additional arguments for the specific model
        """
        self.model_type = model_type.lower()
        self.model = None
        self.is_fitted = False
        
        if self.model_type == 'ets':
            self.model = ETSModel(**kwargs)
        elif self.model_type == 'arima':
            self.model = ARIMAModel(**kwargs)
        elif self.model_type == 'sarima':
            # Default SARIMA parameters if not provided
            seasonal_order = kwargs.pop('seasonal_order', (1, 1, 1, 12))
            self.model = ARIMAModel(seasonal_order=seasonal_order, **kwargs)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    def fit(self, data: pd.Series, **kwargs) -> 'StatisticalForecaster':
        """
        Fit the statistical model to the data.
        
        Args:
            data: Time series data to fit the model to
            **kwargs: Additional arguments for model fitting
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} model for demand forecasting")
        self.model.fit(data, **kwargs)
        self.is_fitted = True
        return self
    
    def predict(self, steps: int = 1) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            steps: Number of steps to forecast
            
        Returns:
            np.ndarray: Forecasted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
        return self.model.predict(steps)
    
    def predict_with_confidence(self, steps: int = 1, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Make predictions with confidence intervals.
        
        Args:
            steps: Number of steps to forecast
            alpha: Significance level for confidence intervals (default: 0.05 for 95% CI)
            
        Returns:
            Tuple[np.ndarray, np.ndarray, np.ndarray]: Forecast, lower bound, upper bound
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
        return self.model.predict_with_confidence(steps, alpha)

# Example usage
if __name__ == "__main__":
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100, freq='D')
    sales = np.random.randint(50, 200, 100) + np.sin(np.arange(100) * 2 * np.pi / 7) * 20  # Add weekly seasonality
    data = pd.Series(sales, index=dates)
    
    # Fit and predict with ETS model
    print("=== ETS Model ===")
    ets_forecaster = StatisticalForecaster(model_type='ets', trend='add', seasonal='add', seasonal_periods=7)
    ets_forecaster.fit(data)
    ets_forecast = ets_forecaster.predict(steps=10)
    ets_forecast_ci = ets_forecaster.predict_with_confidence(steps=10)
    print(f"ETS Forecast: {ets_forecast}")
    print(f"ETS Forecast with CI: {ets_forecast_ci[0]}")
    
    # Fit and predict with ARIMA model
    print("\n=== ARIMA Model ===")
    arima_forecaster = StatisticalForecaster(model_type='arima', order=(1, 1, 1))
    arima_forecaster.fit(data)
    arima_forecast = arima_forecaster.predict(steps=10)
    print(f"ARIMA Forecast: {arima_forecast}")
    
    # Fit and predict with SARIMA model
    print("\n=== SARIMA Model ===")
    sarima_forecaster = StatisticalForecaster(model_type='sarima', order=(1, 1, 1), seasonal_order=(1, 1, 1, 7))
    sarima_forecaster.fit(data)
    sarima_forecast = sarima_forecaster.predict(steps=10)
    print(f"SARIMA Forecast: {sarima_forecast}")