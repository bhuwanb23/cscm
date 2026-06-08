"""
Decision explanation bridge.
"""

from __future__ import annotations

from typing import Dict, Any


class DecisionExplanationBridge:
    def __init__(self):
        self.logs = []

    def record(self, decision: Any, explanation: str):
        self.logs.append({'decision': decision, 'explanation': explanation})

    def latest(self) -> Dict[str, Any]:
        return self.logs[-1] if self.logs else {}

    def integrate(self, decision: Any, shap_values: Dict[int, float], confidence: float):
        rationale = "; ".join(
            f"f{idx}:{val:.2f}"
            for idx, val in sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        )
        explanation = f"{rationale} | confidence={confidence:.2f}"
        self.record(decision, explanation)
