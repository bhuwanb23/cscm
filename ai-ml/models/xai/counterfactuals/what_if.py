"""
What-if simulator for feature tweaks.
"""

from __future__ import annotations

import numpy as np
from typing import Callable, Dict


class WhatIfSimulator:
    def __init__(self, model_fn: Callable[[np.ndarray], np.ndarray]):
        self.model_fn = model_fn

    def simulate(self, instance: np.ndarray, deltas: Dict[int, float]) -> float:
        candidate = instance.copy()
        for idx, delta in deltas.items():
            candidate[idx] += delta
        return float(self.model_fn(candidate.reshape(1, -1))[0])

    def batch_simulate(self, instance: np.ndarray, scenarios: Dict[str, Dict[int, float]]) -> Dict[str, float]:
        return {name: self.simulate(instance, tweaks) for name, tweaks in scenarios.items()}
