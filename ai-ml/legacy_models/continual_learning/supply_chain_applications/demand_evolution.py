"""
Demand Pattern Evolution for Supply Chain Applications

This module tracks and adapts to evolving demand patterns across
the supply chain using continual learning techniques to detect
shifts in customer behavior and market trends.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandPatternEvolution:
    """
    Tracks and adapts to evolving demand patterns in supply chain data.
    Detects seasonal shifts, trend changes, and emerging demand patterns
    using online learning techniques.
    """

    def __init__(self,
                 product_id: str,
                 window_size: int = 90,
                 seasonality_period: int = 7,
                 sensitivity: float = 0.05,
                 n_components: int = 3):
        """
        Initialize the demand pattern evolution tracker.

        Args:
            product_id: Product identifier
            window_size: Rolling window size for pattern analysis (days)
            seasonality_period: Seasonal cycle length (default 7 days)
            sensitivity: Sensitivity to pattern change detection (0-1)
            n_components: Number of seasonal components to track
        """
        self.product_id = product_id
        self.window_size = window_size
        self.seasonality_period = seasonality_period
        self.sensitivity = sensitivity
        self.n_components = n_components

        self.demand_history = deque(maxlen=window_size)
        self.timestamps = deque(maxlen=window_size)

        self.baseline_mean = 0.0
        self.baseline_std = 0.0
        self.seasonal_factors = np.ones(seasonality_period)
        self.trend_slope = 0.0

        self.pattern_shifts = []
        self.current_phase = 'stable'
        self.evolution_score = 0.0

    def update(self, demand: float, timestamp: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Update demand pattern with new observation.

        Args:
            demand: Current demand value
            timestamp: Observation timestamp

        Returns:
            Dictionary with evolution metrics
        """
        if timestamp is None:
            timestamp = datetime.now()

        self.demand_history.append(demand)
        self.timestamps.append(timestamp)

        if len(self.demand_history) >= self.seasonality_period:
            self._update_seasonal_factors()
            self._update_trend()
            evolution = self._detect_evolution()
            self.evolution_score = evolution['evolution_score']
            self.current_phase = evolution['phase']

            if evolution['shift_detected']:
                self.pattern_shifts.append({
                    'timestamp': timestamp.isoformat(),
                    'evolution_score': self.evolution_score,
                    'phase': self.current_phase,
                    'demand': demand,
                })
                logger.info(f"Pattern shift detected for {self.product_id}: "
                           f"score={self.evolution_score:.3f}, phase={self.current_phase}")

        return {
            'product_id': self.product_id,
            'current_demand': demand,
            'baseline_mean': float(self.baseline_mean),
            'trend_slope': float(self.trend_slope),
            'evolution_score': float(self.evolution_score),
            'current_phase': self.current_phase,
            'pattern_shifts_detected': len(self.pattern_shifts),
            'observations': len(self.demand_history),
        }

    def _update_seasonal_factors(self):
        """Update seasonal factors based on recent demand history."""
        data = np.array(self.demand_history)
        if len(data) < self.seasonality_period * 2:
            return

        overall_mean = np.mean(data)
        self.baseline_mean = overall_mean

        for d in range(self.seasonality_period):
            indices = list(range(d, len(data), self.seasonality_period))
            if indices:
                day_mean = np.mean(data[indices])
                self.seasonal_factors[d] = day_mean / overall_mean if overall_mean != 0 else 1.0

        residuals = data - self._compute_seasonal_component(data)
        self.baseline_std = np.std(residuals)

    def _compute_seasonal_component(self, data: np.ndarray) -> np.ndarray:
        """Compute the seasonal component for given data array."""
        result = np.zeros_like(data)
        for i in range(len(data)):
            result[i] = self.baseline_mean * self.seasonal_factors[i % self.seasonality_period]
        return result

    def _update_trend(self):
        """Update trend slope using linear regression on recent data."""
        data = np.array(self.demand_history)
        if len(data) < 14:
            return

        x = np.arange(len(data))
        y = data / (self._compute_seasonal_component(data) + 1e-10)

        n = len(x)
        sx = np.sum(x)
        sy = np.sum(y)
        sxx = np.sum(x * x)
        sxy = np.sum(x * y)

        slope = (n * sxy - sx * sy) / (n * sxx - sx * sx + 1e-10)
        self.trend_slope = slope * (1 - self.sensitivity) + self.trend_slope * self.sensitivity

    def _detect_evolution(self) -> Dict[str, Any]:
        """Detect whether the demand pattern is evolving."""
        data = np.array(self.demand_history)
        if len(data) < 30:
            return {'evolution_score': 0.0, 'phase': 'stable', 'shift_detected': False}

        seasonal = self._compute_seasonal_component(data)
        detrended = data - seasonal - self.trend_slope * np.arange(len(data))

        recent = detrended[-self.seasonality_period:]
        historical = detrended[:-self.seasonality_period]

        recent_std = np.std(recent)
        historical_std = np.std(historical) if len(historical) > 0 else recent_std

        volatility_ratio = recent_std / (historical_std + 1e-10)

        recent_mean = np.mean(recent)
        historical_mean = np.mean(historical) if len(historical) > 0 else recent_mean
        mean_shift = abs(recent_mean - historical_mean) / (self.baseline_std + 1e-10)

        self.evolution_score = 0.6 * volatility_ratio + 0.4 * mean_shift

        if self.evolution_score > 2.0:
            phase = 'high_evolution'
        elif self.evolution_score > 1.3:
            phase = 'moderate_evolution'
        elif self.evolution_score < 0.7:
            phase = 'stable'
        else:
            phase = 'gradual_evolution'

        shift_detected = volatility_ratio > (1.0 + self.sensitivity * 5)

        return {
            'evolution_score': float(self.evolution_score),
            'volatility_ratio': float(volatility_ratio),
            'mean_shift': float(mean_shift),
            'phase': phase,
            'shift_detected': shift_detected,
        }

    def forecast(self, horizon: int = 30) -> np.ndarray:
        """
        Forecast future demand with current pattern.

        Args:
            horizon: Number of days to forecast

        Returns:
            Array of forecasted demand values
        """
        if len(self.demand_history) < self.seasonality_period:
            return np.zeros(horizon)

        forecasts = []
        n_past = len(self.demand_history)
        base = np.mean(self.demand_history[-self.seasonality_period:])

        for i in range(horizon):
            day_idx = (n_past + i) % self.seasonality_period
            seasonal = self.seasonal_factors[day_idx]
            trend = self.trend_slope * (i + 1)
            forecast = base * seasonal + trend
            forecasts.append(max(0, forecast))

        return np.array(forecasts)

    def get_pattern_summary(self) -> Dict[str, Any]:
        """
        Get summary of current demand pattern.

        Returns:
            Dictionary with pattern summary
        """
        return {
            'product_id': self.product_id,
            'current_phase': self.current_phase,
            'evolution_score': float(self.evolution_score),
            'baseline_mean': float(self.baseline_mean),
            'baseline_std': float(self.baseline_std),
            'trend_slope': float(self.trend_slope),
            'seasonal_factors': self.seasonal_factors.tolist(),
            'num_observations': len(self.demand_history),
            'pattern_shifts_detected': len(self.pattern_shifts),
            'window_size': self.window_size,
        }


if __name__ == "__main__":
    np.random.seed(42)
    tracker = DemandPatternEvolution(product_id="SKU-001", window_size=60)

    base_demand = 100.0
    for day in range(90):
        seasonal = 20 * np.sin(2 * np.pi * day / 7)
        trend = 0.1 * day
        noise = np.random.randn() * 10

        if day > 60:
            base_demand = 130.0

        demand = base_demand + seasonal + trend + noise
        timestamp = datetime.now() - timedelta(days=90 - day)
        result = tracker.update(demand, timestamp)

        if (day + 1) % 30 == 0:
            print(f"Day {day+1}: Phase={result['current_phase']}, "
                  f"Score={result['evolution_score']:.3f}, "
                  f"Trend={result['trend_slope']:.3f}")

    forecast = tracker.forecast(14)
    print(f"14-day forecast: {forecast}")
    summary = tracker.get_pattern_summary()
    print(f"Pattern shifts: {summary['pattern_shifts_detected']}")
