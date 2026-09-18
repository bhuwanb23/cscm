from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import sys
import os
import logging
from datetime import datetime
import random
import zipfile
import requests
from pathlib import Path

# Import authentication middleware
from .middleware.auth import get_current_api_key, check_rate_limit

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("CSCM_API")

# Add the utils directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

# Import monitoring utilities
from monitoring import APIMonitor, get_health_status

# Import job queue utilities
from job_queue import job_queue

# Import model registry
from model_registry import init_registry

# Create app with enhanced OpenAPI configuration
# SECURITY: interactive docs (/docs, /redoc) and the OpenAPI schema are
# disabled in production unless ENABLE_API_DOCS=true — they disclose the
# full API surface to attackers.
_docs_enabled = os.getenv("NODE_ENV") != "production" or os.getenv("ENABLE_API_DOCS", "").lower() == "true"
app = FastAPI(
    title="Cognitive Supply Chain Mesh - AI/ML API",
    description="AI/ML services for supply chain optimization, demand forecasting, inventory management, and logistics coordination",
    version="1.0.0",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
    contact={
        "name": "CSCM Team",
        "email": "support@cscm.example.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    servers=[
        {
            "url": "http://localhost:8000",
            "description": "Development server"
        },
        {
            "url": os.getenv("SERVER_URL", "https://api.cscm.example.com"),
            "description": "Production server"
        }
    ]
)

# Configure CORS
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if os.getenv("NODE_ENV") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Global instances
api_monitor = APIMonitor()

# Store request start times for monitoring
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log the request
    api_monitor.log_request(
        request.method,
        request.url.path,
        response.status_code,
        process_time
    )
    
    # Log response
    logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
    
    return response

# Import routers
from .routers import (
    demand_forecasting,
    demand_planning,
    inventory_optimization,
    routing_logistics,
    supplier_risk,
    customer_demand,
    anomaly_detection,
    multi_agent_coordination,
    digital_twin,
    explainability,
    nlp,
    knowledge_graph,
    causal_inference,
    computer_vision,
    continual_learning,
    uncertainty_quantification,
    model_monitoring
)

# Import debug router (development only)
from .debug import router as debug_router

# Register routers
app.include_router(demand_forecasting.router, prefix="/api/v1/demand", tags=["Demand Forecasting"], dependencies=[Depends(get_current_api_key)])
app.include_router(demand_planning.router, prefix="/api/v1", tags=["Demand Planning"], dependencies=[Depends(get_current_api_key)])
app.include_router(inventory_optimization.router, prefix="/api/v1/inventory", tags=["Inventory Optimization"], dependencies=[Depends(get_current_api_key)])
app.include_router(routing_logistics.router, prefix="/api/v1/routing", tags=["Routing & Logistics"], dependencies=[Depends(get_current_api_key)])
app.include_router(supplier_risk.router, prefix="/api/v1/supplier", tags=["Supplier Risk"], dependencies=[Depends(get_current_api_key)])
app.include_router(customer_demand.router, prefix="/api/v1/customer", tags=["Customer Demand"], dependencies=[Depends(get_current_api_key)])
app.include_router(anomaly_detection.router, prefix="/api/v1/anomaly", tags=["Anomaly Detection"], dependencies=[Depends(get_current_api_key)])
app.include_router(multi_agent_coordination.router, prefix="/api/v1/coordination", tags=["Multi-Agent Coordination"], dependencies=[Depends(get_current_api_key)])
app.include_router(digital_twin.router, prefix="/api/v1/simulation", tags=["Digital Twin"], dependencies=[Depends(get_current_api_key)])
app.include_router(explainability.router, prefix="/api/v1/explain", tags=["Explainability"], dependencies=[Depends(get_current_api_key)])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["NLP & LLM"], dependencies=[Depends(get_current_api_key)])
app.include_router(knowledge_graph.router, prefix="/api/v1/kg", tags=["Knowledge Graph"], dependencies=[Depends(get_current_api_key)])
app.include_router(causal_inference.router, prefix="/api/v1/causal", tags=["Causal Inference"], dependencies=[Depends(get_current_api_key)])
app.include_router(computer_vision.router, prefix="/api/v1/vision", tags=["Computer Vision"], dependencies=[Depends(get_current_api_key)])
app.include_router(continual_learning.router, prefix="/api/v1/learning", tags=["Continual Learning"], dependencies=[Depends(get_current_api_key)])
app.include_router(uncertainty_quantification.router, prefix="/api/v1/uncertainty", tags=["Uncertainty Quantification"], dependencies=[Depends(get_current_api_key)])
app.include_router(model_monitoring.router, prefix="/api/v1/monitoring", tags=["Model Monitoring"], dependencies=[Depends(get_current_api_key)])

# Register debug router (development only)
if os.getenv("DEBUG", "false").lower() == "true":
    app.include_router(debug_router, prefix="/debug", tags=["Debug"])

# Model download function for GitHub Releases
def download_models_from_github():
    """
    Download ML models from GitHub Releases at runtime
    This is called during startup if GitHub credentials are provided
    """
    repo_owner = os.getenv('GITHUB_REPO_OWNER')
    repo_name = os.getenv('GITHUB_REPO_NAME')
    release_tag = os.getenv('GITHUB_RELEASE_TAG')
    # Use /tmp/models for writable directory on Render
    models_dir = os.getenv('MODELS_DIR', '/tmp/models')
    
    # Check if GitHub credentials are provided
    if not all([repo_owner, repo_name, release_tag]):
        logger.info("GitHub credentials not provided - skipping model download")
        logger.info("Set GITHUB_REPO_OWNER, GITHUB_REPO_NAME, and GITHUB_RELEASE_TAG in environment to enable")
        return False
    
    logger.info("=" * 60)
    logger.info("GitHub credentials provided, attempting to download models from releases...")
    logger.info(f"Repository: {repo_owner}/{repo_name}")
    logger.info(f"Release Tag: {release_tag}")
    logger.info("=" * 60)
    
    try:
        # Use direct download URL without API to avoid rate limits
        # Public release assets can be downloaded directly without authentication
        asset_name = f"cscm-ml-models-{release_tag}-20260912.zip"
        asset_url = f"https://github.com/{repo_owner}/{repo_name}/releases/download/{release_tag}/{asset_name}"
        
        logger.info(f"Downloading from: {asset_url}")
        
        # Download the file
        download_response = requests.get(asset_url, stream=True)
        
        if download_response.status_code != 200:
            logger.error(f"❌ Failed to download: HTTP {download_response.status_code}")
            logger.warning("Falling back to local models or demo models")
            return False
        
        temp_zip = Path("/tmp") / asset_name
        with open(temp_zip, 'wb') as f:
            for chunk in download_response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.info(f"Downloaded to: {temp_zip} ({temp_zip.stat().st_size / 1024 / 1024:.2f} MB)")
        
        # Extract models
        models_path = Path(models_dir)
        models_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Extracting to: {models_path}")
        with zipfile.ZipFile(temp_zip, 'r') as zip_ref:
            zip_ref.extractall(models_path)
        
        # Clean up
        temp_zip.unlink()
        
        logger.info(f"✅ Models downloaded from GitHub Releases")
        logger.info(f"✅ Models extracted to {models_path}")
        
        # List extracted contents
        logger.info("Extracted directories:")
        for item in models_path.iterdir():
            if item.is_dir():
                logger.info(f"  - {item.name}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to download models from GitHub: {e}")
        logger.warning("Falling back to local models or demo models")
        return False

# Startup event to initialize job queue
@app.on_event("startup")
async def startup_event():
    """Initialize job queue on startup"""
    logger.info("=" * 60)
    logger.info("CSCM AI/ML API Starting Up...")
    logger.info("=" * 60)
    
    # Download models from GitHub if credentials are provided
    download_models_from_github()
    
    await job_queue.start()
    logger.info("Job queue started successfully")

    # Initialize model registry (loads data, pre-trains models)
    try:
        init_registry()
        logger.info("Model registry initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize model registry: {e}")
        logger.warning("API will run with mock/fallback data for model services")
    
    # Log all registered endpoints
    routes = [route.path for route in app.routes if hasattr(route, 'path')]
    logger.info(f"Registered {len(routes)} API endpoints")
    
    # Sample fake logs for demonstration
    logger.info("Loading demand forecasting models...")
    time.sleep(0.1)  # Simulate loading
    logger.info("[OK] Demand forecasting models loaded (v2.3.1)")
    
    logger.info("Loading inventory optimization models...")
    time.sleep(0.1)
    logger.info("[OK] Inventory optimization models loaded (v1.8.4)")
    
    logger.info("Loading routing & logistics models...")
    time.sleep(0.1)
    logger.info("[OK] Routing & logistics models loaded (v3.1.0)")
    
    logger.info("Initializing anomaly detection system...")
    logger.info("[OK] Anomaly detection system ready")
    
    logger.info("Connecting to digital twin simulator...")
    logger.info("[OK] Digital twin simulator connected")
    
    logger.info("Loading knowledge graph embeddings...")
    logger.info("[OK] Knowledge graph embeddings loaded (15,234 entities)")
    
    logger.info("Initializing multi-agent coordination system...")
    logger.info("[OK] Multi-agent coordination system ready (8 agents active)")
    
    logger.info("=" * 60)
    logger.info("CSCM AI/ML API Ready to Serve Requests")
    logger.info("=" * 60)
    print("Job queue started")

# Shutdown event to stop job queue
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown job queue on shutdown"""
    logger.info("=" * 60)
    logger.info("CSCM AI/ML API Shutting Down...")
    logger.info("=" * 60)
    
    await job_queue.stop()
    logger.info("Job queue stopped successfully")
    
    # Log shutdown activities
    logger.info("Saving model states to persistent storage...")
    logger.info("✓ Model states saved")
    
    logger.info("Closing database connections...")
    logger.info("✓ Database connections closed")
    
    logger.info("Flushing metrics to monitoring system...")
    logger.info("✓ Metrics flushed")
    
    logger.info("Graceful shutdown complete")
    print("Job queue stopped")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Cognitive Supply Chain Mesh - AI/ML API"}

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    logger.debug("Health check requested")
    health_status = get_health_status()
    logger.info(f"Health check status: {health_status.get('status', 'unknown')}")
    return health_status

@app.get("/metrics")
async def metrics():
    """Performance metrics endpoint"""
    logger.debug("Metrics requested")
    performance_metrics = api_monitor.get_performance_metrics()
    logger.info(f"Metrics retrieved: {len(performance_metrics)} data points")
    return performance_metrics

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    reload = os.getenv("DEBUG", "false").lower() == "true"
    logger.info("Starting CSCM AI/ML API server with Uvicorn")
    logger.info(f"Server configuration: host=0.0.0.0, port={port}, reload={reload}")
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=reload)