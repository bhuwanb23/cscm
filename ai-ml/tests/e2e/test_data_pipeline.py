"""
End-to-end tests for the AI/ML data pipeline.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestDataPipeline:
    """Tests for the full data processing pipeline."""

    def test_load_and_process_sales(self):
        from scripts.data_processing import process_sales_data
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'sales.csv'))
        result = process_sales_data(df)
        assert result is not None
        assert len(result) > 0
        assert 'date' in result.columns

    def test_load_and_process_inventory(self):
        from scripts.data_processing import process_inventory_data
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'inventory.csv'))
        result = process_inventory_data(df)
        assert result is not None
        assert len(result) > 0

    def test_load_config(self):
        from scripts.data_processing import load_config
        config = load_config()
        assert config is not None
        assert 'data' in config


class TestModelTrainingPipeline:
    """Tests for model training with real data."""

    def test_train_demand_forecaster(self):
        from demand_forecasting.model import DemandForecaster
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed', 'processed_sales.csv'))
        m = DemandForecaster()
        m.train(df)
        assert m.is_trained is True
        preds = m.predict(df.head(5))
        assert len(preds) > 0

    def test_train_anomaly_detector(self):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector
        df = pd.read_csv(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'test', 'anomaly_data.csv'))
        X = df[['feature1', 'feature2', 'feature3', 'feature4', 'feature5']].values
        det = IsolationForestDetector(random_state=42)
        det.fit(X)
        labels = det.predict(X[:20])
        assert len(labels) == 20
