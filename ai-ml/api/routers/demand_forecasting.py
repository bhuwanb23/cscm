from fastapi import APIRouter, HTTPException
from typing import List, Optional
import sys
import os
import pandas as pd
import asyncio

# Add the services directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'services'))

# Import job queue utilities
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
from job_queue import job_queue

# Import models using absolute imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
import demand_models

from demand_service import DemandForecastingService

router = APIRouter()

# API endpoints
@router.post("/forecast", response_model=demand_models.DemandForecastResponse)
async def forecast_demand(request: demand_models.DemandForecastRequest):
    """
    Generate demand forecast for a specific SKU and store
    """
    try:
        service = DemandForecastingService()
        result = service.get_forecast(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/{sku_id}/{store_id}", response_model=demand_models.DemandMetricsResponse)
async def get_demand_metrics(sku_id: str, store_id: str, start_date: str, end_date: str):
    """
    Get demand forecasting metrics for a specific SKU and store
    """
    try:
        request = demand_models.DemandMetricsRequest(
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

# Async endpoint for batch demand forecasting
@router.post("/batch-forecast")
async def batch_forecast_demands(requests: List[demand_models.DemandForecastRequest]):
    """
    Submit batch demand forecasting jobs for asynchronous processing
    """
    try:
        job_ids = []
        for i, req in enumerate(requests):
            # Submit each forecast request as a separate job
            job_id = await job_queue.submit_job(
                f"Demand Forecast {req.sku_id}-{req.store_id}",
                _forecast_job,
                req
            )
            job_ids.append(job_id)
        
        return {
            "message": f"Submitted {len(job_ids)} forecast jobs",
            "job_ids": job_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting batch forecast jobs: {str(e)}")

# Async endpoint to check job status
@router.get("/forecast-job/{job_id}")
async def get_forecast_job_status(job_id: str):
    """
    Get the status of a demand forecast job
    """
    try:
        status = job_queue.get_job_status(job_id)
        if status is None:
            raise HTTPException(status_code=404, detail="Job not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting job status: {str(e)}")

# Async endpoint to get all jobs status
@router.get("/forecast-jobs")
async def get_all_forecast_jobs():
    """
    Get the status of all demand forecast jobs
    """
    try:
        return job_queue.get_all_jobs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting jobs status: {str(e)}")

# Helper function for forecast job
async def _forecast_job(request: demand_models.DemandForecastRequest) -> dict:
    """
    Helper function to run demand forecast in a job
    """
    # Simulate some async work
    await asyncio.sleep(1)
    
    # Run the forecast
    service = DemandForecastingService()
    result = service.get_forecast(request)
    
    # Convert result to dict
    return result.dict()