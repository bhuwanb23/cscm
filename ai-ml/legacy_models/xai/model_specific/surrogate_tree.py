"""
Surrogate tree approximator for complex models.
"""

from __future__ import annotations

import numpy as np
from sklearn.tree import DecisionTreeRegressor


class SurrogateTreeApproximator:
    def __init__(self, max_depth: int = 4, random_state: int = 42):
        self.tree = DecisionTreeRegressor(max_depth=max_depth, random_state=random_state)

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.tree.fit(X, y)
        return self

    def fit_with_model(self, X: np.ndarray, base_model) -> "SurrogateTreeApproximator":
        predictions = base_model.predict(X)
        if predictions.ndim > 1:
            predictions = predictions[:, 0]
        return self.fit(X, predictions)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.tree.predict(X)
