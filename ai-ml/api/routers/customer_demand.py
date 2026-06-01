from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from customer_service import CustomerDemandService
from ..models.customer_models import CustomerAnalyzeRequest, CustomerAnalyzeResponse, CustomerTrendsRequest, CustomerTrendsResponse

router = APIRouter()

# API endpoints
@router.post("/analyze", response_model=CustomerAnalyzeResponse)
async def analyze_customer_demand(request: CustomerAnalyzeRequest):
    """
    Analyze customer demand for a specific segment
    """
    try:
        service = CustomerDemandService()
        result = service.analyze_customer(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trends/{customer_segment}", response_model=CustomerTrendsResponse)
async def get_customer_trends(customer_segment: str, start_date: str, end_date: str):
    """
    Get customer trends for a specific segment
    """
    try:
        request = CustomerTrendsRequest(
            customer_segment=customer_segment,
            start_date=start_date,
            end_date=end_date
        )
        service = CustomerDemandService()
        result = service.get_customer_trends(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))