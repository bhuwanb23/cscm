"""
Unit tests for Explainable AI (XAI) components.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))

TEST_DATA = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'test', 'xai_sample.csv')


class TestSHAPExplainer:
    """Tests for xai.feature_attribution.shap_explainer."""

    def test_tabular_shap(self):
        from xai.feature_attribution import shap_explainer
        from sklearn.linear_model import LogisticRegression

        df = pd.read_csv(TEST_DATA)
        X = df[['feature1', 'feature2', 'feature3']].values
        y = df['target'].values
        model = LogisticRegression().fit(X, y)

        explainer = shap_explainer.TabularSHAPExplainer(
            lambda data: model.predict_proba(data)[:, 1], X
        )
        values = explainer.explain(X[0])
        assert len(values) == 3


class TestLIMEExplainer:
    """Tests for xai.feature_attribution.lime_explainer."""

    def test_tabular_lime(self):
        from xai.feature_attribution import lime_explainer
        from sklearn.linear_model import LogisticRegression

        df = pd.read_csv(TEST_DATA)
        X = df[['feature1', 'feature2', 'feature3']].values
        y = df['target'].values
        model = LogisticRegression().fit(X, y)

        explainer = lime_explainer.TabularLIMEExplainer(
            lambda data: model.predict_proba(data)[:, 1],
            training_data=X
        )
        weights = explainer.explain(X[0])
        assert len(weights) == 3


class TestFeatureViz:
    """Tests for xai.feature_attribution.feature_viz."""

    def test_compute_importance(self):
        from xai.feature_attribution import feature_viz
        viz = feature_viz.FeatureImportanceVisualizer()
        report = viz.compute_importance({0: 0.5, 1: -0.2, 2: 0.8})
        assert len(report) == 3
        assert all('normalized' in r for r in report)

    def test_to_dataframe(self):
        from xai.feature_attribution import feature_viz
        viz = feature_viz.FeatureImportanceVisualizer()
        values = {0: 0.5, 1: -0.2}
        df = viz.to_dataframe(values)
        assert not df.empty
        assert len(df) == 2


class TestCounterfactualEngine:
    """Tests for xai.counterfactuals.counterfactual_engine."""

    def test_generate(self):
        from xai.counterfactuals.counterfactual_engine import CounterfactualEngine
        from sklearn.linear_model import LogisticRegression
        from sklearn.datasets import make_classification

        X, y = make_classification(n_samples=100, n_features=3, n_informative=2, n_redundant=0, random_state=42)
        model = LogisticRegression().fit(X, y)
        engine = CounterfactualEngine(model_fn=lambda x: model.predict_proba(x)[:, 1])
        result = engine.generate(instance=X[0], target=0.9)
        assert 'counterfactual' in result
