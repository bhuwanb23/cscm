"""
Unit tests for customer demand model.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestCustomerDemandForecaster:
    """Tests for customer_demand.model.CustomerDemandForecaster."""

    def test_init(self):
        from customer_demand.model import CustomerDemandForecaster
        model = CustomerDemandForecaster()
        assert model is not None

    def test_fit(self):
        from customer_demand.model import CustomerDemandForecaster
        model = CustomerDemandForecaster()
        historical_data = [
            {'date': '2023-01-01', 'sales': 100 + i * 5, 'store': 'A'}
            for i in range(50)
        ]
        model.fit(historical_data)
        assert model.is_fitted is True

    def test_predict(self):
        from customer_demand.model import CustomerDemandForecaster
        model = CustomerDemandForecaster()
        historical_data = [
            {'value1': float(i), 'value2': float(i * 2), 'value3': float(i * 3)}
            for i in range(50)
        ]
        model.fit(historical_data)
        X = np.random.randn(10, 3)
        preds = model.predict(X)
        # predict returns one value per estimator (50 trees), not per sample
        assert len(preds) == 50
        assert all(isinstance(p, (int, float, np.floating)) for p in preds)
