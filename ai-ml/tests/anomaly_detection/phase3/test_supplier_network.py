"""
Tests for Supplier Network Detector
"""

import pytest
import pandas as pd
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

from models.anomaly_detection.graph_based.supplier_network import SupplierNetworkDetector


class TestSupplierNetworkDetector:
    """Test cases for SupplierNetworkDetector."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = SupplierNetworkDetector(anomaly_threshold=0.5)
        
        assert detector.anomaly_threshold == 0.5
        assert not detector.is_fitted
    
    def test_build_supplier_network(self):
        """Test supplier network building."""
        detector = SupplierNetworkDetector()
        
        supplier_data = pd.DataFrame({
            'supplier_id': [1, 2, 3],
            'name': ['A', 'B', 'C'],
            'location': ['USA', 'China', 'Germany'],
            'lead_time': [10, 15, 8],
            'reliability': [0.95, 0.90, 0.98],
            'cost': [100.0, 80.0, 120.0],
            'quality_score': [0.92, 0.88, 0.95]
        })
        
        detector.build_supplier_network(supplier_data)
        
        assert detector.supplier_graph is not None
        assert detector.supplier_graph.number_of_nodes() == 3
    
    def test_detect_anomalies(self):
        """Test anomaly detection."""
        detector = SupplierNetworkDetector()
        
        supplier_data = pd.DataFrame({
            'supplier_id': [1, 2, 3, 4, 5],
            'name': ['A', 'B', 'C', 'D', 'E'],
            'location': ['USA', 'China', 'Germany', 'Japan', 'USA'],
            'lead_time': [10, 15, 8, 12, 25],
            'reliability': [0.95, 0.90, 0.98, 0.92, 0.75],
            'cost': [100.0, 80.0, 120.0, 110.0, 60.0],
            'quality_score': [0.92, 0.88, 0.95, 0.90, 0.70]
        })
        
        detector.build_supplier_network(supplier_data)
        predictions, scores, info = detector.detect_anomalies()
        
        assert len(predictions) == 5
        assert 'num_anomalies' in info
    
    def test_get_risk_assessment(self):
        """Test risk assessment."""
        detector = SupplierNetworkDetector()
        
        supplier_data = pd.DataFrame({
            'supplier_id': [1, 2, 3],
            'name': ['A', 'B', 'C'],
            'location': ['USA', 'China', 'Germany'],
            'lead_time': [10, 15, 8],
            'reliability': [0.95, 0.90, 0.98],
            'cost': [100.0, 80.0, 120.0],
            'quality_score': [0.92, 0.88, 0.95]
        })
        
        detector.build_supplier_network(supplier_data)
        predictions, scores, _ = detector.detect_anomalies()
        
        risk_assessments = detector.get_risk_assessment(predictions, scores)
        
        assert len(risk_assessments) == 3
        assert all('risk_level' in assessment for assessment in risk_assessments.values())


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

