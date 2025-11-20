"""
Fulfillment center placement evaluator.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, Tuple


class FulfillmentPlacementEvaluator:
    def __init__(self, demand_nodes: Dict[str, Tuple[float, float, float]]):
        self.demand_nodes = demand_nodes  # name -> (x,y, demand)

    def score_location(self, location: Tuple[float, float]) -> float:
        total = 0.0
        loc = np.array(location)
        for _, (x, y, demand) in self.demand_nodes.items():
            dist = np.linalg.norm(loc - np.array([x, y]))
            total += demand * dist
        return total

    def recommend(self, candidates: Dict[str, Tuple[float, float]]) -> Dict[str, float]:
        return {name: self.score_location(coord) for name, coord in candidates.items()}
