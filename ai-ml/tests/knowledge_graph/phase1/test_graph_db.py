"""Phase 1 graph DB tests."""

import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test', 'kg_graph.json')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from knowledge_graph.graph_db import ingestion, graph_store, schema, neo4j_adapter


def test_ingestion_loads_entities():
    store = ingestion.load_graph(DATA)
    neighbors = store.neighbors('SupplierA')
    assert 'DC1' in neighbors


def test_neo4j_adapter():
    adapter = neo4j_adapter.Neo4jAdapter(neo4j_adapter.Neo4jConfig('bolt://localhost', 'neo4j', 'pass'))
    adapter.connect()
    response = adapter.ingest('CREATE (n)')
    assert 'Executed' in response
