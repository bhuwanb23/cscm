"""Phase 4 use-case tests."""

import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'kg_graph.json')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from knowledge_graph.graph_db import ingestion
from knowledge_graph.embeddings import node2vec
from knowledge_graph.use_cases import root_cause, similarity, constraint_system
from knowledge_graph.reasoning import constraint_planner


def build_embedder():
    store = ingestion.load_graph(DATA)
    embedder = node2vec.Node2VecEmbedder(store)
    embedder.fit()
    return store, embedder


def test_root_cause():
    store, _ = build_embedder()
    analyzer = root_cause.RootCauseAnalyzer(store)
    path = analyzer.trace_path('SupplierA', 'Store1')
    assert path


def test_similarity():
    _, embedder = build_embedder()
    sim_engine = similarity.SupplierSimilarity(embedder)
    sims = sim_engine.most_similar('SupplierA')
    assert isinstance(sims, list)


def test_constraint_system():
    planner = constraint_planner.ConstraintPlanner()
    planner.add_min_constraint('fill_rate', 0.95)
    system = constraint_system.ConstraintReasoner(planner)
    results = system.evaluate_plan({'fill_rate': 0.97})
    assert results['fill_rate']
