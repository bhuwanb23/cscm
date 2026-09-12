"""
Authentication middleware for AI/ML API
Protects endpoints with API key or JWT authentication
"""

from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, APIKeyHeader
from fastapi.requests import Request
import os
import logging

logger = logging.getLogger("CSCM_API")

# Security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
bearer = HTTPBearer(auto_error=False)

# Get API key from environment
AI_ML_API_KEY = os.getenv("AI_ML_API_KEY", "default-dev-key-change-in-production")

def verify_api_key(request: Request):
    """
    Verify API key from X-API-Key header
    """
    api_key = request.headers.get("X-API-Key")
    
    # Skip auth in development mode
    if os.getenv("NODE_ENV") == "development" or os.getenv("DEBUG") == "true":
        return True
    
    if not api_key:
        logger.warning("API key missing in request")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    if api_key != AI_ML_API_KEY:
        logger.warning(f"Invalid API key attempt from {request.client.host if request.client else 'unknown'}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    return True

def verify_bearer_token(request: Request):
    """
    Verify JWT bearer token (optional for future integration)
    """
    authorization = request.headers.get("Authorization")
    
    if not authorization:
        return None
    
    # For now, just log that bearer auth was attempted
    # Future: Implement JWT verification
    logger.info("Bearer token authentication attempted")
    return True

async def authenticate_request(request: Request):
    """
    Main authentication function - checks API key or bearer token
    """
    # Try API key first
    try:
        api_key_header = request.headers.get("X-API-Key")
        if api_key_header:
            return verify_api_key(request)
    except HTTPException:
        raise
    
    # Try bearer token as fallback
    try:
        authorization = request.headers.get("Authorization")
        if authorization:
            return verify_bearer_token(request)
    except HTTPException:
        raise
    
    # Skip auth in development mode
    if os.getenv("NODE_ENV") == "development" or os.getenv("DEBUG") == "true":
        return True
    
    # If we get here, no valid auth provided
    logger.warning(f"Unauthenticated request from {request.client.host if request.client else 'unknown'}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required (API key or bearer token)"
    )

# FastAPI dependency
async def get_current_api_key(request: Request):
    """
    FastAPI dependency for authentication
    """
    await authenticate_request(request)
    return True

# Rate limiting for expensive operations
RATE_LIMITS = {
    "demand_forecasting": 10,  # requests per minute
    "routing_optimization": 5,
    "inventory_optimization": 10,
    "default": 20
}

def check_rate_limit(endpoint: str, request: Request):
    """
    Simple in-memory rate limiting for expensive operations
    In production, use Redis-based rate limiting
    """
    # For now, just log - production should use Redis
    logger.info(f"Rate limit check for {endpoint}")
    return True
