"""
Robustness Testing for Uncertainty Quantification

This module implements robustness testing procedures for evaluating
uncertainty estimates under distribution shift, adversarial perturbations,
and extreme scenarios in supply chain contexts.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RobustnessTester:
    """
    Evaluates robustness of uncertainty estimates under various forms
    of distribution shift, adversarial perturbation, and stress testing.
    """

    def __init__(self,
                 perturbation_scale: float = 0.1,
                 n_stress_scenarios: int = 5,
                 random_state: int = 42):
        self.perturbation_scale = perturbation_scale
        self.n_stress_scenarios = n_stress_scenarios
        self.rng = np.random.RandomState(random_state)
        self.test_history: List[Dict[str, Any]] = []

    def add_noise(self, X: np.ndarray, noise_level: Optional[float] = None) -> np.ndarray:
        scale = noise_level if noise_level is not None else self.perturbation_scale
        noise = self.rng.normal(0, scale * np.std(X, axis=0, keepdims=True), X.shape)
        return X + noise

    def shift_distribution(self, X: np.ndarray, shift_magnitude: float = 0.5) -> np.ndarray:
        shift = self.rng.uniform(-shift_magnitude, shift_magnitude, X.shape[1])
        return X + shift

    def corrupt_features(self, X: np.ndarray, corruption_rate: float = 0.1) -> np.ndarray:
        X_corrupted = X.copy()
        n_corrupt = int(X.shape[0] * X.shape[1] * corruption_rate)
        indices = self.rng.choice(X.size, n_corrupt, replace=False)
        rows = indices // X.shape[1]
        cols = indices % X.shape[1]
        X_corrupted[rows, cols] = self.rng.choice([0, np.nan, -1], n_corrupt)
        X_corrupted = np.nan_to_num(X_corrupted, nan=0.0)
        return X_corrupted

    def test_perturbation_robustness(self,
                                     model_fn: Callable,
                                     X: np.ndarray,
                                     noise_levels: Optional[List[float]] = None) -> Dict[str, Any]:
        if noise_levels is None:
            noise_levels = [0.01, 0.05, 0.1, 0.2, 0.5]

        base_preds = model_fn(X)
        results = []

        for noise in noise_levels:
            X_noisy = self.add_noise(X, noise)
            noisy_preds = model_fn(X_noisy)
            deviation = np.mean(np.abs(noisy_preds - base_preds))
            relative_change = deviation / (np.mean(np.abs(base_preds)) + 1e-10)
            results.append({
                'noise_level': noise,
                'mean_deviation': float(deviation),
                'relative_change': float(relative_change),
            })

        fragile_levels = [r['noise_level'] for r in results if r['relative_change'] > 0.5]
        return {
            'results': results,
            'fragile_noise_levels': fragile_levels,
            'overall_stability': 'fragile' if fragile_levels else 'robust',
        }

    def test_extreme_scenarios(self,
                               model_fn: Callable,
                               X_base: np.ndarray,
                               scenario_fn: Optional[Callable] = None) -> Dict[str, Any]:
        predictions = model_fn(X_base)
        base_mean = float(np.mean(predictions))
        base_std = float(np.std(predictions))

        scenarios = []
        for i in range(self.n_stress_scenarios):
            if scenario_fn:
                X_scenario = scenario_fn(X_base, i)
            else:
                shift = 1.0 + i * 0.5
                X_scenario = self.shift_distribution(X_base, shift)

            scenario_preds = model_fn(X_scenario)
            scenario_mean = float(np.mean(scenario_preds))
            deviation = abs(scenario_mean - base_mean) / (base_std + 1e-10)
            scenarios.append({
                'scenario': i,
                'mean': scenario_mean,
                'std': float(np.std(scenario_preds)),
                'deviation_sigma': deviation,
                'extreme': deviation > 3.0,
            })

        extreme_count = sum(1 for s in scenarios if s['extreme'])
        return {
            'base_mean': base_mean,
            'base_std': base_std,
            'scenarios': scenarios,
            'extreme_scenarios': extreme_count,
            'robustness_score': 1.0 - extreme_count / max(len(scenarios), 1),
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'perturbation_scale': self.perturbation_scale,
            'n_stress_scenarios': self.n_stress_scenarios,
            'tests_run': len(self.test_history),
        }


if __name__ == "__main__":
    np.random.seed(42)

    def dummy_model(X):
        return np.dot(X, np.array([1.0, 2.0, 3.0, 0.5, -1.0])) + 0.1

    X = np.random.randn(100, 5)
    tester = RobustnessTester()

    pert_result = tester.test_perturbation_robustness(dummy_model, X)
    print(f"Stability: {pert_result['overall_stability']}")
    for r in pert_result['results'][:3]:
        print(f"  noise={r['noise_level']}: deviation={r['mean_deviation']:.4f}")

    extreme_result = tester.test_extreme_scenarios(dummy_model, X)
    print(f"Robustness score: {extreme_result['robustness_score']:.2f}")
    print(f"Extreme scenarios: {extreme_result['extreme_scenarios']}")
