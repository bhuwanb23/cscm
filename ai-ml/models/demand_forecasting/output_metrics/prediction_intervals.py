"""
Prediction Intervals for Demand Forecasting

This module implements point forecast generation with prediction intervals (80%/95%).
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple, List
import logging
from scipy import stats

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PredictionIntervalGenerator:
    """Generate point forecasts with prediction intervals (80%/95%)."""
    
    def __init__(self, method: str = 'quantile'):
        """
        Initialize the prediction interval generator.
        
        Args:
            method: Method for generating prediction intervals ('quantile', 'bootstrap', 'analytical')
        """
        self.method = method
        
    def generate_intervals_from_samples(self, samples: np.ndarray, 
                                       confidence_levels: List[float] = [0.8, 0.95]) -> Dict[str, np.ndarray]:
        """
        Generate prediction intervals from probabilistic forecast samples.
        
        Args:
            samples: Array of forecast samples (num_samples, forecast_horizon)
            confidence_levels: List of confidence levels (e.g., [0.8, 0.95])
            
        Returns:
            Dictionary with point forecast and intervals for each confidence level
        """
        if len(samples.shape) == 1:
            samples = samples.reshape(1, -1)
            
        num_samples, forecast_horizon = samples.shape
        
        result = {
            'point_forecast': np.median(samples, axis=0),
            'forecast_horizon': forecast_horizon
        }
        
        # Generate intervals for each confidence level
        for conf_level in confidence_levels:
            alpha = 1 - conf_level
            lower_percentile = (alpha / 2) * 100
            upper_percentile = (1 - alpha / 2) * 100
            
            lower_bound = np.percentile(samples, lower_percentile, axis=0)
            upper_bound = np.percentile(samples, upper_percentile, axis=0)
            
            result[f'lower_{int(conf_level*100)}'] = lower_bound
            result[f'upper_{int(conf_level*100)}'] = upper_bound
            result[f'interval_{int(conf_level*100)}'] = upper_bound - lower_bound
            
        return result
    
    def generate_intervals_analytical(self, point_forecast: np.ndarray, 
                                     std_error: np.ndarray,
                                     confidence_levels: List[float] = [0.8, 0.95]) -> Dict[str, np.ndarray]:
        """
        Generate prediction intervals using analytical method (assumes normal distribution).
        
        Args:
            point_forecast: Point forecast values
            std_error: Standard error of the forecast
            confidence_levels: List of confidence levels
            
        Returns:
            Dictionary with point forecast and intervals
        """
        result = {
            'point_forecast': point_forecast,
            'forecast_horizon': len(point_forecast)
        }
        
        for conf_level in confidence_levels:
            alpha = 1 - conf_level
            z_score = stats.norm.ppf(1 - alpha / 2)
            
            margin = z_score * std_error
            lower_bound = point_forecast - margin
            upper_bound = point_forecast + margin
            
            result[f'lower_{int(conf_level*100)}'] = lower_bound
            result[f'upper_{int(conf_level*100)}'] = upper_bound
            result[f'interval_{int(conf_level*100)}'] = upper_bound - lower_bound
            
        return result
    
    def generate_intervals_bootstrap(self, model, X: np.ndarray, 
                                    n_bootstrap: int = 100,
                                    confidence_levels: List[float] = [0.8, 0.95]) -> Dict[str, np.ndarray]:
        """
        Generate prediction intervals using bootstrap method.
        
        Args:
            model: Trained forecasting model with predict method
            X: Input features for prediction
            n_bootstrap: Number of bootstrap samples
            confidence_levels: List of confidence levels
            
        Returns:
            Dictionary with point forecast and intervals
        """
        bootstrap_predictions = []
        
        for _ in range(n_bootstrap):
            # Bootstrap sample (with replacement)
            n_samples = len(X) if hasattr(X, '__len__') else 1
            indices = np.random.choice(n_samples, size=n_samples, replace=True)
            
            if hasattr(X, 'iloc'):
                X_boot = X.iloc[indices]
            else:
                X_boot = X[indices] if len(X.shape) > 1 else X
                
            # Make prediction
            try:
                pred = model.predict(X_boot)
                if isinstance(pred, (list, np.ndarray)):
                    bootstrap_predictions.append(pred[0] if len(pred) > 0 else pred)
                else:
                    bootstrap_predictions.append(pred)
            except Exception as e:
                logger.warning(f"Bootstrap prediction failed: {e}")
                continue
                
        if len(bootstrap_predictions) == 0:
            raise ValueError("No valid bootstrap predictions generated")
            
        bootstrap_predictions = np.array(bootstrap_predictions)
        
        # If single value predictions, reshape
        if bootstrap_predictions.ndim == 1:
            bootstrap_predictions = bootstrap_predictions.reshape(-1, 1)
            
        return self.generate_intervals_from_samples(bootstrap_predictions, confidence_levels)
    
    def generate(self, model, X: Optional[np.ndarray] = None,
                 point_forecast: Optional[np.ndarray] = None,
                 samples: Optional[np.ndarray] = None,
                 std_error: Optional[np.ndarray] = None,
                 confidence_levels: List[float] = [0.8, 0.95],
                 **kwargs) -> Dict[str, Any]:
        """
        Generate point forecast with prediction intervals.
        
        Args:
            model: Trained forecasting model (optional if point_forecast or samples provided)
            X: Input features for prediction
            point_forecast: Pre-computed point forecast (optional)
            samples: Probabilistic forecast samples (optional)
            std_error: Standard error for analytical method (optional)
            confidence_levels: List of confidence levels [0.8, 0.95]
            **kwargs: Additional arguments
            
        Returns:
            Dictionary with point forecast and prediction intervals
        """
        if samples is not None:
            # Use samples if provided (probabilistic forecast)
            logger.info("Generating intervals from probabilistic samples")
            return self.generate_intervals_from_samples(samples, confidence_levels)
            
        elif std_error is not None and point_forecast is not None:
            # Use analytical method if std_error provided
            logger.info("Generating intervals using analytical method")
            return self.generate_intervals_analytical(point_forecast, std_error, confidence_levels)
            
        elif model is not None and X is not None:
            # Use bootstrap method
            logger.info("Generating intervals using bootstrap method")
            return self.generate_intervals_bootstrap(model, X, 
                                                   n_bootstrap=kwargs.get('n_bootstrap', 100),
                                                   confidence_levels=confidence_levels)
        else:
            raise ValueError("Must provide either samples, (point_forecast and std_error), or (model and X)")
    
    def format_output(self, intervals: Dict[str, Any], 
                     sku_id: Optional[int] = None,
                     store_id: Optional[int] = None,
                     forecast_date: Optional[pd.Timestamp] = None) -> pd.DataFrame:
        """
        Format prediction intervals as a DataFrame.
        
        Args:
            intervals: Dictionary with prediction intervals
            sku_id: SKU identifier (optional)
            store_id: Store identifier (optional)
            forecast_date: Forecast date (optional)
            
        Returns:
            DataFrame with formatted output
        """
        forecast_horizon = intervals['forecast_horizon']
        
        data = {
            'horizon': range(1, forecast_horizon + 1),
            'point_forecast': intervals['point_forecast']
        }
        
        # Add intervals for each confidence level
        for key in intervals.keys():
            if key.startswith('lower_') or key.startswith('upper_') or key.startswith('interval_'):
                data[key] = intervals[key]
                
        df = pd.DataFrame(data)
        
        # Add metadata if provided
        if sku_id is not None:
            df['sku_id'] = sku_id
        if store_id is not None:
            df['store_id'] = store_id
        if forecast_date is not None:
            df['forecast_date'] = forecast_date
            
        return df

