"""GraphSAGE-style aggregator."""

from __future__ import annotations

import numpy as np
from typing import Dict


class GraphSAGEAggregator:
    def __init__(self, graph_store, dimensions: int = 8):
        self.graph_store = graph_store
        self.dimensions = dimensions
        self.embeddings: Dict[str, np.ndarray] = {}

    def fit(self):
        rng = np.random.default_rng()
        nodes = list(self.graph_store.graph.nodes()) if hasattr(self.graph_store.graph, 'nodes') else list(self.graph_store.graph['nodes'].keys())
        for node in nodes:
            neighbors = self.graph_store.neighbors(node)
            neighbor_vecs = [rng.random(self.dimensions) for _ in neighbors]
            if neighbor_vecs:
                agg = np.mean(neighbor_vecs, axis=0)
            else:
                agg = rng.random(self.dimensions)
            self.embeddings[node] = agg
        return self.embeddings

    def similarity(self, node_a: str, node_b: str) -> float:
        va = self.embeddings.get(node_a)
        vb = self.embeddings.get(node_b)
        if va is None or vb is None:
            return 0.0
        return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb) + 1e-8))
