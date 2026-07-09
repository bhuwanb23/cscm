"""Supplier similarity search."""

from __future__ import annotations

import numpy as np
from typing import List, Tuple


class SupplierSimilarity:
    def __init__(self, embedder):
        self.embedder = embedder

    def most_similar(self, supplier: str, top_k: int = 3) -> List[Tuple[str, float]]:
        base = self.embedder.embeddings.get(supplier)
        if base is None:
            return []
        scores = []
        for other, vec in self.embedder.embeddings.items():
            if other == supplier:
                continue
            score = float(np.dot(base, vec) / (np.linalg.norm(base) * np.linalg.norm(vec) + 1e-8))
            scores.append((other, score))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]
