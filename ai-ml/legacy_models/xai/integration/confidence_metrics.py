"""
Confidence estimation utilities.
"""

from __future__ import annotations

import numpy as np


class ConfidenceEstimator:
    def compute(self, probabilities: np.ndarray) -> float:
        return float(1 - np.mean(np.abs(probabilities - 0.5) * 2))

    def summary(self, probabilities: np.ndarray) -> dict:
        return {
            'mean_confidence': float(np.mean(probabilities)),
            'min_confidence': float(np.min(probabilities)),
            'max_confidence': float(np.max(probabilities)),
        }
