"""
Counterfactual and rationale tests.
"""

import numpy as np
import os
import sys
from sklearn.linear_model import LogisticRegression
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'xai_sample.csv')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from xai.counterfactuals import counterfactual_engine, what_if, rationale_generator


def build_model():
    df = pd.read_csv(DATA)
    X = df[['feature1', 'feature2', 'feature3']].values
    y = df['target'].values
    model = LogisticRegression().fit(X, y)
    return model, X


def test_counterfactual():
    model, X = build_model()
    engine = counterfactual_engine.CounterfactualEngine(lambda data: model.predict_proba(data)[:, 1])
    result = engine.generate(X[0], target=1)
    assert 'counterfactual' in result
    assert result['final_prediction'] >= 0.5


def test_what_if():
    model, X = build_model()
    sim = what_if.WhatIfSimulator(lambda data: model.predict_proba(data)[:, 1])
    score = sim.simulate(X[0], {0: 0.5})
    assert isinstance(score, float)
    scenarios = sim.batch_simulate(X[0], {'up': {0: 0.5}, 'down': {0: -0.5}})
    assert 'up' in scenarios


def test_rationale():
    gen = rationale_generator.RationaleGenerator()
    rationale = gen.generate({0: 0.4, 1: -0.2})
    assert 'increased' in rationale or 'decreased' in rationale
