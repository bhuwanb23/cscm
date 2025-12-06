from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sys
import os

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from inventory_service import InventoryOptimizationService
from ..models.inventory_models import InventoryOptimizeRequest, InventoryOptimizeResponse, InventoryRecommendationRequest, InventoryRecommendationResponse

router = APIRouter()

# API endpoints
@router.post("/optimize", response_model=InventoryOptimizeResponse)
async def optimize_inventory(request: InventoryOptimizeRequest):
    """
    Optimize inventory parameters for a specific SKU and store
    """
    try:
        service = InventoryOptimizationService()
        result = service.optimize_inventory(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendation/{sku_id}/{store_id}", response_model=InventoryRecommendationResponse)
async def get_inventory_recommendation(sku_id: str, store_id: str, current_stock: int, days_to_review: int = 7):
    """
    Get inventory recommendation for a specific SKU and store
    """
    try:
        request = InventoryRecommendationRequest(
            sku_id=sku_id,
            store_id=store_id,
            current_stock=current_stock,
            days_to_review=days_to_review
        )
        service = InventoryOptimizationService()
        result = service.get_recommendation(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))