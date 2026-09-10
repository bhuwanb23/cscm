"""
Debug Endpoints for AI/ML Service
Provides debugging capabilities for development
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sys
import traceback
import time
import psutil
import os
from typing import Optional, Dict, Any

router = APIRouter(prefix="/debug", tags=["debug"])


class DebugInfo(BaseModel):
    """Debug information model"""
    context: str
    message: str
    data: Optional[Dict[str, Any]] = None


class PerformanceMetrics(BaseModel):
    """Performance metrics model"""
    url: str
    method: str
    duration: float
    memory_usage: Dict[str, float]


class SystemInfo(BaseModel):
    """System information model"""
    python_version: str
    platform: str
    cpu_count: int
    memory_total: int
    memory_available: int
    disk_usage: Dict[str, float]


@router.get("/info")
async def get_debug_info():
    """
    Get debug information about the AI/ML service
    """
    return {
        "service": "CSCM AI/ML Service",
        "version": "1.0.0",
        "python_version": sys.version,
        "platform": sys.platform,
        "debug_mode": os.getenv("DEBUG", "false").lower() == "true",
        "environment": os.getenv("PYTHONUNBUFFERED", "false"),
        "working_directory": os.getcwd()
    }


@router.get("/system")
async def get_system_info() -> SystemInfo:
    """
    Get system information and resource usage
    """
    process = psutil.Process()
    memory_info = process.memory_info()
    
    return SystemInfo(
        python_version=sys.version,
        platform=sys.platform,
        cpu_count=psutil.cpu_count(),
        memory_total=psutil.virtual_memory().total,
        memory_available=psutil.virtual_memory().available,
        disk_usage={
            "total": psutil.disk_usage('/').total,
            "used": psutil.disk_usage('/').used,
            "free": psutil.disk_usage('/').free
        }
    )


@router.get("/memory")
async def get_memory_usage():
    """
    Get current memory usage
    """
    process = psutil.Process()
    memory_info = process.memory_info()
    
    return {
        "heap": {
            "used": memory_info.rss,
            "used_mb": round(memory_info.rss / 1024 / 1024, 2)
        },
        "virtual": {
            "used": memory_info.vms,
            "used_mb": round(memory_info.vms / 1024 / 1024, 2)
        },
        "percent": process.memory_percent()
    }


@router.post("/log")
async def log_debug_info(info: DebugInfo):
    """
    Log debug information (development only)
    """
    if os.getenv("DEBUG", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="Debug mode is not enabled")
    
    print(f"[DEBUG] [{info.context}] {info.message}")
    if info.data:
        print(f"[DEBUG] Data: {info.data}")
    
    return {"status": "logged", "context": info.context}


@router.get("/models")
async def get_loaded_models():
    """
    Get information about loaded ML models
    """
    # This would return actual model information in production
    return {
        "loaded_models": [],
        "model_registry": {
            "demand_forecasting": "not_loaded",
            "inventory_optimization": "not_loaded",
            "anomaly_detection": "not_loaded"
        }
    }


@router.get("/config")
async def get_config():
    """
    Get current configuration (development only)
    """
    if os.getenv("DEBUG", "false").lower() != "true":
        raise HTTPException(status_code=403, detail="Debug mode is not enabled")
    
    # Return safe configuration values
    safe_config = {
        "debug": os.getenv("DEBUG", "false"),
        "python_unbuffered": os.getenv("PYTHONUNBUFFERED", "false"),
        "pythonpath": os.getenv("PYTHONPATH", "")
    }
    
    return safe_config


@router.post("/test-prediction")
async def test_prediction(endpoint: str, data: Dict[str, Any]):
    """
    Test a prediction endpoint with dummy data
    """
    # This would test actual prediction endpoints in production
    return {
        "status": "test_mode",
        "endpoint": endpoint,
        "data_sample": data,
        "note": "This is a test endpoint for development"
    }


@router.get("/performance")
async def get_performance_metrics():
    """
    Get performance metrics for the service
    """
    process = psutil.Process()
    
    return {
        "cpu_percent": process.cpu_percent(),
        "memory_percent": process.memory_percent(),
        "num_threads": process.num_threads(),
        "num_fds": process.num_fds() if hasattr(process, 'num_fds') else 0,
        "connections": len(process.connections()) if hasattr(process, 'connections') else 0
    }
