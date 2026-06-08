"""
Uncertainty Propagation Methods

This module implements techniques for propagating uncertainty through
supply chain models using Monte Carlo simulation, first-order
second-moment (FOSM) method, and polynomial chaos expansion.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UncertaintyPropagationEngine:
    """
    Propagates input uncertainties through models to quantify
    output uncertainty using multiple propagation methods.
    """

    def __init__(self,
                 method: str = 'monte_carlo',
                 n_samples: int = 10000,
                 random_state: int = 42):
        self.method = method
        self.n_samples = n_samples
        self.random_state = random_state
        self.rng = np.random.RandomState(random_state)

    def monte_carlo_propagate(self, model_fn: Callable,
                               input_distributions: Dict[str, Dict[str, Any]],
                               n_samples: Optional[int] = None) -> Dict[str, Any]:
        n = n_samples or self.n_samples
        input_samples = {}

        for name, dist in input_distributions.items():
            dist_type = dist.get('type', 'normal')
            params = dist.get('params', {})

            if dist_type == 'normal':
                input_samples[name] = self.rng.normal(
                    params.get('mean', 0), params.get('std', 1), n
                )
            elif dist_type == 'uniform':
                input_samples[name] = self.rng.uniform(
                    params.get('low', 0), params.get('high', 1), n
                )
            elif dist_type == 'lognormal':
                input_samples[name] = self.rng.lognormal(
                    params.get('mean', 0), params.get('sigma', 1), n
                )
            elif dist_type == 'triangular':
                input_samples[name] = self.rng.triangular(
                    params.get('low', 0), params.get('mode', 0.5),
                    params.get('high', 1), n
                )
            else:
                input_samples[name] = self.rng.normal(0, 1, n)

        output_samples = np.zeros(n)
        for i in range(n):
            inputs = {name: samples[i] for name, samples in input_samples.items()}
            output_samples[i] = model_fn(**inputs)

        result = {
            'method': 'monte_carlo',
            'n_samples': n,
            'mean': float(np.mean(output_samples)),
            'std': float(np.std(output_samples)),
            'variance': float(np.var(output_samples)),
            'percentiles': {
                'p5': float(np.percentile(output_samples, 5)),
                'p25': float(np.percentile(output_samples, 25)),
                'p50': float(np.percentile(output_samples, 50)),
                'p75': float(np.percentile(output_samples, 75)),
                'p95': float(np.percentile(output_samples, 95)),
            },
            'skewness': float(np.mean((output_samples - np.mean(output_samples)) ** 3) / (np.std(output_samples) ** 3 + 1e-10)),
            'kurtosis': float(np.mean((output_samples - np.mean(output_samples)) ** 4) / (np.var(output_samples) ** 2 + 1e-10) - 3),
        }
        return result

    def fosm_propagate(self, sensitivities: Dict[str, float],
                        input_stds: Dict[str, float]) -> Dict[str, Any]:
        variance = 0.0
        contributions = {}

        for name, sens in sensitivities.items():
            std = input_stds.get(name, 0)
            contrib = (sens ** 2) * (std ** 2)
            contributions[name] = float(contrib)
            variance += contrib

        total_std = np.sqrt(variance)

        total = sum(contributions.values()) if contributions else 1.0
        importance = {
            name: float(contrib / total)
            for name, contrib in contributions.items()
        }

        return {
            'method': 'fosm',
            'output_variance': float(variance),
            'output_std': float(total_std),
            'contributions': contributions,
            'importance': importance,
        }

    def _compute_hermite(self, x: np.ndarray, n: int) -> np.ndarray:
        if n == 0:
            return np.ones_like(x)
        if n == 1:
            return x
        h0 = np.ones_like(x)
        h1 = x
        for k in range(2, n + 1):
            h2 = x * h1 - (k - 1) * h0
            h0, h1 = h1, h2
        return h1

    def polynomial_chaos_propagate(self, model_fn: Callable,
                                     input_means: Dict[str, float],
                                     input_stds: Dict[str, float],
                                     order: int = 3) -> Dict[str, Any]:
        n_vars = len(input_means)
        var_names = list(input_means.keys())

        import math
        n_pc = int(math.comb(n_vars + order, order))
        xi = self.rng.randn(self.n_samples, n_vars)

        poly_basis = np.ones((self.n_samples, n_pc))
        col = 1
        for var_idx in range(n_vars):
            poly_basis[:, col] = xi[:, var_idx]
            col += 1
        for o in range(2, order + 1):
            for var_idx in range(n_vars):
                poly_basis[:, col] = self._compute_hermite(xi[:, var_idx], o)
                col += 1

        output_samples = np.zeros(self.n_samples)
        for i in range(self.n_samples):
            inputs = {
                name: input_means[name] + input_stds[name] * xi[i, j]
                for j, name in enumerate(var_names)
            }
            output_samples[i] = model_fn(**inputs)

        coeffs = np.linalg.lstsq(poly_basis, output_samples, rcond=None)[0]
        sobol_indices = {}
        total_var = np.var(output_samples)

        for i, name in enumerate(var_names):
            main_effect = coeffs[i + 1] ** 2
            sobol_indices[name] = float(main_effect / total_var) if total_var > 0 else 0.0

        return {
            'method': 'polynomial_chaos',
            'order': order,
            'output_mean': float(np.mean(output_samples)),
            'output_std': float(np.std(output_samples)),
            'sobol_indices': sobol_indices,
            'n_pc_terms': n_pc,
        }

    def propagate(self, model_fn: Callable,
                  input_uncertainties: Dict[str, Dict[str, Any]],
                  sensitivities: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        if self.method == 'monte_carlo':
            return self.monte_carlo_propagate(model_fn, input_uncertainties)
        elif self.method == 'fosm':
            if sensitivities is None:
                raise ValueError("FOSM requires sensitivities")
            input_stds = {
                name: params.get('params', {}).get('std', 1)
                for name, params in input_uncertainties.items()
            }
            return self.fosm_propagate(sensitivities, input_stds)
        elif self.method == 'polynomial_chaos':
            input_means = {
                name: params.get('params', {}).get('mean', 0)
                for name, params in input_uncertainties.items()
            }
            input_stds = {
                name: params.get('params', {}).get('std', 1)
                for name, params in input_uncertainties.items()
            }
            return self.polynomial_chaos_propagate(model_fn, input_means, input_stds)
        else:
            raise ValueError(f"Unknown method: {self.method}")


if __name__ == "__main__":
    np.random.seed(42)
    engine = UncertaintyPropagationEngine(method='monte_carlo', n_samples=5000)

    def demand_model(price: float, promotion: float, seasonality: float) -> float:
        base = 100.0
        return base - 2.5 * price + 15.0 * promotion + 20.0 * seasonality

    inputs = {
        'price': {'type': 'normal', 'params': {'mean': 20, 'std': 3}},
        'promotion': {'type': 'uniform', 'params': {'low': 0, 'high': 1}},
        'seasonality': {'type': 'normal', 'params': {'mean': 0.5, 'std': 0.2}},
    }

    mc_result = engine.monte_carlo_propagate(demand_model, inputs)
    print(f"MC: mean={mc_result['mean']:.1f}, std={mc_result['std']:.1f}")

    fosm_result = engine.fosm_propagate(
        {'price': -2.5, 'promotion': 15.0, 'seasonality': 20.0},
        {'price': 3, 'promotion': 0.29, 'seasonality': 0.2}
    )
    print(f"FOSM: std={fosm_result['output_std']:.1f}")

    engine2 = UncertaintyPropagationEngine(method='polynomial_chaos', n_samples=3000)
    pc_result = engine2.polynomial_chaos_propagate(
        demand_model,
        {'price': 20, 'promotion': 0.5, 'seasonality': 0.5},
        {'price': 3, 'promotion': 0.29, 'seasonality': 0.2},
        order=2
    )
    print(f"PC: std={pc_result['output_std']:.1f}")
    print(f"Sobol indices: {pc_result['sobol_indices']}")
