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
    """Create a FastAPI TestClient for the API (session-wide, authenticated)."""
    from fastapi.testclient import TestClient
    from api.main import app
    # Routers are protected by Depends(get_current_api_key); present the
    # configured service key on every request so tests exercise the handlers.
    api_key = os.getenv("AI_ML_API_KEY", "default-dev-key-change-in-production")
    with TestClient(app, headers={"X-API-Key": api_key}) as c:
        yield c


@pytest.fixture
def api_prefix():
    return "/api/v1"
