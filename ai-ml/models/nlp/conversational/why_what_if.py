"""Handles "why" and "what-if" queries using explanation modules."""

from __future__ import annotations

from typing import Dict


class WhyWhatIfHandler:
    def __init__(self, explanation_source):
        self.explanation_source = explanation_source

    def answer_why(self, decision_id: str) -> str:
        entry = self.explanation_source.latest()
        if entry:
            return f"Decision {decision_id} because {entry['explanation']}"
        return f"Decision {decision_id} rationale unavailable"

    def run_what_if(self, base_score: float, delta: float) -> Dict[str, float]:
        return {
            'baseline': base_score,
            'adjusted': base_score + delta,
            'delta': delta
        }
