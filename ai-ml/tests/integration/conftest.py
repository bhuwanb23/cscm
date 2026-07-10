"""
Conftest for integration tests.
Provides a FastAPI TestClient fixture.
"""
import sys
import os
import pytest

AI_ML_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, AI_ML_ROOT)
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'legacy_models'))
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'api'))


@pytest.fixture(scope="session")
def client():
    """Create a FastAPI TestClient for the API."""
    from fastapi.testclient import TestClient
    from api.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def api_prefix():
    return "/api/v1"
