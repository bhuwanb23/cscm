import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(url, method="GET", data=None, expected_status=200):
    """Test a single endpoint and return the result"""
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(data))
        
        if response.status_code == expected_status:
            print(f"✓ {method} {url} - Status: {response.status_code}")
            return True
        else:
            print(f"✗ {method} {url} - Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print(f"✗ {method} {url} - Error: {str(e)}")
        return False

def main():
    print("Starting comprehensive API testing...\n")
    
    # Test health endpoint
    test_endpoint(f"{BASE_URL}/health")
    
    # Test root endpoint
    test_endpoint(f"{BASE_URL}/")
    
    # Test Demand Forecasting endpoints
    print("\n--- Testing Demand Forecasting ---")
    forecast_data = {
        "sku_id": "SKU123",
        "store_id": "STORE456",
        "forecast_horizon": 7
    }
    test_endpoint(f"{BASE_URL}/api/v1/demand/forecast", "POST", forecast_data)
    test_endpoint(f"{BASE_URL}/api/v1/demand/metrics/SKU123/STORE456?start_date=2023-01-01&end_date=2023-01-07")
    
    # Test Inventory Optimization endpoints
    print("\n--- Testing Inventory Optimization ---")
    inventory_data = {
        "sku_id": "SKU123",
        "store_id": "STORE456",
        "current_stock": 100,
        "lead_time_days": 3,
        "demand_forecast": [10, 15, 12, 18, 20, 15, 10],
        "demand_std_dev": 3.5,
        "service_level": 0.95,
        "holding_cost": 2.5,
        "ordering_cost": 50
    }
    test_endpoint(f"{BASE_URL}/api/v1/inventory/optimize", "POST", inventory_data)
    test_endpoint(f"{BASE_URL}/api/v1/inventory/recommendation/SKU123/STORE456?current_stock=100&days_to_review=7")
    
    # Test Routing & Logistics endpoints
    print("\n--- Testing Routing & Logistics ---")
    routing_data = {
        "vehicle_id": "TRUCK001",
        "depot_location": {"lat": 40.7128, "lng": -74.0060},
        "delivery_locations": [
            {"id": "loc1", "lat": 40.7589, "lng": -73.9851, "demand": 10, "time_window": {"start": "09:00", "end": "12:00"}},
            {"id": "loc2", "lat": 40.7505, "lng": -73.9934, "demand": 15, "time_window": {"start": "13:00", "end": "16:00"}}
        ],
        "vehicle_capacity": 100,
        "max_route_time": 480
    }
    test_endpoint(f"{BASE_URL}/api/v1/routing/optimize", "POST", routing_data)
    test_endpoint(f"{BASE_URL}/api/v1/routing/status/ROUTE123")
    
    # Test Supplier Risk endpoints
    print("\n--- Testing Supplier Risk ---")
    risk_data = {
        "supplier_id": "SUP789",
        "current_orders": 5,
        "delivery_history": [1, 0, 1, 1, 0, 1, 1],
        "financial_health_score": 0.75,
        "historical_data": [
            {"order_id": "ORD001", "delivery_time": 5, "delayed": False},
            {"order_id": "ORD002", "delivery_time": 7, "delayed": True}
        ],
        "features": {
            "quality_score": 0.9,
            "reliability_score": 0.85,
            "financial_stability": 0.75
        }
    }
    test_endpoint(f"{BASE_URL}/api/v1/supplier/risk", "POST", risk_data)
    test_endpoint(f"{BASE_URL}/api/v1/supplier/recommendations/SUP789")
    
    # Test Customer Demand endpoints
    print("\n--- Testing Customer Demand ---")
    customer_data = {
        "customer_segment": "PREMIUM",
        "historical_data": [
            {"date": "2023-01-01", "purchase_amount": 100, "product_category": "electronics"},
            {"date": "2023-01-02", "purchase_amount": 120, "product_category": "clothing"}
        ],
        "external_factors": {
            "marketing_campaigns": ["campaign1", "campaign2"],
            "economic_indicators": {"gdp_growth": 0.02, "inflation": 0.03}
        },
        "time_horizon_days": 30
    }
    test_endpoint(f"{BASE_URL}/api/v1/customer/analyze", "POST", customer_data)
    test_endpoint(f"{BASE_URL}/api/v1/customer/trends/PREMIUM?start_date=2023-01-01&end_date=2023-01-07")
    
    # Test Anomaly Detection endpoints
    print("\n--- Testing Anomaly Detection ---")
    anomaly_data = {
        "data": [
            [0.5, 0.3, 0.7],
            [0.6, 0.4, 0.8],
            [0.4, 0.5, 0.6]
        ],
        "feature_names": ["cpu_utilization", "memory_usage", "network_traffic"],
        "contamination": 0.1,
        "threshold": 3.0
    }
    test_endpoint(f"{BASE_URL}/api/v1/anomaly/detect", "POST", anomaly_data)
    test_endpoint(f"{BASE_URL}/api/v1/anomaly/alerts/ALERT123")
    
    # Test Multi-Agent Coordination endpoints
    print("\n--- Testing Multi-Agent Coordination ---")
    coordination_data = {
        "agent_states": [
            {"agent_id": "agent1", "battery": 100, "status": "active", "position": [0, 0]},
            {"agent_id": "agent2", "battery": 80, "status": "active", "position": [10, 10]},
            {"agent_id": "agent3", "battery": 90, "status": "charging", "position": [20, 20]}
        ],
        "environment_state": {
            "obstacles": [[5, 5], [15, 15]],
            "weather": "clear"
        },
        "objectives": ["goal1", "goal2"],
        "constraints": ["constraint1", "constraint2"],
        "time_horizon": 100
    }
    test_endpoint(f"{BASE_URL}/api/v1/coordination/plan", "POST", coordination_data)
    test_endpoint(f"{BASE_URL}/api/v1/coordination/status/PLAN123")
    
    # Test Digital Twin endpoints
    print("\n--- Testing Digital Twin ---")
    simulation_data = {
        "simulation_id": "SIM001",
        "model_type": "WAREHOUSE",
        "parameters": {"temperature": 22, "humidity": 45, "occupancy": 0.7},
        "duration": 3600,
        "steps": 100,
        "simulation_parameters": {
            "physics_engine": "ode",
            "time_step": 0.01
        },
        "initial_conditions": {
            "robot_positions": [[0, 0], [10, 10]],
            "item_locations": [[5, 5], [15, 15]]
        }
    }
    test_endpoint(f"{BASE_URL}/api/v1/simulation/run", "POST", simulation_data)
    test_endpoint(f"{BASE_URL}/api/v1/simulation/results/SIM001")
    
    # Test Explainability endpoints
    print("\n--- Testing Explainability ---")
    explanation_data = {
        "model_id": "MODEL123",
        "instance": [0.5, 0.8, 0.3],
        "feature_names": ["price", "quality", "brand_recognition"],
        "method": "shap",
        "num_samples": 200
    }
    test_endpoint(f"{BASE_URL}/api/v1/explain/prediction", "POST", explanation_data)
    test_endpoint(f"{BASE_URL}/api/v1/explain/features/MODEL123")
    
    # Test NLP endpoints
    print("\n--- Testing NLP ---")
    nlp_data = {
        "query": "What are the top-selling products this month?",
        "context": "Retail sales data for January 2023",
        "max_tokens": 100
    }
    test_endpoint(f"{BASE_URL}/api/v1/nlp/query", "POST", nlp_data)
    test_endpoint(f"{BASE_URL}/api/v1/nlp/summary/DOC123")
    
    # Test Knowledge Graph endpoints
    print("\n--- Testing Knowledge Graph ---")
    kg_data = {
        "query": "Find suppliers for electronics products",
        "entity_types": ["Supplier", "Product"],
        "relationship_types": ["SUPPLIES"],
        "max_results": 5
    }
    test_endpoint(f"{BASE_URL}/api/v1/kg/query", "POST", kg_data)
    test_endpoint(f"{BASE_URL}/api/v1/kg/similarity/entity123/Supplier?top_k=5")
    
    # Test Causal Inference endpoints
    print("\n--- Testing Causal Inference ---")
    causal_data = {
        "treatment_variable": "advertising_spend",
        "outcome_variable": "sales",
        "confounding_variables": ["season", "competition", "economic_index"],
        "data_filters": {"region": "north_america"}
    }
    test_endpoint(f"{BASE_URL}/api/v1/causal/analyze", "POST", causal_data)
    
    whatif_data = {
        "intervention": "increase_price",
        "scenario_parameters": {"price_change": 0.1, "competitor_response": 0.05},
        "time_horizon": 12
    }
    test_endpoint(f"{BASE_URL}/api/v1/causal/whatif", "POST", whatif_data)
    
    # Test Computer Vision endpoints
    print("\n--- Testing Computer Vision ---")
    test_endpoint(f"{BASE_URL}/api/v1/vision/metrics/WH001?start_date=2023-01-01&end_date=2023-01-07")
    
    # Test Continual Learning endpoints
    print("\n--- Testing Continual Learning ---")
    federated_data = {
        "client_id": "CLIENT001",
        "model_weights": {"layer1": [0.1, 0.2, 0.3], "layer2": [0.4, 0.5, 0.6]},
        "training_samples": 1000,
        "metrics": {"accuracy": 0.92, "loss": 0.05}
    }
    test_endpoint(f"{BASE_URL}/api/v1/learning/federated-update", "POST", federated_data)
    test_endpoint(f"{BASE_URL}/api/v1/learning/status/MODEL123")
    
    # Test Uncertainty Quantification endpoints
    print("\n--- Testing Uncertainty Quantification ---")
    uncertainty_data = {
        "model_id": "MODEL123",
        "input_data": {"feature1": 0.5, "feature2": 0.8},
        "uncertainty_method": "ensemble"
    }
    test_endpoint(f"{BASE_URL}/api/v1/uncertainty/quantify", "POST", uncertainty_data)
    
    calibration_data = {
        "model_id": "MODEL123",
        "calibration_data": [
            {"prediction": 0.9, "actual": 1},
            {"prediction": 0.1, "actual": 0}
        ],
        "method": "platt"
    }
    test_endpoint(f"{BASE_URL}/api/v1/uncertainty/calibrate", "POST", calibration_data)
    
    # Test Model Monitoring endpoints
    print("\n--- Testing Model Monitoring ---")
    drift_data = {
        "model_id": "MODEL123",
        "reference_data": [{"feature1": 0.5, "feature2": 0.3}, {"feature1": 0.7, "feature2": 0.4}],
        "current_data": [{"feature1": 0.6, "feature2": 0.2}, {"feature1": 0.8, "feature2": 0.5}],
        "drift_threshold": 0.05
    }
    test_endpoint(f"{BASE_URL}/api/v1/monitoring/drift", "POST", drift_data)
    test_endpoint(f"{BASE_URL}/api/v1/monitoring/performance/MODEL123?period_start=2023-01-01&period_end=2023-01-07")
    
    print("\nComprehensive testing completed!")

if __name__ == "__main__":
    main()