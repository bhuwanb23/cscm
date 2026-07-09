"""
One-Class SVM for Anomaly Detection

Implements One-Class SVM algorithm for detecting anomalies.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import logging
import pickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OneClassSVMDetector:
    """
    One-Class SVM anomaly detector.
    
    Uses support vector machine to learn a decision boundary around normal data.
    """
    
    def __init__(
        self,
        kernel: str = 'rbf',
        nu: float = 0.1,
        gamma: Optional[str] = 'scale',
        degree: int = 3,
        random_state: Optional[int] = None
    ):
        """
        Initialize One-Class SVM detector.
        
        Args:
            kernel: Kernel type ('rbf', 'linear', 'poly', 'sigmoid')
            nu: Upper bound on fraction of outliers (0.0 to 1.0)
            gamma: Kernel coefficient ('scale', 'auto', or float)
            degree: Degree for polynomial kernel
            random_state: Random seed
        """
        self.kernel = kernel
        self.nu = nu
        self.gamma = gamma
        self.degree = degree
        self.random_state = random_state
        
        # OneClassSVM doesn't support random_state in older versions
        model_params = {
            'kernel': kernel,
            'nu': nu,
            'gamma': gamma,
            'degree': degree
        }
        
        # Add random_state only if supported
        try:
            self.model = OneClassSVM(**model_params, random_state=random_state)
        except TypeError:
            self.model = OneClassSVM(**model_params)
        
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
    
    def fit(self, X: np.ndarray, feature_names: Optional[List[str]] = None):
        """
        Fit the One-Class SVM model.
        
        Args:
            X: Training data (n_samples, n_features)
            feature_names: Optional list of feature names
        """
        logger.info(f"Fitting One-Class SVM with {X.shape[0]} samples and {X.shape[1]} features")
        
        # Store feature names
        self.feature_names = feature_names
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit model
        self.model.fit(X_scaled)
        self.is_fitted = True
        
        logger.info("One-Class SVM fitted successfully")
    
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
    
    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """
        Compute decision function scores.
        
        Args:
            X: Data to score (n_samples, n_features)
        
        Returns:
            Array of decision function scores (higher = more normal)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before scoring")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get decision function
        scores = self.model.decision_function(X_scaled)
        
        return scores
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies with detailed information.
        
        Args:
            X: Data to analyze (n_samples, n_features)
            threshold: Optional custom threshold for decision scores
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        
        # Get predictions and scores
        predictions = self.predict(X)
        decision_scores = self.decision_function(X)
        
        # Use threshold if provided
        if threshold is not None:
            anomaly_mask = decision_scores < threshold
            predictions = np.where(anomaly_mask, -1, 1)
        
        # Get anomaly indices
        anomaly_indices = np.where(predictions == -1)[0]
        
        # Convert decision scores to probabilities (normalize)
        scores_normalized = (decision_scores - decision_scores.min()) / (
            decision_scores.max() - decision_scores.min() + 1e-8
        )
        anomaly_probs = 1 - scores_normalized
        
        info = {
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(X),
            'anomaly_indices': anomaly_indices.tolist(),
            'decision_scores': decision_scores.tolist(),
            'anomaly_probs': anomaly_probs.tolist(),
            'mean_score': float(np.mean(decision_scores)),
            'std_score': float(np.std(decision_scores))
        }
        
        return predictions, decision_scores, info
    
    def save(self, filepath: str):
        """
        Save model to file.
        
        Args:
            filepath: Path to save model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'kernel': self.kernel,
            'nu': self.nu,
            'gamma': self.gamma,
            'degree': self.degree,
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
        self.kernel = model_data['kernel']
        self.nu = model_data['nu']
        self.gamma = model_data['gamma']
        self.degree = model_data['degree']
        self.random_state = model_data['random_state']
        self.is_fitted = model_data['is_fitted']
        self.feature_names = model_data['feature_names']
        
        logger.info(f"Model loaded from {filepath}")

