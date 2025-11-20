"""
Supplier graph embedding utilities.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from typing import Optional, Dict

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:  # pragma: no cover - optional dependency
    HAS_NETWORKX = False
    nx = None


class SupplierGraphEmbedder:
    """Generates embeddings for supplier networks using simple random walks."""

    def __init__(self, dimensions: int = 8, walk_length: int = 5, num_walks: int = 20, seed: int = 42):
        self.dimensions = dimensions
        self.walk_length = walk_length
        self.num_walks = num_walks
        self.seed = seed
        self.embeddings_: Optional[Dict[int, np.ndarray]] = None

    def fit(self, edges: pd.DataFrame) -> "SupplierGraphEmbedder":
        if not HAS_NETWORKX:
            # Fall back to simple degree-based embeddings
            grouped = edges.groupby('source_supplier')['weight'].sum().add(edges.groupby('target_supplier')['weight'].sum(), fill_value=0)
            self.embeddings_ = {int(node): np.full(self.dimensions, value) for node, value in grouped.items()}
            return self

        G = nx.Graph()
        for _, row in edges.iterrows():
            G.add_edge(int(row['source_supplier']), int(row['target_supplier']), weight=row.get('weight', 1.0))

        rng = np.random.default_rng(self.seed)
        walks = []
        nodes = list(G.nodes())
        for _ in range(self.num_walks):
            rng.shuffle(nodes)
            for node in nodes:
                walk = [node]
                current = node
                for _ in range(self.walk_length - 1):
                    neighbors = list(G.neighbors(current))
                    if not neighbors:
                        break
                    current = rng.choice(neighbors)
                    walk.append(current)
                walks.append(walk)

        # Build co-occurrence matrix
        vocab = {node: idx for idx, node in enumerate(G.nodes())}
        matrix = np.zeros((len(vocab), len(vocab)))
        for walk in walks:
            for i, node in enumerate(walk):
                for j in range(max(0, i - 2), min(len(walk), i + 3)):
                    if i == j:
                        continue
                    matrix[vocab[node], vocab[walk[j]]] += 1

        # Use truncated SVD for embeddings
        U, S, _ = np.linalg.svd(matrix + 1e-6, full_matrices=False)
        embed = U[:, :self.dimensions] * S[:self.dimensions]
        self.embeddings_ = {node: embed[vocab[node]] for node in vocab}
        return self

    def get_embedding(self, node: int) -> np.ndarray:
        if self.embeddings_ is None or node not in self.embeddings_:
            raise ValueError("Embeddings not available for node")
        return self.embeddings_[node]

