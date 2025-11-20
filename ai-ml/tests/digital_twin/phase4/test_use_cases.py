"""
Phase 4 use-case tests.
"""

import numpy as np
import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from digital_twin.use_cases import rl_environment, policy_impact, fulfillment_placement


def test_rl_environment():
    env = rl_environment.DigitalTwinRLEnvironment()
    state = env.reset()
    assert state > 0
    next_state, reward, done = env.step(10)
    assert isinstance(reward, float)


def test_policy_impact():
    analyzer = policy_impact.PolicyImpactAnalyzer({'throughput': 100})
    delta = analyzer.compare({'throughput': 120})
    assert delta['throughput'] == 20


def test_fulfillment_placement():
    evaluator = fulfillment_placement.FulfillmentPlacementEvaluator({'Store1': (0, 0, 50)})
    scores = evaluator.recommend({'Candidate': (1, 1)})
    assert 'Candidate' in scores
