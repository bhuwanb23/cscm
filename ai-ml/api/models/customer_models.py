from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class CustomerAnalyzeRequest(BaseModel):
    customer_segment: str
    time_horizon_days: int
    historical_data: List[Dict[str, Any]]
    external_factors: Dict[str, Any]

class CustomerAnalyzeResponse(BaseModel):
    customer_segment: str
    demand_forecast: List[float]
    forecast_dates: List[str]
    trend_analysis: Dict[str, Any]
    promotional_impact: Dict[str, Any]
    confidence_intervals: List[Dict[str, float]]
    model_version: str
    timestamp: str

class CustomerTrendsRequest(BaseModel):
    customer_segment: str
    start_date: str
    end_date: str

class CustomerTrendsResponse(BaseModel):
    customer_segment: str
    trends: List[Dict[str, Any]]
    seasonal_patterns: Dict[str, Any]
    growth_rate: float
    model_version: str
    timestamp: str