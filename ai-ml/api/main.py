from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Cognitive Supply Chain Mesh - AI/ML API",
    description="RESTful API for serving all AI/ML models in the CSCM project",
    version="1.0.0"
)

# Add rate limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from .routers import (
    demand_forecasting,
    inventory_optimization,
    routing_logistics
    # supplier_risk,
    # customer_demand,
    # anomaly_detection,
    # multi_agent_coordination,
    # digital_twin,
    # explainability,
    # nlp,
    # knowledge_graph,
    # causal_inference,
    # computer_vision,
    # continual_learning,
    # uncertainty_quantification,
    # model_monitoring
)

# Register routers
app.include_router(demand_forecasting.router, prefix="/api/v1/demand", tags=["Demand Forecasting"])
app.include_router(inventory_optimization.router, prefix="/api/v1/inventory", tags=["Inventory Optimization"])
app.include_router(routing_logistics.router, prefix="/api/v1/routing", tags=["Routing & Logistics"])
# app.include_router(supplier_risk.router, prefix="/api/v1/supplier", tags=["Supplier Risk"])
# app.include_router(customer_demand.router, prefix="/api/v1/customer", tags=["Customer Demand"])
# app.include_router(anomaly_detection.router, prefix="/api/v1/anomaly", tags=["Anomaly Detection"])
# app.include_router(multi_agent_coordination.router, prefix="/api/v1/coordination", tags=["Multi-Agent Coordination"])
# app.include_router(digital_twin.router, prefix="/api/v1/simulation", tags=["Digital Twin"])
# app.include_router(explainability.router, prefix="/api/v1/explain", tags=["Explainability"])
# app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["NLP & LLM"])
# app.include_router(knowledge_graph.router, prefix="/api/v1/kg", tags=["Knowledge Graph"])
# app.include_router(causal_inference.router, prefix="/api/v1/causal", tags=["Causal Inference"])
# app.include_router(computer_vision.router, prefix="/api/v1/vision", tags=["Computer Vision"])
# app.include_router(continual_learning.router, prefix="/api/v1/learning", tags=["Continual Learning"])
# app.include_router(uncertainty_quantification.router, prefix="/api/v1/uncertainty", tags=["Uncertainty Quantification"])
# app.include_router(model_monitoring.router, prefix="/api/v1/monitoring", tags=["Model Monitoring"])


@app.get("/")
async def root():
    return {"message": "Cognitive Supply Chain Mesh - AI/ML API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)