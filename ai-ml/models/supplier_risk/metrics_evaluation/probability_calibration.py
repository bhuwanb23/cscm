"""
Probability calibration utilities.
"""

from __future__ import annotations

import numpy as np
from typing import Optional, Dict, Any
from sklearn.calibration import CalibratedClassifierCV
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression


class ProbabilityCalibrator:
    """Calibrate predicted probabilities to reduce bias."""

    def __init__(self, method: str = "isotonic"):
        self.method = method
        self.model = None

    def fit(self, y_scores: np.ndarray, y_true: np.ndarray) -> "ProbabilityCalibrator":
        if self.method == "isotonic":
            self.model = IsotonicRegression(out_of_bounds="clip")
            self.model.fit(y_scores, y_true)
        else:
            lr = LogisticRegression(max_iter=500)
            lr.fit(y_scores.reshape(-1, 1), y_true)
            self.model = lr
        return self

    def transform(self, y_scores: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("Calibrator must be fitted")
        if isinstance(self.model, IsotonicRegression):
            return self.model.transform(y_scores)
        return self.model.predict_proba(y_scores.reshape(-1, 1))[:, 1]

