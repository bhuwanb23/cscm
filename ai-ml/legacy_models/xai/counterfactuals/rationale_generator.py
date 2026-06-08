"""
Rationale generation helper.
"""

from __future__ import annotations

from typing import Dict


class RationaleGenerator:
    def generate(self, shap_values: Dict[int, float]) -> str:
        sorted_feats = sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)
        top = sorted_feats[:3]
        pieces = []
        for idx, value in top:
            direction = "increased" if value >= 0 else "decreased"
            pieces.append(f"feature_{idx} {direction} the score by {abs(value):.3f}")
        return "; ".join(pieces)
