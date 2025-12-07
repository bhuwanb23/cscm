from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SupplierRiskRequest(BaseModel):
    supplier_id: str
    current_orders: int
    delivery_history: List[int]  # 1 = on time, 0 = delayed
    financial_health_score: float
    historical_data: List[Dict[str, Any]]
    features: Dict[str, float]

class SupplierRiskResponse(BaseModel):
    supplier_id: str
    risk_score: float
    risk_level: str
    factors: Dict[str, float]
    recommendations: List[str]
    model_version: str
    timestamp: str

class SupplierRecommendationsRequest(BaseModel):
    supplier_id: str
    risk_threshold: float = 0.7
    max_recommendations: int = 5

class SupplierRecommendationsResponse(BaseModel):
    supplier_id: str
    recommendations: List[Dict[str, Any]]
    model_version: str
    timestamp: str