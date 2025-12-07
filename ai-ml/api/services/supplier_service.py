import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))

# Import data models for validation
from data_models import SalesDataModel, PriceDataModel, StoreAttributeModel, ProductAttributeModel, InventoryDataModel

# Import data validation utility
from data_validator import DataValidator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import supplier models directly using absolute path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
from supplier_models import SupplierRiskRequest, SupplierRiskResponse, SupplierRecommendationsRequest, SupplierRecommendationsResponse

class SupplierRiskService:
    """
    Service class for supplier risk assessment operations
    """
    
    @staticmethod
    def assess_risk(request: SupplierRiskRequest) -> SupplierRiskResponse:
        """
        Assess supplier risk based on historical data and features
        
        Args:
            request: SupplierRiskRequest with supplier data
            
        Returns:
            SupplierRiskResponse with risk assessment
        """
        try:
            logger.info(f"Assessing risk for supplier: {request.supplier_id}")
            
            # Validate input parameters
            if request.current_orders < 0:
                raise ValueError("Current orders cannot be negative")
            if not request.historical_data:
                raise ValueError("Historical data is required")
            if not request.features:
                raise ValueError("Features are required")
            
            # This would integrate with the actual supplier risk model
            # For now, returning mock data
            response = SupplierRiskResponse(
                supplier_id=request.supplier_id,
                risk_score=0.75,
                risk_level="MEDIUM",
                factors={
                    "delivery_performance": 0.8,
                    "quality_score": 0.9,
                    "financial_stability": 0.7
                },
                recommendations=[
                    "Increase backup suppliers",
                    "Negotiate better terms",
                    "Monitor deliveries closely"
                ],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully assessed risk for supplier: {request.supplier_id}")
            return response
        except Exception as e:
            logger.error(f"Error assessing supplier risk: {str(e)}")
            raise
    
    @staticmethod
    def get_recommendations(request: SupplierRecommendationsRequest) -> SupplierRecommendationsResponse:
        """
        Get alternative supplier recommendations
        
        Args:
            request: SupplierRecommendationsRequest with supplier ID and parameters
            
        Returns:
            SupplierRecommendationsResponse with alternative suppliers
        """
        try:
            logger.info(f"Getting recommendations for supplier: {request.supplier_id}")
            
            # Validate input parameters
            if request.risk_threshold < 0 or request.risk_threshold > 1:
                raise ValueError("Risk threshold must be between 0 and 1")
            if request.max_recommendations <= 0:
                raise ValueError("Max recommendations must be positive")
            
            # This would integrate with the actual supplier recommendation model
            # For now, returning mock data
            response = SupplierRecommendationsResponse(
                supplier_id=request.supplier_id,
                recommendations=[
                    {
                        "supplier_id": "ALT_SUP_001",
                        "similarity_score": 0.95,
                        "risk_score": 0.3,
                        "location": "US-NYC",
                        "capabilities": ["electronics", "apparel"]
                    },
                    {
                        "supplier_id": "ALT_SUP_002",
                        "similarity_score": 0.87,
                        "risk_score": 0.45,
                        "location": "US-LA",
                        "capabilities": ["electronics", "home_goods"]
                    }
                ],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully generated recommendations for supplier: {request.supplier_id}")
            return response
        except Exception as e:
            logger.error(f"Error getting supplier recommendations: {str(e)}")
            raise