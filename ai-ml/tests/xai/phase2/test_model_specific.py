"""
Model-specific XAI tests.
"""

import numpy as np
import os
import sys
from sklearn.tree import DecisionTreeClassifier

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from xai.model_specific import attention_viz, rule_extraction, surrogate_tree


def test_attention_viz():
    weights = np.random.rand(2, 4, 4)
    viz = attention_viz.AttentionVisualizer()
    summary = viz.summarize(weights)
    assert 'mean_attention' in summary
    token_summary = viz.token_attention(weights, tokens=['a', 'b', 'c', 'd'])
    assert 'a' in token_summary


def test_rule_extractor():
    X = np.random.rand(20, 3)
    y = np.random.randint(0, 2, size=20)
    extractor = rule_extraction.RuleExtractor(max_depth=2)
    extractor.fit(X, y, feature_names=['a', 'b', 'c'])
    rules = extractor.get_rules()
    assert 'class' in rules.lower()
    structured = extractor.as_dicts(['a', 'b', 'c'])
    assert isinstance(structured, list)


def test_surrogate_tree():
    X = np.random.rand(30, 3)
    y = np.random.rand(30)
    surrogate = surrogate_tree.SurrogateTreeApproximator()
    surrogate.fit(X, y)
    preds = surrogate.predict(X[:3])
    assert preds.shape[0] == 3
    class DummyModel:
        def predict(self, data):
            return np.sum(data, axis=1)
    surrogate.fit_with_model(X, DummyModel())
