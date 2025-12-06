import requests
import json

# Test the health endpoint
response = requests.get("http://localhost:8000/health")
print("Health check:", response.json())

# Test the demand forecasting endpoint
forecast_data = {
    "sku_id": "SKU123",
    "store_id": "STORE456",
    "forecast_horizon": 7
}

response = requests.post(
    "http://localhost:8000/api/v1/demand/forecast",
    headers={"Content-Type": "application/json"},
    data=json.dumps(forecast_data)
)

print("Demand forecast response:", response.json())

# Test the supplier risk endpoint
risk_data = {
    "supplier_id": "SUP789",
    "current_orders": 5,
    "delivery_history": [1, 0, 1, 1, 0, 1, 1],  # 1 = on time, 0 = delayed
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

response = requests.post(
    "http://localhost:8000/api/v1/supplier/risk",
    headers={"Content-Type": "application/json"},
    data=json.dumps(risk_data)
)

print("Supplier risk response:", response.json())

# Test the knowledge graph endpoint
kg_data = {
    "query": "Find suppliers for electronics products",
    "entity_types": ["Supplier", "Product"],
    "relationship_types": ["SUPPLIES"],
    "max_results": 5
}

response = requests.post(
    "http://localhost:8000/api/v1/kg/query",
    headers={"Content-Type": "application/json"},
    data=json.dumps(kg_data)
)

print("Knowledge graph response:", response.json())