"""
XAI Feature Attribution tests.
"""

import os
import sys
import pandas as pd
from sklearn.linear_model import LogisticRegression
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'xai_sample.csv')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from xai.feature_attribution import shap_explainer, lime_explainer, feature_viz


def build_model():
    df = pd.read_csv(DATA)
    X = df[['feature1', 'feature2', 'feature3']].values
    y = df['target'].values
    model = LogisticRegression().fit(X, y)
    return model, X, y


def test_shap_explainer():
    model, X, _ = build_model()
    explainer = shap_explainer.TabularSHAPExplainer(lambda data: model.predict_proba(data)[:, 1], X)
    values = explainer.explain(X[0])
    assert len(values) == 3
    viz = feature_viz.FeatureImportanceVisualizer()
    df = viz.to_dataframe(values)
    assert not df.empty


def test_lime_explainer():
    model, X, _ = build_model()
    explainer = lime_explainer.TabularLIMEExplainer(lambda data: model.predict_proba(data)[:, 1], training_data=X)
    weights = explainer.explain(X[0])
    assert len(weights) == 3


def test_feature_viz():
    viz = feature_viz.FeatureImportanceVisualizer()
    report = viz.compute_importance({0: 0.5, 1: -0.2})
    assert report[0]['normalized'] <= 1
