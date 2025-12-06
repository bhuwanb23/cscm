from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

router = APIRouter()

# Pydantic models for request/response
class ExplanationRequest(BaseModel):
    model_id: str
    instance: List[float]
    feature_names: List[str]
    method: str = "shap"
    num_samples: int = 200

class ExplanationResponse(BaseModel):
    model_id: str
    instance: List[float]
    feature_importance: Dict[str, float]
    base_value: float
    prediction: float
    explanation_method: str
    confidence: float
    model_version: str
    timestamp: str

class FeaturesRequest(BaseModel):
    model_id: str

class FeaturesResponse(BaseModel):
    model_id: str
    most_important_features: List[Dict[str, Any]]
    feature_interactions: List[Dict[str, Any]]
    sensitivity_analysis: Dict[str, Any]
    model_version: str
    timestamp: str

# Placeholder for actual model service
class ExplainabilityService:
    @staticmethod
    def explain_prediction(request: ExplanationRequest) -> ExplanationResponse:
        # This would integrate with the actual explainability model
        # For now, returning mock data
        feature_importance = {}
        for i, name in enumerate(request.feature_names):
            # Create mock importance values
            importance = 0.1 + (0.8 * (i / len(request.feature_names))) if i < len(request.feature_names) else 0.1
            feature_importance[name] = round(importance, 3)
        
        return ExplanationResponse(
            model_id=request.model_id,
            instance=request.instance,
            feature_importance=feature_importance,
            base_value=0.5,
            prediction=0.72,
            explanation_method=request.method,
            confidence=0.88,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )
    
    @staticmethod
    def get_features(request: FeaturesRequest) -> FeaturesResponse:
        # This would integrate with the actual feature analysis system
        # For now, returning mock data
        return FeaturesResponse(
            model_id=request.model_id,
            most_important_features=[
                {"feature": "price", "importance": 0.25, "impact": "negative"},
                {"feature": "promotion", "importance": 0.22, "impact": "positive"},
                {"feature": "seasonality", "importance": 0.18, "impact": "positive"},
                {"feature": "competitor_price", "importance": 0.15, "impact": "negative"}
            ],
            feature_interactions=[
                {"features": ["price", "promotion"], "interaction_strength": 0.35},
                {"features": ["seasonality", "promotion"], "interaction_strength": 0.28}
            ],
            sensitivity_analysis={
                "price_elasticity": -1.2,
                "promotion_sensitivity": 0.8,
                "seasonal_factor": 1.15
            },
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )

# API endpoints
@router.post("/prediction", response_model=ExplanationResponse)
async def explain_prediction(request: ExplanationRequest):
    """
    Explain a model prediction
    """
    try:
        service = ExplainabilityService()
        result = service.explain_prediction(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/features/{model_id}", response_model=FeaturesResponse)
async def get_features(model_id: str):
    """
    Get feature importance and interactions for a model
    """
    try:
        request = FeaturesRequest(model_id=model_id)
        service = ExplainabilityService()
        result = service.get_features(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))