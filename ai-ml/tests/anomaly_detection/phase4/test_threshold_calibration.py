"""
Tests for Alert Threshold Calibrator
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.anomaly_detection.deployment.threshold_calibration import AlertThresholdCalibrator


class TestAlertThresholdCalibrator:
    """Test cases for AlertThresholdCalibrator."""
    
    def test_initialization(self):
        """Test calibrator initialization."""
        calibrator = AlertThresholdCalibrator(
            target_precision=0.9,
            target_recall=0.8
        )
        
        assert calibrator.target_precision == 0.9
        assert calibrator.target_recall == 0.8
        assert not calibrator.is_calibrated
    
    def test_calibrate(self):
        """Test threshold calibration."""
        calibrator = AlertThresholdCalibrator(target_precision=0.9)
        
        np.random.seed(42)
        # Generate scores and labels
        scores = np.random.rand(100)
        labels = np.random.choice([-1, 1], size=100, p=[0.1, 0.9])
        
        results = calibrator.calibrate(scores, labels, method='f1')
        
        assert calibrator.is_calibrated
        assert 'optimal_threshold' in results
        assert 'precision' in results
        assert 'recall' in results
    
    def test_apply_threshold(self):
        """Test threshold application."""
        calibrator = AlertThresholdCalibrator()
        
        np.random.seed(42)
        scores = np.random.rand(100)
        labels = np.random.choice([-1, 1], size=100, p=[0.1, 0.9])
        
        calibrator.calibrate(scores, labels)
        predictions = calibrator.apply_threshold(scores)
        
        assert len(predictions) == 100
        assert all(pred in [-1, 1] for pred in predictions)
    
    def test_get_threshold_analysis(self):
        """Test threshold analysis."""
        calibrator = AlertThresholdCalibrator()
        
        np.random.seed(42)
        scores = np.random.rand(100)
        labels = np.random.choice([-1, 1], size=100, p=[0.1, 0.9])
        
        calibrator.calibrate(scores, labels)
        analysis = calibrator.get_threshold_analysis(scores, labels)
        
        assert 'thresholds' in analysis
        assert 'precision' in analysis
        assert 'recall' in analysis


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

