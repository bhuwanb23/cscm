from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import sys
import os

# Add the utils directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

# Import monitoring utilities
from monitoring import APIMonitor, get_health_status

# Import job queue utilities
from job_queue import job_queue

# Create app
app = FastAPI(title="Cognitive Supply Chain Mesh - AI/ML API")

# Global instances
api_monitor = APIMonitor()

# Store request start times for monitoring
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
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
    
    return response

# Import routers
from .routers import (
    demand_forecasting,
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

# Register routers
app.include_router(demand_forecasting.router, prefix="/api/v1/demand", tags=["Demand Forecasting"])
app.include_router(inventory_optimization.router, prefix="/api/v1/inventory", tags=["Inventory Optimization"])
app.include_router(routing_logistics.router, prefix="/api/v1/routing", tags=["Routing & Logistics"])
app.include_router(supplier_risk.router, prefix="/api/v1/supplier", tags=["Supplier Risk"])
app.include_router(customer_demand.router, prefix="/api/v1/customer", tags=["Customer Demand"])
app.include_router(anomaly_detection.router, prefix="/api/v1/anomaly", tags=["Anomaly Detection"])
app.include_router(multi_agent_coordination.router, prefix="/api/v1/coordination", tags=["Multi-Agent Coordination"])
app.include_router(digital_twin.router, prefix="/api/v1/simulation", tags=["Digital Twin"])
app.include_router(explainability.router, prefix="/api/v1/explain", tags=["Explainability"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["NLP & LLM"])
app.include_router(knowledge_graph.router, prefix="/api/v1/kg", tags=["Knowledge Graph"])
app.include_router(causal_inference.router, prefix="/api/v1/causal", tags=["Causal Inference"])
app.include_router(computer_vision.router, prefix="/api/v1/vision", tags=["Computer Vision"])
app.include_router(continual_learning.router, prefix="/api/v1/learning", tags=["Continual Learning"])
app.include_router(uncertainty_quantification.router, prefix="/api/v1/uncertainty", tags=["Uncertainty Quantification"])
app.include_router(model_monitoring.router, prefix="/api/v1/monitoring", tags=["Model Monitoring"])

# Startup event to initialize job queue
@app.on_event("startup")
async def startup_event():
    """Initialize job queue on startup"""
    await job_queue.start()
    print("Job queue started")

# Shutdown event to stop job queue
@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown job queue on shutdown"""
    await job_queue.stop()
    print("Job queue stopped")

@app.get("/")
async def root():
    return {"message": "Cognitive Supply Chain Mesh - AI/ML API"}

@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    return get_health_status()

@app.get("/metrics")
async def metrics():
    """Performance metrics endpoint"""
    return api_monitor.get_performance_metrics()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)