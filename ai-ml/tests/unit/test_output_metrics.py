"""
Unit tests for output metrics (service level, unified interface).
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestServiceLevelMetrics:
    """Tests for demand_forecasting.output_metrics.service_level_metrics.ServiceLevelMetricsCalculator."""

    def test_init(self):
        from demand_forecasting.output_metrics.service_level_metrics import ServiceLevelMetricsCalculator
        calc = ServiceLevelMetricsCalculator(target_service_level=0.95)
        assert calc.target_service_level == 0.95

    def test_calculate_service_level(self):
        from demand_forecasting.output_metrics.service_level_metrics import ServiceLevelMetricsCalculator
        calc = ServiceLevelMetricsCalculator()
        dates = pd.date_range('2023-01-01', periods=10)
        forecasts = pd.DataFrame({
            'date': dates, 'sku_id': [1]*10, 'store_id': [1]*10,
            'forecast': np.random.poisson(20, 10)
        })
        actuals = pd.DataFrame({
            'date': dates, 'sku_id': [1]*10, 'store_id': [1]*10,
            'actual': np.random.poisson(20, 10)
        })
        inventory = pd.DataFrame({
            'date': dates, 'sku_id': [1]*10, 'store_id': [1]*10,
            'inventory': np.random.randint(10, 50, 10)
        })
        orders = pd.DataFrame({
            'date': dates, 'sku_id': [1]*10, 'store_id': [1]*10,
            'order_qty': np.random.randint(5, 20, 10)
        })
        result = calc.calculate_service_level_metrics(forecasts, actuals, inventory, orders)
        assert result is not None


class TestUnifiedInterface:
    """Tests for demand_forecasting.output_metrics.unified_interface.DemandForecastOutputMetrics."""

    def test_init(self):
        from demand_forecasting.output_metrics.unified_interface import DemandForecastOutputMetrics
        iface = DemandForecastOutputMetrics()
        assert iface is not None

    def test_calculate_error_metrics(self):
        from demand_forecasting.output_metrics.unified_interface import DemandForecastOutputMetrics
        iface = DemandForecastOutputMetrics()
        y_true = np.array([100, 110, 120])
        y_pred = np.array([105, 108, 118])
        metrics = iface.calculate_error_metrics(y_true, y_pred)
        assert 'mae' in metrics
        assert 'rmse' in metrics
