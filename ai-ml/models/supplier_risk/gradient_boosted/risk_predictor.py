"""
Gradient-boosted supplier risk predictor.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any
import logging

try:  # pragma: no cover - optional dependency
    from xgboost import XGBClassifier  # type: ignore
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:  # pragma: no cover - optional dependency
    from lightgbm import LGBMClassifier  # type: ignore
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LeadTimeFeatureEngineer:
    """Create lead-time variability features."""

    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        if "lead_time_mean" in df.columns and "lead_time_std" in df.columns:
            df["lead_time_cv"] = df["lead_time_std"] / df["lead_time_mean"].replace(0, np.nan)
            df["lead_time_stability"] = 1 / (1 + df["lead_time_std"])
        return df


class FinancialFeatureIntegrator:
    """Add financial indicator aggregates."""

    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        if "financial_score" in df.columns:
            df["financial_risk"] = 1 - df["financial_score"]
        if {"financial_score", "reliability_score"}.issubset(df.columns):
            df["resilience_index"] = 0.6 * df["financial_score"] + 0.4 * df["reliability_score"]
        return df


class GradientBoostRiskModel:
    """Wrapper around gradient boosted models for supplier risk."""

    def __init__(
        self,
        target_col: str = "event_flag",
        random_state: int = 42
    ):
        self.target_col = target_col
        self.random_state = random_state
        self.model = None
        self.model_type = "sklearn"
        self.scaler: Optional[StandardScaler] = None
        self.feature_cols: Optional[List[str]] = None
        self.categorical_cols: List[str] = []

    def _build_model(self):
        if HAS_XGBOOST:
            self.model_type = "xgboost"
            return XGBClassifier(
                eval_metric="logloss",
                max_depth=3,
                learning_rate=0.1,
                n_estimators=200,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state
            )
        if HAS_LIGHTGBM:
            self.model_type = "lightgbm"
            return LGBMClassifier(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=-1,
                random_state=self.random_state
            )
        self.model_type = "sklearn"
        return GradientBoostingClassifier(random_state=self.random_state)

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        processed = df.copy()
        if self.categorical_cols:
            processed = pd.get_dummies(processed, columns=[c for c in self.categorical_cols if c in processed.columns], drop_first=True)
        if self.feature_cols is None:
            raise ValueError("Model must be fitted")
        for col in self.feature_cols:
            if col not in processed.columns:
                processed[col] = 0.0
        processed = processed[self.feature_cols]
        numeric_means = processed.mean(numeric_only=True)
        processed = processed.fillna(numeric_means).fillna(0.0)
        return processed

    def fit(
        self,
        data: pd.DataFrame,
        feature_cols: Optional[List[str]] = None
    ) -> "GradientBoostRiskModel":
        if feature_cols is None:
            feature_cols = [c for c in data.columns if c not in {self.target_col, "supplier_id", "failure_date"}]

        df = data[feature_cols + [self.target_col]].dropna()
        self.categorical_cols = [col for col in feature_cols if df[col].dtype == object]
        if self.categorical_cols:
            df = pd.get_dummies(df, columns=self.categorical_cols, drop_first=True)
            feature_cols = [c for c in df.columns if c != self.target_col]
        self.feature_cols = feature_cols

        X = df[self.feature_cols]
        y = df[self.target_col]

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=0.2, random_state=self.random_state, stratify=y
        )

        self.model = self._build_model()
        self.model.fit(X_train, y_train)
        val_probs = self.model.predict_proba(X_val)[:, 1]
        auc = roc_auc_score(y_val, val_probs)
        logger.info("Risk model (%s) validation AUC: %.3f", self.model_type, auc)
        return self

    def predict_risk(self, data: pd.DataFrame) -> np.ndarray:
        if self.model is None or self.feature_cols is None or self.scaler is None:
            raise ValueError("Model must be fitted")
        X = self._prepare_features(data)
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)[:, 1]

    def feature_importance(self) -> Dict[str, float]:
        if self.model is None or self.feature_cols is None:
            raise ValueError("Model must be fitted")
        if hasattr(self.model, "feature_importances_"):
            values = self.model.feature_importances_
        else:
            values = np.abs(self.model.coef_).flatten()  # type: ignore[assignment]
        return dict(zip(self.feature_cols, values))

