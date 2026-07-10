"""
Unit tests for routing and logistics models.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestTravelTimePredictor:
    """Tests for routing_logistics.predictive_models.travel_time_prediction."""

    def test_init(self):
        from routing_logistics.predictive_models.travel_time_prediction import TravelTimePredictor
        p = TravelTimePredictor()
        assert p is not None

    def test_fit_and_predict(self):
        from routing_logistics.predictive_models.travel_time_prediction import TravelTimePredictor
        np.random.seed(42)
        p = TravelTimePredictor()
        df = pd.DataFrame({
            'distance': np.random.uniform(1, 50, 100).astype(float),
            'hour': np.random.randint(0, 24, 100).astype(float),
            'day_of_week': np.random.randint(0, 7, 100).astype(float),
            'temperature': np.random.normal(70, 10, 100).astype(float),
        })
        y = pd.Series(df['distance'] * 0.02 + np.random.normal(0, 0.1, 100))
        p.train(df, y)
        preds = p.predict(df.head(5))
        assert len(preds) == 5


class TestTimeWindows:
    """Tests for routing_logistics.classical_optimization.time_windows."""

    def test_init(self):
        from routing_logistics.classical_optimization.time_windows import TimeWindowHandler
        tw = TimeWindowHandler()
        assert tw is not None


class TestCVRPTWSolver:
    """Tests for routing_logistics.classical_optimization.cvrptw_solver."""

    def test_init(self):
        from routing_logistics.classical_optimization.cvrptw_solver import CVRPTWSolver
        s = CVRPTWSolver()
        assert s is not None
