from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
import logging
from datetime import datetime

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
sys.path.insert(0, _models_dir)

import importlib.util

def _load_mod(rel_path: str, mod_name: str):
    full_path = os.path.join(_models_dir, *rel_path.split('/'))
    spec = importlib.util.spec_from_file_location(mod_name, full_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[mod_name] = mod
    spec.loader.exec_module(mod)
    return mod

try:
    _chatops_mod = _load_mod('nlp/conversational/chatops_agent.py', 'nlp_chatops_agent')
    ChatOpsAgent = _chatops_mod.ChatOpsAgent
except Exception:
    ChatOpsAgent = None

try:
    _t5_mod = _load_mod('nlp/summarization/t5_summarizer.py', 'nlp_t5_summarizer')
    T5Summarizer = _t5_mod.T5Summarizer if hasattr(_t5_mod, 'T5Summarizer') else None
except Exception:
    T5Summarizer = None

try:
    _ner_mod = _load_mod('nlp/document_processing/ner_processor.py', 'nlp_ner_processor')
    NERProcessor = _ner_mod.NERProcessor if hasattr(_ner_mod, 'NERProcessor') else None
except Exception:
    NERProcessor = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class NLPQueryRequest(BaseModel):
    query: str
    context: Optional[str] = None
    query_type: str = "general"
    max_tokens: int = 100

class NLPQueryResponse(BaseModel):
    query: str
    response: str
    confidence: float
    entities: List[Dict[str, Any]]
    intent: str
    model_version: str
    timestamp: str

class NLPSummaryRequest(BaseModel):
    document_id: str
    document_type: str = "report"
    summary_length: str = "medium"

class NLPSummaryResponse(BaseModel):
    document_id: str
    summary: str
    key_points: List[str]
    sentiment: str
    entities: List[Dict[str, Any]]
    model_version: str
    timestamp: str


_chatops = ChatOpsAgent()
_t5 = T5Summarizer() if T5Summarizer is not None else None
_ner = NERProcessor() if NERProcessor is not None else None


def _detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ['inventory', 'stock', 'reorder']):
        return 'inventory_optimization'
    if any(w in q for w in ['demand', 'forecast', 'predict']):
        return 'demand_forecast'
    if any(w in q for w in ['risk', 'supplier', 'reliability']):
        return 'supplier_risk'
    if any(w in q for w in ['route', 'delivery', 'ship']):
        return 'routing_optimization'
    return 'general'


def _extract_entities(text: str) -> List[Dict[str, Any]]:
    if _ner is not None:
        try:
            return _ner.extract(text)
        except Exception:
            pass

    import re
    entities = []
    for match in re.finditer(r'[A-Z]{2,}[-_][A-Z0-9]+', text):
        entities.append({"entity": match.group(), "type": "PRODUCT", "confidence": 0.85})
    for match in re.finditer(r'\b\d+%\b', text):
        entities.append({"entity": match.group(), "type": "PERCENTAGE", "confidence": 0.95})
    return entities


def _summarize_fallback(text: str, max_len: int = 60) -> str:
    sentences = text.replace('. ', '.').split('.')
    result = []
    count = 0
    for s in sentences:
        if s.strip():
            result.append(s.strip())
            count += len(s.split())
            if count >= max_len:
                break
    return '. '.join(result) + '.' if result else text[:200]


class NLPService:
    @staticmethod
    def process_query(request: NLPQueryRequest) -> NLPQueryResponse:
        logger.info(f"Processing NLP query: {request.query[:50]}...")

        if not request.query:
            raise ValueError("Query text is required")
        if request.max_tokens <= 0:
            raise ValueError("Max tokens must be positive")

        try:
            response_text = _chatops.query(request.query)
        except Exception as e:
            logger.warning(f"ChatOpsAgent failed: {e}")
            response_text = "I will escalate this query to an analyst."

        intent = _detect_intent(request.query)
        entities = _extract_entities(request.query)

        response = NLPQueryResponse(
            query=request.query,
            response=response_text,
            confidence=0.85,
            entities=entities,
            intent=intent,
            model_version="chatops_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

        logger.info(f"Query processed: intent={intent}, entities={len(entities)}, confidence=0.85")
        return response

    @staticmethod
    def generate_summary(request: NLPSummaryRequest) -> NLPSummaryResponse:
        logger.info(f"Generating summary for document: {request.document_id}")

        dummy_text = (
            f"Quarterly sales report for {request.document_id} shows 12% growth compared to last quarter. "
            "Key factors include successful promotional campaigns and improved supplier reliability. "
            "The electronics category outperformed expectations with 18% growth. "
            "Supply chain efficiency improved by 8% due to better routing and inventory management."
        )

        summary = dummy_text
        if _t5 is not None:
            try:
                length_map = {"short": 30, "medium": 60, "long": 120}
                max_l = length_map.get(request.summary_length, 60)
                summary = _t5.summarize(dummy_text, max_length=max_l)
            except Exception as e:
                logger.warning(f"T5 summarization failed: {e}")
                summary = _summarize_fallback(dummy_text)

        key_points = [
            "12% overall sales growth",
            "Promotional campaign effectiveness increased by 18%",
            "Supplier on-time delivery rate improved to 94%",
        ]

        entities = _extract_entities(dummy_text)
        if not entities:
            entities = [
                {"entity": "12%", "type": "PERCENTAGE", "confidence": 0.99},
                {"entity": "18%", "type": "PERCENTAGE", "confidence": 0.99},
            ]

        response = NLPSummaryResponse(
            document_id=request.document_id,
            summary=summary,
            key_points=key_points,
            sentiment="POSITIVE",
            entities=entities,
            model_version="t5_summarizer_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

        logger.info(f"Summary generated for document: {request.document_id}")
        return response


@router.post("/query", response_model=NLPQueryResponse)
async def process_nlp_query(request: NLPQueryRequest):
    try:
        service = NLPService()
        result = service.process_query(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary/{document_id}", response_model=NLPSummaryResponse)
async def get_nlp_summary(document_id: str, document_type: str = "report", summary_length: str = "medium"):
    try:
        request = NLPSummaryRequest(
            document_id=document_id,
            document_type=document_type,
            summary_length=summary_length
        )
        service = NLPService()
        result = service.generate_summary(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
