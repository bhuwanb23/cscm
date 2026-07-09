"""Simple NER processor for contracts."""

from __future__ import annotations

import re
from typing import List, Dict


class NERProcessor:
    def __init__(self):
        self.pattern = re.compile(r"(?P<entity>[A-Z][A-Za-z]+(?:\s[A-Z][A-Za-z]+)*)(?=\s(?:Inc|LLC|Corp|Ltd))")

    def extract(self, text: str) -> List[Dict[str, str]]:
        return [{"entity": match.group("entity"), "type": "ORG"} for match in self.pattern.finditer(text)]
