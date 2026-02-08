"""
Online Learning Adapter for Continual Learning

This module implements incremental learning from streaming data with mechanisms
to prevent catastrophic forgetting and adapt to concept drift.
"""

import numpy as np
import logging
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OnlineLearningAdapter(ABC):
    """
    Abstract base class for online learning adapters that enable continual learning.
    """
    
    def __init__(self, learning_rate: float = 0.01, memory_size: int = 1000):
        """
        Initialize the online learning adapter.
        
        Args:
            learning_rate: Learning rate for incremental updates
            memory_size: Size of memory buffer for replay mechanisms
        """
        self.learning_rate = learning_rate
        self.memory_size = memory_size
        self.training_step = 0
        
    @abstractmethod
    def update(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """
        Update the model with new batch of data.
        
        Args:
            X_batch: Input features
            y_batch: Target values
            
        Returns:
            Dictionary with update metrics
        """
        pass
    
    @abstractmethod
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions on new data.
        
        Args:
            X: Input features
            
        Returns:
            Predictions
        """
        pass


class SimpleOnlineAdapter(OnlineLearningAdapter):
    """
    Simple implementation of an online learning adapter using incremental gradient descent.
    """
    
    def __init__(self, n_features: int, learning_rate: float = 0.01, memory_size: int = 1000):
        super().__init__(learning_rate, memory_size)
        self.weights = np.random.randn(n_features) * 0.01
        self.bias = 0.0
        self.memory_X = []
        self.memory_y = []
        
    def update(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """
        Perform incremental update using gradient descent.
        """
        batch_size = X_batch.shape[0]
        
        # Make predictions
        y_pred = self.predict(X_batch)
        
        # Calculate gradients
        dw = (1/batch_size) * np.dot(X_batch.T, (y_pred - y_batch))
        db = (1/batch_size) * np.sum(y_pred - y_batch)
        
        # Update weights
        self.weights -= self.learning_rate * dw
        self.bias -= self.learning_rate * db
        
        # Store in memory for replay (simple reservoir sampling)
        for x, y in zip(X_batch, y_batch):
            if len(self.memory_X) < self.memory_size:
                self.memory_X.append(x)
                self.memory_y.append(y)
            else:
                # Replace random element
                idx = np.random.randint(0, self.memory_size)
                self.memory_X[idx] = x
                self.memory_y[idx] = y
        
        self.training_step += 1
        
        mse = np.mean((y_pred - y_batch) ** 2)
        
        return {
            'mse': mse,
            'learning_rate': self.learning_rate,
            'memory_usage': len(self.memory_X),
            'training_step': self.training_step
        }
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using current weights.
        """
        return np.dot(X, self.weights) + self.bias


if __name__ == "__main__":
    # Example usage
    adapter = SimpleOnlineAdapter(n_features=5)
    
    # Simulate streaming data
    for i in range(10):
        X_batch = np.random.randn(32, 5)
        y_batch = np.sum(X_batch, axis=1) + np.random.randn(32) * 0.1
        
        metrics = adapter.update(X_batch, y_batch)
        print(f"Step {i+1}: MSE = {metrics['mse']:.4f}")