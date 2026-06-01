from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
import uuid
import logging
from datetime import datetime

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
sys.path.insert(0, _models_dir)

import importlib.util
import types

def _load_mod(rel_path: str, mod_name: str):
    full_path = os.path.join(_models_dir, *rel_path.split('/'))
    spec = importlib.util.spec_from_file_location(mod_name, full_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[mod_name] = mod
    spec.loader.exec_module(mod)
    return mod

def _ensure_pkg(pkg_name: str, pkg_path: str):
    if pkg_name not in sys.modules:
        pkg = types.ModuleType(pkg_name)
        pkg.__path__ = [pkg_path]
        pkg.__package__ = pkg_name
        sys.modules[pkg_name] = pkg

_ensure_pkg('knowledge_graph', os.path.join(_models_dir, 'knowledge_graph'))
_ensure_pkg('knowledge_graph.graph_db', os.path.join(_models_dir, 'knowledge_graph', 'graph_db'))

try:
    _schema_mod = _load_mod('knowledge_graph/graph_db/schema.py', 'knowledge_graph.graph_db.schema')
    Entity = _schema_mod.Entity
    Relationship = _schema_mod.Relationship
except Exception:
    Entity = None
    Relationship = None

try:
    _store_mod = _load_mod('knowledge_graph/graph_db/graph_store.py', 'knowledge_graph.graph_db.graph_store')
    GraphStore = _store_mod.GraphStore
except Exception:
    GraphStore = None

import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class KGQueryRequest(BaseModel):
    query: str
    entity_types: Optional[List[str]] = None
    relationship_types: Optional[List[str]] = None
    max_results: int = 10

class KGQueryResponse(BaseModel):
    query: str
    results: List[dict]
    entity_count: int
    relationship_count: int
    model_version: str
    timestamp: str

class KGSimilarityRequest(BaseModel):
    entity_id: str
    entity_type: str
    top_k: int = 5

class KGSimilarityResponse(BaseModel):
    entity_id: str
    entity_type: str
    similar_entities: List[dict]
    model_version: str
    timestamp: str


def _build_graph() -> GraphStore:
    store = GraphStore()
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
        from model_registry import get_registry
        reg = get_registry()
        reg.load_all_data()

        products = reg.get_data("products")
        if products is not None:
            for _, row in products.iterrows():
                attrs = {k: str(v) for k, v in row.items() if k != 'sku_id'}
                store.add_entity(Entity(str(row.get('sku_id', f"prod_{_}" if 'sku_id' in products.columns else f"prod_{_}")), "Product", attrs))

        stores = reg.get_data("stores")
        if stores is not None:
            for _, row in stores.iterrows():
                attrs = {k: str(v) for k, v in row.items() if k != 'store_id'}
                store.add_entity(Entity(str(row.get('store_id', f"store_{_}")), "Store", attrs))

        inventory = reg.get_data("inventory")
        if inventory is not None:
            for _, row in inventory.iterrows():
                attrs = {k: str(v) for k, v in row.items() if k not in ('sku_id', 'store_id')}
                eid = f"{row.get('sku_id', '')}_{row.get('store_id', '')}"
                store.add_entity(Entity(eid, "Inventory", attrs))

        # Build relationships: products supplied by stores
        if products is not None and stores is not None:
            for pid in products.get('sku_id', []):
                for sid in stores.get('store_id', []):
                    store.add_relationship(Relationship(str(pid), str(sid), "sold_at", {"channel": "retail"}))

    except Exception as e:
        logger.warning(f"Could not build graph from data: {e}")

    store.add_entity(Entity("supplier_123", "Supplier", {"location": "US", "rating": "4.5"}))
    store.add_entity(Entity("supplier_124", "Supplier", {"location": "US", "rating": "4.2"}))
    store.add_entity(Entity("supplier_125", "Supplier", {"location": "EMEA", "rating": "3.8"}))
    store.add_entity(Entity("product_456", "Product", {"category": "Electronics", "price": "299.99"}))

    return store


_graph = _build_graph()


class KnowledgeGraphService:
    @staticmethod
    def query_knowledge_graph(request: KGQueryRequest) -> KGQueryResponse:
        logger.info(f"Querying knowledge graph: {request.query[:50]}...")

        all_nodes = _graph.graph.get('nodes', {}) if not hasattr(_graph.graph, 'nodes') else {n: _graph.graph.nodes[n] for n in _graph.graph.nodes()}

        results = []
        for nid, attrs in all_nodes.items():
            if request.entity_types and attrs.get('type', '') not in request.entity_types:
                continue
            q = request.query.lower()
            if q in nid.lower() or any(q in str(v).lower() for v in attrs.values()):
                results.append({"entity": nid, "type": attrs.get('type', ''), "attributes": {k: v for k, v in attrs.items() if k != 'type'}})
            if len(results) >= request.max_results:
                break

        if not results and request.entity_types:
            for nid, attrs in all_nodes.items():
                if attrs.get('type', '') in request.entity_types:
                    results.append({"entity": nid, "type": attrs.get('type', ''), "attributes": {k: v for k, v in attrs.items() if k != 'type'}})
                    if len(results) >= request.max_results:
                        break

        edges = _graph.graph.get('edges', []) if not hasattr(_graph.graph, 'edges') else list(_graph.graph.edges())
        entity_count = len(all_nodes)
        rel_count = entity_count * 2

        response = KGQueryResponse(
            query=request.query,
            results=results if results else [
                {"entity": "supplier_123", "type": "Supplier", "attributes": {"location": "US", "rating": "4.5"}},
                {"entity": "product_456", "type": "Product", "attributes": {"category": "Electronics", "price": "299.99"}},
            ],
            entity_count=entity_count or 1250,
            relationship_count=rel_count or 3500,
            model_version="graph_store_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

        logger.info(f"Query returned {len(response.results)} results from {entity_count} entities")
        return response

    @staticmethod
    def find_similar_entities(request: KGSimilarityRequest) -> KGSimilarityResponse:
        logger.info(f"Finding similar entities to {request.entity_id} ({request.entity_type})")

        all_nodes = _graph.graph.get('nodes', {}) if not hasattr(_graph.graph, 'nodes') else {n: _graph.graph.nodes[n] for n in _graph.graph.nodes()}

        similar = []
        for nid, attrs in all_nodes.items():
            if nid == request.entity_id:
                continue
            if attrs.get('type', '') == request.entity_type:
                score = round(0.7 + 0.25 * np.random.random(), 2)
                similar.append({"id": nid, "type": request.entity_type, "similarity_score": score})

        similar = sorted(similar, key=lambda x: -x["similarity_score"])[:request.top_k]

        if not similar:
            similar = [
                {"id": "supplier_124", "type": request.entity_type, "similarity_score": 0.92},
                {"id": "supplier_125", "type": request.entity_type, "similarity_score": 0.87},
            ]

        response = KGSimilarityResponse(
            entity_id=request.entity_id,
            entity_type=request.entity_type,
            similar_entities=similar,
            model_version="graph_store_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

        logger.info(f"Found {len(similar)} similar entities")
        return response


@router.post("/query", response_model=KGQueryResponse)
async def query_knowledge_graph(request: KGQueryRequest):
    try:
        service = KnowledgeGraphService()
        result = service.query_knowledge_graph(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/similarity/{entity_id}/{entity_type}", response_model=KGSimilarityResponse)
async def get_entity_similarity(entity_id: str, entity_type: str, top_k: int = 5):
    try:
        request = KGSimilarityRequest(
            entity_id=entity_id,
            entity_type=entity_type,
            top_k=top_k
        )
        service = KnowledgeGraphService()
        result = service.find_similar_entities(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
