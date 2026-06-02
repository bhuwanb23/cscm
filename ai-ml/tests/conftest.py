"""
Configuration file for pytest tests
"""
import pytest
import sys
import os
import requests

# Add the api directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

def api_server_running(url="http://localhost:8000", timeout=2):
    """Check if the API server is running."""
    try:
        requests.get(f"{url}/health", timeout=timeout)
        return True
    except (requests.ConnectionError, requests.Timeout):
        return False

SERVER_RUNNING = api_server_running()

# Files that require the API server
API_DEPENDENT_TEST_FILES = {
    "test_api_endpoints.py",
    "test_batch_processing.py",
    "test_model_versioning.py",
    "test_security_auth.py",
}

def pytest_collection_modifyitems(config, items):
    """Skip API-dependent tests when the server is not running."""
    if SERVER_RUNNING:
        return
    for item in items:
        fname = os.path.basename(item.fspath)
        if fname in API_DEPENDENT_TEST_FILES:
            item.add_marker(
                pytest.mark.skipif(True, reason="API server not running on localhost:8000")
            )

@pytest.fixture
def base_url():
    """Base URL for the API"""
    return "http://localhost:8000"

@pytest.fixture
def api_prefix():
    """API prefix for versioned endpoints"""
    return "/api/v1"