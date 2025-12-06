from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from supplier_service import SupplierRiskService
from ..models.supplier_models import SupplierRiskRequest, SupplierRiskResponse, SupplierRecommendationsRequest, SupplierRecommendationsResponse

router = APIRouter()

# API endpoints
@router.post("/risk", response_model=SupplierRiskResponse)
async def assess_supplier_risk(request: SupplierRiskRequest):
    """
    Assess risk for a specific supplier
    """
    try:
        service = SupplierRiskService()
        result = service.assess_risk(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/{supplier_id}", response_model=SupplierRecommendationsResponse)
async def get_supplier_recommendations(supplier_id: str, risk_threshold: float = 0.7, max_recommendations: int = 5):
    """
    Get alternative supplier recommendations
    """
    try:
        request = SupplierRecommendationsRequest(
            supplier_id=supplier_id,
            risk_threshold=risk_threshold,
            max_recommendations=max_recommendations
        )
        service = SupplierRiskService()
        result = service.get_recommendations(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))