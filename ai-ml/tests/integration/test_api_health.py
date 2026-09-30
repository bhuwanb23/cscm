"""
Integration tests for API health endpoints.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'api'))


class TestHealthEndpoints:
    """Tests for basic API health endpoints."""

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

    def test_metrics(self, client):
        response = client.get("/metrics")
        assert response.status_code == 200
