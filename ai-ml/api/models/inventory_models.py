from pydantic import BaseModel
from typing import List, Optional

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