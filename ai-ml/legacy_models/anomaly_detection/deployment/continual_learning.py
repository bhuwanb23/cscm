"""
Continual Learning for Anomaly Models

Implements continual learning capabilities for anomaly detection models.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Callable
import logging
from collections import deque
import pickle
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ContinualLearningAnomaly:
    """
    Continual learning system for anomaly detection models.
    
    Supports incremental learning and model adaptation.
    """
    
    def __init__(
        self,
        base_detector: Any,
        learning_rate: float = 0.1,
        memory_size: int = 1000,
        adaptation_threshold: float = 0.1,
        retrain_frequency: int = 100
    ):
        """
        Initialize continual learning system.
        
        Args:
            base_detector: Base anomaly detector
            learning_rate: Learning rate for adaptation
            memory_size: Size of memory buffer
            adaptation_threshold: Threshold for triggering adaptation
            retrain_frequency: Frequency of full retraining
        """
        self.base_detector = base_detector
        self.learning_rate = learning_rate
        self.memory_size = memory_size
        self.adaptation_threshold = adaptation_threshold
        self.retrain_frequency = retrain_frequency
        
        # Memory buffer
        self.memory_buffer = deque(maxlen=memory_size)
        self.memory_labels = deque(maxlen=memory_size)
        
        # Statistics
        self.num_updates = 0
        self.num_retrains = 0
        self.performance_history: List[Dict[str, float]] = []
        
        # Model state
        self.is_initialized = False
    
    def initialize(self, X: np.ndarray):
        """
        Initialize the model with initial data.
        
        Args:
            X: Initial training data
        """
        logger.info(f"Initializing continual learning with {len(X)} samples")
        
        # Fit base detector
        if hasattr(self.base_detector, 'fit'):
            self.base_detector.fit(X)
        
        # Add to memory
        for sample in X:
            self.memory_buffer.append(sample)
        
        self.is_initialized = True
        logger.info("Continual learning initialized")
    
    def update(
        self,
        X_new: np.ndarray,
        labels: Optional[np.ndarray] = None,
        feedback: Optional[Dict[int, bool]] = None
    ):
        """
        Update model with new data.
        
        Args:
            X_new: New data samples
            labels: Optional true labels
            feedback: Optional feedback dictionary {index: is_anomaly}
        """
        if not self.is_initialized:
            raise ValueError("Model must be initialized before update")
        
        logger.info(f"Updating model with {len(X_new)} new samples")
        
        # Get predictions
        if hasattr(self.base_detector, 'predict'):
            predictions = self.base_detector.predict(X_new)
        else:
            predictions = np.ones(len(X_new))
        
        # Process feedback
        if feedback is not None:
            # Update based on feedback
            for idx, is_anomaly in feedback.items():
                if idx < len(X_new):
                    # Add to memory with correct label
                    self.memory_buffer.append(X_new[idx])
                    self.memory_labels.append(1 if is_anomaly else -1)
        
        # Add new samples to memory
        for sample in X_new:
            self.memory_buffer.append(sample)
        
        # Check if retraining is needed
        self.num_updates += len(X_new)
        
        if self.num_updates >= self.retrain_frequency:
            self._retrain()
        else:
            self._adapt(X_new, predictions)
    
    def _adapt(self, X_new: np.ndarray, predictions: np.ndarray):
        """
        Adapt model incrementally using partial_fit or memory-buffer gradient update.
        
        Args:
            X_new: New data
            predictions: Current predictions
        """
        if hasattr(self.base_detector, 'partial_fit'):
            try:
                y_scores = np.where(predictions < 0, -1, 1)
                self.base_detector.partial_fit(X_new, y_scores)
                logger.debug(f"Partial fit with {len(X_new)} samples")
                return
            except Exception as e:
                logger.warning(f"partial_fit failed: {e}")

        if hasattr(self.base_detector, 'warm_start') and hasattr(self.base_detector, 'fit'):
            try:
                memory_X = np.array(list(self.memory_buffer))
                memory_y = np.array(list(self.memory_labels)) if self.memory_labels else None
                if len(memory_X) >= X_new.shape[1] * 2:
                    if memory_y is not None and len(memory_y) == len(memory_X):
                        self.base_detector.warm_start = True
                        self.base_detector.fit(memory_X, memory_y)
                    else:
                        self.base_detector.warm_start = True
                        self.base_detector.fit(memory_X)
                    logger.debug(f"Warm-start fit with {len(memory_X)} samples")
                    return
            except Exception as e:
                logger.warning(f"warm_start fit failed: {e}")

        anomaly_ratio = float(np.mean(predictions < -0.5) if len(predictions) > 0 else 0)
        if hasattr(self.base_detector, 'contamination'):
            old = self.base_detector.contamination
            adapted = 0.5 * old + 0.5 * max(anomaly_ratio, 0.01)
            self.base_detector.contamination = min(adapted, 0.5)
            logger.debug(f"Adapted contamination: {old:.4f} -> {self.base_detector.contamination:.4f}")
        if hasattr(self.base_detector, 'threshold'):
            old = self.base_detector.threshold
            new_thresh = 0.9 * old + 0.1 * float(np.percentile(abs(predictions), 95)) if len(predictions) > 0 else old
            self.base_detector.threshold = min(new_thresh, 1.0)
            logger.debug(f"Adapted threshold: {old:.4f} -> {self.base_detector.threshold:.4f}")

        logger.debug(f"Adapted model with {len(X_new)} samples (anomaly_ratio={anomaly_ratio:.3f})")
    
    def _retrain(self):
        """Retrain model on memory buffer."""
        logger.info("Retraining model on memory buffer")
        
        if len(self.memory_buffer) == 0:
            return
        
        # Convert memory to array
        X_memory = np.array(list(self.memory_buffer))
        
        # Retrain base detector
        if hasattr(self.base_detector, 'fit'):
            self.base_detector.fit(X_memory)
        
        self.num_retrains += 1
        self.num_updates = 0
        
        logger.info(f"Model retrained (retrain #{self.num_retrains})")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomalies.
        
        Args:
            X: Data to predict
        
        Returns:
            Predictions
        """
        if not self.is_initialized:
            raise ValueError("Model must be initialized before prediction")
        
        if hasattr(self.base_detector, 'predict'):
            return self.base_detector.predict(X)
        else:
            return np.ones(len(X))
    
    def detect_anomalies(
        self,
        X: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies with detailed information.
        
        Args:
            X: Data to analyze
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_initialized:
            raise ValueError("Model must be initialized before detection")
        
        if hasattr(self.base_detector, 'detect_anomalies'):
            return self.base_detector.detect_anomalies(X)
        else:
            predictions = self.predict(X)
            scores = np.zeros(len(X))
            info = {
                'num_anomalies': np.sum(predictions == -1),
                'anomaly_rate': np.sum(predictions == -1) / len(X)
            }
            return predictions, scores, info
    
    def evaluate_performance(
        self,
        X: np.ndarray,
        y_true: np.ndarray
    ) -> Dict[str, float]:
        """
        Evaluate model performance.
        
        Args:
            X: Test data
            y_true: True labels
        
        Returns:
            Performance metrics
        """
        if not self.is_initialized:
            raise ValueError("Model must be initialized before evaluation")
        
        predictions = self.predict(X)
        
        # Convert to binary
        y_pred_binary = (predictions == -1).astype(int)
        y_true_binary = (y_true == -1).astype(int)
        
        # Compute metrics
        from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
        
        accuracy = accuracy_score(y_true_binary, y_pred_binary)
        precision = precision_score(y_true_binary, y_pred_binary, zero_division=0)
        recall = recall_score(y_true_binary, y_pred_binary, zero_division=0)
        f1 = f1_score(y_true_binary, y_pred_binary, zero_division=0)
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1
        }
        
        # Store in history
        self.performance_history.append({
            'timestamp': datetime.now().isoformat(),
            **metrics
        })
        
        return metrics
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get learning statistics.
        
        Returns:
            Dictionary of statistics
        """
        return {
            'num_updates': self.num_updates,
            'num_retrains': self.num_retrains,
            'memory_size': len(self.memory_buffer),
            'is_initialized': self.is_initialized,
            'performance_history': self.performance_history[-10:]  # Last 10 evaluations
        }
    
    def save(self, filepath: str):
        """Save model to file."""
        model_data = {
            'base_detector': self.base_detector,
            'memory_buffer': list(self.memory_buffer),
            'memory_labels': list(self.memory_labels),
            'num_updates': self.num_updates,
            'num_retrains': self.num_retrains,
            'performance_history': self.performance_history,
            'is_initialized': self.is_initialized
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load model from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.base_detector = model_data['base_detector']
        self.memory_buffer = deque(model_data['memory_buffer'], maxlen=self.memory_size)
        self.memory_labels = deque(model_data['memory_labels'], maxlen=self.memory_size)
        self.num_updates = model_data['num_updates']
        self.num_retrains = model_data['num_retrains']
        self.performance_history = model_data['performance_history']
        self.is_initialized = model_data['is_initialized']
        
        logger.info(f"Model loaded from {filepath}")

