"""
Learned agent-based modeling wrapper.
"""

from __future__ import annotations

import numpy as np


class LearnedAgentBasedModel:
    def __init__(self):
        self.transitions = {}

    def fit(self, states: np.ndarray, actions: np.ndarray, rewards: np.ndarray):
        for s, a, r in zip(states, actions, rewards):
            key = (tuple(s), tuple(a))
            self.transitions[key] = r

    def predict_reward(self, state: np.ndarray, action: np.ndarray) -> float:
        key = (tuple(state), tuple(action))
        return self.transitions.get(key, 0.0)
