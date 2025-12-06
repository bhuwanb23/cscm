from typing import List, Optional
import sys
import os

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from inventory_models import InventoryOptimizeRequest, InventoryOptimizeResponse, InventoryRecommendationRequest, InventoryRecommendationResponse

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
        # This would integrate with the actual inventory optimization model
        # For now, returning mock data
        return InventoryOptimizeResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            reorder_point=150.0,
            order_quantity=200.0,
            safety_stock=50.0,
            total_cost=1250.0,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )
    
    @staticmethod
    def get_recommendation(request: InventoryRecommendationRequest) -> InventoryRecommendationResponse:
        """
        Get inventory recommendation for a specific SKU and store
        
        Args:
            request: InventoryRecommendationRequest with SKU, store, and current stock
            
        Returns:
            InventoryRecommendationResponse with recommended action
        """
        # This would integrate with the actual recommendation engine
        # For now, returning mock data
        return InventoryRecommendationResponse(
            sku_id=request.sku_id,
            store_id=request.store_id,
            recommended_action="ORDER",
            order_quantity=150,
            expected_stockout_risk=0.05,
            expected_surplus_risk=0.10,
            projected_stock_days=15,
            model_version="1.0.0",
            timestamp="2023-01-01T00:00:00Z"
        )