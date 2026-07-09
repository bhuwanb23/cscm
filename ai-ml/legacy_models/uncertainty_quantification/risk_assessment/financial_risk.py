"""
Financial Risk Propagator for Supply Chain Risk Assessment

This module propagates cost and price uncertainties through supply
chain financial models to quantify margin risk, cost volatility,
and expected financial outcomes.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FinancialRiskPropagator:
    """
    Propagates financial uncertainties through cost and revenue models
    to quantify margin risk, expected costs, and value-at-risk metrics.
    """

    def __init__(self,
                 n_simulations: int = 10000,
                 confidence_level: float = 0.95,
                 random_state: int = 42):
        self.n_simulations = n_simulations
        self.confidence_level = confidence_level
        self.rng = np.random.RandomState(random_state)
        self.simulation_history: List[Dict[str, Any]] = []

    def simulate_cost(self,
                      base_cost: float,
                      cost_std: float,
                      volume: float,
                      volume_std: float,
                      fixed_cost: float = 0.0) -> Dict[str, Any]:
        cost_samples = self.rng.normal(base_cost, cost_std, self.n_simulations)
        cost_samples = np.maximum(cost_samples, base_cost * 0.5)

        volume_samples = self.rng.normal(volume, volume_std, self.n_simulations)
        volume_samples = np.maximum(volume_samples, 0)

        total_cost = cost_samples * volume_samples + fixed_cost

        result = self._summarize_distribution(total_cost, 'total_cost')
        result.update({
            'unit_cost_mean': float(base_cost),
            'unit_cost_std': float(cost_std),
            'volume_mean': float(volume),
            'volume_std': float(volume_std),
            'fixed_cost': float(fixed_cost),
        })
        self.simulation_history.append(result)
        return result

    def simulate_margin(self,
                        revenue: float,
                        revenue_std: float,
                        cost: float,
                        cost_std: float,
                        correlation: float = 0.0) -> Dict[str, Any]:
        mean = np.array([revenue, cost])
        cov = np.array([
            [revenue_std ** 2, correlation * revenue_std * cost_std],
            [correlation * revenue_std * cost_std, cost_std ** 2],
        ])
        samples = self.rng.multivariate_normal(mean, cov, self.n_simulations)
        revenue_samples = np.maximum(samples[:, 0], 0)
        cost_samples = np.maximum(samples[:, 1], 0)
        margin_samples = revenue_samples - cost_samples
        margin_rate_samples = (revenue_samples - cost_samples) / (revenue_samples + 1e-10)

        margin_result = self._summarize_distribution(margin_samples, 'margin')
        margin_rate_result = self._summarize_distribution(margin_rate_samples, 'margin_rate')
        loss_prob = float(np.mean(margin_samples < 0))

        result = {**margin_result, **margin_rate_result, 'loss_probability': loss_prob}
        self.simulation_history.append(result)
        return result

    def _summarize_distribution(self, samples: np.ndarray,
                                name: str) -> Dict[str, Any]:
        alpha = (1 - self.confidence_level) / 2
        return {
            f'{name}_mean': float(np.mean(samples)),
            f'{name}_std': float(np.std(samples)),
            f'{name}_p5': float(np.percentile(samples, alpha * 100)),
            f'{name}_p95': float(np.percentile(samples, (1 - alpha) * 100)),
            f'{name}_var': float(np.percentile(samples, alpha * 100)),
        }

    def compute_var(self, return_samples: np.ndarray) -> float:
        alpha = 1 - self.confidence_level
        return float(np.percentile(return_samples, alpha * 100))

    def compute_cvar(self, return_samples: np.ndarray) -> float:
        alpha = 1 - self.confidence_level
        var = np.percentile(return_samples, alpha * 100)
        cvar = float(np.mean(return_samples[return_samples <= var]))
        return cvar

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_simulations': self.n_simulations,
            'confidence_level': self.confidence_level,
            'simulations_run': len(self.simulation_history),
        }


if __name__ == "__main__":
    np.random.seed(42)
    propagator = FinancialRiskPropagator(n_simulations=5000)

    cost_result = propagator.simulate_cost(
        base_cost=50.0, cost_std=5.0,
        volume=1000, volume_std=100,
        fixed_cost=10000,
    )
    print(f"Total cost: {cost_result['total_cost_mean']:.0f} ± {cost_result['total_cost_std']:.0f}")

    margin_result = propagator.simulate_margin(
        revenue=80.0, revenue_std=8.0,
        cost=50.0, cost_std=5.0,
        correlation=0.3,
    )
    print(f"Margin: {margin_result['margin_mean']:.0f} ± {margin_result['margin_std']:.0f}")
    print(f"Loss probability: {margin_result['loss_probability']:.2%}")
