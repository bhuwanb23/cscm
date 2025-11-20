"""
Phase 3 probabilistic tests.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA_PATH = os.path.join(ROOT_DIR, 'data', 'test', 'supplier_risk_data.csv')
EDGE_PATH = os.path.join(ROOT_DIR, 'data', 'test', 'supplier_network_edges.csv')
sys.path.insert(0, os.path.join(ROOT_DIR, 'models'))
sys.modules.pop('supplier_risk', None)

from supplier_risk.probabilistic import SupplierBayesianNetwork, SupplierGraphEmbedder, CorrelatedRiskAnalyzer


def load_data():
    return pd.read_csv(DATA_PATH)


def test_bayesian_network():
    df = load_data()
    cols = ['financial_score', 'region']
    bn = SupplierBayesianNetwork()
    bn.fit(df[['event_flag'] + cols].fillna(0), feature_cols=cols)
    probs = bn.predict_proba(df.iloc[0][cols])
    assert sum(probs.values()) == pytest.approx(1.0)


def test_graph_embeddings():
    edges = pd.read_csv(EDGE_PATH)
    embedder = SupplierGraphEmbedder(dimensions=4)
    embedder.fit(edges)
    emb = embedder.get_embedding(1)
    assert emb.shape[0] == 4


def test_correlated_risk():
    analyzer = CorrelatedRiskAnalyzer()
    analyzer.fit(load_data())
    risk = analyzer.scenario_risk({'financial_score': 0.2, 'lead_time_std': 0.5})
    assert isinstance(risk, float)

