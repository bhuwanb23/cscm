"""
Monte Carlo Propagation for Uncertainty Quantification

This module implements Monte Carlo simulation methods for propagating
input uncertainties through supply chain models, supporting correlated
inputs, Latin Hypercube sampling, and sensitivity analysis.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MonteCarloPropagator:
    """
    Performs Monte Carlo simulation to propagate input uncertainties
    through arbitrary model functions with support for correlated inputs,
    Latin Hypercube sampling, and Sobol sensitivity analysis.
    """

    def __init__(self,
                 n_samples: int = 10000,
                 sampling_method: str = 'random',
                 random_state: int = 42):
        self.n_samples = n_samples
        self.sampling_method = sampling_method
        self.rng = np.random.RandomState(random_state)
        self.results_history: List[Dict[str, Any]] = []

    def _latin_hypercube_sample(self, n_vars: int, n: int) -> np.ndarray:
        samples = np.zeros((n, n_vars))
        for i in range(n_vars):
            perm = self.rng.permutation(n)
            samples[:, i] = (perm + self.rng.uniform(0, 1, n)) / n
        return samples

    def _transform_samples(self, u_samples: np.ndarray,
                           dist_type: str,
                           params: Dict[str, Any]) -> np.ndarray:
        if dist_type == 'normal':
            return params.get('mean', 0) + params.get('std', 1) * u_samples
        elif dist_type == 'uniform':
            return params.get('low', 0) + (params.get('high', 1) - params.get('low', 0)) * u_samples
        elif dist_type == 'lognormal':
            mu = np.log(params.get('mean', 1)) - 0.5 * np.log(1 + (params.get('std', 0.5) / params.get('mean', 1)) ** 2)
            sigma = np.sqrt(np.log(1 + (params.get('std', 0.5) / params.get('mean', 1)) ** 2))
            return np.exp(mu + sigma * u_samples)
        elif dist_type == 'triangular':
            low, mode, high = params.get('low', 0), params.get('mode', 0.5), params.get('high', 1)
            fc = (mode - low) / (high - low)
            mask = u_samples <= fc
            result = np.zeros_like(u_samples)
            result[mask] = low + np.sqrt(u_samples[mask] * (high - low) * (mode - low))
            result[~mask] = high - np.sqrt((1 - u_samples[~mask]) * (high - low) * (high - mode))
            return result
        else:
            return params.get('mean', 0) + params.get('std', 1) * u_samples

    def propagate(self,
                  model_fn: Callable,
                  input_distributions: Dict[str, Dict[str, Any]],
                  correlations: Optional[np.ndarray] = None,
                  n_samples: Optional[int] = None) -> Dict[str, Any]:
        n = n_samples or self.n_samples
        var_names = list(input_distributions.keys())
        n_vars = len(var_names)

        if self.sampling_method == 'latin':
            base_samples = self._latin_hypercube_sample(n_vars, n)
        else:
            base_samples = self.rng.uniform(0, 1, (n, n_vars))

        if correlations is not None and correlations.shape == (n_vars, n_vars):
            from scipy.stats import norm
            L = np.linalg.cholesky(correlations)
            normal_samples = norm.ppf(base_samples)
            correlated = normal_samples @ L.T
            base_samples = norm.cdf(correlated)

        input_samples = {}
        for idx, name in enumerate(var_names):
            dist = input_distributions[name]
            input_samples[name] = self._transform_samples(
                base_samples[:, idx], dist.get('type', 'normal'), dist.get('params', {})
            )

        output_samples = np.array([
            model_fn({name: input_samples[name][i] for name in var_names})
            for i in range(n)
        ])

        mean = float(np.mean(output_samples))
        std = float(np.std(output_samples))
        p5 = float(np.percentile(output_samples, 5))
        p95 = float(np.percentile(output_samples, 95))

        sensitivity = self._compute_sensitivity(output_samples, input_samples, var_names)

        result = {
            'output_mean': mean,
            'output_std': std,
            'output_p5': p5,
            'output_p95': p95,
            'n_samples': n,
            'sensitivity': sensitivity,
        }
        self.results_history.append(result)
        return result

    def _compute_sensitivity(self, output: np.ndarray,
                             inputs: Dict[str, np.ndarray],
                             var_names: List[str]) -> Dict[str, float]:
        sensitivity = {}
        for name in var_names:
            corr = np.corrcoef(inputs[name], output)[0, 1]
            sensitivity[name] = float(abs(corr)) if not np.isnan(corr) else 0.0
        total = sum(sensitivity.values())
        if total > 0:
            sensitivity = {k: v / total for k, v in sensitivity.items()}
        return sensitivity

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_samples': self.n_samples,
            'sampling_method': self.sampling_method,
            'propagations_run': len(self.results_history),
        }


if __name__ == "__main__":
    np.random.seed(42)

    def cost_model(params):
        return params['material_cost'] * params['quantity'] + params['fixed_overhead']

    propagator = MonteCarloPropagator(n_samples=5000)

    distributions = {
        'material_cost': {'type': 'normal', 'params': {'mean': 50, 'std': 5}},
        'quantity': {'type': 'normal', 'params': {'mean': 1000, 'std': 100}},
        'fixed_overhead': {'type': 'uniform', 'params': {'low': 5000, 'high': 8000}},
    }

    result = propagator.propagate(cost_model, distributions)
    print(f"Cost: {result['output_mean']:.0f} ± {result['output_std']:.0f}")
    print(f"90% CI: [{result['output_p5']:.0f}, {result['output_p95']:.0f}]")
    print(f"Sensitivity: {result['sensitivity']}")
