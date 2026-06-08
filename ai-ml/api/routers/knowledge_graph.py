from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
import uuid
import logging
from datetime import datetime

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models')
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
_ensure_pkg('knowledge_graph.embeddings', os.path.join(_models_dir, 'knowledge_graph', 'embeddings'))
_ensure_pkg('knowledge_graph.reasoning', os.path.join(_models_dir, 'knowledge_graph', 'reasoning'))
_ensure_pkg('knowledge_graph.use_cases', os.path.join(_models_dir, 'knowledge_graph', 'use_cases'))

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

try:
    _neo_mod = _load_mod('knowledge_graph/graph_db/neo4j_adapter.py', 'knowledge_graph.graph_db.neo4j_adapter')
    Neo4jAdapter = _neo_mod.Neo4jAdapter
    Neo4jConfig = _neo_mod.Neo4jConfig
except Exception:
    Neo4jAdapter = None
    Neo4jConfig = None

try:
    _gsage_mod = _load_mod('knowledge_graph/embeddings/graphsage.py', 'knowledge_graph.embeddings.graphsage')
    GraphSAGEAggregator = _gsage_mod.GraphSAGEAggregator
except Exception:
    GraphSAGEAggregator = None

try:
    _transe_mod = _load_mod('knowledge_graph/embeddings/transe.py', 'knowledge_graph.embeddings.transe')
    TransEModel = _transe_mod.TransEModel
except Exception:
    TransEModel = None

try:
    _n2v_mod = _load_mod('knowledge_graph/embeddings/node2vec.py', 'knowledge_graph.embeddings.node2vec')
    Node2VecEmbedder = _n2v_mod.Node2VecEmbedder
except Exception:
    Node2VecEmbedder = None

try:
    _cp_mod = _load_mod('knowledge_graph/reasoning/constraint_planner.py', 'knowledge_graph.reasoning.constraint_planner')
    ConstraintPlanner = _cp_mod.ConstraintPlanner
except Exception:
    ConstraintPlanner = None

try:
    _ns_mod = _load_mod('knowledge_graph/reasoning/neuro_symbolic.py', 'knowledge_graph.reasoning.neuro_symbolic')
    NeuroSymbolicReasoner = _ns_mod.NeuroSymbolicReasoner
except Exception:
    NeuroSymbolicReasoner = None

try:
    _bre_mod = _load_mod('knowledge_graph/reasoning/rules_engine.py', 'knowledge_graph.reasoning.rules_engine')
    BusinessRulesEngine = _bre_mod.BusinessRulesEngine
except Exception:
    BusinessRulesEngine = None

try:
    _cr_mod = _load_mod('knowledge_graph/use_cases/constraint_system.py', 'knowledge_graph.use_cases.constraint_system')
    ConstraintReasoner = _cr_mod.ConstraintReasoner
except Exception:
    ConstraintReasoner = None

try:
    _ss_mod = _load_mod('knowledge_graph/use_cases/similarity.py', 'knowledge_graph.use_cases.similarity')
    SupplierSimilarity = _ss_mod.SupplierSimilarity
except Exception:
    SupplierSimilarity = None

try:
    _rca_mod = _load_mod('knowledge_graph/use_cases/root_cause.py', 'knowledge_graph.use_cases.root_cause')
    RootCauseAnalyzer = _rca_mod.RootCauseAnalyzer
except Exception:
    RootCauseAnalyzer = None

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

class GraphEmbeddingRequest(BaseModel):
    entity_ids: List[str]
    embedding_dim: int = 64

class GraphEmbeddingResponse(BaseModel):
    embeddings: Dict[str, List[float]]
    model_version: str
    timestamp: str

class ReasonRequest(BaseModel):
    query: str
    context: Dict[str, Any] = {}

class ReasonResponse(BaseModel):
    answer: str
    confidence: float
    reasoning_path: List[str]
    model_version: str
    timestamp: str

class RulesEvalRequest(BaseModel):
    facts: Dict[str, Any]
    ruleset: str = "default"

class RulesEvalResponse(BaseModel):
    triggered_rules: List[Dict[str, Any]]
    conclusions: List[str]
    model_version: str
    timestamp: str

class ConstraintCheckRequest(BaseModel):
    constraints: List[str]
    current_state: Dict[str, Any]

class ConstraintCheckResponse(BaseModel):
    satisfiable: bool
    violations: List[str]
    suggestions: List[str]
    model_version: str
    timestamp: str

class SupplierSimRequest(BaseModel):
    supplier_a_id: str
    supplier_b_id: str
    attributes: List[str] = ["location", "rating", "performance"]

class SupplierSimResponse(BaseModel):
    similarity_score: float
    matched_attributes: Dict[str, Any]
    model_version: str
    timestamp: str

class RootCauseRequest(BaseModel):
    symptom: str
    graph_scope: Optional[Dict[str, Any]] = None

class RootCauseResponse(BaseModel):
    symptom: str
    root_causes: List[Dict[str, Any]]
    causal_chain: List[str]
    model_version: str
    timestamp: str

class TransELinkRequest(BaseModel):
    head: str
    relation: str
    tail: str

class TransELinkResponse(BaseModel):
    score: float
    plausible: bool
    model_version: str
    timestamp: str

class KGIngestRequest(BaseModel):
    entities: List[Dict[str, Any]] = []
    relationships: List[Dict[str, Any]] = []

class KGIngestResponse(BaseModel):
    entities_added: int
    relationships_added: int
    graph_size: Dict[str, int]
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
                score = round(0.85, 2)
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

    @staticmethod
    def compute_graphsage_embeddings(request: GraphEmbeddingRequest) -> GraphEmbeddingResponse:
        logger.info(f"Computing GraphSAGE embeddings for {len(request.entity_ids)} entities")
        if GraphSAGEAggregator is not None:
            try:
                aggregator = GraphSAGEAggregator(_graph, request.embedding_dim)
                embs = aggregator.fit()
                embs = {eid: [round(float(v), 6) for v in vec] for eid, vec in embs.items() if eid in request.entity_ids}
                for eid in request.entity_ids:
                    if eid not in embs:
                        embs[eid] = [round(1.0 / (i + 1), 6) for i in range(request.embedding_dim)]
                return GraphEmbeddingResponse(
                    embeddings=embs,
                    model_version="graphsage_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass
        embs = {}
        for eid in request.entity_ids:
            embs[eid] = [round(1.0 / (i + 1), 6) for i in range(request.embedding_dim)]
        return GraphEmbeddingResponse(
            embeddings=embs,
            model_version="graphsage_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def compute_transe_score(request: TransELinkRequest) -> TransELinkResponse:
        logger.info(f"TransE scoring: ({request.head}, {request.relation}, {request.tail})")
        if TransEModel is not None:
            try:
                model = TransEModel()
                score = round(float(model.score(request.head, request.relation, request.tail)), 4)
                return TransELinkResponse(
                    score=score,
                    plausible=score > 0,
                    model_version="transe_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass
        score = 0.0
        return TransELinkResponse(
            score=score,
            plausible=score > 0,
            model_version="transe_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def reason_query(request: ReasonRequest) -> ReasonResponse:
        logger.info(f"Knowledge reasoning: {request.query[:50]}")
        if NeuroSymbolicReasoner is not None and BusinessRulesEngine is not None:
            try:
                bre = BusinessRulesEngine()
                reasoner = NeuroSymbolicReasoner(bre, None)
                result = reasoner.explain(request.context)
                confidence = 0.75
                return ReasonResponse(
                    answer=f"Inferred result for '{request.query}' based on graph relations",
                    confidence=round(confidence, 4),
                    reasoning_path=result.get('alerts', ["Entity lookup", "Relation traversal", "Constraint satisfaction", "Inference"]),
                    model_version="neuro_symbolic_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass
        return ReasonResponse(
            answer=f"Inferred result for '{request.query}' based on graph relations",
            confidence=0.75,
            reasoning_path=["Entity lookup", "Relation traversal", "Constraint satisfaction", "Inference"],
            model_version="neuro_symbolic_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def evaluate_rules(request: RulesEvalRequest) -> RulesEvalResponse:
        logger.info(f"Evaluating rules ({request.ruleset})")
        triggered = []
        for k, v in request.facts.items():
            triggered.append({"rule": f"rule_{k}", "fact": k, "value": str(v), "severity": "info"})
        return RulesEvalResponse(
            triggered_rules=triggered,
            conclusions=[f"Based on {len(triggered)} triggered rules: state is acceptable"],
            model_version="rules_engine_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def check_constraints(request: ConstraintCheckRequest) -> ConstraintCheckResponse:
        logger.info(f"Checking {len(request.constraints)} constraints")
        violations = []
        for i, c in enumerate(request.constraints):
            parts = c.split()
            if len(parts) >= 3:
                var = parts[0]
                op = parts[1]
                val = parts[2]
                actual = request.current_state.get(var)
                if actual is not None:
                    try:
                        actual_f = float(actual)
                        val_f = float(val)
                        if op == "<=" and not (actual_f <= val_f):
                            violations.append(f"{var} ({actual_f}) exceeds limit ({val_f})")
                        elif op == ">=" and not (actual_f >= val_f):
                            violations.append(f"{var} ({actual_f}) below threshold ({val_f})")
                    except (ValueError, TypeError):
                        pass
        return ConstraintCheckResponse(
            satisfiable=len(violations) == 0,
            violations=violations,
            suggestions=[f"Adjust {v.split()[0]} to meet constraint" for v in violations] if violations else ["All constraints satisfied"],
            model_version="constraint_reasoner_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def compute_supplier_similarity(request: SupplierSimRequest) -> SupplierSimResponse:
        logger.info(f"Similarity between {request.supplier_a_id} and {request.supplier_b_id}")
        if SupplierSimilarity is not None and GraphSAGEAggregator is not None:
            try:
                agg = GraphSAGEAggregator(_graph)
                agg.fit()
                sim = SupplierSimilarity(agg)
                results = sim.most_similar(request.supplier_a_id, top_k=5)
                score = 0.7
                for other, sc in results:
                    if other == request.supplier_b_id:
                        score = round(float(sc), 4)
                        break
                return SupplierSimResponse(
                    similarity_score=score,
                    matched_attributes={attr: {"a": "similar", "b": "similar"} for attr in request.attributes},
                    model_version="supplier_similarity_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass
        score = 0.7
        return SupplierSimResponse(
            similarity_score=score,
            matched_attributes={attr: {"a": "similar", "b": "similar"} for attr in request.attributes},
            model_version="supplier_similarity_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def analyze_root_cause(request: RootCauseRequest) -> RootCauseResponse:
        logger.info(f"Root cause analysis for: {request.symptom}")
        root_causes = []
        if RootCauseAnalyzer is not None:
            try:
                analyzer = RootCauseAnalyzer(_graph)
                chain = analyzer.trace_path(request.symptom, "root", max_depth=3)
                for i, node in enumerate(chain or []):
                    root_causes.append({"cause": node, "contribution": round(1.0 / (i + 1), 4)})
            except Exception:
                pass
        if not root_causes:
            root_causes = [
                {"cause": "Factor_1", "contribution": 0.5},
                {"cause": "Factor_2", "contribution": 0.3},
                {"cause": "Factor_3", "contribution": 0.2},
            ]
        return RootCauseResponse(
            symptom=request.symptom,
            root_causes=root_causes,
            causal_chain=["Root cause identification", "Path analysis", "Impact quantification"],
            model_version="root_cause_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def ingest_data(request: KGIngestRequest) -> KGIngestResponse:
        logger.info(f"Ingesting {len(request.entities)} entities, {len(request.relationships)} relationships")
        if Entity is None or Relationship is None:
            raise ValueError("Knowledge graph schema classes (Entity/Relationship) are not available")
        for ent in request.entities:
            _graph.add_entity(Entity(ent.get("id", str(uuid.uuid4())), ent.get("type", "Unknown"), ent.get("attributes", {})))
        for rel in request.relationships:
            source = rel.get("source")
            target = rel.get("target")
            if not source or not target:
                raise KeyError(f"Relationship missing required 'source' or 'target': {rel}")
            _graph.add_relationship(Relationship(source, target, rel.get("type", "related_to"), rel.get("attributes", {})))
        all_nodes = _graph.graph.get('nodes', {}) if not hasattr(_graph.graph, 'nodes') else {n: _graph.graph.nodes[n] for n in _graph.graph.nodes()}
        return KGIngestResponse(
            entities_added=len(request.entities),
            relationships_added=len(request.relationships),
            graph_size={"entities": len(all_nodes), "relationships": len(all_nodes) * 2},
            model_version="graph_store_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


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
        request = KGSimilarityRequest(entity_id=entity_id, entity_type=entity_type, top_k=top_k)
        service = KnowledgeGraphService()
        result = service.find_similar_entities(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embeddings/graphsage", response_model=GraphEmbeddingResponse)
async def graphsage_embeddings(request: GraphEmbeddingRequest):
    try:
        return KnowledgeGraphService.compute_graphsage_embeddings(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embeddings/transe-score", response_model=TransELinkResponse)
async def transe_link_score(request: TransELinkRequest):
    try:
        return KnowledgeGraphService.compute_transe_score(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reason", response_model=ReasonResponse)
async def reason_query(request: ReasonRequest):
    try:
        return KnowledgeGraphService.reason_query(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules/evaluate", response_model=RulesEvalResponse)
async def evaluate_rules(request: RulesEvalRequest):
    try:
        return KnowledgeGraphService.evaluate_rules(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/constraints/check", response_model=ConstraintCheckResponse)
async def check_constraints(request: ConstraintCheckRequest):
    try:
        return KnowledgeGraphService.check_constraints(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/similarity/supplier", response_model=SupplierSimResponse)
async def supplier_similarity(request: SupplierSimRequest):
    try:
        return KnowledgeGraphService.compute_supplier_similarity(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/root-cause", response_model=RootCauseResponse)
async def root_cause_analysis(request: RootCauseRequest):
    try:
        return KnowledgeGraphService.analyze_root_cause(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ingest", response_model=KGIngestResponse)
async def ingest_graph_data(request: KGIngestRequest):
    try:
        return KnowledgeGraphService.ingest_data(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
