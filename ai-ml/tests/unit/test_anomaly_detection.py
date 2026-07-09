"""
Unit tests for anomaly detection models.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestIsolationForest:
    """Tests for anomaly_detection.unsupervised.isolation_forest.IsolationForestDetector."""

    def _make_data(self):
        np.random.seed(42)
        normal = np.random.normal(0, 1, (200, 5))
        anomaly = np.random.uniform(-5, 5, (10, 5))
        return np.vstack([normal, anomaly])

    def test_init(self):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
        det = IsolationForestDetector(contamination=0.05, random_state=42)
        assert det.contamination == 0.05

    def test_fit(self):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
        det = IsolationForestDetector(random_state=42)
        X = self._make_data()
        det.fit(X)
        assert det.is_fitted is True

    def test_predict_labels(self):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
        det = IsolationForestDetector(contamination=0.05, random_state=42)
        X = self._make_data()
        det.fit(X)
        labels = det.predict(X)
        assert len(labels) == len(X)
        assert set(labels).issubset({-1, 1})

    def test_predict_proba(self):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
        det = IsolationForestDetector(random_state=42)
        X = self._make_data()
        det.fit(X)
        proba = det.predict_proba(X)
        assert len(proba) == len(X)
        assert all(0 <= p <= 1 for p in proba)


class TestOneClassSVM:
    """Tests for anomaly_detection.unsupervised.one_class_svm."""

    def test_init_and_predict(self):
        from anomaly_detection.unsupervised.one_class_svm import OneClassSVMDetector
        np.random.seed(42)
        X = np.random.normal(0, 1, (100, 4))
        det = OneClassSVMDetector(nu=0.1)
        det.fit(X)
        labels = det.predict(X)
        assert len(labels) == 100


class TestDBSCAN:
    """Tests for anomaly_detection.unsupervised.dbscan.DBSCANDetector."""

    def test_cluster(self):
        from anomaly_detection.unsupervised.dbscan import DBSCANDetector
        np.random.seed(42)
        X = np.vstack([
            np.random.normal(0, 0.5, (50, 2)),
            np.random.normal(5, 0.5, (50, 2)),
        ])
        det = DBSCANDetector(eps=0.5, min_samples=5)
        det.fit(X)
        labels = det.predict(X)
        assert len(labels) == 100
