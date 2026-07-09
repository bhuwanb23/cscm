"""
Tests for Isolation Forest Detector
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector


class TestIsolationForestDetector:
    """Test cases for IsolationForestDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = IsolationForestDetector(contamination=0.1)
        
        assert detector.contamination == 0.1
        assert not detector.is_fitted
    
    def test_fit(self):
        """Test model fitting."""
        detector = IsolationForestDetector(contamination=0.1)
        
        # Generate sample data
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        detector.fit(X)
        
        assert detector.is_fitted
    
    def test_predict(self):
        """Test prediction."""
        detector = IsolationForestDetector(contamination=0.1)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        detector.fit(X_train)
        predictions = detector.predict(X_test)
        
        assert len(predictions) == 20
        assert all(pred in [-1, 1] for pred in predictions)
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = IsolationForestDetector(contamination=0.1)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        detector.fit(X_train)
        predictions, scores, info = detector.detect_anomalies(X_test)
        
        assert len(predictions) == 20
        assert len(scores) == 20
        assert 'num_anomalies' in info
        assert 'anomaly_rate' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

