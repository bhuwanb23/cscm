"""
Counterfactual explanation engine.
"""

from __future__ import annotations

import numpy as np
from typing import Callable, Dict


class CounterfactualEngine:
    def __init__(
        self,
        model_fn: Callable[[np.ndarray], np.ndarray],
        step_size: float = 0.1,
        max_iter: int = 200,
        feature_weights: np.ndarray | None = None,
    ):
        self.model_fn = model_fn
        self.step_size = step_size
        self.max_iter = max_iter
        self.feature_weights = feature_weights

    def generate(self, instance: np.ndarray, target: float) -> Dict[str, np.ndarray | float]:
        candidate = instance.copy()
        best_candidate = candidate.copy()
        best_margin = float("inf")
        rng = np.random.default_rng()
        for _ in range(self.max_iter):
            pred = float(self.model_fn(candidate.reshape(1, -1))[0])
            margin = abs(target - (1 if pred >= 0.5 else 0))
            if margin < best_margin:
                best_margin = margin
                best_candidate = candidate.copy()
            if (target == 1 and pred >= 0.5) or (target == 0 and pred < 0.5):
                break
            direction = np.sign(target - pred)
            noise = rng.normal(scale=self.step_size * 0.5, size=candidate.shape)
            step = direction * self.step_size + noise
            if self.feature_weights is not None:
                step *= self.feature_weights
            candidate = candidate + step
        final_pred = float(self.model_fn(best_candidate.reshape(1, -1))[0])
        return {'counterfactual': best_candidate, 'final_prediction': final_pred}
