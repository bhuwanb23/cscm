import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.supplier_risk import SupplierRiskRequest, SupplierRiskResponse, SupplierRecommendationsRequest, SupplierRecommendationsResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
                risk_score=0.25,
                risk_category="LOW",
                key_risk_factors=["delivery_delay", "quality_issues"],
                confidence=0.85,
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
            request: SupplierRecommendationsRequest with supplier ID
            
        Returns:
            SupplierRecommendationsResponse with alternative suppliers
        """
        try:
            logger.info(f"Getting supplier recommendations for supplier: {request.supplier_id}")
            
            # This would integrate with the actual recommendation engine
            # For now, returning mock data
            response = SupplierRecommendationsResponse(
                supplier_id=request.supplier_id,
                alternative_suppliers=[
                    {"supplier_id": "ALT_SUP_001", "similarity_score": 0.92, "risk_score": 0.15},
                    {"supplier_id": "ALT_SUP_002", "similarity_score": 0.87, "risk_score": 0.20}
                ],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully retrieved supplier recommendations for supplier: {request.supplier_id}")
            return response
        except Exception as e:
            logger.error(f"Error getting supplier recommendations: {str(e)}")
            raise