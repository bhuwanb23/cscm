import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.customer_demand import CustomerAnalyzeRequest, CustomerAnalyzeResponse, CustomerTrendsRequest, CustomerTrendsResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomerDemandService:
    """
    Service class for customer demand analysis operations
    """
    
    @staticmethod
    def analyze_customer(request: CustomerAnalyzeRequest) -> CustomerAnalyzeResponse:
        """
        Analyze customer demand for a specific segment
        
        Args:
            request: CustomerAnalyzeRequest with customer data
            
        Returns:
            CustomerAnalyzeResponse with demand analysis
        """
        try:
            logger.info(f"Analyzing customer demand for segment: {request.customer_segment}")
            
            # Validate input parameters
            if not request.historical_data:
                raise ValueError("Historical data is required")
            if not request.external_factors:
                raise ValueError("External factors are required")
            if request.time_horizon_days <= 0:
                raise ValueError("Time horizon must be positive")
            
            # This would integrate with the actual customer demand model
            # For now, returning mock data
            response = CustomerAnalyzeResponse(
                customer_segment=request.customer_segment,
                demand_forecast=[150.0, 155.0, 162.0, 158.0, 165.0],
                forecast_dates=["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", "2023-01-05"],
                trend_analysis={
                    "trend_direction": "increasing",
                    "trend_strength": 0.75
                },
                promotional_impact={
                    "baseline_demand": 140.0,
                    "promotion_effect": 15.0,
                    "elasticity": -1.2
                },
                confidence_intervals=[
                    {"lower": 140.0, "upper": 160.0},
                    {"lower": 145.0, "upper": 165.0},
                    {"lower": 152.0, "upper": 172.0},
                    {"lower": 148.0, "upper": 168.0},
                    {"lower": 155.0, "upper": 175.0}
                ],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully analyzed customer demand for segment: {request.customer_segment}")
            return response
        except Exception as e:
            logger.error(f"Error analyzing customer demand: {str(e)}")
            raise
    
    @staticmethod
    def get_trends(request: CustomerTrendsRequest) -> CustomerTrendsResponse:
        """
        Get customer trends for a specific segment
        
        Args:
            request: CustomerTrendsRequest with customer segment and date range
            
        Returns:
            CustomerTrendsResponse with trend analysis
        """
        try:
            logger.info(f"Getting customer trends for segment: {request.customer_segment}")
            
            # Validate date format
            try:
                datetime.strptime(request.start_date, "%Y-%m-%d")
                datetime.strptime(request.end_date, "%Y-%m-%d")
            except ValueError:
                raise ValueError("Invalid date format. Expected YYYY-MM-DD")
            
            # This would integrate with the actual trend analysis model
            # For now, returning mock data
            response = CustomerTrendsResponse(
                customer_segment=request.customer_segment,
                trends=[
                    {"period": "Q1", "value": 1200},
                    {"period": "Q2", "value": 1350},
                    {"period": "Q3", "value": 1420},
                    {"period": "Q4", "value": 1580}
                ],
                seasonal_patterns={
                    "peak_month": "December",
                    "low_month": "February",
                    "seasonality_strength": 0.65
                },
                growth_rate=0.08,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully retrieved customer trends for segment: {request.customer_segment}")
            return response
        except Exception as e:
            logger.error(f"Error getting customer trends: {str(e)}")
            raise