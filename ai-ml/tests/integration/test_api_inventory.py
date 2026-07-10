"""
Integration tests for inventory optimization API endpoints.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))


@pytest.fixture(scope="module")
def client():
    from fastapi.testclient import TestClient
    from api.main import app
    with TestClient(app) as c:
        yield c


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
        response = client.post("/api/v1/inventory/recommend", json={
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "current_stock": 50,
            "reorder_point": 20,
            "max_stock": 200
        })
        assert response.status_code == 200
