"""
Configuration file for pytest tests
"""
import pytest
import sys
import os

# Add the api directory to the path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

@pytest.fixture
def base_url():
    """Base URL for the API"""
    return "http://localhost:8000"

@pytest.fixture
def api_prefix():
    """API prefix for versioned endpoints"""
    return "/api/v1"