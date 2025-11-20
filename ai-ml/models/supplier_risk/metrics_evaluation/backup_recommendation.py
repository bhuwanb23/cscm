"""
Backup supplier recommendation system.
"""

from __future__ import annotations

import pandas as pd
from typing import List, Dict, Any


class BackupSupplierRecommender:
    """Recommend alternate suppliers based on risk metrics."""

    def __init__(
        self,
        min_reliability: float = 0.9,
        min_on_time_rate: float = 0.9
    ):
        self.min_reliability = min_reliability
        self.min_on_time_rate = min_on_time_rate

    def recommend(
        self,
        suppliers: pd.DataFrame,
        exclude_supplier: int,
        top_k: int = 3
    ) -> pd.DataFrame:
        candidates = suppliers[suppliers['supplier_id'] != exclude_supplier].copy()
        if 'reliability_score' in candidates.columns:
            candidates = candidates[candidates['reliability_score'] >= self.min_reliability]
        if 'on_time_rate' in candidates.columns:
            candidates = candidates[candidates['on_time_rate'] >= self.min_on_time_rate]
        if 'financial_score' in candidates.columns:
            candidates['composite'] = 0.4 * candidates['financial_score'] + 0.6 * candidates.get('reliability_score', 0.9)
        else:
            candidates['composite'] = candidates.get('reliability_score', 0.9)
        return candidates.sort_values('composite', ascending=False).head(top_k)[['supplier_id', 'composite']]

