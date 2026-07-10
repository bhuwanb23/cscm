"""
Integration tests for model wrappers.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))


class TestDemandForecastingModelWrapper:
    """Tests for api.models.model_wrappers.DemandForecastingModel."""

    def test_train_and_predict(self):
        from api.models.model_wrappers import DemandForecastingModel
        m = DemandForecastingModel()
        np.random.seed(42)
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=100),
            'sales': np.random.poisson(20, 100).astype(float),
            'is_weekend': np.random.choice([0, 1], 100).astype(float),
        })
        m.train(df)
        preds = m.predict(df.head(10))
        assert len(preds) > 0


class TestAnomalyDetectionModelWrapper:
    """Tests for api.models.model_wrappers.AnomalyDetectionModel."""

    def test_fit_and_detect(self):
        from api.models.model_wrappers import AnomalyDetectionModel
        np.random.seed(42)
        m = AnomalyDetectionModel()
        X = np.random.normal(0, 1, (200, 3))
        m.fit(X)
        result = m.detect_anomalies(X[:10])
        assert len(result) == 3


class TestSupplierRiskModelWrapper:
    """Tests for api.models.model_wrappers.SupplierRiskModel."""

    def test_fit_and_predict(self):
        from api.models.model_wrappers import SupplierRiskModel
        np.random.seed(42)
        m = SupplierRiskModel(target_col="event_flag")
        df = pd.DataFrame({
            'lead_time_mean': np.random.uniform(1, 10, 100),
            'reliability_score': np.random.uniform(0.5, 1.0, 100),
            'financial_score': np.random.uniform(0.3, 1.0, 100),
            'event_flag': np.random.choice([0, 1], 100),
        })
        m.fit(df)
        preds = m.predict_risk(df.head(10))
        assert len(preds) == 10
