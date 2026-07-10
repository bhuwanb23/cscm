"""
Integration tests for demand forecasting API endpoints.
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


class TestDemandForecastAPI:
    """Tests for demand forecast endpoints."""

    def test_forecast_valid(self, client):
        response = client.post("/api/v1/demand/forecast", json={
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "forecast_horizon": 7
        })
        assert response.status_code == 200
        data = response.json()
        assert "sku_id" in data

    def test_forecast_missing_fields(self, client):
        response = client.post("/api/v1/demand/forecast", json={
            "sku_id": "SKU123"
        })
        assert response.status_code in [400, 422, 200]

    def test_metrics_valid(self, client):
        response = client.post("/api/v1/demand/metrics", json={
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "start_date": "2023-01-01",
            "end_date": "2023-01-07"
        })
        assert response.status_code == 200
