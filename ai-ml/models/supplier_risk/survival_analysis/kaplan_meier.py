"""
Kaplan-Meier estimator utilities for supplier survival curves.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, Dict, Any


class KaplanMeierEstimator:
    """Simple Kaplan-Meier estimator implementation."""

    def __init__(self):
        self.survival_table_: Optional[pd.DataFrame] = None

    def fit(self, durations: np.ndarray, events: np.ndarray) -> "KaplanMeierEstimator":
        order = np.argsort(durations)
        durations = durations[order]
        events = events[order]

        unique_times = np.unique(durations)
        survival = []
        n_at_risk = len(durations)
        prob = 1.0

        for t in unique_times:
            mask = durations == t
            d = events[mask].sum()
            n = mask.sum()
            if n_at_risk > 0:
                prob *= (1 - d / n_at_risk)
            survival.append((t, n_at_risk, d, prob))
            n_at_risk -= n

        self.survival_table_ = pd.DataFrame(
            survival,
            columns=["time", "at_risk", "events", "survival"]
        )
        return self

    def predict(self, times: np.ndarray) -> np.ndarray:
        if self.survival_table_ is None:
            raise ValueError("Estimator not fitted")
        result = np.interp(times, self.survival_table_["time"], self.survival_table_["survival"], left=1.0, right=self.survival_table_["survival"].iloc[-1])
        return result

    def summary(self) -> pd.DataFrame:
        if self.survival_table_ is None:
            raise ValueError("Estimator not fitted")
        return self.survival_table_.copy()

