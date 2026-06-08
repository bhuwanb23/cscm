"""
Isolation Forest for Anomaly Detection

Implements Isolation Forest algorithm for detecting anomalies in supply chain data.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging
import pickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IsolationForestDetector:
    """
    Isolation Forest anomaly detector.
    
    Uses tree-based isolation to identify anomalies in high-dimensional data.
    """
    
    def __init__(
        self,
        contamination: float = 0.1,
        n_estimators: int = 100,
        max_samples: Optional[int] = None,
        random_state: Optional[int] = None,
        n_jobs: int = -1
    ):
        """
        Initialize Isolation Forest detector.
        
        Args:
            contamination: Expected proportion of anomalies (0.0 to 0.5)
            n_estimators: Number of trees in the forest
            max_samples: Number of samples to draw for each tree
            random_state: Random seed
            n_jobs: Number of parallel jobs
        """
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state
        self.n_jobs = n_jobs
        
        # Set default max_samples if None
        if max_samples is None:
            max_samples = 'auto'
        
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=n_jobs
        )
        
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
    
    def fit(self, X: np.ndarray, feature_names: Optional[List[str]] = None):
        """
        Fit the Isolation Forest model.
        
        Args:
            X: Training data (n_samples, n_features)
            feature_names: Optional list of feature names
        """
        logger.info(f"Fitting Isolation Forest with {X.shape[0]} samples and {X.shape[1]} features")
        
        # Store feature names
        self.feature_names = feature_names
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit model
        self.model.fit(X_scaled)
        self.is_fitted = True
        
        logger.info("Isolation Forest fitted successfully")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomalies.
        
        Args:
            X: Data to predict (n_samples, n_features)
        
        Returns:
            Array of predictions: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Predict
        predictions = self.model.predict(X_scaled)
        
        return predictions
    
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomaly scores (anomaly probabilities).
        
        Args:
            X: Data to predict (n_samples, n_features)
        
        Returns:
            Array of anomaly scores (lower = more anomalous)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly scores
        scores = self.model.score_samples(X_scaled)
        
        # Convert to probabilities (lower scores = higher anomaly probability)
        # Normalize scores to [0, 1] range
        if scores.max() > scores.min():
            scores_normalized = (scores - scores.min()) / (scores.max() - scores.min() + 1e-8)
            anomaly_probs = 1 - scores_normalized
        else:
            anomaly_probs = np.zeros(len(scores))
        
        return anomaly_probs
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies with detailed information.
        
        Args:
            X: Data to analyze (n_samples, n_features)
            threshold: Optional custom threshold for anomaly scores
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        
        # Get predictions and scores
        predictions = self.predict(X)
        scores = self.model.score_samples(self.scaler.transform(X))
        anomaly_probs = self.predict_proba(X)
        
        # Use threshold if provided
        if threshold is not None:
            anomaly_mask = anomaly_probs >= threshold
            predictions = np.where(anomaly_mask, -1, 1)
        
        # Get anomaly indices
        anomaly_indices = np.where(predictions == -1)[0]
        
        info = {
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(X),
            'anomaly_indices': anomaly_indices.tolist(),
            'scores': scores.tolist(),
            'anomaly_probs': anomaly_probs.tolist(),
            'mean_score': float(np.mean(scores)),
            'std_score': float(np.std(scores))
        }
        
        return predictions, scores, info
    
    def get_feature_importance(self) -> Optional[Dict[str, float]]:
        """
        Get feature importance (if available).
        
        Returns:
            Dictionary of feature names to importance scores
        """
        # Isolation Forest doesn't provide direct feature importance
        # This is a placeholder for future implementation
        return None
    
    def save(self, filepath: str):
        """
        Save model to file.
        
        Args:
            filepath: Path to save model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'contamination': self.contamination,
            'n_estimators': self.n_estimators,
            'max_samples': self.max_samples,
            'random_state': self.random_state,
            'is_fitted': self.is_fitted,
            'feature_names': self.feature_names
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """
        Load model from file.
        
        Args:
            filepath: Path to load model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.contamination = model_data['contamination']
        self.n_estimators = model_data['n_estimators']
        self.max_samples = model_data['max_samples']
        self.random_state = model_data['random_state']
        self.is_fitted = model_data['is_fitted']
        self.feature_names = model_data['feature_names']
        
        logger.info(f"Model loaded from {filepath}")

