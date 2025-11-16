"""
Tests for Autoencoder Detector
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

from models.anomaly_detection.deep_learning.autoencoder import AutoencoderDetector


class TestAutoencoderDetector:
    """Test cases for AutoencoderDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = AutoencoderDetector(encoding_dim=32, epochs=10)
        
        assert detector.encoding_dim == 32
        assert detector.epochs == 10
        assert not detector.is_fitted
    
    def test_fit(self):
        """Test model fitting."""
        detector = AutoencoderDetector(encoding_dim=16, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        detector.fit(X, validation_split=0.2)
        
        assert detector.is_fitted
        assert detector.reconstruction_threshold is not None
    
    def test_predict(self):
        """Test prediction."""
        detector = AutoencoderDetector(encoding_dim=16, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        detector.fit(X_train, validation_split=0.2)
        predictions = detector.predict(X_test)
        
        assert len(predictions) == 20
        assert all(pred in [-1, 1] for pred in predictions)
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = AutoencoderDetector(encoding_dim=16, epochs=5, batch_size=16)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        detector.fit(X_train, validation_split=0.2)
        predictions, scores, info = detector.detect_anomalies(X_test)
        
        assert len(predictions) == 20
        assert len(scores) == 20
        assert 'num_anomalies' in info
        assert 'reconstruction_errors' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

