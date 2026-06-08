"""BART summarizer wrapper."""

from __future__ import annotations

from typing import List

try:  # pragma: no cover
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:  # pragma: no cover
    HAS_TRANSFORMERS = False
    pipeline = None


class BARTSummarizer:
    def __init__(self, model_name: str = "facebook/bart-large-cnn"):
        self.model_name = model_name
        self.pipeline = None
        if HAS_TRANSFORMERS:
            try:
                self.pipeline = pipeline("summarization", model=model_name)
            except Exception:
                self.pipeline = None

    def summarize(self, text: str, max_length: int = 80) -> str:
        if self.pipeline:
            result = self.pipeline(text, max_length=max_length, truncation=True)
            return result[0]['summary_text']
        return text[:max_length] + ('...' if len(text) > max_length else '')

    def summarize_structured(self, title: str, body: str) -> str:
        combined = f"{title}: {body}"
        return self.summarize(combined)

    def batch(self, records: List[dict]) -> List[str]:
        return [self.summarize_structured(r.get('title', ''), r.get('body', '')) for r in records]
