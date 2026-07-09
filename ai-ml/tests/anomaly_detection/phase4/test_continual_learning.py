"""
Tests for Continual Learning Anomaly
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
from legacy_models.anomaly_detection.deployment.continual_learning import ContinualLearningAnomaly


class TestContinualLearningAnomaly:
    """Test cases for ContinualLearningAnomaly."""
    
    def test_initialization(self):
        """Test system initialization."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector)
        
        assert cl_system.base_detector == base_detector
        assert not cl_system.is_initialized
    
    def test_initialize(self):
        """Test system initialization with data."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector)
        
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        cl_system.initialize(X)
        
        assert cl_system.is_initialized
        assert len(cl_system.memory_buffer) > 0
    
    def test_update(self):
        """Test model update."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector, retrain_frequency=50)
        
        np.random.seed(42)
        X_initial = np.random.randn(100, 5)
        X_new = np.random.randn(20, 5)
        
        cl_system.initialize(X_initial)
        cl_system.update(X_new)
        
        assert cl_system.num_updates > 0
    
    def test_predict(self):
        """Test prediction."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        cl_system.initialize(X_train)
        predictions = cl_system.predict(X_test)
        
        assert len(predictions) == 20
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector)
        
        np.random.seed(42)
        X_train = np.random.randn(100, 5)
        X_test = np.random.randn(20, 5)
        
        cl_system.initialize(X_train)
        predictions, scores, info = cl_system.detect_anomalies(X_test)
        
        assert len(predictions) == 20
        assert 'num_anomalies' in info
    
    def test_get_statistics(self):
        """Test statistics retrieval."""
        base_detector = IsolationForestDetector(contamination=0.1)
        cl_system = ContinualLearningAnomaly(base_detector)
        
        np.random.seed(42)
        X = np.random.randn(100, 5)
        
        cl_system.initialize(X)
        stats = cl_system.get_statistics()
        
        assert 'num_updates' in stats
        assert 'is_initialized' in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

