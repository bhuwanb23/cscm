from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from anomaly_service import AnomalyDetectionService
from ..models.anomaly_models import AnomalyDetectRequest, AnomalyDetectResponse, AnomalyAlertsRequest, AnomalyAlertsResponse

router = APIRouter()

# API endpoints
@router.post("/detect", response_model=AnomalyDetectResponse)
async def detect_anomalies(request: AnomalyDetectRequest):
    """
    Detect anomalies in provided data
    """
    try:
        service = AnomalyDetectionService()
        result = service.detect_anomalies(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/{alert_id}", response_model=AnomalyAlertsResponse)
async def get_anomaly_alerts(alert_id: str):
    """
    Get details for a specific anomaly alert
    """
    try:
        request = AnomalyAlertsRequest(alert_id=alert_id)
        service = AnomalyDetectionService()
        result = service.get_alerts(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))