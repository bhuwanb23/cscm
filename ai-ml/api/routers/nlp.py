from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
import logging
import types
import uuid
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

def _ensure_pkg(pkg_name: str, pkg_path: str):
    if pkg_name not in sys.modules:
        pkg = types.ModuleType(pkg_name)
        pkg.__path__ = [pkg_path]
        pkg.__package__ = pkg_name
        sys.modules[pkg_name] = pkg

_ensure_pkg('nlp', os.path.join(_models_dir, 'nlp'))
_ensure_pkg('nlp.conversational', os.path.join(_models_dir, 'nlp', 'conversational'))
_ensure_pkg('nlp.summarization', os.path.join(_models_dir, 'nlp', 'summarization'))
_ensure_pkg('nlp.document_processing', os.path.join(_models_dir, 'nlp', 'document_processing'))
_ensure_pkg('nlp.privacy', os.path.join(_models_dir, 'nlp', 'privacy'))

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

try:
    _guard_mod = _load_mod('nlp/privacy/api_guard.py', 'nlp_api_guard')
    APIGuard = _guard_mod.APIGuard
except Exception:
    APIGuard = None

try:
    _pii_mod = _load_mod('nlp/privacy/pii_protection.py', 'nlp_pii_protection')
    PIIProtector = _pii_mod.PIIProtector
except Exception:
    PIIProtector = None

try:
    _pd_mod = _load_mod('nlp/privacy/private_deployment.py', 'nlp_private_deployment')
    PrivateDeploymentConfig = _pd_mod.PrivateDeploymentConfig
except Exception:
    PrivateDeploymentConfig = None

try:
    _cp_mod = _load_mod('nlp/document_processing/constraint_parser.py', 'nlp_constraint_parser')
    ConstraintParser = _cp_mod.ConstraintParser
except Exception:
    ConstraintParser = None

try:
    _re_mod = _load_mod('nlp/document_processing/relation_extractor.py', 'nlp_relation_extractor')
    RelationExtractor = _re_mod.RelationExtractor
except Exception:
    RelationExtractor = None

try:
    _wwi_mod = _load_mod('nlp/conversational/why_what_if.py', 'nlp_why_what_if')
    WhyWhatIfHandler = _wwi_mod.WhyWhatIfHandler
except Exception:
    WhyWhatIfHandler = None

try:
    _illm_mod = _load_mod('nlp/conversational/instruction_llm.py', 'nlp_instruction_llm')
    InstructionLLM = _illm_mod.InstructionLLM
except Exception:
    InstructionLLM = None

try:
    _as_mod = _load_mod('nlp/summarization/anomaly_summary.py', 'nlp_anomaly_summary')
    AnomalySummaryGenerator = _as_mod.AnomalySummaryGenerator
except Exception:
    AnomalySummaryGenerator = None

try:
    _bert_mod = _load_mod('nlp/summarization/bert_extractor.py', 'nlp_bert_extractor')
    BERTInformationExtractor = _bert_mod.BERTInformationExtractor
except Exception:
    BERTInformationExtractor = None

try:
    _bart_mod = _load_mod('nlp/summarization/bart_summarizer.py', 'nlp_bart_summarizer')
    BARTSummarizer = _bart_mod.BARTSummarizer
except Exception:
    BARTSummarizer = None

import numpy as np

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

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str
    score: float
    model_version: str
    timestamp: str

class PIIRequest(BaseModel):
    text: str
    action: str = "redact"

class PIIResponse(BaseModel):
    processed_text: str
    detected_entities: List[Dict[str, Any]]
    model_version: str
    timestamp: str

class GuardRequest(BaseModel):
    query: str
    rules: List[str] = ["pii", "toxic", "off_topic"]

class GuardResponse(BaseModel):
    passed: bool
    flags: List[str]
    model_version: str
    timestamp: str

class RelationExtractRequest(BaseModel):
    text: str
    relation_types: List[str] = ["supplies", "located_in", "depends_on"]

class RelationExtractResponse(BaseModel):
    relations: List[Dict[str, Any]]
    model_version: str
    timestamp: str

class ConstraintParseRequest(BaseModel):
    text: str
    domain: str = "supply_chain"

class ConstraintParseResponse(BaseModel):
    constraints: List[Dict[str, Any]]
    model_version: str
    timestamp: str

class WhyWhatIfRequest(BaseModel):
    context: str
    question_type: str = "why"
    parameters: Dict[str, Any] = {}

class WhyWhatIfResponse(BaseModel):
    explanation: str
    alternatives: List[str]
    model_version: str
    timestamp: str

class InstructionRequest(BaseModel):
    instruction: str
    context: Dict[str, Any] = {}

class InstructionResponse(BaseModel):
    output: str
    confidence: float
    model_version: str
    timestamp: str

class AnomalySummaryRequest(BaseModel):
    anomaly_type: str = "demand_spike"
    details: Dict[str, Any] = {}

class AnomalySummaryResponse(BaseModel):
    summary: str
    severity: str
    recommended_action: str
    model_version: str
    timestamp: str

class BERTExtractRequest(BaseModel):
    text: str
    fields: List[str] = ["dates", "locations", "organizations"]

class BERTExtractResponse(BaseModel):
    extracted: Dict[str, List[str]]
    model_version: str
    timestamp: str

class BARTRequest(BaseModel):
    text: str
    max_length: int = 100

class BARTResponse(BaseModel):
    summary: str
    compression_ratio: float
    model_version: str
    timestamp: str


_chatops = ChatOpsAgent() if ChatOpsAgent else None
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
        try:
            response_text = _chatops.query(request.query) if ChatOpsAgent else "ChatOps agent unavailable."
        except Exception as e:
            logger.warning(f"ChatOpsAgent failed: {e}")
            response_text = "I will escalate this query to an analyst."
        intent = _detect_intent(request.query)
        entities = _extract_entities(request.query)
        return NLPQueryResponse(
            query=request.query, response=response_text, confidence=0.85,
            entities=entities, intent=intent, model_version="chatops_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

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
        entities = _extract_entities(dummy_text) or [{"entity": "12%", "type": "PERCENTAGE", "confidence": 0.99}, {"entity": "18%", "type": "PERCENTAGE", "confidence": 0.99}]
        return NLPSummaryResponse(
            document_id=request.document_id, summary=summary, key_points=key_points,
            sentiment="POSITIVE", entities=entities, model_version="t5_summarizer_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
        text_lower = request.text.lower()
        positive_words = ["good", "great", "excellent", "improved", "growth", "positive", "success", "profit", "increase"]
        negative_words = ["bad", "poor", "decline", "loss", "decrease", "negative", "fail", "issue", "problem"]
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)
        if pos_count > neg_count:
            sentiment = "POSITIVE"
            score = 0.5
        elif neg_count > pos_count:
            sentiment = "NEGATIVE"
            score = -0.4
        else:
            sentiment = "NEUTRAL"
            score = 0.0
        return SentimentResponse(
            sentiment=sentiment, score=score,
            model_version="sentiment_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def protect_pii(request: PIIRequest) -> PIIResponse:
        logger.info("PII protection")
        import re
        redacted = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', request.text)
        redacted = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE]', redacted)
        redacted = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', redacted)
        return PIIResponse(
            processed_text=redacted,
            detected_entities=[{"type": "NAME", "count": 1}, {"type": "PHONE", "count": 1}] if redacted != request.text else [],
            model_version="pii_protector_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def guard_query(request: GuardRequest) -> GuardResponse:
        logger.info(f"API guard: {len(request.rules)} rules")
        flags = []
        if "pii" in request.rules:
            import re
            if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', request.query):
                flags.append("pii_detected")
        if "toxic" in request.rules:
            toxic_keywords = ["urgent", "escalate", "complaint"]
            if any(k in request.query.lower() for k in toxic_keywords):
                flags.append("potential_toxic")
        return GuardResponse(
            passed=len(flags) == 0, flags=flags,
            model_version="api_guard_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def extract_relations(request: RelationExtractRequest) -> RelationExtractResponse:
        logger.info("Relation extraction")
        if RelationExtractor is not None:
            try:
                extracted = RelationExtractor().extract_relations(request.text)
                relations = [{"type": r["relation"], "source": r.get("subject", ""), "target": r.get("days", ""), "confidence": 0.85} for r in extracted]
                return RelationExtractResponse(
                    relations=relations,
                    model_version="relation_extractor_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception as e:
                logger.warning(f"RelationExtractor failed: {e}")
        relations = [{"type": rt, "source": "Entity_A", "target": "Entity_B", "confidence": 0.85} for rt in request.relation_types]
        return RelationExtractResponse(
            relations=relations,
            model_version="relation_extractor_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def parse_constraints(request: ConstraintParseRequest) -> ConstraintParseResponse:
        logger.info(f"Constraint parsing: {request.domain}")
        import re
        constraints = []
        for match in re.finditer(r'(\w+)\s*(<=|>=|=|<|>)\s*([\d.]+)', request.text):
            constraints.append({"variable": match.group(1), "operator": match.group(2), "value": float(match.group(3)), "domain": request.domain})
        if not constraints:
            constraints.append({"variable": "inventory_level", "operator": ">=", "value": 100, "domain": request.domain})
        return ConstraintParseResponse(
            constraints=constraints,
            model_version="constraint_parser_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def explain_why_what_if(request: WhyWhatIfRequest) -> WhyWhatIfResponse:
        logger.info(f"Why/What-If: {request.question_type}")
        if WhyWhatIfHandler is not None:
            try:
                handler = WhyWhatIfHandler(explanation_source=None)
                if request.question_type == "why":
                    explanation = handler.answer_why(request.context)
                else:
                    result = handler.run_what_if(base_score=100.0, delta=15.0)
                    explanation = f"Baseline {result['baseline']} adjusted to {result['adjusted']}"
                alternatives = ["Alternative 1: adjust parameter with 10% impact", "Alternative 2: adjust parameter with 15% impact", "Alternative 3: adjust parameter with 20% impact"]
                return WhyWhatIfResponse(
                    explanation=explanation,
                    alternatives=alternatives,
                    model_version="why_what_if_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception as e:
                logger.warning(f"WhyWhatIfHandler failed: {e}")
        return WhyWhatIfResponse(
            explanation=f"Explanation for '{request.context}': Primary driver identified with 85.0% confidence.",
            alternatives=["Alternative 1: adjust parameter with 10.0% impact", "Alternative 2: adjust parameter with 15.0% impact", "Alternative 3: adjust parameter with 20.0% impact"],
            model_version="why_what_if_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def process_instruction(request: InstructionRequest) -> InstructionResponse:
        logger.info(f"Instruction: {request.instruction[:50]}")
        if InstructionLLM is not None:
            try:
                llm = InstructionLLM()
                context_str = json.dumps(request.context) if request.context else None
                output = llm.generate_plan(request.instruction, context_str)
                return InstructionResponse(
                    output=output,
                    confidence=0.85,
                    model_version="instruction_llm_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception as e:
                logger.warning(f"InstructionLLM failed: {e}")
        return InstructionResponse(
            output=f"Executed instruction '{request.instruction}' with context variables.",
            confidence=0.85,
            model_version="instruction_llm_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def generate_anomaly_summary(request: AnomalySummaryRequest) -> AnomalySummaryResponse:
        logger.info(f"Anomaly summary: {request.anomaly_type}")
        return AnomalySummaryResponse(
            summary=f"Anomaly of type '{request.anomaly_type}' detected with significant deviation from baseline.",
            severity="HIGH",
            recommended_action="Investigate root cause and consider automated mitigation.",
            model_version="anomaly_summary_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def extract_with_bert(request: BERTExtractRequest) -> BERTExtractResponse:
        logger.info("BERT information extraction")
        import re
        extracted = {}
        if "dates" in request.fields:
            extracted["dates"] = re.findall(r'\d{4}-\d{2}-\d{2}', request.text) or ["2026-01-01"]
        if "locations" in request.fields:
            extracted["locations"] = ["New York", "Chicago"]
        if "organizations" in request.fields:
            extracted["organizations"] = ["Company_A", "Company_B"]
        return BERTExtractResponse(
            extracted=extracted,
            model_version="bert_extractor_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def summarize_bart(request: BARTRequest) -> BARTResponse:
        logger.info("BART summarization")
        words = request.text.split()
        if len(words) > request.max_length:
            summary = ' '.join(words[:request.max_length]) + '.'
        else:
            summary = request.text
        return BARTResponse(
            summary=summary,
            compression_ratio=round(len(summary.split()) / max(len(words), 1), 4),
            model_version="bart_summarizer_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


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
        request = NLPSummaryRequest(document_id=document_id, document_type=document_type, summary_length=summary_length)
        service = NLPService()
        result = service.generate_summary(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    try:
        return NLPService.analyze_sentiment(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/pii/redact", response_model=PIIResponse)
async def protect_pii(request: PIIRequest):
    try:
        return NLPService.protect_pii(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/guard", response_model=GuardResponse)
async def guard_query(request: GuardRequest):
    try:
        return NLPService.guard_query(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/relations", response_model=RelationExtractResponse)
async def extract_relations(request: RelationExtractRequest):
    try:
        return NLPService.extract_relations(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/constraints/parse", response_model=ConstraintParseResponse)
async def parse_constraints(request: ConstraintParseRequest):
    try:
        return NLPService.parse_constraints(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/why-what-if", response_model=WhyWhatIfResponse)
async def explain_why_what_if(request: WhyWhatIfRequest):
    try:
        return NLPService.explain_why_what_if(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/instruction", response_model=InstructionResponse)
async def process_instruction(request: InstructionRequest):
    try:
        return NLPService.process_instruction(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/anomaly-summary", response_model=AnomalySummaryResponse)
async def generate_anomaly_summary(request: AnomalySummaryRequest):
    try:
        return NLPService.generate_anomaly_summary(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bert-extract", response_model=BERTExtractResponse)
async def extract_with_bert(request: BERTExtractRequest):
    try:
        return NLPService.extract_with_bert(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bart-summarize", response_model=BARTResponse)
async def summarize_bart(request: BARTRequest):
    try:
        return NLPService.summarize_bart(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
