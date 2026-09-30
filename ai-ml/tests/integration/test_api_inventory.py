"""
Integration tests for inventory optimization API endpoints.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))


class TestInventoryAPI:
    """Tests for inventory optimization endpoints."""

    def test_optimize_valid(self, client):
        response = client.post("/api/v1/inventory/optimize", json={
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "current_stock": 100,
            "lead_time_days": 3,
            "demand_forecast": [10, 15, 12, 18, 20, 15, 10],
            "demand_std_dev": 3.5,
            "service_level": 0.95,
            "holding_cost": 2.5,
            "ordering_cost": 50
        })
        assert response.status_code == 200

    def test_recommend_valid(self, client):
        response = client.get(
            "/api/v1/inventory/recommendation/SKU123/STORE456",
            params={"current_stock": 50, "days_to_review": 7},
        )
        assert response.status_code == 200
        data = response.json()
        assert "recommended_action" in data
