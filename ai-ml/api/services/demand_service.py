import logging
from typing import List, Optional
import sys
import os
from datetime import datetime
import pandas as pd

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))

# Import data models for validation
from data_models import SalesDataModel, PriceDataModel, StoreAttributeModel, ProductAttributeModel, InventoryDataModel

# Import data validation utility
from data_validator import DataValidator

from ..models.demand_models import DemandForecastRequest, DemandForecastResponse, DemandMetricsRequest, DemandMetricsResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemandForecastingService:
    """
    Service class for demand forecasting operations
    """
    
    @staticmethod
    def validate_and_preprocess_sales_data(raw_data: pd.DataFrame) -> pd.DataFrame:
        """
        Validate and preprocess sales data using the DataValidator utility
        
        Args:
            raw_data: Raw sales data as DataFrame
            
        Returns:
            pd.DataFrame: Validated and transformed sales data
        """
        try:
            logger.info("Validating and preprocessing sales data")
            
            # Validate the data
            is_valid, error_msg = DataValidator.validate_sales_data(raw_data)
            if not is_valid:
                raise ValueError(f"Sales data validation failed: {error_msg}")
            
            # Preprocess the data
            processed_data = DataValidator.preprocess_sales_data(raw_data)
            
            logger.info("Successfully validated and preprocessed sales data")
            return processed_data
        except Exception as e:
            logger.error(f"Error validating and preprocessing sales data: {str(e)}")
            raise
    
    @staticmethod
    def get_forecast(request: DemandForecastRequest) -> DemandForecastResponse:
        """
        Generate demand forecast for a specific SKU and store
        
        Args:
            request: DemandForecastRequest with SKU, store, and forecast parameters
            
        Returns:
            DemandForecastResponse with forecast values and metadata
        """
        try:
            logger.info(f"Generating demand forecast for SKU: {request.sku_id}, Store: {request.store_id}")
            
            # Validate input parameters
            if request.forecast_horizon <= 0:
                raise ValueError("Forecast horizon must be positive")
            
            # This would integrate with the actual demand forecasting model
            # For now, returning mock data
            response = DemandForecastResponse(
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
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully generated demand forecast for SKU: {request.sku_id}")
            return response
        except Exception as e:
            logger.error(f"Error generating demand forecast: {str(e)}")
            raise
    
    @staticmethod
    def get_metrics(request: DemandMetricsRequest) -> DemandMetricsResponse:
        """
        Calculate demand forecasting metrics for a specific SKU and store
        
        Args:
            request: DemandMetricsRequest with SKU, store, and date range
            
        Returns:
            DemandMetricsResponse with accuracy metrics
        """
        try:
            logger.info(f"Calculating demand metrics for SKU: {request.sku_id}, Store: {request.store_id}")
            
            # Validate date format
            try:
                datetime.strptime(request.start_date, "%Y-%m-%d")
                datetime.strptime(request.end_date, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Invalid date format. Expected YYYY-MM-DD")
            
            # This would integrate with the actual metrics calculation
            # For now, returning mock data
            response = DemandMetricsResponse(
                sku_id=request.sku_id,
                store_id=request.store_id,
                mape=0.15,
                smape=0.14,
                mae=12.5,
                rmse=15.2,
                crps=2.3,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully calculated demand metrics for SKU: {request.sku_id}")
            return response
        except Exception as e:
            logger.error(f"Error calculating demand metrics: {str(e)}")
            raise