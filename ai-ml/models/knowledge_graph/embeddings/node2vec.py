"""Node2Vec-style embedding generator."""

from __future__ import annotations

import numpy as np
from typing import Dict, List


class Node2VecEmbedder:
    def __init__(self, graph_store, dimensions: int = 8, walk_length: int = 5, walks_per_node: int = 10):
        self.graph_store = graph_store
        self.dimensions = dimensions
        self.walk_length = walk_length
        self.walks_per_node = walks_per_node
        self.embeddings: Dict[str, np.ndarray] = {}

    def fit(self):
        nodes = list(self.graph_store.graph.nodes()) if hasattr(self.graph_store.graph, 'nodes') else list(self.graph_store.graph['nodes'].keys())
        rng = np.random.default_rng()
        for node in nodes:
            walks = []
            for _ in range(self.walks_per_node):
                current = node
                walk = [current]
                for _ in range(self.walk_length - 1):
                    neighbors = self.graph_store.neighbors(current)
                    if not neighbors:
                        break
                    current = rng.choice(neighbors)
                    walk.append(current)
                walks.append(walk)
            vec = np.zeros(self.dimensions)
            for walk in walks:
                vec += rng.random(self.dimensions)
            self.embeddings[node] = vec / max(len(walks), 1)
        return self.embeddings

    def get_embedding(self, node: str) -> np.ndarray:
        return self.embeddings.get(node)
