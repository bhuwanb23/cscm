from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter()

# Pydantic models for request/response
class DemandForecastRequest(BaseModel):
    sku_id: str
    store_id: str
    forecast_horizon: int  # in days
    include_confidence_intervals: bool = True

class DemandForecastResponse(BaseModel):
    sku_id: str
    store_id: str
    forecast_dates: List[str]
    forecast_values: List[float]
    confidence_intervals: Optional[List[dict]] = None
    model_version: str
    timestamp: str

class DemandMetricsRequest(BaseModel):
    sku_id: str
    store_id: str
    start_date: str
    end_date: str

class DemandMetricsResponse(BaseModel):
    sku_id: str
    store_id: str
    mape: float
    smape: float
    mae: float
    rmse: float
    crps: Optional[float] = None
    timestamp: str

# Placeholder for actual model service
class DemandForecastingService:
    @staticmethod
    def get_forecast(request: DemandForecastRequest) -> DemandForecastResponse:
        # This would integrate with the actual demand forecasting model
        # For now, returning mock data
        return DemandForecastResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            forecast_dates=["2023-01-01", "2023-01-02", "2023-01-03"],
            forecast_values=[100.0, 105.0, 98.0],
            confidence_intervals=[
                {"lower": 90.0, "upper": 110.0},
                {"lower": 95.0, "upper": 115.0},
                {"lower": 88.0, "upper": 108.0}
            ] if request.include_confidence_intervals else None,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )
    
    @staticmethod
    def get_metrics(request: DemandMetricsRequest) -> DemandMetricsResponse:
        # This would integrate with the actual metrics calculation
        # For now, returning mock data
        return DemandMetricsResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            mape=0.15,
            smape=0.14,
            mae=12.5,
            rmse=15.2,
            crps=2.3,
            timestamp="2023-01-01T00:00:00Z"
        )

# API endpoints
@router.post("/forecast", response_model=DemandForecastResponse)
async def forecast_demand(request: DemandForecastRequest):
    """
    Generate demand forecast for a specific SKU and store
    """
    try:
        service = DemandForecastingService()
        result = service.get_forecast(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/{sku_id}/{store_id}", response_model=DemandMetricsResponse)
async def get_demand_metrics(sku_id: str, store_id: str, start_date: str, end_date: str):
    """
    Get demand forecasting metrics for a specific SKU and store
    """
    try:
        request = DemandMetricsRequest(
            sku_id=sku_id,
            store_id=store_id,
            start_date=start_date,
            end_date=end_date
        )
        service = DemandForecastingService()
        result = service.get_metrics(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))