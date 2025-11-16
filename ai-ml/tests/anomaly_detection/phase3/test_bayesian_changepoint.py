"""
Tests for Bayesian Changepoint Detector
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.anomaly_detection.graph_based.bayesian_changepoint import BayesianChangepointDetector


class TestBayesianChangepointDetector:
    """Test cases for BayesianChangepointDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = BayesianChangepointDetector(prior_lambda=1.0, min_segment_length=5)
        
        assert detector.prior_lambda == 1.0
        assert detector.min_segment_length == 5
        assert not detector.is_fitted
    
    def test_fit(self):
        """Test model fitting."""
        detector = BayesianChangepointDetector(min_segment_length=5)
        
        # Create data with changepoint
        np.random.seed(42)
        data = np.concatenate([
            np.random.normal(0, 1, 50),
            np.random.normal(5, 1, 50)
        ])
        
        detector.fit(data)
        
        assert detector.is_fitted
        assert len(detector.changepoints) >= 0
        assert len(detector.segment_parameters) > 0
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = BayesianChangepointDetector(min_segment_length=5)
        
        # Create data with changepoint
        np.random.seed(42)
        data = np.concatenate([
            np.random.normal(0, 1, 50),
            np.random.normal(5, 1, 50)
        ])
        
        predictions, scores, info = detector.detect_anomalies(data)
        
        assert len(predictions) == len(data)
        assert len(scores) == len(data)
        assert 'num_anomalies' in info
        assert 'num_changepoints' in info
    
    def test_get_changepoint_summary(self):
        """Test changepoint summary."""
        detector = BayesianChangepointDetector(min_segment_length=5)
        
        np.random.seed(42)
        data = np.concatenate([
            np.random.normal(0, 1, 50),
            np.random.normal(5, 1, 50)
        ])
        
        detector.fit(data)
        summary = detector.get_changepoint_summary()
        
        assert 'num_changepoints' in summary
        assert 'segments' in summary


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

