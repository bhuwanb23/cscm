"""
Order simulation engine for digital twin.
"""

from __future__ import annotations

import pandas as pd
from typing import List, Dict, Any


class OrderSimulationEngine:
    def __init__(self, orders: pd.DataFrame):
        self.orders = orders.sort_values('timestamp')
        self.pointer = 0

    @classmethod
    def from_csv(cls, path: str) -> "OrderSimulationEngine":
        df = pd.read_csv(path, parse_dates=['timestamp'])
        return cls(df)

    def next_batch(self, window_minutes: int = 30) -> pd.DataFrame:
        if self.pointer >= len(self.orders):
            return pd.DataFrame(columns=self.orders.columns)
        start_time = self.orders.iloc[self.pointer]['timestamp']
        end_time = start_time + pd.Timedelta(minutes=window_minutes)
        mask = (self.orders['timestamp'] >= start_time) & (self.orders['timestamp'] < end_time)
        batch = self.orders[mask]
        self.pointer = batch.index.max() + 1 if not batch.empty else self.pointer + 1
        return batch
