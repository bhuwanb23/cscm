from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sys
import os
import pandas as pd

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

from demand_service import DemandForecastingService
from ..models.demand_models import DemandForecastRequest, DemandForecastResponse, DemandMetricsRequest, DemandMetricsResponse

router = APIRouter()

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

# New endpoint for validating and preprocessing sales data
@router.post("/validate-preprocess-sales-data")
async def validate_preprocess_sales_data(data: dict):
    """
    Validate and preprocess sales data using data validation models
    """
    try:
        # Convert dict to DataFrame
        df = pd.DataFrame(data)
        
        # Use the service to validate and preprocess the data
        service = DemandForecastingService()
        result = service.validate_and_preprocess_sales_data(df)
        
        # Convert result back to dict for JSON serialization
        return result.to_dict(orient='records')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error validating and preprocessing sales data: {str(e)}")