"""Phase 3 reasoning tests."""

import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from knowledge_graph.reasoning import rules_engine, neuro_symbolic, constraint_planner
from knowledge_graph.embeddings import node2vec
from knowledge_graph.graph_db import ingestion

DATA = os.path.join(ROOT, 'data', 'test', 'kg_graph.json')


def test_rules_engine():
    engine = rules_engine.BusinessRulesEngine()
    engine.add_rule(lambda ctx: 'late' if ctx.get('lead_time', 0) > 7 else '')
    alerts = engine.evaluate({'lead_time': 8})
    assert 'late' in alerts


def test_neuro_symbolic():
    store = ingestion.load_graph(DATA)
    embedder = node2vec.Node2VecEmbedder(store)
    embedder.fit()
    engine = rules_engine.BusinessRulesEngine()
    reasoner = neuro_symbolic.NeuroSymbolicReasoner(engine, embedder)
    result = reasoner.explain({'entity': 'SupplierA'})
    assert 'embedding' in result


def test_constraint_planner():
    planner = constraint_planner.ConstraintPlanner()
    planner.add_max_constraint('lead_time', 5)
    results = planner.evaluate({'lead_time': 4})
    assert results['lead_time']
