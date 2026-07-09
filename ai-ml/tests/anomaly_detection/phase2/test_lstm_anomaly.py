"""
Tests for LSTM Anomaly Detector
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

pytestmark = pytest.mark.skipif(not HAS_TORCH, reason="PyTorch not available")

from legacy_models.anomaly_detection.deep_learning.lstm_anomaly import LSTMAnomalyDetector


class TestLSTMAnomalyDetector:
    """Test cases for LSTMAnomalyDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = LSTMAnomalyDetector(sequence_length=10, epochs=10)
        
        assert detector.sequence_length == 10
        assert detector.epochs == 10
        assert not detector.is_fitted
    
    def test_fit(self):
        """Test model fitting."""
        detector = LSTMAnomalyDetector(sequence_length=5, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        detector.fit(X, validation_split=0.2)
        
        assert detector.is_fitted
        assert detector.anomaly_threshold is not None
    
    def test_predict(self):
        """Test prediction."""
        detector = LSTMAnomalyDetector(sequence_length=5, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(30, 5)
        
        detector.fit(X_train, validation_split=0.2)
        predictions = detector.predict(X_test)
        
        assert len(predictions) == len(X_test)
        assert all(pred in [-1, 1] for pred in predictions)
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = LSTMAnomalyDetector(sequence_length=5, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(30, 5)
        
        detector.fit(X_train, validation_split=0.2)
        predictions, scores, info = detector.detect_anomalies(X_test)
        
        assert len(predictions) == len(X_test)
        assert 'num_anomalies' in info
        assert 'prediction_errors' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

