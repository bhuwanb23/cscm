"""Relation extraction for SLA documents."""

from __future__ import annotations

import re
from typing import List, Dict


class RelationExtractor:
    def __init__(self):
        self.pattern = re.compile(r"(?P<subject>\b[A-Z][A-Za-z]+\b) must deliver within (?P<days>\d+) days")

    def extract_relations(self, text: str) -> List[Dict[str, str]]:
        return [
            {
                'relation': 'DELIVERY_TERM',
                'subject': match.group('subject'),
                'days': match.group('days')
            }
            for match in self.pattern.finditer(text)
        ]
