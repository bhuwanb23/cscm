"""
Performance Tracker for Model Monitoring

This module implements real-time model performance tracking with statistical
tests for detecting performance degradation and drift in the Cognitive Supply Chain Mesh.
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
import logging
from scipy import stats
from collections import deque
import warnings

warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PerformanceTracker:
    """
    Tracks model performance metrics in real-time and detects degradation.
    """
    
    def __init__(self, 
                 model_id: str,
                 warmup_period: int = 100,
                 significance_level: float = 0.05,
                 window_size: int = 1000):
        """
        Initialize the performance tracker.
        
        Args:
            model_id: Unique identifier for the model
            warmup_period: Number of predictions before monitoring begins
            significance_level: Statistical significance level for tests
            window_size: Size of sliding window for performance calculations
        """
        self.model_id = model_id
        self.warmup_period = warmup_period
        self.significance_level = significance_level
        self.window_size = window_size
        
        # Data storage
        self.predictions = deque(maxlen=window_size)
        self.targets = deque(maxlen=window_size)
        self.prediction_times = deque(maxlen=window_size)
        self.performance_history = []
        
        # Performance metrics
        self.current_metrics = {}
        self.baseline_metrics = {}
        self.drift_detected = False
        
        # Tracking counters
        self.total_predictions = 0
        self.warmup_count = 0
        self.last_alert_time = None
        
    def update(self, y_true: Union[float, np.ndarray], 
               y_pred: Union[float, np.ndarray]) -> Dict[str, Any]:
        """
        Update the tracker with new prediction-target pairs.
        
        Args:
            y_true: Actual target values
            y_pred: Predicted values
            
        Returns:
            Dictionary with current metrics and alert status
        """
        # Convert to numpy arrays if needed
        if not isinstance(y_true, np.ndarray):
            y_true = np.array([y_true])
        if not isinstance(y_pred, np.ndarray):
            y_pred = np.array([y_pred])
        
        # Store the new data
        for yt, yp in zip(y_true, y_pred):
            self.predictions.append(yp)
            self.targets.append(yt)
            self.prediction_times.append(datetime.now())
            self.total_predictions += 1
            self.warmup_count += 1
        
        # Calculate current metrics
        metrics = self.calculate_current_metrics()
        self.current_metrics = metrics
        
        # Set baseline after warmup period
        if self.warmup_count >= self.warmup_period and not self.baseline_metrics:
            self.baseline_metrics = metrics.copy()
            logger.info(f"Baseline metrics set for model {self.model_id}: {self.baseline_metrics}")
        
        # Check for drift if past warmup period
        drift_status = {}
        if self.warmup_count > self.warmup_period and self.baseline_metrics:
            drift_status = self.check_for_drift()
            self.drift_detected = any(drift_status.values())
        
        # Prepare result
        result = {
            'model_id': self.model_id,
            'total_predictions': self.total_predictions,
            'current_metrics': metrics,
            'baseline_metrics': self.baseline_metrics,
            'drift_detected': self.drift_detected,
            'drift_status': drift_status,
            'timestamp': datetime.now().isoformat()
        }
        
        # Log alert if drift detected
        if self.drift_detected:
            logger.warning(f"Performance degradation detected for model {self.model_id}")
            self.last_alert_time = datetime.now()
        
        # Store in history
        self.performance_history.append(result.copy())
        
        return result
    
    def calculate_current_metrics(self) -> Dict[str, float]:
        """
        Calculate current performance metrics.
        
        Returns:
            Dictionary with performance metrics
        """
        if len(self.targets) < 2:
            return {}
        
        targets = np.array(list(self.targets))
        predictions = np.array(list(self.predictions))
        
        # Basic regression metrics
        mae = np.mean(np.abs(targets - predictions))
        mse = np.mean((targets - predictions) ** 2)
        rmse = np.sqrt(mse)
        
        # Calculate R²
        ss_res = np.sum((targets - predictions) ** 2)
        ss_tot = np.sum((targets - np.mean(targets)) ** 2)
        r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0.0
        
        # Calculate MAPE (avoid division by zero)
        non_zero_targets = targets != 0
        mape = np.mean(np.abs((targets[non_zero_targets] - predictions[non_zero_targets]) / 
                             targets[non_zero_targets])) * 100 if np.any(non_zero_targets) else float('inf')
        
        # Directional accuracy (for time series)
        actual_directions = np.diff(targets) > 0
        predicted_directions = np.diff(predictions) > 0
        directional_accuracy = np.mean(actual_directions == predicted_directions) if len(actual_directions) > 0 else 0.0
        
        return {
            'mae': float(mae),
            'mse': float(mse),
            'rmse': float(rmse),
            'r2': float(r2),
            'mape': float(mape) if mape != float('inf') else 0.0,
            'directional_accuracy': float(directional_accuracy),
            'sample_size': len(targets)
        }
    
    def check_for_drift(self) -> Dict[str, bool]:
        """
        Check for performance drift using statistical tests.
        
        Returns:
            Dictionary indicating which metrics show drift
        """
        if not self.baseline_metrics or len(self.targets) < 10:
            return {metric: False for metric in self.current_metrics.keys() if metric != 'sample_size'}
        
        drift_status = {}
        
        # Compare current metrics to baseline using threshold-based detection
        for metric, current_val in self.current_metrics.items():
            if metric == 'sample_size':
                continue
                
            baseline_val = self.baseline_metrics.get(metric, current_val)
            
            # For R², higher is better, so degradation is lower values
            if metric == 'r2' or metric == 'directional_accuracy':
                drift_status[metric] = current_val < baseline_val * 0.95  # 5% degradation
            # For error metrics, lower is better, so degradation is higher values
            elif metric in ['mae', 'mse', 'rmse', 'mape']:
                drift_status[metric] = current_val > baseline_val * 1.05  # 5% increase
            else:
                # Default: 10% deviation threshold
                threshold = baseline_val * 0.10
                drift_status[metric] = abs(current_val - baseline_val) > threshold
        
        return drift_status
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """
        Get a summary of model performance.
        
        Returns:
            Dictionary with performance summary
        """
        return {
            'model_id': self.model_id,
            'total_predictions': self.total_predictions,
            'current_metrics': self.current_metrics,
            'baseline_metrics': self.baseline_metrics,
            'drift_detected': self.drift_detected,
            'last_alert_time': self.last_alert_time.isoformat() if self.last_alert_time else None,
            'window_size': self.window_size,
            'samples_in_window': len(self.targets)
        }
    
    def reset(self):
        """
        Reset the performance tracker to initial state.
        """
        self.predictions.clear()
        self.targets.clear()
        self.prediction_times.clear()
        self.performance_history = []
        self.current_metrics = {}
        self.baseline_metrics = {}
        self.drift_detected = False
        self.total_predictions = 0
        self.warmup_count = 0
        self.last_alert_time = None
        logger.info(f"Performance tracker for model {self.model_id} has been reset")


if __name__ == "__main__":
    # Example usage
    tracker = PerformanceTracker(model_id="demand_forecaster_v1", warmup_period=50)
    
    # Simulate model predictions over time
    np.random.seed(42)
    n_samples = 200
    
    # Generate synthetic data with concept drift
    X = np.linspace(0, 10, n_samples)
    true_values = 2 * X + 1 + np.random.normal(0, 0.5, n_samples)
    predictions = 2 * X + 0.8 + np.random.normal(0, 0.6, n_samples)  # Slightly worse
    
    # Add concept drift after halfway point
    mid_point = n_samples // 2
    true_values[mid_point:] = true_values[mid_point:] + 2  # Shift in true values
    predictions[mid_point:] = predictions[mid_point:] + 0.5  # Different shift in predictions
    
    print("Tracking model performance over time...")
    for i in range(n_samples):
        result = tracker.update(true_values[i], predictions[i])
        
        # Print status every 50 predictions
        if (i + 1) % 50 == 0:
            print(f"After {i+1} predictions - RMSE: {result['current_metrics'].get('rmse', 0):.3f}, "
                  f"Drift Detected: {result['drift_detected']}")
    
    summary = tracker.get_performance_summary()
    print(f"\nFinal Performance Summary:")
    print(f"Total Predictions: {summary['total_predictions']}")
    print(f"Current RMSE: {summary['current_metrics'].get('rmse', 0):.3f}")
    print(f"Drift Detected: {summary['drift_detected']}")