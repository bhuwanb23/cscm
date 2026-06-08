"""
Confidence Interval Estimation for Uncertainty Quantification

This module provides bootstrap-based and analytical confidence interval
estimation for supply chain metrics including demand forecasts,
cost estimates, and performance measures.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfidenceIntervalEstimator:
    """
    Estimates confidence intervals using bootstrap resampling and
    analytical methods for supply chain uncertainty quantification.
    """

    def __init__(self,
                 n_bootstrap: int = 1000,
                 confidence_level: float = 0.95,
                 method: str = 'bootstrap_percentile',
                 random_state: int = 42):
        self.n_bootstrap = n_bootstrap
        self.confidence_level = confidence_level
        self.method = method
        self.rng = np.random.RandomState(random_state)

    def bootstrap_ci(self, data: np.ndarray,
                     statistic_fn: Optional[Callable] = None) -> Dict[str, Any]:
        n = len(data)
        if statistic_fn is None:
            statistic_fn = np.mean

        original_stat = float(statistic_fn(data))
        bootstrap_stats = np.zeros(self.n_bootstrap)

        for i in range(self.n_bootstrap):
            indices = self.rng.randint(0, n, size=n)
            bootstrap_stats[i] = statistic_fn(data[indices])

        alpha = (1 - self.confidence_level) / 2
        lower = float(np.percentile(bootstrap_stats, alpha * 100))
        upper = float(np.percentile(bootstrap_stats, (1 - alpha) * 100))
        bias = float(np.mean(bootstrap_stats) - original_stat)
        se = float(np.std(bootstrap_stats))

        return {
            'original_statistic': original_stat,
            'bootstrap_mean': float(np.mean(bootstrap_stats)),
            'standard_error': se,
            'bias': bias,
            'lower_bound': lower,
            'upper_bound': upper,
            'confidence_level': self.confidence_level,
            'n_bootstrap': self.n_bootstrap,
            'method': self.method,
        }

    def normal_ci(self, mean: float, std: float, n: int) -> Dict[str, Any]:
        from scipy import stats
        alpha = (1 - self.confidence_level) / 2
        z = float(stats.norm.ppf(1 - alpha))
        se = std / np.sqrt(n)
        return {
            'mean': mean,
            'standard_error': se,
            'lower_bound': mean - z * se,
            'upper_bound': mean + z * se,
            'confidence_level': self.confidence_level,
            'method': 'normal_approximation',
        }

    def bootstrap_difference(self, data_a: np.ndarray,
                              data_b: np.ndarray) -> Dict[str, Any]:
        mean_a = np.mean(data_a)
        mean_b = np.mean(data_b)
        obs_diff = float(mean_a - mean_b)

        combined = np.concatenate([data_a, data_b])
        n_a, n_b = len(data_a), len(data_b)
        bootstrap_diffs = np.zeros(self.n_bootstrap)

        for i in range(self.n_bootstrap):
            idx_a = self.rng.randint(0, len(combined), size=n_a)
            idx_b = self.rng.randint(0, len(combined), size=n_b)
            bootstrap_diffs[i] = np.mean(combined[idx_a]) - np.mean(combined[idx_b])

        alpha = (1 - self.confidence_level) / 2
        lower = float(np.percentile(bootstrap_diffs, alpha * 100))
        upper = float(np.percentile(bootstrap_diffs, (1 - alpha) * 100))
        p_value = float(2 * min(np.mean(bootstrap_diffs >= 0), np.mean(bootstrap_diffs <= 0)))

        return {
            'observed_difference': obs_diff,
            'lower_bound': lower,
            'upper_bound': upper,
            'p_value': p_value,
            'significant': p_value < (1 - self.confidence_level),
            'confidence_level': self.confidence_level,
            'method': 'bootstrap_difference',
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_bootstrap': self.n_bootstrap,
            'confidence_level': self.confidence_level,
            'method': self.method,
        }


if __name__ == "__main__":
    np.random.seed(42)
    estimator = ConfidenceIntervalEstimator(n_bootstrap=2000)

    data = np.random.normal(100, 15, 50)
    ci = estimator.bootstrap_ci(data)
    print(f"Mean: {ci['original_statistic']:.2f}, 95% CI: [{ci['lower_bound']:.2f}, {ci['upper_bound']:.2f}]")

    data_a = np.random.normal(100, 15, 30)
    data_b = np.random.normal(95, 15, 30)
    diff = estimator.bootstrap_difference(data_a, data_b)
    print(f"Difference: {diff['observed_difference']:.2f}, p={diff['p_value']:.4f}, significant={diff['significant']}")
