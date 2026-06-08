"""BERT-based information extraction with regex fallback."""

from __future__ import annotations

import re
from typing import Dict, List

try:  # pragma: no cover
    from transformers import AutoTokenizer, AutoModelForTokenClassification
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:  # pragma: no cover
    HAS_TRANSFORMERS = False
    AutoTokenizer = None
    AutoModelForTokenClassification = None
    pipeline = None


class BERTInformationExtractor:
    def __init__(self, model_name: str = "dslim/bert-base-NER"):
        self.model_name = model_name
        self.pipeline = None
        if HAS_TRANSFORMERS:
            try:
                self.pipeline = pipeline("ner", model=model_name, aggregation_strategy="simple")
            except Exception:
                self.pipeline = None

    def extract(self, text: str) -> List[Dict[str, str]]:
        if self.pipeline:
            return [
                {"entity": ent["word"], "label": ent["entity_group"], "score": ent["score"]}
                for ent in self.pipeline(text)
            ]
        pattern = re.compile(r"(?P<entity>[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)")
        return [{"entity": match.group("entity"), "label": "MISC", "score": 0.5} for match in pattern.finditer(text)]
