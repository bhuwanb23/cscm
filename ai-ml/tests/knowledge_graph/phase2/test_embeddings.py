"""Phase 2 embeddings tests."""

import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'kg_graph.json')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from knowledge_graph.graph_db import ingestion
from knowledge_graph.embeddings import node2vec, transe, graphsage


def load_store():
    return ingestion.load_graph(DATA)


def test_node2vec_embeddings():
    store = load_store()
    embedder = node2vec.Node2VecEmbedder(store)
    embedder.fit()
    assert 'SupplierA' in embedder.embeddings


def test_transe_score():
    model = transe.TransEModel()
    score = model.train_step(('SupplierA', 'supplies', 'DC1'))
    assert isinstance(score, float)


def test_graphsage_similarity():
    store = load_store()
    sage = graphsage.GraphSAGEAggregator(store)
    sage.fit()
    sim = sage.similarity('SupplierA', 'SupplierB')
    assert isinstance(sim, float)
