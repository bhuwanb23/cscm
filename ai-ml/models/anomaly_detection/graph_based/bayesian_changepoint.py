"""
Bayesian Changepoint Detection

Implements Bayesian methods for detecting changepoints in time series.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
from scipy import stats
import pickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BayesianChangepointDetector:
    """
    Bayesian changepoint detector.
    
    Detects changepoints in time series using Bayesian inference.
    """
    
    def __init__(
        self,
        prior_lambda: float = 1.0,
        min_segment_length: int = 5,
        max_changepoints: Optional[int] = None
    ):
        """
        Initialize Bayesian changepoint detector.
        
        Args:
            prior_lambda: Prior parameter for changepoint rate
            min_segment_length: Minimum length of segments
            max_changepoints: Maximum number of changepoints to detect
        """
        self.prior_lambda = prior_lambda
        self.min_segment_length = min_segment_length
        self.max_changepoints = max_changepoints
        
        self.changepoints: List[int] = []
        self.segment_parameters: List[Dict[str, Any]] = []
        self.is_fitted = False
    
    def _compute_segment_likelihood(
        self,
        data: np.ndarray,
        start: int,
        end: int
    ) -> float:
        """
        Compute likelihood of a segment.
        
        Args:
            data: Time series data
            start: Start index
            end: End index
        
        Returns:
            Log likelihood
        """
        segment = data[start:end]
        
        if len(segment) < 2:
            return -np.inf
        
        # Assume normal distribution
        mean = np.mean(segment)
        std = np.std(segment) + 1e-8
        
        # Log likelihood
        log_likelihood = np.sum(stats.norm.logpdf(segment, loc=mean, scale=std))
        
        return log_likelihood
    
    def _detect_changepoints_dp(
        self,
        data: np.ndarray
    ) -> Tuple[List[int], List[Dict[str, Any]]]:
        """
        Detect changepoints using dynamic programming.
        
        Args:
            data: Time series data
        
        Returns:
            Tuple of (changepoints, segment_parameters)
        """
        n = len(data)
        
        # DP table: cost[i] = best cost up to position i
        cost = np.full(n + 1, np.inf)
        cost[0] = 0.0
        
        # Backtracking
        prev = np.zeros(n + 1, dtype=int)
        
        # Fill DP table
        for i in range(self.min_segment_length, n + 1):
            for j in range(max(0, i - n), i - self.min_segment_length + 1):
                segment_likelihood = self._compute_segment_likelihood(data, j, i)
                segment_cost = -segment_likelihood + self.prior_lambda
                
                if cost[j] + segment_cost < cost[i]:
                    cost[i] = cost[j] + segment_cost
                    prev[i] = j
        
        # Backtrack to find changepoints
        changepoints = []
        i = n
        while i > 0:
            changepoints.append(prev[i])
            i = prev[i]
        
        changepoints = sorted(set(changepoints))
        changepoints = [cp for cp in changepoints if cp > 0 and cp < n]
        
        # Compute segment parameters
        segment_params = []
        changepoints_with_end = [0] + changepoints + [n]
        
        for i in range(len(changepoints_with_end) - 1):
            start = changepoints_with_end[i]
            end = changepoints_with_end[i + 1]
            segment = data[start:end]
            
            params = {
                'start': start,
                'end': end,
                'mean': float(np.mean(segment)),
                'std': float(np.std(segment)),
                'length': end - start
            }
            segment_params.append(params)
        
        return changepoints, segment_params
    
    def fit(self, data: np.ndarray):
        """
        Fit changepoint detector to data.
        
        Args:
            data: Time series data (1D array)
        """
        logger.info(f"Fitting Bayesian changepoint detector with {len(data)} data points")
        
        # Detect changepoints
        changepoints, segment_params = self._detect_changepoints_dp(data)
        
        # Limit number of changepoints if specified
        if self.max_changepoints and len(changepoints) > self.max_changepoints:
            # Keep most significant changepoints (based on segment differences)
            changepoint_scores = []
            for cp in changepoints:
                idx = next(i for i, seg in enumerate(segment_params) if seg['end'] == cp)
                if idx > 0:
                    prev_seg = segment_params[idx - 1]
                    curr_seg = segment_params[idx]
                    score = abs(curr_seg['mean'] - prev_seg['mean']) / (prev_seg['std'] + 1e-8)
                    changepoint_scores.append((cp, score))
            
            changepoint_scores.sort(key=lambda x: x[1], reverse=True)
            changepoints = [cp for cp, _ in changepoint_scores[:self.max_changepoints]]
            changepoints.sort()
            
            # Recompute segment parameters
            changepoints_with_end = [0] + changepoints + [len(data)]
            segment_params = []
            
            for i in range(len(changepoints_with_end) - 1):
                start = changepoints_with_end[i]
                end = changepoints_with_end[i + 1]
                segment = data[start:end]
                
                params = {
                    'start': start,
                    'end': end,
                    'mean': float(np.mean(segment)),
                    'std': float(np.std(segment)),
                    'length': end - start
                }
                segment_params.append(params)
        
        self.changepoints = changepoints
        self.segment_parameters = segment_params
        self.is_fitted = True
        
        logger.info(f"Detected {len(changepoints)} changepoints")
    
    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        Predict changepoints in new data.
        
        Args:
            data: Time series data
        
        Returns:
            Array of changepoint probabilities (1 for changepoint, 0 otherwise)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # For new data, we can use the fitted model to detect changepoints
        # or use a sliding window approach
        predictions = np.zeros(len(data))
        
        # Mark detected changepoints
        for cp in self.changepoints:
            if cp < len(data):
                predictions[cp] = 1
        
        return predictions
    
    def detect_anomalies(
        self,
        data: np.ndarray,
        threshold: float = 2.0
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies based on changepoints.
        
        Args:
            data: Time series data
            threshold: Threshold for anomaly detection (in standard deviations)
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            self.fit(data)
        
        predictions = np.zeros(len(data), dtype=int)
        scores = np.zeros(len(data))
        
        # For each segment, detect anomalies
        for seg_params in self.segment_parameters:
            start = seg_params['start']
            end = seg_params['end']
            segment = data[start:end]
            
            mean = seg_params['mean']
            std = seg_params['std']
            
            # Compute z-scores
            z_scores = np.abs((segment - mean) / (std + 1e-8))
            
            # Mark anomalies
            anomaly_mask = z_scores > threshold
            predictions[start:end][anomaly_mask] = -1
            
            # Store scores
            scores[start:end] = z_scores
        
        # Also mark changepoints as potential anomalies
        for cp in self.changepoints:
            if cp < len(data):
                predictions[cp] = -1
                scores[cp] = threshold + 1.0
        
        anomaly_indices = np.where(predictions == -1)[0]
        
        info = {
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(data),
            'anomaly_indices': anomaly_indices.tolist(),
            'num_changepoints': len(self.changepoints),
            'changepoints': self.changepoints,
            'segment_parameters': self.segment_parameters
        }
        
        return predictions, scores, info
    
    def get_changepoint_summary(self) -> Dict[str, Any]:
        """
        Get summary of detected changepoints.
        
        Returns:
            Dictionary with changepoint summary
        """
        if not self.is_fitted:
            return {}
        
        summary = {
            'num_changepoints': len(self.changepoints),
            'changepoints': self.changepoints,
            'num_segments': len(self.segment_parameters),
            'segments': self.segment_parameters
        }
        
        return summary
    
    def save(self, filepath: str):
        """Save model to file."""
        model_data = {
            'changepoints': self.changepoints,
            'segment_parameters': self.segment_parameters,
            'prior_lambda': self.prior_lambda,
            'min_segment_length': self.min_segment_length,
            'max_changepoints': self.max_changepoints,
            'is_fitted': self.is_fitted
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load model from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.changepoints = model_data['changepoints']
        self.segment_parameters = model_data['segment_parameters']
        self.prior_lambda = model_data['prior_lambda']
        self.min_segment_length = model_data['min_segment_length']
        self.max_changepoints = model_data['max_changepoints']
        self.is_fitted = model_data['is_fitted']
        
        logger.info(f"Model loaded from {filepath}")

