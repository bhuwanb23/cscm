from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class AnomalyDetectRequest(BaseModel):
    data: List[List[float]]
    feature_names: List[str]
    contamination: float = 0.1

class AnomalyDetectResponse(BaseModel):
    predictions: List[int]
    anomaly_scores: List[float]
    anomaly_indices: List[int]
    anomaly_rate: float
    model_version: str
    timestamp: str

class AnomalyAlertsRequest(BaseModel):
    alert_id: str

class AnomalyAlertsResponse(BaseModel):
    alert_id: str
    anomalies: List[Dict[str, Any]]
    severity: str
    affected_entities: List[str]
    recommended_actions: List[str]
    model_version: str
    timestamp: str