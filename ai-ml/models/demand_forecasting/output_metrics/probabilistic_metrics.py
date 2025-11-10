"""
Probabilistic Metrics for Demand Forecasting

This module implements:
- CRPS (Continuous Ranked Probability Score)
- Pinball Loss for probabilistic forecasts
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProbabilisticMetricsCalculator:
    """Calculate probabilistic metrics for demand forecasts."""
    
    @staticmethod
    def pinball_loss(y_true: np.ndarray, y_pred: np.ndarray, 
                    quantile: float) -> float:
        """
        Calculate Pinball Loss for a specific quantile.
        
        Args:
            y_true: True values
            y_pred: Predicted quantile values
            quantile: Quantile level (0-1)
            
        Returns:
            Pinball loss value
        """
        errors = y_true - y_pred
        
        loss = np.maximum(quantile * errors, (quantile - 1) * errors)
        
        return float(np.mean(loss))
    
    @staticmethod
    def multi_quantile_pinball_loss(y_true: np.ndarray,
                                   y_pred_quantiles: np.ndarray,
                                   quantiles: List[float]) -> float:
        """
        Calculate average pinball loss across multiple quantiles.
        
        Args:
            y_true: True values (shape: n_samples)
            y_pred_quantiles: Predicted quantiles (shape: n_samples, n_quantiles)
            quantiles: List of quantile levels
            
        Returns:
            Average pinball loss
        """
        if len(y_pred_quantiles.shape) == 1:
            y_pred_quantiles = y_pred_quantiles.reshape(-1, 1)
            
        n_samples, n_quantiles = y_pred_quantiles.shape
        
        if len(quantiles) != n_quantiles:
            raise ValueError(f"Number of quantiles ({n_quantiles}) doesn't match quantile list length ({len(quantiles)})")
            
        total_loss = 0.0
        
        for i, quantile in enumerate(quantiles):
            loss = ProbabilisticMetricsCalculator.pinball_loss(
                y_true, y_pred_quantiles[:, i], quantile
            )
            total_loss += loss
            
        return total_loss / len(quantiles)
    
    @staticmethod
    def crps_from_samples(y_true: np.ndarray, 
                         samples: np.ndarray) -> float:
        """
        Calculate CRPS from forecast samples.
        
        Args:
            y_true: True values (shape: n_samples)
            samples: Forecast samples (shape: n_samples, n_samples_per_forecast)
            
        Returns:
            CRPS value
        """
        if len(samples.shape) == 1:
            samples = samples.reshape(-1, 1)
            
        n_samples, n_forecast_samples = samples.shape
        
        if len(y_true) != n_samples:
            raise ValueError(f"True values length ({len(y_true)}) doesn't match samples length ({n_samples})")
            
        crps_values = []
        
        for i in range(n_samples):
            true_val = y_true[i]
            forecast_samples = samples[i, :]
            
            # Sort samples
            sorted_samples = np.sort(forecast_samples)
            
            # Calculate CRPS for this observation
            # CRPS = mean(|samples - true|) - 0.5 * mean(|samples_i - samples_j|)
            term1 = np.mean(np.abs(forecast_samples - true_val))
            
            # Calculate pairwise differences
            pairwise_diffs = []
            for j in range(n_forecast_samples):
                for k in range(j + 1, n_forecast_samples):
                    pairwise_diffs.append(abs(sorted_samples[j] - sorted_samples[k]))
                    
            term2 = 0.5 * np.mean(pairwise_diffs) if len(pairwise_diffs) > 0 else 0.0
            
            crps = term1 - term2
            crps_values.append(crps)
            
        return float(np.mean(crps_values))
    
    @staticmethod
    def crps_from_quantiles(y_true: np.ndarray,
                           quantiles: np.ndarray,
                           quantile_levels: List[float]) -> float:
        """
        Calculate CRPS from quantile forecasts.
        
        Args:
            y_true: True values (shape: n_samples)
            quantiles: Predicted quantiles (shape: n_samples, n_quantiles)
            quantile_levels: List of quantile levels
            
        Returns:
            CRPS value
        """
        if len(quantiles.shape) == 1:
            quantiles = quantiles.reshape(-1, 1)
            
        n_samples, n_quantiles = quantiles.shape
        
        if len(quantile_levels) != n_quantiles:
            raise ValueError(f"Number of quantiles ({n_quantiles}) doesn't match quantile levels length ({len(quantile_levels)})")
            
        # Approximate CRPS using quantiles
        # This is an approximation - full CRPS requires the full distribution
        crps_values = []
        
        for i in range(n_samples):
            true_val = y_true[i]
            quantile_vals = quantiles[i, :]
            
            # Calculate CRPS approximation
            # Integrate over quantiles
            crps = 0.0
            for j in range(n_quantiles - 1):
                q_low = quantile_levels[j]
                q_high = quantile_levels[j + 1]
                val_low = quantile_vals[j]
                val_high = quantile_vals[j + 1]
                
                # Linear interpolation between quantiles
                if true_val < val_low:
                    crps += (q_high - q_low) * (val_low - true_val)
                elif true_val > val_high:
                    crps += (q_high - q_low) * (true_val - val_high)
                else:
                    # True value is within this quantile range
                    # Calculate area under the curve
                    crps += (q_high - q_low) * abs(true_val - (val_low + val_high) / 2)
                    
            crps_values.append(crps)
            
        return float(np.mean(crps_values))
    
    def calculate_all_probabilistic_metrics(self,
                                          y_true: np.ndarray,
                                          y_pred_samples: Optional[np.ndarray] = None,
                                          y_pred_quantiles: Optional[np.ndarray] = None,
                                          quantile_levels: Optional[List[float]] = None) -> Dict[str, float]:
        """
        Calculate all probabilistic metrics.
        
        Args:
            y_true: True values
            y_pred_samples: Forecast samples (optional)
            y_pred_quantiles: Predicted quantiles (optional)
            quantile_levels: Quantile levels for quantile predictions (optional)
            
        Returns:
            Dictionary with all probabilistic metrics
        """
        metrics = {}
        
        if y_pred_samples is not None:
            # Calculate CRPS from samples
            metrics['crps'] = self.crps_from_samples(y_true, y_pred_samples)
            
        if y_pred_quantiles is not None and quantile_levels is not None:
            # Calculate CRPS from quantiles
            metrics['crps_quantiles'] = self.crps_from_quantiles(y_true, y_pred_quantiles, quantile_levels)
            
            # Calculate pinball loss for each quantile
            for i, quantile in enumerate(quantile_levels):
                metrics[f'pinball_loss_q{int(quantile*100)}'] = self.pinball_loss(
                    y_true, y_pred_quantiles[:, i], quantile
                )
                
            # Calculate average pinball loss
            metrics['avg_pinball_loss'] = self.multi_quantile_pinball_loss(
                y_true, y_pred_quantiles, quantile_levels
            )
            
        return metrics
    
    @staticmethod
    def calculate_coverage(y_true: np.ndarray,
                          lower_bound: np.ndarray,
                          upper_bound: np.ndarray) -> float:
        """
        Calculate coverage (percentage of true values within prediction interval).
        
        Args:
            y_true: True values
            lower_bound: Lower bound of prediction interval
            upper_bound: Upper bound of prediction interval
            
        Returns:
            Coverage percentage (0-100)
        """
        coverage = np.mean((y_true >= lower_bound) & (y_true <= upper_bound))
        return float(coverage * 100)
    
    @staticmethod
    def calculate_interval_width(lower_bound: np.ndarray,
                               upper_bound: np.ndarray) -> float:
        """
        Calculate average width of prediction intervals.
        
        Args:
            lower_bound: Lower bound of prediction interval
            upper_bound: Upper bound of prediction interval
            
        Returns:
            Average interval width
        """
        widths = upper_bound - lower_bound
        return float(np.mean(widths))

