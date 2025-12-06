from typing import List, Optional
import sys
import os

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from demand_models import DemandForecastRequest, DemandForecastResponse, DemandMetricsRequest, DemandMetricsResponse

class DemandForecastingService:
    """
    Service class for demand forecasting operations
    """
    
    @staticmethod
    def get_forecast(request: DemandForecastRequest) -> DemandForecastResponse:
        """
        Generate demand forecast for a specific SKU and store
        
        Args:
            request: DemandForecastRequest with SKU, store, and forecast parameters
            
        Returns:
            DemandForecastResponse with forecast values and metadata
        """
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
        """
        Calculate demand forecasting metrics for a specific SKU and store
        
        Args:
            request: DemandMetricsRequest with SKU, store, and date range
            
        Returns:
            DemandMetricsResponse with accuracy metrics
        """
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