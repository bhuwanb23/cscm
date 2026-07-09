"""
Simple Bayesian network for supplier risk factors.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List


class SupplierBayesianNetwork:
    """Naive Bayesian network to capture causal relationships."""

    def __init__(self, target_col: str = "event_flag"):
        self.target_col = target_col
        self.conditional_tables: Dict[str, Dict[Any, Dict[Any, float]]] = {}
        self.prior: Dict[Any, float] = {}
        self.feature_cols: Optional[List[str]] = None

    def fit(self, data: pd.DataFrame, feature_cols: Optional[List[str]] = None) -> "SupplierBayesianNetwork":
        if feature_cols is None:
            feature_cols = [c for c in data.columns if c != self.target_col]

        self.feature_cols = feature_cols
        target_counts = data[self.target_col].value_counts()
        total = len(data)
        self.prior = {cls: count / total for cls, count in target_counts.items()}

        for col in feature_cols:
            self.conditional_tables[col] = {}
            grouped = data.groupby([col, self.target_col]).size().reset_index(name='count')
            for value in data[col].unique():
                table = {}
                for cls in self.prior.keys():
                    numerator = grouped[(grouped[col] == value) & (grouped[self.target_col] == cls)]['count']
                    numerator = numerator.iloc[0] if not numerator.empty else 0.5  # Laplace smoothing
                    denom = target_counts.get(cls, 0) + len(data[col].unique()) * 0.5
                    table[cls] = numerator / denom
                self.conditional_tables[col][value] = table
        return self

    def predict_proba(self, row: pd.Series) -> Dict[Any, float]:
        if self.feature_cols is None:
            raise ValueError("Model must be fitted")
        scores = {}
        for cls, prior_prob in self.prior.items():
            prob = prior_prob
            for col in self.feature_cols:
                value = row.get(col)
                table = self.conditional_tables[col]
                value_table = table.get(value)
                if value_table is None:
                    prob *= 0.5  # unseen value
                else:
                    prob *= value_table.get(cls, 0.5)
            scores[cls] = prob
        total = sum(scores.values())
        if total == 0:
            return {cls: 1 / len(scores) for cls in scores}
        return {cls: val / total for cls, val in scores.items()}

    def predict(self, data: pd.DataFrame) -> np.ndarray:
        probs = [self.predict_proba(row) for _, row in data.iterrows()]
        classes = list(self.prior.keys())
        return np.array([max(p, key=p.get) for p in probs])

