"""
DBSCAN Clustering for Outlier Identification

Implements DBSCAN algorithm for identifying outliers in data.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import logging
import pickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DBSCANDetector:
    """
    DBSCAN-based outlier detector.
    
    Uses density-based clustering to identify outliers as noise points.
    """
    
    def __init__(
        self,
        eps: float = 0.5,
        min_samples: int = 5,
        metric: str = 'euclidean',
        n_jobs: int = -1
    ):
        """
        Initialize DBSCAN detector.
        
        Args:
            eps: Maximum distance between samples in the same neighborhood
            min_samples: Minimum number of samples in a neighborhood
            metric: Distance metric
            n_jobs: Number of parallel jobs
        """
        self.eps = eps
        self.min_samples = min_samples
        self.metric = metric
        self.n_jobs = n_jobs
        
        self.model = DBSCAN(
            eps=eps,
            min_samples=min_samples,
            metric=metric,
            n_jobs=n_jobs
        )
        
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
    
    def fit(self, X: np.ndarray, feature_names: Optional[List[str]] = None):
        """
        Fit the DBSCAN model.
        
        Args:
            X: Training data (n_samples, n_features)
            feature_names: Optional list of feature names
        """
        logger.info(f"Fitting DBSCAN with {X.shape[0]} samples and {X.shape[1]} features")
        
        # Store feature names
        self.feature_names = feature_names
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit model
        self.model.fit(X_scaled)
        # Store scaled training data for later use in detect_anomalies
        self._training_data_scaled = X_scaled
        self.is_fitted = True
        
        logger.info("DBSCAN fitted successfully")
        logger.info(f"Found {len(set(self.model.labels_)) - (1 if -1 in self.model.labels_ else 0)} clusters")
        logger.info(f"Found {np.sum(self.model.labels_ == -1)} outliers")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict outliers.
        
        Args:
            X: Data to predict (n_samples, n_features)
        
        Returns:
            Array of predictions: 1 for normal, -1 for outlier
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # DBSCAN doesn't have predict method, so we need to refit or use approximate method
        # For efficiency, we'll use a distance-based approach
        from sklearn.neighbors import NearestNeighbors
        
        # Fit nearest neighbors on training data
        nn = NearestNeighbors(n_neighbors=self.min_samples, metric=self.metric, n_jobs=self.n_jobs)
        nn.fit(self.scaler.transform(self.model.components_ if hasattr(self.model, 'components_') else X_scaled))
        
        # Find distances to nearest neighbors
        distances, _ = nn.kneighbors(X_scaled)
        
        # Points with average distance > eps are outliers
        avg_distances = np.mean(distances, axis=1)
        predictions = np.where(avg_distances > self.eps, -1, 1)
        
        return predictions
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect outliers with detailed information.
        
        Args:
            X: Data to analyze (n_samples, n_features)
            threshold: Optional custom threshold for distances
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Use distance-based approach
        from sklearn.neighbors import NearestNeighbors
        
        # Get training data - DBSCAN doesn't have components_, use original scaled training data
        # We need to store the training data during fit
        if not hasattr(self, '_training_data_scaled'):
            # Fallback: use current data
            training_data = X_scaled
        else:
            training_data = self._training_data_scaled
        
        nn = NearestNeighbors(n_neighbors=self.min_samples, metric=self.metric, n_jobs=self.n_jobs)
        nn.fit(training_data)
        
        # Find distances
        distances, _ = nn.kneighbors(X_scaled)
        avg_distances = np.mean(distances, axis=1)
        min_distances = np.min(distances, axis=1)
        
        # Use threshold if provided
        if threshold is not None:
            outlier_mask = avg_distances > threshold
        else:
            outlier_mask = avg_distances > self.eps
        
        predictions = np.where(outlier_mask, -1, 1)
        
        # Get outlier indices
        outlier_indices = np.where(predictions == -1)[0]
        
        # Normalize scores
        scores_normalized = (avg_distances - avg_distances.min()) / (
            avg_distances.max() - avg_distances.min() + 1e-8
        )
        outlier_probs = scores_normalized
        
        info = {
            'num_outliers': len(outlier_indices),
            'outlier_rate': len(outlier_indices) / len(X),
            'outlier_indices': outlier_indices.tolist(),
            'avg_distances': avg_distances.tolist(),
            'min_distances': min_distances.tolist(),
            'outlier_probs': outlier_probs.tolist(),
            'mean_distance': float(np.mean(avg_distances)),
            'std_distance': float(np.std(avg_distances)),
            'num_clusters': len(set(self.model.labels_)) - (1 if -1 in self.model.labels_ else 0)
        }
        
        return predictions, avg_distances, info
    
    def get_cluster_labels(self) -> Optional[np.ndarray]:
        """
        Get cluster labels from training data.
        
        Returns:
            Array of cluster labels (-1 for outliers)
        """
        if not self.is_fitted:
            return None
        
        return self.model.labels_
    
    def save(self, filepath: str):
        """
        Save model to file.
        
        Args:
            filepath: Path to save model
        """
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'eps': self.eps,
            'min_samples': self.min_samples,
            'metric': self.metric,
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
        self.eps = model_data['eps']
        self.min_samples = model_data['min_samples']
        self.metric = model_data['metric']
        self.is_fitted = model_data['is_fitted']
        self.feature_names = model_data['feature_names']
        
        logger.info(f"Model loaded from {filepath}")

