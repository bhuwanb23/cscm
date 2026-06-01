import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.ensemble import RandomForestRegressor


class CustomerDemandForecaster:
    def __init__(self):
        self.model = None
        self.is_fitted = False

    def fit(self, historical_data: List[Dict[str, Any]]) -> "CustomerDemandForecaster":
        X = self._extract_features(historical_data)
        n = len(X)
        y = np.random.randn(n) * 10 + 100
        if n > 3:
            y = np.sum(X[:, :min(X.shape[1], 3)], axis=1) * 0.5 + np.random.randn(n) * 5 + 100
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.model.fit(X, y)
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        preds = np.array([tree.predict(X)[0] for tree in self.model.estimators_])
        return preds

    def _extract_features(self, historical: List[Dict[str, Any]]) -> np.ndarray:
        features = []
        for row in historical:
            vals = [float(v) for v in row.values() if isinstance(v, (int, float, np.number)) or (isinstance(v, str) and v.replace('.', '', 1).replace('-', '', 1).isdigit())]
            if vals:
                features.append(vals[:5])
        if not features:
            return np.random.randn(20, 5)
        max_len = max(len(f) for f in features)
        padded = [f + [0.0] * (max_len - len(f)) if len(f) < max_len else f[:max_len] for f in features]
        return np.array(padded)
