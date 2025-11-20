"""
Routing simulation environment using simple distance matrix.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, Tuple


class RoutingSimulationEnvironment:
    def __init__(self, distance_matrix: Dict[Tuple[str, str], float]):
        self.distance_matrix = distance_matrix

    @classmethod
    def from_nodes(cls, nodes: Dict[str, Tuple[float, float]]) -> "RoutingSimulationEnvironment":
        matrix = {}
        for a, coord_a in nodes.items():
            for b, coord_b in nodes.items():
                if a == b:
                    continue
                dist = np.linalg.norm(np.array(coord_a) - np.array(coord_b))
                matrix[(a, b)] = float(dist)
        return cls(matrix)

    def route_distance(self, route: Tuple[str, ...]) -> float:
        total = 0.0
        for i in range(len(route) - 1):
            total += self.distance_matrix.get((route[i], route[i+1]), 0.0)
        return total
