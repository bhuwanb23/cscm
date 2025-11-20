"""
Correlated risk analysis utilities.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Dict, Any


class CorrelatedRiskAnalyzer:
    """Analyzes correlated supplier risk scenarios."""

    def __init__(self, target_col: str = "event_flag"):
        self.target_col = target_col
        self.correlation_matrix_: Optional[pd.DataFrame] = None

    def fit(self, data: pd.DataFrame) -> "CorrelatedRiskAnalyzer":
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        if self.target_col in numeric_cols:
            numeric_cols.remove(self.target_col)
        self.correlation_matrix_ = data[numeric_cols + [self.target_col]].corr()
        return self

    def scenario_risk(self, shocks: Dict[str, float]) -> float:
        if self.correlation_matrix_ is None:
            raise ValueError("Analyzer must be fitted")
        vec = np.zeros(len(self.correlation_matrix_))
        columns = list(self.correlation_matrix_.columns)
        for factor, magnitude in shocks.items():
            if factor in columns:
                vec[columns.index(factor)] = magnitude
        risk = vec @ self.correlation_matrix_.values @ vec.T
        return float(risk)

    def summary(self) -> pd.DataFrame:
        if self.correlation_matrix_ is None:
            raise ValueError("Analyzer must be fitted")
        return self.correlation_matrix_.copy()

