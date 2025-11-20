"""
Phase 3 learned simulator tests.
"""

import pytest
import numpy as np
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from digital_twin.learned import surrogate_model, fast_approximation, abm_learned

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


@pytest.mark.skipif(not HAS_TORCH, reason="PyTorch required")
def test_surrogate_model():
    model = surrogate_model.NeuralSurrogateModel(input_dim=2)
    X = np.random.rand(10, 2)
    y = np.random.rand(10, 1)
    model.fit(X, y, epochs=10)
    preds = model.predict(X)
    assert preds.shape == (10, 1)


def test_fast_approximation():
    engine = fast_approximation.FastApproximationEngine()
    engine.build({(1, 1): 10.0})
    assert engine.estimate((1, 1)) == 10.0


def test_learned_abm():
    abm = abm_learned.LearnedAgentBasedModel()
    states = np.array([[1, 2], [2, 3]])
    actions = np.array([[0], [1]])
    rewards = np.array([5.0, 7.0])
    abm.fit(states, actions, rewards)
    assert abm.predict_reward(np.array([1, 2]), np.array([0])) == 5.0
