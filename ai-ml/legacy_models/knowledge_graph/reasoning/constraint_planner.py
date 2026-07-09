"""Constraint reasoning for planners."""

from __future__ import annotations

from typing import Dict


class ConstraintPlanner:
    def __init__(self):
        self.constraints = []

    def add_max_constraint(self, metric: str, threshold: float):
        self.constraints.append(('max', metric, threshold))

    def add_min_constraint(self, metric: str, threshold: float):
        self.constraints.append(('min', metric, threshold))

    def evaluate(self, metrics: Dict[str, float]) -> Dict[str, bool]:
        results = {}
        for ctype, metric, threshold in self.constraints:
            value = metrics.get(metric, 0)
            if ctype == 'max':
                results[metric] = value <= threshold
            else:
                results[metric] = value >= threshold
        return results
