"""
Tests for One-Class SVM Detector
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.anomaly_detection.unsupervised.one_class_svm import OneClassSVMDetector


class TestOneClassSVMDetector:
    """Test cases for OneClassSVMDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = OneClassSVMDetector(nu=0.1)
        
        assert detector.nu == 0.1
        assert not detector.is_fitted
    
    def test_fit_and_predict(self):
        """Test fitting and prediction."""
        detector = OneClassSVMDetector(nu=0.1)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        detector.fit(X_train)
        
        # Check if fitted
        assert detector.is_fitted
        
        predictions = detector.predict(X_test)
        
        assert len(predictions) == 20
        assert all(pred in [-1, 1] for pred in predictions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

