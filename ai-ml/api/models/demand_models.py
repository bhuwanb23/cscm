from pydantic import BaseModel
from typing import List, Optional

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