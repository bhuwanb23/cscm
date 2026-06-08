"""Constraint reasoning system tying planner + graph."""

from __future__ import annotations

from typing import Dict


class ConstraintReasoner:
    def __init__(self, planner):
        self.planner = planner

    def evaluate_plan(self, plan_metrics: Dict[str, float]) -> Dict[str, bool]:
        return self.planner.evaluate(plan_metrics)
