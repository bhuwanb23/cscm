"""Business rules engine."""

from __future__ import annotations

from typing import List, Dict


class BusinessRulesEngine:
    def __init__(self):
        self.rules: List[callable] = []

    def add_rule(self, rule_fn):
        self.rules.append(rule_fn)

    def evaluate(self, context: Dict) -> List[str]:
        alerts = []
        for rule in self.rules:
            result = rule(context)
            if result:
                alerts.append(result)
        return alerts
