"""
Initialize demo models for AI/ML service
This script creates placeholder models for demonstration purposes
"""
import os
import pickle
import numpy as np
from datetime import datetime
from pathlib import Path

def create_demo_models():
    """Create demo model files for all model types"""
    
    models_dir = Path("/app/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    # Create subdirectories
    subdirs = [
        "demand_forecasting",
        "inventory_optimization",
        "routing_logistics",
        "customer_demand",
        "supplier_risk",
        "anomaly_detection",
        "knowledge_graph"
    ]
    
    for subdir in subdirs:
        (models_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    # Create demo demand forecasting model
    demand_model = {
        "model_type": "demo_demand_forecast",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "forecast_horizon": 30,
            "confidence_level": 0.95
        },
        "weights": np.random.rand(10, 10).tolist()  # Dummy weights
    }
    
    with open(models_dir / "demand_forecasting" / "demand_model.pkl", "wb") as f:
        pickle.dump(demand_model, f)
    
    # Create demo inventory optimization model
    inventory_model = {
        "model_type": "demo_inventory_opt",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "safety_stock_level": 7,
            "reorder_point": 5
        },
        "weights": np.random.rand(5, 5).tolist()
    }
    
    with open(models_dir / "inventory_optimization" / "inventory_model.pkl", "wb") as f:
        pickle.dump(inventory_model, f)
    
    # Create demo routing model
    routing_model = {
        "model_type": "demo_routing",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "cost_matrix": np.random.rand(5, 5).tolist()
        },
        "weights": np.random.rand(8, 8).tolist()
    }
    
    with open(models_dir / "routing_logistics" / "routing_model.pkl", "wb") as f:
        pickle.dump(routing_model, f)
    
    # Create demo customer demand model
    customer_model = {
        "model_type": "demo_customer_demand",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "segmentation": "kmeans",
            "n_clusters": 5
        },
        "weights": np.random.rand(12, 12).tolist()
    }
    
    with open(models_dir / "customer_demand" / "customer_model.pkl", "wb") as f:
        pickle.dump(customer_model, f)
    
    # Create demo supplier risk model
    supplier_model = {
        "model_type": "demo_supplier_risk",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "risk_threshold": 0.5
        },
        "weights": np.random.rand(6, 6).tolist()
    }
    
    with open(models_dir / "supplier_risk" / "supplier_model.pkl", "wb") as f:
        pickle.dump(supplier_model, f)
    
    # Create demo anomaly detection model
    anomaly_model = {
        "model_type": "demo_anomaly_detection",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "threshold": 3.0,
            "method": "isolation_forest"
        },
        "weights": np.random.rand(7, 7).tolist()
    }
    
    with open(models_dir / "anomaly_detection" / "anomaly_model.pkl", "wb") as f:
        pickle.dump(anomaly_model, f)
    
    # Create demo knowledge graph model
    kg_model = {
        "model_type": "demo_knowledge_graph",
        "version": "1.0.0",
        "created_at": datetime.now().isoformat(),
        "parameters": {
            "embedding_dim": 128,
            "graph_type": "knowledge_graph"
        },
        "weights": np.random.rand(15, 15).tolist()
    }
    
    with open(models_dir / "knowledge_graph" / "kg_model.pkl", "wb") as f:
        pickle.dump(kg_model, f)
    
    print(f"Demo models created successfully in {models_dir}")
    print("Model files created:")
    for subdir in subdirs:
        model_file = models_dir / subdir / f"{subdir.rstrip('_')}_model.pkl"
        if model_file.exists():
            print(f"  - {model_file}")

if __name__ == "__main__":
    create_demo_models()
