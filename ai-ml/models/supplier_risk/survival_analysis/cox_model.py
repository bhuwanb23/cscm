"""
Cox proportional hazards model wrapper for supplier risk.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Any
import logging

try:
    from lifelines import CoxPHFitter  # type: ignore
    HAS_LIFELINES = True
except ImportError:  # pragma: no cover - optional dependency
    CoxPHFitter = None
    HAS_LIFELINES = False

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CoxRiskModel:
    """Wrapper that prefers lifelines Cox model and falls back to logistic baseline."""

    def __init__(
        self,
        duration_col: str = "tenure_days",
        event_col: str = "event_flag",
        regularization: float = 1.0
    ):
        self.duration_col = duration_col
        self.event_col = event_col
        self.regularization = regularization
        self.model = None
        self.model_type = "lifelines" if HAS_LIFELINES else "logistic"
        self.scaler: Optional[StandardScaler] = None
        self.feature_cols: Optional[List[str]] = None
        self.categorical_cols: List[str] = []

    def _prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        processed = data.copy()
        if self.categorical_cols:
            processed = pd.get_dummies(processed, columns=[c for c in self.categorical_cols if c in processed.columns], drop_first=True)
        if self.feature_cols is None:
            raise ValueError("Model must be fitted")
        for col in self.feature_cols:
            if col not in processed.columns:
                processed[col] = 0.0
        processed = processed[self.feature_cols].fillna(processed.mean())
        return processed

    def fit(
        self,
        data: pd.DataFrame,
        feature_cols: Optional[List[str]] = None
    ) -> "CoxRiskModel":
        """Fit the risk model."""
        if feature_cols is None:
            feature_cols = [col for col in data.columns if col not in {self.duration_col, self.event_col}]

        df = data[[self.duration_col, self.event_col] + feature_cols].dropna()
        self.categorical_cols = [col for col in feature_cols if df[col].dtype == object]
        if self.categorical_cols:
            df = pd.get_dummies(df, columns=self.categorical_cols, drop_first=True)
            feature_cols = [col for col in df.columns if col not in {self.duration_col, self.event_col}]
        self.feature_cols = feature_cols

        if HAS_LIFELINES:
            self.model = CoxPHFitter()
            self.model.fit(
                df[[self.duration_col, self.event_col] + self.feature_cols],
                duration_col=self.duration_col,
                event_col=self.event_col,
                show_progress=False
            )
            logger.info("Fitted lifelines CoxPH model with %s features", len(feature_cols))
        else:
            # Fallback: logistic regression on event flag
            self.scaler = StandardScaler()
            X = self.scaler.fit_transform(df[self.feature_cols])
            y = df[self.event_col].values
            self.model = LogisticRegression(C=1.0 / self.regularization, max_iter=1000)
            self.model.fit(X, y)
            logger.warning("lifelines not available; falling back to logistic regression for survival proxy")

        return self

    def predict_partial_hazard(self, data: pd.DataFrame) -> np.ndarray:
        """Predict partial hazard scores."""
        if self.model is None or self.feature_cols is None:
            raise ValueError("Model must be fitted before prediction")

        df = self._prepare_features(data)

        if self.model_type == "lifelines":
            return self.model.predict_partial_hazard(df).values  # type: ignore[attr-defined]

        X = self.scaler.transform(df)  # type: ignore[union-attr]
        probs = self.model.predict_proba(X)[:, 1]
        return probs

    def predict_survival_probability(
        self,
        data: pd.DataFrame,
        times: np.ndarray
    ) -> np.ndarray:
        """Predict survival probability at specified times."""
        if self.model is None or self.feature_cols is None:
            raise ValueError("Model must be fitted before prediction")

        features = self._prepare_features(data)

        if self.model_type == "lifelines":
            sf_list = self.model.predict_survival_function(features, times=times)  # type: ignore[attr-defined]
            return sf_list.values.T

        hazards = np.clip(self.model.predict_proba(self.scaler.transform(features))[:, 1], 1e-6, 1 - 1e-6)  # type: ignore[union-attr]
        hazard_rate = -np.log(1 - hazards)
        survival = np.exp(-np.outer(hazard_rate, times / times.max()))
        return survival

    def get_summary(self) -> Dict[str, Any]:
        """Return model summary information."""
        if self.model is None:
            raise ValueError("Model must be fitted")

        if self.model_type == "lifelines":
            summary = self.model.summary  # type: ignore[attr-defined]
            return summary.to_dict()

        coefs = self.model.coef_.flatten().tolist()
        return {
            'model': 'logistic_fallback',
            'coefficients': dict(zip(self.feature_cols or [], coefs)),
        }

