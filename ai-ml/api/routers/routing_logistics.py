from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from routing_service import RoutingOptimizationService
from ..models.routing_models import RoutingOptimizeRequest, RoutingOptimizeResponse, RoutingStatusRequest, RoutingStatusResponse

router = APIRouter()

# API endpoints
@router.post("/optimize", response_model=RoutingOptimizeResponse)
async def optimize_routing(request: RoutingOptimizeRequest):
    """
    Optimize delivery route for a vehicle
    """
    try:
        service = RoutingOptimizationService()
        result = service.optimize_route(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{route_id}", response_model=RoutingStatusResponse)
async def get_routing_status(route_id: str):
    """
    Get current status of a delivery route
    """
    try:
        request = RoutingStatusRequest(route_id=route_id)
        service = RoutingOptimizationService()
        result = service.get_route_status(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))