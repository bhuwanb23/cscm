"""
Integration tests for XAI.
"""

import numpy as np
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from xai.integration import decision_bridge, confidence_metrics, influence_tracker


def test_decision_bridge():
    bridge = decision_bridge.DecisionExplanationBridge()
    bridge.integrate('approve', {0: 0.5, 1: -0.3}, confidence=0.8)
    latest = bridge.latest()
    assert latest['decision'] == 'approve'
    assert 'confidence' in latest['explanation']


def test_confidence():
    estimator = confidence_metrics.ConfidenceEstimator()
    conf = estimator.compute(np.array([0.6, 0.4]))
    assert 0 <= conf <= 1
    summary = estimator.summary(np.array([0.6, 0.4]))
    assert 'mean_confidence' in summary


def test_influence_tracker():
    tracker = influence_tracker.InfluenceTracker()
    top = tracker.track({0: 0.5, 1: 0.2, 2: -0.3}, top_k=2)
    assert len(top) == 2
    tracker.track({0: 0.1, 3: 0.4}, top_k=1)
    history = tracker.top_features_over_time()
    assert history
