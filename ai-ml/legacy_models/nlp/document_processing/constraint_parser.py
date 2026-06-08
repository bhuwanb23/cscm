"""Structured constraint extraction."""

from __future__ import annotations

from typing import Dict, List


class ConstraintParser:
    def parse(self, text: str) -> List[Dict[str, str]]:
        constraints = []
        for sentence in text.split('.'):
            sentence = sentence.strip()
            if 'must not exceed' in sentence:
                parts = sentence.split('must not exceed')
                constraints.append({'type': 'MAX', 'target': parts[0].strip(), 'value': parts[1].strip()})
            elif 'at least' in sentence:
                parts = sentence.split('at least')
                constraints.append({'type': 'MIN', 'target': parts[0].strip(), 'value': parts[1].strip()})
        return constraints
