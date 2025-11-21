"""
Feature importance visualization utilities.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, List, Optional

try:
    import pandas as pd

    HAS_PANDAS = True
except ImportError:  # pragma: no cover
    pd = None
    HAS_PANDAS = False

try:  # pragma: no cover - optional plotting dependency
    import matplotlib.pyplot as plt

    HAS_MPL = True
except ImportError:  # pragma: no cover
    plt = None
    HAS_MPL = False


class FeatureImportanceVisualizer:
    def compute_importance(self, shap_values: Dict[int, float]) -> List[Dict[str, float]]:
        total = sum(abs(v) for v in shap_values.values()) or 1.0
        return [
            {'feature_index': idx, 'importance': float(abs(val)), 'normalized': float(abs(val) / total)}
            for idx, val in sorted(shap_values.items(), key=lambda item: abs(item[1]), reverse=True)
        ]

    def to_dataframe(self, shap_values: Dict[int, float]):
        if not HAS_PANDAS:
            raise ImportError("pandas is required for to_dataframe()")
        return pd.DataFrame(self.compute_importance(shap_values))

    def plot(self, shap_values: Dict[int, float], top_k: Optional[int] = None):
        if not HAS_MPL:
            raise ImportError("matplotlib is required for plot()")
        data = self.compute_importance(shap_values)
        if top_k:
            data = data[:top_k]
        indices = [item['feature_index'] for item in data]
        values = [item['importance'] for item in data]
        plt.figure(figsize=(6, 3 + len(data) * 0.2))
        plt.barh(range(len(data)), values, color='#2b7bba')
        plt.yticks(range(len(data)), [f"f{idx}" for idx in indices])
        plt.xlabel("Importance")
        plt.tight_layout()
        return plt
