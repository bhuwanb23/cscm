"""
Demand Forecast Uncertainty for Risk Assessment

This module provides uncertainty-aware demand forecasting for supply chain
risk assessment, quantifying prediction intervals and probabilistic
forecasts to support inventory and procurement decisions.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandForecastUncertainty:
    """
    Generates probabilistic demand forecasts with calibrated uncertainty
    intervals for supply chain risk assessment and decision support.
    """

    def __init__(self,
                 product_id: str,
                 forecast_horizon: int = 30,
                 confidence_levels: List[float] = None,
                 seasonality_period: int = 7,
                 n_bootstrap: int = 200):
        """
        Initialize the demand forecast uncertainty model.

        Args:
            product_id: Product identifier
            forecast_horizon: Number of periods to forecast
            confidence_levels: Confidence levels for prediction intervals
            seasonality_period: Seasonal cycle length
            n_bootstrap: Number of bootstrap samples for uncertainty estimation
        """
        self.product_id = product_id
        self.forecast_horizon = forecast_horizon
        self.confidence_levels = confidence_levels or [0.50, 0.80, 0.90, 0.95]
        self.seasonality_period = seasonality_period
        self.n_bootstrap = n_bootstrap

        self.history = []
        self.baseline_mean = 0.0
        self.baseline_std = 0.0
        self.seasonal_indices = np.ones(seasonality_period)
        self.trend_coefficient = 0.0
        self.autocorrelation = 0.0
        self.is_fitted = False

    def fit(self, historical_demand: List[float]) -> Dict[str, Any]:
        """
        Fit the uncertainty model to historical demand data.

        Args:
            historical_demand: Historical demand time series

        Returns:
            Dictionary with fitting metrics
        """
        self.history = list(historical_demand)
        data = np.array(self.history)

        if len(data) < self.seasonality_period * 2:
            logger.warning(f"Insufficient data points: {len(data)}")
            self.baseline_mean = float(np.mean(data)) if len(data) > 0 else 0.0
            self.baseline_std = float(np.std(data)) if len(data) > 0 else 0.0
            self.is_fitted = True
            return {'status': 'partial', 'n_observations': len(data)}

        self.baseline_mean = float(np.mean(data))
        self.baseline_std = float(np.std(data))

        for d in range(self.seasonality_period):
            indices = list(range(d, len(data), self.seasonality_period))
            if indices:
                day_mean = np.mean(data[indices])
                self.seasonal_indices[d] = day_mean / self.baseline_mean if self.baseline_mean != 0 else 1.0

        detrended = data.copy()
        x = np.arange(len(data))
        if len(data) > 1:
            seasonal = self._compute_seasonal_component(x)
            self.trend_coefficient = np.polyfit(x, data - seasonal, 1)[0]
            detrended = data - self.trend_coefficient * x

        if len(detrended) > 1:
            lag = np.roll(detrended, 1)
            lag[0] = detrended[0]
            valid = ~np.isnan(lag * detrended)
            if np.sum(valid) > 1:
                self.autocorrelation = float(np.corrcoef(lag[valid], detrended[valid])[0, 1])

        self.is_fitted = True

        residuals = detrended - self._compute_seasonal_component(x)
        rmse = float(np.sqrt(np.mean(residuals ** 2)))

        logger.info(f"DemandForecastUncertainty fitted for {self.product_id}: "
                   f"mean={self.baseline_mean:.1f}, trend={self.trend_coefficient:.3f}, "
                   f"autocorr={self.autocorrelation:.3f}")

        return {
            'status': 'fitted',
            'n_observations': len(data),
            'baseline_mean': self.baseline_mean,
            'baseline_std': self.baseline_std,
            'trend': self.trend_coefficient,
            'autocorrelation': self.autocorrelation,
            'rmse': rmse,
        }

    def _compute_seasonal_component(self, indices: np.ndarray) -> np.ndarray:
        """Compute seasonal component at given indices."""
        return self.baseline_mean * np.array([
            self.seasonal_indices[i % self.seasonality_period]
            for i in indices
        ])

    def forecast(self, horizon: Optional[int] = None) -> Dict[str, np.ndarray]:
        """
        Generate probabilistic forecast with uncertainty intervals.

        Args:
            horizon: Number of periods to forecast (default: self.forecast_horizon)

        Returns:
            Dictionary with point forecast, intervals, and uncertainty metrics
        """
        if horizon is None:
            horizon = self.forecast_horizon

        if not self.is_fitted or len(self.history) == 0:
            return {
                'point_forecast': np.zeros(horizon),
                'intervals': {str(cl): np.zeros((horizon, 2)) for cl in self.confidence_levels},
                'uncertainty': np.zeros(horizon),
            }

        n_past = len(self.history)
        future_indices = np.arange(n_past, n_past + horizon)

        seasonal = self._compute_seasonal_component(future_indices)
        trend = self.trend_coefficient * future_indices
        point_forecast = seasonal + trend

        base_uncertainty = self.baseline_std if self.baseline_std > 0 else 1.0
        uncertainty_growth = 1.0 + 0.05 * np.arange(horizon)
        uncertainty = base_uncertainty * uncertainty_growth

        intervals = {}
        for cl in self.confidence_levels:
            z = np.abs(np.percentile(np.random.randn(10000), (1 - cl) / 2 * 100))
            z = 0.674 if cl == 0.50 else (1.282 if cl == 0.80 else (1.645 if cl == 0.90 else 1.960))
            lower = point_forecast - z * uncertainty
            upper = point_forecast + z * uncertainty
            intervals[str(cl)] = np.column_stack([lower, upper])

        bootstrap_samples = []
        rng = np.random.RandomState(42)
        for _ in range(self.n_bootstrap):
            noise = rng.randn(horizon) * uncertainty
            sample = point_forecast + noise

            if self.autocorrelation != 0:
                for t in range(1, horizon):
                    sample[t] += self.autocorrelation * (sample[t - 1] - point_forecast[t - 1])

            bootstrap_samples.append(sample)

        bootstrap_samples = np.array(bootstrap_samples)
        lower_ci = np.percentile(bootstrap_samples, 2.5, axis=0)
        upper_ci = np.percentile(bootstrap_samples, 97.5, axis=0)

        return {
            'point_forecast': point_forecast,
            'intervals': intervals,
            'uncertainty': uncertainty,
            'bootstrap_ci_lower': lower_ci,
            'bootstrap_ci_upper': upper_ci,
            'prediction_interval': np.column_stack([lower_ci, upper_ci]),
        }

    def assess_risk(self, target_demand: float, horizon: int = 30) -> Dict[str, Any]:
        """
        Assess probability of exceeding a target demand level.

        Args:
            target_demand: Threshold demand value
            horizon: Forecast horizon for assessment

        Returns:
            Dictionary with risk metrics
        """
        fc = self.forecast(horizon)
        point_forecast = fc['point_forecast']
        uncertainty = fc['uncertainty']

        prob_shortfall = np.mean(
            point_forecast - 1.96 * uncertainty < target_demand
        )

        worst_case = np.min(point_forecast - 2.58 * uncertainty)
        expected_case = np.mean(point_forecast)

        return {
            'product_id': self.product_id,
            'target_demand': target_demand,
            'probability_shortfall': float(prob_shortfall),
            'worst_case_forecast': float(worst_case),
            'expected_forecast': float(expected_case),
            'forecast_horizon': horizon,
            'risk_level': 'high' if prob_shortfall > 0.3 else (
                'medium' if prob_shortfall > 0.1 else 'low'
            ),
        }

    def get_uncertainty_summary(self) -> Dict[str, Any]:
        """
        Get summary of uncertainty characteristics.

        Returns:
            Dictionary with uncertainty summary
        """
        return {
            'product_id': self.product_id,
            'baseline_mean': self.baseline_mean,
            'baseline_std': self.baseline_std,
            'cv': self.baseline_std / self.baseline_mean if self.baseline_mean != 0 else 0,
            'trend': self.trend_coefficient,
            'autocorrelation': self.autocorrelation,
            'observations': len(self.history),
            'forecast_horizon': self.forecast_horizon,
            'is_fitted': self.is_fitted,
        }


if __name__ == "__main__":
    np.random.seed(42)
    product = "SKU-DEMAND-001"

    n_days = 180
    base = 200
    history = []
    for day in range(n_days):
        seasonal = 40 * np.sin(2 * np.pi * day / 7)
        trend = 0.3 * day
        noise = np.random.randn() * 30
        demand = base + seasonal + trend + noise
        history.append(max(0, demand))

    model = DemandForecastUncertainty(product_id=product, forecast_horizon=14)
    fit_result = model.fit(history)
    print(f"Fit: mean={fit_result['baseline_mean']:.1f}, trend={fit_result['trend']:.3f}")

    fc = model.forecast()
    print(f"14-day forecast (first 5): {fc['point_forecast'][:5]}")
    print(f"Uncertainty (first 5): {fc['uncertainty'][:5]}")

    risk = model.assess_risk(target_demand=150, horizon=14)
    print(f"Risk: {risk['risk_level']}, prob_shortfall={risk['probability_shortfall']:.3f}")
