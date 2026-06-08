"""
Policy impact analyzer for digital twin scenarios.
"""

from __future__ import annotations

from typing import Dict, Any


class PolicyImpactAnalyzer:
    def __init__(self, baseline_metrics: Dict[str, float]):
        self.baseline = baseline_metrics

    def compare(self, new_metrics: Dict[str, float]) -> Dict[str, float]:
        return {k: new_metrics.get(k, 0) - self.baseline.get(k, 0) for k in set(self.baseline) | set(new_metrics)}
