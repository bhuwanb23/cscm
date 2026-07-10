"""
Unit tests for model monitoring components.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestPerformanceTracker:
    """Tests for model_monitoring.model_monitoring.performance_tracker.PerformanceTracker."""

    def test_init(self):
        from model_monitoring.model_monitoring.performance_tracker import PerformanceTracker
        t = PerformanceTracker(model_id="test_model")
        assert t.model_id == "test_model"

    def test_record_predictions(self):
        from model_monitoring.model_monitoring.performance_tracker import PerformanceTracker
        t = PerformanceTracker(model_id="test_model", warmup_period=5)
        for i in range(10):
            t.update(y_true=np.random.normal(100, 5), y_pred=np.random.normal(100, 5))
        assert t.total_predictions == 10

    def test_get_metrics(self):
        from model_monitoring.model_monitoring.performance_tracker import PerformanceTracker
        t = PerformanceTracker(model_id="test_model", warmup_period=5)
        for i in range(10):
            t.update(y_true=np.random.normal(100, 5), y_pred=np.random.normal(100, 5))
        metrics = t.get_performance_summary()
        assert metrics is not None


class TestPredictionDrift:
    """Tests for model_monitoring.model_monitoring.prediction_drift."""

    def test_init(self):
        from model_monitoring.model_monitoring.prediction_drift import PredictionDriftDetector
        d = PredictionDriftDetector(model_id="test_model")
        assert d is not None


class TestADWINDetector:
    """Tests for model_monitoring.model_monitoring.adwin_detector."""

    def test_init(self):
        from model_monitoring.model_monitoring.adwin_detector import ADWINDetector
        d = ADWINDetector()
        assert d is not None

    def test_update(self):
        from model_monitoring.model_monitoring.adwin_detector import ADWINDetector
        d = ADWINDetector()
        for i in range(50):
            d.update(np.random.normal(0, 1))
        assert d.get_mean() is not None


class TestAlertManager:
    """Tests for model_monitoring.alerting_system.alert_manager."""

    def test_init(self):
        from model_monitoring.alerting_system.alert_manager import AlertManager
        m = AlertManager()
        assert m is not None
