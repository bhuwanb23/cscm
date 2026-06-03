"""
Supplier Uncertainty Model for Supply Chain Risk Assessment

This module quantifies uncertainty in supplier performance including
lead time variability, quality consistency, and reliability scoring
using probabilistic methods.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupplierUncertaintyModel:
    """
    Models uncertainty in supplier performance metrics using
    Bayesian updating and bootstrapped confidence intervals.
    """

    def __init__(self,
                 supplier_id: str,
                 prior_reliability: float = 0.9,
                 prior_strength: int = 10):
        self.supplier_id = supplier_id
        self.prior_reliability = prior_reliability
        self.prior_strength = prior_strength

        self.lead_times: List[float] = []
        self.quality_scores: List[float] = []
        self.on_time_deliveries: List[bool] = []
        self.observations: int = 0

    def update(self, lead_time: float, quality_score: float,
               on_time: bool) -> Dict[str, Any]:
        self.lead_times.append(lead_time)
        self.quality_scores.append(quality_score)
        self.on_time_deliveries.append(on_time)
        self.observations += 1

        lt_mean, lt_std = self._estimate_lead_time_uncertainty()
        quality_mean, quality_std = self._estimate_quality_uncertainty()
        reliability_mean, reliability_std = self._estimate_reliability()

        return {
            'supplier_id': self.supplier_id,
            'lead_time_mean': lt_mean,
            'lead_time_std': lt_std,
            'quality_mean': quality_mean,
            'quality_std': quality_std,
            'reliability_mean': reliability_mean,
            'reliability_std': reliability_std,
            'observations': self.observations,
        }

    def _estimate_lead_time_uncertainty(self) -> Tuple[float, float]:
        if len(self.lead_times) < 3:
            return 7.0, 2.0
        mean = float(np.mean(self.lead_times))
        std = float(np.std(self.lead_times))
        return mean, std

    def _estimate_quality_uncertainty(self) -> Tuple[float, float]:
        if len(self.quality_scores) < 3:
            return 0.95, 0.05
        mean = float(np.mean(self.quality_scores))
        std = float(np.std(self.quality_scores))
        return mean, std

    def _estimate_reliability(self) -> Tuple[float, float]:
        n_success = self.prior_strength * self.prior_reliability + sum(self.on_time_deliveries)
        n_total = self.prior_strength + self.observations
        alpha = n_success
        beta = n_total - n_success
        mean = alpha / max(n_total, 1)
        std = np.sqrt(alpha * beta / (n_total ** 2 * (n_total + 1))) if n_total > 0 else 0.1
        return float(mean), float(std)

    def predict_lead_time(self, confidence: float = 0.95) -> Dict[str, Any]:
        from scipy import stats
        mean, std = self._estimate_lead_time_uncertainty()
        z = float(stats.norm.ppf((1 + confidence) / 2))
        return {
            'mean': mean,
            'std': std,
            'lower_bound': mean - z * std,
            'upper_bound': mean + z * std,
            'confidence': confidence,
        }

    def reliability_distribution(self) -> Dict[str, float]:
        mean, std = self._estimate_reliability()
        return {
            'mean_reliability': mean,
            'std_reliability': std,
            'p95_lower': max(0, mean - 1.645 * std),
            'observations': self.observations,
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'supplier_id': self.supplier_id,
            'observations': self.observations,
            'lead_time_samples': len(self.lead_times),
            'quality_samples': len(self.quality_scores),
        }


if __name__ == "__main__":
    np.random.seed(42)
    model = SupplierUncertaintyModel(supplier_id="SUP-001")

    for _ in range(30):
        lt = max(1, np.random.normal(7, 1.5))
        qs = min(1.0, max(0.7, np.random.normal(0.93, 0.04)))
        ot = np.random.random() < 0.92
        result = model.update(lt, qs, ot)

    lt_pred = model.predict_lead_time(confidence=0.95)
    print(f"Lead time: {lt_pred['mean']:.1f} ± {lt_pred['std']:.1f} days")
    rel = model.reliability_distribution()
    print(f"Reliability: {rel['mean_reliability']:.3f} ± {rel['std_reliability']:.3f}")
    print(f"State: {model.get_state()}")
