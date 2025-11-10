"""
Output & Metrics Module for Demand Forecasting (Phase 4)

This module provides:
- Point forecast generation with prediction intervals (80%/95%)
- Nowcast (near real-time demand signal) capabilities
- Demand error/confidence metrics per SKU
- MAPE, sMAPE, MAE, RMSE calculation
- CRPS and pinball loss for probabilistic forecasts
- Service-level impact metrics
"""

from .prediction_intervals import PredictionIntervalGenerator
from .nowcast import NowcastEngine
from .error_metrics import ErrorMetricsCalculator, SKUConfidenceMetrics
from .probabilistic_metrics import ProbabilisticMetricsCalculator
from .service_level_metrics import ServiceLevelMetricsCalculator
from .unified_interface import DemandForecastOutputMetrics

__all__ = [
    'PredictionIntervalGenerator',
    'NowcastEngine',
    'ErrorMetricsCalculator',
    'SKUConfidenceMetrics',
    'ProbabilisticMetricsCalculator',
    'ServiceLevelMetricsCalculator',
    'DemandForecastOutputMetrics'
]

