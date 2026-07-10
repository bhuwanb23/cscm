"""
Unit tests for demand forecasting models.
Tests the DemandForecaster, statistical models, hybrid models, and output metrics.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


# ---------------------------------------------------------------------------
# DemandForecaster (sklearn-based, always available)
# ---------------------------------------------------------------------------
class TestDemandForecaster:
    """Tests for models.demand_forecasting.model.DemandForecaster."""

    def _make_df(self, n=200):
        np.random.seed(42)
        dates = pd.date_range('2023-01-01', periods=n, freq='D')
        return pd.DataFrame({
            'date': dates,
            'sales_quantity': np.random.poisson(20, n),
            'is_weekend': [1 if d.weekday() >= 5 else 0 for d in dates],
            'month': dates.month,
            'temperature': np.random.normal(60, 10, n),
        })

    def test_init_defaults(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        assert m.model_type == 'random_forest'
        assert m.is_trained is False

    def test_detect_target_sales_quantity(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        assert m._detect_target(df) == 'sales_quantity'

    def test_detect_target_sales_amount(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = pd.DataFrame({'date': [], 'sales_amount': []})
        assert m._detect_target(df) == 'sales_amount'

    def test_select_features(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        features = m._select_features(df, 'sales_quantity')
        assert 'date' not in features
        assert 'sales_quantity' not in features
        assert len(features) > 0

    def test_train(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        m.train(df)
        assert m.is_trained is True

    def test_predict(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        m.train(df)
        preds = m.predict(df.head(10))
        assert len(preds) > 0

    def test_evaluate(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        m.train(df)
        true_vals = df['sales_quantity'].values[:10]
        metrics = m.evaluate(df.head(10), true_vals)
        assert 'mae' in metrics
        assert 'rmse' in metrics
        assert metrics['mae'] >= 0
        assert metrics['rmse'] >= 0

    def test_forecast(self):
        from demand_forecasting.model import DemandForecaster
        m = DemandForecaster()
        df = self._make_df()
        m.train(df)
        future_dates = pd.date_range('2023-07-01', periods=7, freq='D')
        fc = m.forecast(future_dates)
        assert len(fc) == 7


# ---------------------------------------------------------------------------
# Error Metrics
# ---------------------------------------------------------------------------
class TestErrorMetrics:
    """Tests for demand_forecasting.output_metrics.error_metrics."""

    def test_mae(self):
        from demand_forecasting.output_metrics.error_metrics import ErrorMetricsCalculator
        calc = ErrorMetricsCalculator()
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        mae = calc.mae(y_true, y_pred)
        assert abs(mae - 3.0) < 0.1

    def test_rmse(self):
        from demand_forecasting.output_metrics.error_metrics import ErrorMetricsCalculator
        calc = ErrorMetricsCalculator()
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        rmse = calc.rmse(y_true, y_pred)
        mae = calc.mae(y_true, y_pred)
        assert rmse >= mae

    def test_mape(self):
        from demand_forecasting.output_metrics.error_metrics import ErrorMetricsCalculator
        calc = ErrorMetricsCalculator()
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        mape = calc.mape(y_true, y_pred)
        assert 0 <= mape < 100

    def test_smape(self):
        from demand_forecasting.output_metrics.error_metrics import ErrorMetricsCalculator
        calc = ErrorMetricsCalculator()
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        smape = calc.smape(y_true, y_pred)
        assert 0 <= smape < 100

    def test_calculate_all_metrics(self):
        from demand_forecasting.output_metrics.error_metrics import ErrorMetricsCalculator
        calc = ErrorMetricsCalculator()
        y_true = np.array([100, 110, 120, 130, 140])
        y_pred = np.array([105, 108, 118, 132, 138])
        y_train = np.array([90, 95, 100, 105, 110, 115, 120])
        metrics = calc.calculate_all_metrics(y_true, y_pred, y_train)
        for key in ['mae', 'rmse', 'mape', 'smape', 'mase']:
            assert key in metrics


# ---------------------------------------------------------------------------
# Probabilistic Metrics
# ---------------------------------------------------------------------------
class TestProbabilisticMetrics:
    """Tests for demand_forecasting.output_metrics.probabilistic_metrics."""

    def test_pinball_loss(self):
        from demand_forecasting.output_metrics.probabilistic_metrics import ProbabilisticMetricsCalculator
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        loss = ProbabilisticMetricsCalculator.pinball_loss(y_true, y_pred, quantile=0.5)
        assert loss >= 0

    def test_crps_from_samples(self):
        from demand_forecasting.output_metrics.probabilistic_metrics import ProbabilisticMetricsCalculator
        y_true = np.array([100.0, 110.0, 120.0])
        samples = np.random.normal(110, 10, (3, 100))
        crps = ProbabilisticMetricsCalculator.crps_from_samples(y_true, samples)
        assert crps >= 0


# ---------------------------------------------------------------------------
# Prediction Intervals
# ---------------------------------------------------------------------------
class TestPredictionIntervals:
    """Tests for demand_forecasting.output_metrics.prediction_intervals."""

    def test_init(self):
        from demand_forecasting.output_metrics.prediction_intervals import PredictionIntervalGenerator
        gen = PredictionIntervalGenerator(method='quantile')
        assert gen is not None

    def test_generate_from_samples(self):
        from demand_forecasting.output_metrics.prediction_intervals import PredictionIntervalGenerator
        gen = PredictionIntervalGenerator(method='quantile')
        samples = np.random.normal(100, 10, (200, 5))
        intervals = gen.generate_intervals_from_samples(samples, confidence_levels=[0.8, 0.95])
        assert 'lower_80' in intervals
        assert 'upper_80' in intervals
        assert 'lower_95' in intervals
        assert 'upper_95' in intervals


# ---------------------------------------------------------------------------
# Nowcast
# ---------------------------------------------------------------------------
class TestNowcast:
    """Tests for demand_forecasting.output_metrics.nowcast."""

    def test_nowcast_engine_init(self):
        from demand_forecasting.output_metrics.nowcast import NowcastEngine
        engine = NowcastEngine()
        assert engine is not None

    def test_nowcast_engine_params(self):
        from demand_forecasting.output_metrics.nowcast import NowcastEngine
        engine = NowcastEngine(update_frequency_minutes=30, lookback_hours=12)
        assert engine.update_frequency_minutes == 30
