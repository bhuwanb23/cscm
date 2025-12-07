"""
Test suite for data validation
"""
import pytest
from pydantic import ValidationError
import sys
import os

# Add the api directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

# Import the models with correct relative paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api', 'models'))
import demand_models
import inventory_models
import routing_models
import supplier_models
import customer_models
import anomaly_models

class TestDataValidation:
    """Test suite for data validation"""
    
    def test_demand_forecast_request_validation(self):
        """Test DemandForecastRequest validation"""
        # Valid request
        valid_request = demand_models.DemandForecastRequest(
            sku_id="SKU123",
            store_id="STORE456",
            forecast_horizon=7
        )
        assert valid_request.sku_id == "SKU123"
        assert valid_request.store_id == "STORE456"
        assert valid_request.forecast_horizon == 7
        
        # Invalid request - missing required fields
        with pytest.raises(ValidationError):
            demand_models.DemandForecastRequest(
                sku_id="SKU123"
                # Missing store_id and forecast_horizon
            )
        
        # Invalid request - wrong type
        with pytest.raises(ValidationError):
            demand_models.DemandForecastRequest(
                sku_id="SKU123",
                store_id="STORE456",
                forecast_horizon="invalid"  # Should be int
            )
    
    def test_demand_metrics_request_validation(self):
        """Test DemandMetricsRequest validation"""
        # Valid request
        valid_request = demand_models.DemandMetricsRequest(
            sku_id="SKU123",
            store_id="STORE456",
            start_date="2023-01-01",
            end_date="2023-01-07"
        )
        assert valid_request.sku_id == "SKU123"
        assert valid_request.store_id == "STORE456"
        assert valid_request.start_date == "2023-01-01"
        assert valid_request.end_date == "2023-01-07"
        
        # Invalid request - missing required fields
        with pytest.raises(ValidationError):
            demand_models.DemandMetricsRequest(
                sku_id="SKU123",
                store_id="STORE456"
                # Missing start_date and end_date
            )
    
    def test_inventory_optimize_request_validation(self):
        """Test InventoryOptimizeRequest validation"""
        # Valid request
        valid_request = inventory_models.InventoryOptimizeRequest(
            sku_id="SKU123",
            store_id="STORE456",
            current_stock=100,
            lead_time_days=3,
            demand_forecast=[10, 15, 12, 18, 20, 15, 10],
            demand_std_dev=3.5,
            service_level=0.95,
            holding_cost=2.5,
            ordering_cost=50
        )
        assert valid_request.sku_id == "SKU123"
        assert valid_request.store_id == "STORE456"
        assert valid_request.current_stock == 100
        assert valid_request.lead_time_days == 3
        assert valid_request.demand_forecast == [10, 15, 12, 18, 20, 15, 10]
        assert valid_request.demand_std_dev == 3.5
        assert valid_request.service_level == 0.95
        assert valid_request.holding_cost == 2.5
        assert valid_request.ordering_cost == 50
        
        # Invalid request - missing required fields
        with pytest.raises(ValidationError):
            inventory_models.InventoryOptimizeRequest(
                sku_id="SKU123",
                store_id="STORE456"
                # Missing other required fields
            )
        
        # Invalid request - wrong type
        with pytest.raises(ValidationError):
            inventory_models.InventoryOptimizeRequest(
                sku_id="SKU123",
                store_id="STORE456",
                current_stock="invalid",  # Should be int
                lead_time_days=3,
                demand_forecast=[10, 15, 12, 18, 20, 15, 10],
                demand_std_dev=3.5,
                service_level=0.95,
                holding_cost=2.5,
                ordering_cost=50
            )
    
    def test_supplier_risk_request_validation(self):
        """Test SupplierRiskRequest validation"""
        # Valid request
        valid_request = supplier_models.SupplierRiskRequest(
            supplier_id="SUP789",
            current_orders=5,
            delivery_history=[1, 0, 1, 1, 0, 1, 1],
            financial_health_score=0.75,
            historical_data=[
                {"order_id": "ORD001", "delivery_time": 5, "delayed": False},
                {"order_id": "ORD002", "delivery_time": 7, "delayed": True}
            ],
            features={
                "quality_score": 0.9,
                "reliability_score": 0.85,
                "financial_stability": 0.75
            }
        )
        assert valid_request.supplier_id == "SUP789"
        assert valid_request.current_orders == 5
        assert valid_request.delivery_history == [1, 0, 1, 1, 0, 1, 1]
        assert valid_request.financial_health_score == 0.75
        
        # Invalid request - missing required fields
        with pytest.raises(ValidationError):
            supplier_models.SupplierRiskRequest(
                supplier_id="SUP789"
                # Missing other required fields
            )
        
        # Invalid request - wrong type
        with pytest.raises(ValidationError):
            supplier_models.SupplierRiskRequest(
                supplier_id="SUP789",
                current_orders="invalid",  # Should be int
                delivery_history=[1, 0, 1, 1, 0, 1, 1],
                financial_health_score=0.75,
                historical_data=[
                    {"order_id": "ORD001", "delivery_time": 5, "delayed": False},
                    {"order_id": "ORD002", "delivery_time": 7, "delayed": True}
                ],
                features={
                    "quality_score": 0.9,
                    "reliability_score": 0.85,
                    "financial_stability": 0.75
                }
            )

if __name__ == "__main__":
    pytest.main([__file__])