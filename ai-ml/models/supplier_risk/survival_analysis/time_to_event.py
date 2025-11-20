"""
Time-to-event dataset utilities.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, List, Dict, Any


class TimeToEventDataset:
    """Helper to prepare survival analysis datasets."""

    def __init__(
        self,
        duration_col: str = "tenure_days",
        event_col: str = "event_flag"
    ):
        self.duration_col = duration_col
        self.event_col = event_col

    def from_dataframe(
        self,
        data: pd.DataFrame,
        feature_cols: Optional[List[str]] = None
    ) -> pd.DataFrame:
        if feature_cols is None:
            feature_cols = [col for col in data.columns if col not in {self.duration_col, self.event_col, "failure_date"}]

        df = data[[self.duration_col, self.event_col] + feature_cols].copy()
        df = df.fillna(df.mean(numeric_only=True))
        return df

    def censor_above(self, data: pd.DataFrame, days: int) -> pd.DataFrame:
        df = data.copy()
        mask = df[self.duration_col] > days
        df.loc[mask, self.duration_col] = days
        df.loc[mask, self.event_col] = 0
        return df

    def summary(self, data: pd.DataFrame) -> Dict[str, Any]:
        durations = data[self.duration_col]
        events = data[self.event_col]
        return {
            'count': len(data),
            'events': int(events.sum()),
            'censored': int(len(data) - events.sum()),
            'mean_duration': float(durations.mean()),
            'median_duration': float(durations.median())
        }

