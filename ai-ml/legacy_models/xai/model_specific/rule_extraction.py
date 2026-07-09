"""
Rule extraction using decision trees.
"""

from __future__ import annotations

import numpy as np
from sklearn.tree import DecisionTreeClassifier, export_text


class RuleExtractor:
    def __init__(self, max_depth: int = 3, random_state: int = 42):
        self.tree = DecisionTreeClassifier(max_depth=max_depth, random_state=random_state)
        self.rules = None

    def fit(self, X: np.ndarray, y: np.ndarray, feature_names: list[str] | None = None):
        self.tree.fit(X, y)
        self.rules = export_text(self.tree, feature_names=feature_names)
        return self

    def get_rules(self) -> str:
        if self.rules is None:
            raise ValueError("Call fit first")
        return self.rules

    def as_dicts(self, feature_names: list[str]) -> list[dict]:
        if self.tree.tree_ is None:
            raise ValueError("Call fit first")
        tree_ = self.tree.tree_
        rules = []

        def recurse(node: int, conditions: list[str]):
            if tree_.feature[node] != -2:  # not leaf
                name = feature_names[tree_.feature[node]]
                threshold = tree_.threshold[node]
                recurse(tree_.children_left[node], conditions + [f"{name} <= {threshold:.3f}"])
                recurse(tree_.children_right[node], conditions + [f"{name} > {threshold:.3f}"])
            else:
                value = tree_.value[node][0]
                target = int(value.argmax())
                rules.append({'conditions': conditions, 'class': target})

        recurse(0, [])
        return rules
