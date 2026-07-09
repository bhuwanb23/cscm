"""
Unit tests for knowledge graph components.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestGraphSchema:
    """Tests for knowledge_graph.graph_db.schema."""

    def test_entity_creation(self):
        from knowledge_graph.graph_db.schema import Entity
        entity = Entity(id="supplier_1", type="supplier", attributes={"name": "Acme Corp"})
        assert entity.id == "supplier_1"
        assert entity.type == "supplier"

    def test_relationship_creation(self):
        from knowledge_graph.graph_db.schema import Relationship
        rel = Relationship(source="s1", target="p1", type="supplies", attributes={})
        assert rel.source == "s1"
        assert rel.target == "p1"


class TestGraphStore:
    """Tests for knowledge_graph.graph_db.graph_store."""

    def test_add_entity(self):
        from knowledge_graph.graph_db.graph_store import GraphStore
        from knowledge_graph.graph_db.schema import Entity
        store = GraphStore()
        entity = Entity(id="n1", type="supplier", attributes={"name": "Acme"})
        store.add_entity(entity)
        result = store.get_entity("n1")
        assert result is not None

    def test_add_relationship(self):
        from knowledge_graph.graph_db.graph_store import GraphStore
        from knowledge_graph.graph_db.schema import Entity, Relationship
        store = GraphStore()
        store.add_entity(Entity(id="s1", type="supplier", attributes={}))
        store.add_entity(Entity(id="p1", type="product", attributes={}))
        store.add_relationship(Relationship(source="s1", target="p1", type="supplies", attributes={}))
        neighbors = store.neighbors("s1")
        assert "p1" in neighbors
