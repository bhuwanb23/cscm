"""
Test suite for model versioning
"""
import pytest
import requests
import json

class TestModelVersioning:
    """Test suite for model versioning"""
    
    BASE_URL = "http://localhost:8000"
    API_PREFIX = "/api/v1"
    
    def test_model_version_in_responses(self):
        """Test that all API responses include model version information"""
        # Test demand forecast endpoint
        forecast_data = {
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "forecast_horizon": 7
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/forecast",
            headers={"Content-Type": "application/json"},
            data=json.dumps(forecast_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_version" in data
        assert "timestamp" in data
        
        # Test inventory optimize endpoint
        inventory_data = {
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "current_stock": 100,
            "lead_time_days": 3,
            "demand_forecast": [10, 15, 12, 18, 20, 15, 10],
            "demand_std_dev": 3.5,
            "service_level": 0.95,
            "holding_cost": 2.5,
            "ordering_cost": 50
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/inventory/optimize",
            headers={"Content-Type": "application/json"},
            data=json.dumps(inventory_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_version" in data
        assert "timestamp" in data
        
        # Test supplier risk endpoint
        risk_data = {
            "supplier_id": "SUP789",
            "current_orders": 5,
            "delivery_history": [1, 0, 1, 1, 0, 1, 1],
            "financial_health_score": 0.75,
            "historical_data": [
                {"order_id": "ORD001", "delivery_time": 5, "delayed": False},
                {"order_id": "ORD002", "delivery_time": 7, "delayed": True}
            ],
            "features": {
                "quality_score": 0.9,
                "reliability_score": 0.85,
                "financial_stability": 0.75
            }
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/supplier/risk",
            headers={"Content-Type": "application/json"},
            data=json.dumps(risk_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_version" in data
        assert "timestamp" in data
    
    def test_model_version_consistency(self):
        """Test that model versions are consistent across related endpoints"""
        # This is a placeholder test since we're using mock data
        # In a real implementation, we would verify that related endpoints
        # return consistent model versions for the same underlying models
        
        # For now, just verify that all responses have model version fields
        endpoints_to_test = [
            f"{self.API_PREFIX}/demand/forecast",
            f"{self.API_PREFIX}/inventory/optimize",
            f"{self.API_PREFIX}/supplier/risk"
        ]
        
        test_data = {
            f"{self.API_PREFIX}/demand/forecast": {
                "sku_id": "SKU123",
                "store_id": "STORE456",
                "forecast_horizon": 7
            },
            f"{self.API_PREFIX}/inventory/optimize": {
                "sku_id": "SKU123",
                "store_id": "STORE456",
                "current_stock": 100,
                "lead_time_days": 3,
                "demand_forecast": [10, 15, 12, 18, 20, 15, 10],
                "demand_std_dev": 3.5,
                "service_level": 0.95,
                "holding_cost": 2.5,
                "ordering_cost": 50
            },
            f"{self.API_PREFIX}/supplier/risk": {
                "supplier_id": "SUP789",
                "current_orders": 5,
                "delivery_history": [1, 0, 1, 1, 0, 1, 1],
                "financial_health_score": 0.75,
                "historical_data": [
                    {"order_id": "ORD001", "delivery_time": 5, "delayed": False},
                    {"order_id": "ORD002", "delivery_time": 7, "delayed": True}
                ],
                "features": {
                    "quality_score": 0.9,
                    "reliability_score": 0.85,
                    "financial_stability": 0.75
                }
            }
        }
        
        for endpoint in endpoints_to_test:
            response = requests.post(
                f"{self.BASE_URL}{endpoint}",
                headers={"Content-Type": "application/json"},
                data=json.dumps(test_data[endpoint])
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "model_version" in data
            assert "timestamp" in data
            # Verify model version format (should be semantic versioning)
            assert isinstance(data["model_version"], str)
            assert len(data["model_version"].split(".")) >= 2

if __name__ == "__main__":
    pytest.main([__file__])