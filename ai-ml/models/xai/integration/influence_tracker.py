"""
Influence tracker for most influential features.
"""

from __future__ import annotations

from typing import Dict, List


class InfluenceTracker:
    def __init__(self):
        self.history: List[List[int]] = []

    def track(self, shap_values: Dict[int, float], top_k: int = 3) -> List[int]:
        top = [idx for idx, _ in sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:top_k]]
        self.history.append(top)
        return top

    def top_features_over_time(self) -> List[int]:
        counts = {}
        for entry in self.history:
            for idx in entry:
                counts[idx] = counts.get(idx, 0) + 1
        return [idx for idx, _ in sorted(counts.items(), key=lambda x: x[1], reverse=True)]
