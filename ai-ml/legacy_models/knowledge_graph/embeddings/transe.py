"""TransE scoring."""

from __future__ import annotations

import numpy as np
from typing import Dict, Tuple


class TransEModel:
    def __init__(self, embedding_dim: int = 16, learning_rate: float = 0.01):
        self.embedding_dim = embedding_dim
        self.lr = learning_rate
        self.entity_embeddings: Dict[str, np.ndarray] = {}
        self.rel_embeddings: Dict[str, np.ndarray] = {}

    def _get_entity(self, entity: str) -> np.ndarray:
        if entity not in self.entity_embeddings:
            self.entity_embeddings[entity] = np.random.randn(self.embedding_dim)
        return self.entity_embeddings[entity]

    def _get_relation(self, relation: str) -> np.ndarray:
        if relation not in self.rel_embeddings:
            self.rel_embeddings[relation] = np.random.randn(self.embedding_dim)
        return self.rel_embeddings[relation]

    def score(self, head: str, relation: str, tail: str) -> float:
        h = self._get_entity(head)
        r = self._get_relation(relation)
        t = self._get_entity(tail)
        return -np.linalg.norm(h + r - t)

    def train_step(self, triplet: Tuple[str, str, str]):
        head, relation, tail = triplet
        score = self.score(head, relation, tail)
        # simple gradient ascent on score
        grad = self.lr * (self._get_entity(tail) - (self._get_entity(head) + self._get_relation(relation)))
        self.entity_embeddings[head] += grad
        self.entity_embeddings[tail] -= grad
        self.rel_embeddings[relation] += grad
        return score
