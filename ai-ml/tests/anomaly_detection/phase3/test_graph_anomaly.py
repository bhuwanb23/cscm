"""
Tests for Graph Anomaly Detector
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

pytestmark = pytest.mark.skipif(not HAS_NETWORKX, reason="NetworkX not available")

from models.anomaly_detection.graph_based.graph_anomaly import GraphAnomalyDetector


class TestGraphAnomalyDetector:
    """Test cases for GraphAnomalyDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = GraphAnomalyDetector(anomaly_threshold=0.5)
        
        assert detector.anomaly_threshold == 0.5
        assert not detector.is_fitted
    
    def test_build_graph(self):
        """Test graph building."""
        detector = GraphAnomalyDetector()
        
        edges = [(0, 1), (1, 2), (2, 3), (3, 0), (1, 3)]
        detector.build_graph(edges)
        
        assert detector.graph is not None
        assert detector.graph.number_of_nodes() == 4
        assert detector.graph.number_of_edges() == 5
    
    def test_compute_node_features(self):
        """Test node feature computation."""
        detector = GraphAnomalyDetector()
        
        edges = [(0, 1), (1, 2), (2, 3), (3, 0), (1, 3)]
        detector.build_graph(edges)
        
        features = detector.compute_node_features()
        
        assert len(features) == 4
        assert all(isinstance(f, np.ndarray) for f in features.values())
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = GraphAnomalyDetector(anomaly_threshold=0.5)
        
        edges = [(0, 1), (1, 2), (2, 3), (3, 0), (1, 3), (4, 5)]
        detector.build_graph(edges)
        
        predictions, scores, info = detector.detect_anomalies(method='statistical')
        
        assert len(predictions) > 0
        assert 'num_anomalies' in info
        assert 'anomaly_rate' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

