"""
Unit tests for supplier risk models.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestGradientBoostRiskModel:
    """Tests for supplier_risk.gradient_boosted.risk_predictor.GradientBoostRiskModel."""

    def test_init(self):
        from supplier_risk.gradient_boosted.risk_predictor import GradientBoostRiskModel
        m = GradientBoostRiskModel()
        assert m is not None

    def test_fit_and_predict(self):
        from supplier_risk.gradient_boosted.risk_predictor import GradientBoostRiskModel
        np.random.seed(42)
        m = GradientBoostRiskModel(target_col="event_flag")
        df = pd.DataFrame({
            'lead_time_mean': np.random.uniform(1, 10, 100),
            'lead_time_std': np.random.uniform(0.5, 3, 100),
            'reliability_score': np.random.uniform(0.5, 1.0, 100),
            'financial_score': np.random.uniform(0.3, 1.0, 100),
            'quality_score': np.random.uniform(0.6, 1.0, 100),
            'event_flag': (np.random.uniform(0.5, 1.0, 100) < 0.7).astype(int),
        })
        m.fit(df)
        preds = m.predict_risk(df.head(10))
        assert len(preds) == 10


class TestRiskMetrics:
    """Tests for supplier_risk.metrics_evaluation.risk_metrics."""

    def test_init(self):
        from supplier_risk.metrics_evaluation.risk_metrics import RiskMetricsEvaluator
        calc = RiskMetricsEvaluator()
        assert calc is not None


class TestBackupRecommendation:
    """Tests for supplier_risk.metrics_evaluation.backup_recommendation."""

    def test_init(self):
        from supplier_risk.metrics_evaluation.backup_recommendation import BackupSupplierRecommender
        eng = BackupSupplierRecommender()
        assert eng is not None
