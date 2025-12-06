import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from inventory_models import InventoryOptimizeRequest, InventoryOptimizeResponse, InventoryRecommendationRequest, InventoryRecommendationResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InventoryOptimizationService:
    """
    Service class for inventory optimization operations
    """
    
    @staticmethod
    def optimize_inventory(request: InventoryOptimizeRequest) -> InventoryOptimizeResponse:
        """
        Optimize inventory parameters for a specific SKU and store
        
        Args:
            request: InventoryOptimizeRequest with SKU, store, and optimization parameters
            
        Returns:
            InventoryOptimizeResponse with optimal inventory parameters
        """
        try:
            logger.info(f"Optimizing inventory for SKU: {request.sku_id}, Store: {request.store_id}")
            
            # Validate input parameters
            if request.current_stock < 0:
                raise ValueError("Current stock cannot be negative")
            if request.lead_time_days < 0:
                raise ValueError("Lead time must be non-negative")
            if request.service_level <= 0 or request.service_level > 1:
                raise ValueError("Service level must be between 0 and 1")
            if request.holding_cost < 0:
                raise ValueError("Holding cost cannot be negative")
            if request.ordering_cost < 0:
                raise ValueError("Ordering cost cannot be negative")
            
            # This would integrate with the actual inventory optimization model
            # For now, returning mock data
            response = InventoryOptimizeResponse(
                sku_id=request.sku_id,
                store_id=request.store_id,
                reorder_point=150.0,
                order_quantity=200.0,
                safety_stock=50.0,
                total_cost=1250.0,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully optimized inventory for SKU: {request.sku_id}")
            return response
        except Exception as e:
            logger.error(f"Error optimizing inventory: {str(e)}")
            raise
    
    @staticmethod
    def get_recommendation(request: InventoryRecommendationRequest) -> InventoryRecommendationResponse:
        """
        Get inventory recommendation for a specific SKU and store
        
        Args:
            request: InventoryRecommendationRequest with SKU, store, and current stock
            
        Returns:
            InventoryRecommendationResponse with recommended action
        """
        try:
            logger.info(f"Generating inventory recommendation for SKU: {request.sku_id}, Store: {request.store_id}")
            
            # Validate input parameters
            if request.current_stock < 0:
                raise ValueError("Current stock cannot be negative")
            if request.days_to_review <= 0:
                raise ValueError("Days to review must be positive")
            
            # This would integrate with the actual recommendation engine
            # For now, returning mock data
            response = InventoryRecommendationResponse(
                sku_id=request.sku_id,
                store_id=request.store_id,
                recommended_action="ORDER",
                order_quantity=150,
                expected_stockout_risk=0.05,
                expected_surplus_risk=0.10,
                projected_stock_days=15,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully generated inventory recommendation for SKU: {request.sku_id}")
            return response
        except Exception as e:
            logger.error(f"Error generating inventory recommendation: {str(e)}")
            raise