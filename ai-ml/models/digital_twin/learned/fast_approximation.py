"""
Fast approximation engine using lookup tables.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, Tuple


class FastApproximationEngine:
    def __init__(self):
        self.lookup: Dict[Tuple[int, int], float] = {}

    def build(self, simulator_outputs: Dict[Tuple[int, int], float]):
        self.lookup = simulator_outputs

    def estimate(self, key: Tuple[int, int]) -> float:
        if key in self.lookup:
            return self.lookup[key]
        closest = min(self.lookup.keys(), key=lambda k: abs(k[0]-key[0])+abs(k[1]-key[1])) if self.lookup else (0,0)
        return self.lookup.get(closest, 0.0)
