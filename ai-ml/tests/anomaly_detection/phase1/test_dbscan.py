"""
Tests for DBSCAN Detector
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.anomaly_detection.unsupervised.dbscan import DBSCANDetector


class TestDBSCANDetector:
    """Test cases for DBSCANDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = DBSCANDetector(eps=0.5, min_samples=5)
        
        assert detector.eps == 0.5
        assert detector.min_samples == 5
        assert not detector.is_fitted
    
    def test_fit_and_detect(self):
        """Test fitting and detection."""
        detector = DBSCANDetector(eps=0.5, min_samples=5)
        
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        detector.fit(X)
        predictions, scores, info = detector.detect_anomalies(X)
        
        assert len(predictions) == 100
        assert 'num_outliers' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

