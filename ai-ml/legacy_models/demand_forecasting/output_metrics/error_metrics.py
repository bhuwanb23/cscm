"""
Error Metrics for Demand Forecasting

This module implements:
- MAPE, sMAPE, MAE, RMSE calculation
- Demand error/confidence metrics per SKU
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
import logging
from scipy import stats

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ErrorMetricsCalculator:
    """Calculate error metrics for demand forecasts."""
    
    @staticmethod
    def mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        Calculate Mean Absolute Error (MAE).
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            MAE value
        """
        return float(np.mean(np.abs(y_true - y_pred)))
    
    @staticmethod
    def rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
        """
        Calculate Root Mean Squared Error (RMSE).
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            RMSE value
        """
        return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
    
    @staticmethod
    def mape(y_true: np.ndarray, y_pred: np.ndarray, 
            epsilon: float = 1e-8) -> float:
        """
        Calculate Mean Absolute Percentage Error (MAPE).
        
        Args:
            y_true: True values
            y_pred: Predicted values
            epsilon: Small value to avoid division by zero
            
        Returns:
            MAPE value (as percentage)
        """
        # Avoid division by zero
        mask = np.abs(y_true) > epsilon
        if np.sum(mask) == 0:
            return np.nan
            
        return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)
    
    @staticmethod
    def smape(y_true: np.ndarray, y_pred: np.ndarray,
             epsilon: float = 1e-8) -> float:
        """
        Calculate Symmetric Mean Absolute Percentage Error (sMAPE).
        
        Args:
            y_true: True values
            y_pred: Predicted values
            epsilon: Small value to avoid division by zero
            
        Returns:
            sMAPE value (as percentage)
        """
        numerator = np.abs(y_true - y_pred)
        denominator = (np.abs(y_true) + np.abs(y_pred)) / 2 + epsilon
        
        return float(np.mean(numerator / denominator) * 100)
    
    @staticmethod
    def mase(y_true: np.ndarray, y_pred: np.ndarray,
            y_train: Optional[np.ndarray] = None,
            seasonal_period: int = 1) -> float:
        """
        Calculate Mean Absolute Scaled Error (MASE).
        
        Args:
            y_true: True values
            y_pred: Predicted values
            y_train: Training data for scaling (optional)
            seasonal_period: Seasonal period for naive forecast
            
        Returns:
            MASE value
        """
        mae_value = ErrorMetricsCalculator.mae(y_true, y_pred)
        
        if y_train is not None and len(y_train) > seasonal_period:
            # Use seasonal naive forecast as baseline
            naive_errors = np.abs(y_train[seasonal_period:] - y_train[:-seasonal_period])
            scale = np.mean(naive_errors)
        else:
            # Use simple naive forecast
            if len(y_true) > 1:
                scale = np.mean(np.abs(np.diff(y_true)))
            else:
                scale = 1.0
                
        if scale == 0:
            return np.nan
            
        return float(mae_value / scale)
    
    def calculate_all_metrics(self, y_true: np.ndarray, 
                             y_pred: np.ndarray,
                             y_train: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Calculate all error metrics.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            y_train: Training data (optional, for MASE)
            
        Returns:
            Dictionary with all metrics
        """
        metrics = {
            'mae': self.mae(y_true, y_pred),
            'rmse': self.rmse(y_true, y_pred),
            'mape': self.mape(y_true, y_pred),
            'smape': self.smape(y_true, y_pred)
        }
        
        if y_train is not None:
            metrics['mase'] = self.mase(y_true, y_pred, y_train)
            
        return metrics


class SKUConfidenceMetrics:
    """Calculate demand error and confidence metrics per SKU."""
    
    def __init__(self, error_calculator: Optional[ErrorMetricsCalculator] = None):
        """
        Initialize SKU confidence metrics calculator.
        
        Args:
            error_calculator: Error metrics calculator instance
        """
        self.error_calculator = error_calculator or ErrorMetricsCalculator()
        
    def calculate_sku_metrics(self, forecasts: pd.DataFrame,
                             actuals: pd.DataFrame,
                             sku_id: int,
                             store_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Calculate error and confidence metrics for a specific SKU.
        
        Args:
            forecasts: DataFrame with forecasts (columns: sku_id, store_id, date, forecast)
            actuals: DataFrame with actuals (columns: sku_id, store_id, date, actual)
            sku_id: SKU identifier
            store_id: Store identifier (optional)
            
        Returns:
            Dictionary with metrics for the SKU
        """
        # Filter data for this SKU
        forecast_filtered = forecasts[forecasts['sku_id'] == sku_id]
        actual_filtered = actuals[actuals['sku_id'] == sku_id]
        
        if store_id is not None:
            forecast_filtered = forecast_filtered[forecast_filtered['store_id'] == store_id]
            actual_filtered = actual_filtered[actual_filtered['store_id'] == store_id]
            
        # Merge on date
        merged = pd.merge(
            forecast_filtered,
            actual_filtered,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        if len(merged) == 0:
            logger.warning(f"No matching data for SKU {sku_id}, Store {store_id}")
            return {
                'sku_id': sku_id,
                'store_id': store_id,
                'error': 'No matching data',
                'confidence': 0.0
            }
            
        # Extract values
        y_true = merged['actual'].values
        y_pred = merged['forecast'].values
        
        # Calculate error metrics
        error_metrics = self.error_calculator.calculate_all_metrics(y_true, y_pred)
        
        # Calculate confidence score
        confidence = self._calculate_confidence_score(error_metrics)
        
        # Calculate error distribution statistics
        errors = y_true - y_pred
        error_stats = {
            'mean_error': float(np.mean(errors)),
            'std_error': float(np.std(errors)),
            'median_error': float(np.median(errors)),
            'error_range': float(np.max(errors) - np.min(errors))
        }
        
        return {
            'sku_id': sku_id,
            'store_id': store_id,
            'n_observations': len(merged),
            'error_metrics': error_metrics,
            'error_stats': error_stats,
            'confidence': confidence,
            'forecast_accuracy': 100 - error_metrics.get('mape', 0)
        }
    
    def _calculate_confidence_score(self, error_metrics: Dict[str, float]) -> float:
        """
        Calculate confidence score based on error metrics.
        
        Args:
            error_metrics: Dictionary with error metrics
            
        Returns:
            Confidence score (0-1)
        """
        # Lower errors = higher confidence
        mape = error_metrics.get('mape', 100)
        smape = error_metrics.get('smape', 100)
        
        # Normalize to 0-1 scale
        # MAPE < 10% = high confidence, > 50% = low confidence
        mape_score = max(0, 1 - (mape / 50))
        smape_score = max(0, 1 - (smape / 50))
        
        # Average of both scores
        confidence = (mape_score + smape_score) / 2
        
        return float(np.clip(confidence, 0, 1))
    
    def calculate_all_sku_metrics(self, forecasts: pd.DataFrame,
                                  actuals: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate metrics for all SKUs in the dataset.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            
        Returns:
            DataFrame with metrics for each SKU
        """
        # Get unique SKU-store pairs
        if 'store_id' in forecasts.columns:
            sku_store_pairs = forecasts[['sku_id', 'store_id']].drop_duplicates()
        else:
            sku_store_pairs = pd.DataFrame({'sku_id': forecasts['sku_id'].unique(), 'store_id': None})
            
        results = []
        
        for _, row in sku_store_pairs.iterrows():
            sku_id = row['sku_id']
            store_id = row.get('store_id')
            
            metrics = self.calculate_sku_metrics(forecasts, actuals, sku_id, store_id)
            results.append(metrics)
            
        return pd.DataFrame(results)
    
    def get_sku_confidence_ranking(self, metrics_df: pd.DataFrame,
                                   top_n: Optional[int] = None) -> pd.DataFrame:
        """
        Rank SKUs by confidence score.
        
        Args:
            metrics_df: DataFrame with SKU metrics
            top_n: Number of top SKUs to return (None for all)
            
        Returns:
            DataFrame ranked by confidence
        """
        if 'confidence' not in metrics_df.columns:
            raise ValueError("Metrics DataFrame must contain 'confidence' column")
            
        ranked = metrics_df.sort_values('confidence', ascending=False)
        
        if top_n is not None:
            ranked = ranked.head(top_n)
            
        return ranked

