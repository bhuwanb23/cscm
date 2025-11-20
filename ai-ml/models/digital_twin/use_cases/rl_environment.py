"""
Digital twin RL environment.
"""

from __future__ import annotations

import numpy as np
from typing import Tuple


class DigitalTwinRLEnvironment:
    def __init__(self, demand_mean: float = 20.0, max_inventory: float = 200.0):
        self.demand_mean = demand_mean
        self.max_inventory = max_inventory
        self.inventory = max_inventory / 2
        self.step_count = 0

    def reset(self) -> float:
        self.inventory = self.max_inventory / 2
        self.step_count = 0
        return self.inventory

    def step(self, action: float) -> Tuple[float, float, bool]:
        self.inventory = min(self.max_inventory, self.inventory + action)
        demand = np.random.poisson(self.demand_mean)
        fulfilled = min(self.inventory, demand)
        self.inventory -= fulfilled
        reward = fulfilled - 0.1 * action
        self.step_count += 1
        done = self.step_count >= 50
        return self.inventory, reward, done
