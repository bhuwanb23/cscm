"""T5-based summarizer wrapper with graceful fallback."""

from __future__ import annotations

from typing import List

try:  # pragma: no cover
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:  # pragma: no cover
    HAS_TRANSFORMERS = False
    pipeline = None


class T5Summarizer:
    def __init__(self, model_name: str = "t5-small"):
        self.model_name = model_name
        self.pipeline = None
        if HAS_TRANSFORMERS:
            try:
                self.pipeline = pipeline("summarization", model=model_name)
            except Exception:  # fallback
                self.pipeline = None

    def summarize(self, text: str, max_length: int = 60) -> str:
        if self.pipeline:
            result = self.pipeline(text, max_length=max_length, truncation=True)
            return result[0]['summary_text']
        sentences = text.split('.')
        return '.'.join(sent.strip() for sent in sentences[:2] if sent.strip())

    def batch_summarize(self, texts: List[str]) -> List[str]:
        return [self.summarize(t) for t in texts]
