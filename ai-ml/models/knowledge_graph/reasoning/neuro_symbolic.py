"""Neuro-symbolic hybrid reasoning."""

from __future__ import annotations

from typing import Dict


class NeuroSymbolicReasoner:
    def __init__(self, rules_engine, embedder):
        self.rules_engine = rules_engine
        self.embedder = embedder

    def explain(self, context: Dict) -> Dict[str, object]:
        rule_alerts = self.rules_engine.evaluate(context)
        node = context.get('entity')
        embedding = None
        if node and hasattr(self.embedder, 'embeddings'):
            embedding = self.embedder.embeddings.get(node)
        return {'alerts': rule_alerts, 'embedding': embedding}
