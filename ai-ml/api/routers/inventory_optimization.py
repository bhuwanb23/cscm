from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

# Pydantic models for request/response
class InventoryOptimizeRequest(BaseModel):
    sku_id: str
    store_id: str
    current_stock: int
    lead_time_days: int
    demand_forecast: List[float]
    demand_std_dev: float
    service_level: float = 0.95
    holding_cost: float
    ordering_cost: float

class InventoryOptimizeResponse(BaseModel):
    sku_id: str
    store_id: str
    reorder_point: float
    order_quantity: float
    safety_stock: float
    total_cost: float
    model_version: str
    timestamp: str

class InventoryRecommendationRequest(BaseModel):
    sku_id: str
    store_id: str
    current_stock: int
    days_to_review: int

class InventoryRecommendationResponse(BaseModel):
    sku_id: str
    store_id: str
    recommended_action: str
    order_quantity: Optional[int] = None
    expected_stockout_risk: float
    expected_surplus_risk: float
    projected_stock_days: int
    model_version: str
    timestamp: str

# Placeholder for actual model service
class InventoryOptimizationService:
    @staticmethod
    def optimize_inventory(request: InventoryOptimizeRequest) -> InventoryOptimizeResponse:
        # This would integrate with the actual inventory optimization model
        # For now, returning mock data
        return InventoryOptimizeResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            reorder_point=150.0,
            order_quantity=200.0,
            safety_stock=50.0,
            total_cost=1250.0,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )
    
    @staticmethod
    def get_recommendation(request: InventoryRecommendationRequest) -> InventoryRecommendationResponse:
        # This would integrate with the actual recommendation engine
        # For now, returning mock data
        return InventoryRecommendationResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            recommended_action="ORDER",
            order_quantity=150,
            expected_stockout_risk=0.05,
            expected_surplus_risk=0.10,
            projected_stock_days=15,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )

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