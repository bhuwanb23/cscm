"""ChatOps agent for natural language queries."""

from __future__ import annotations

from typing import Dict


class ChatOpsAgent:
    def __init__(self, knowledge_base: Dict[str, str] | None = None):
        self.knowledge_base = knowledge_base or {
            'status': 'All systems operational',
            'inventory': 'Inventory coverage at 28 days',
        }

    def query(self, text: str) -> str:
        text_lower = text.lower()
        if 'why' in text_lower:
            return 'Explanation: demand spike due to promotion.'
        if 'what if' in text_lower:
            return 'Scenario: rerouting reduces delay by 12%.'
        for key, value in self.knowledge_base.items():
            if key in text_lower:
                return value
        return 'I will escalate this query to an analyst.'
