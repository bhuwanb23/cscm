"""
Comprehensive test suite for all API endpoints
"""
import pytest
import requests
import json
from typing import Dict, Any

class TestAPIEndpoints:
    """Test suite for all API endpoints"""
    
    BASE_URL = "http://localhost:8000"
    API_PREFIX = "/api/v1"
    
    def test_health_endpoint(self):
        """Test the health check endpoint"""
        response = requests.get(f"{self.BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(f"{self.BASE_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_metrics_endpoint(self):
        """Test the metrics endpoint"""
        response = requests.get(f"{self.BASE_URL}/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "request_count" in data
        assert "error_count" in data
        assert "average_response_time" in data
    
    # Demand Forecasting Tests
    def test_demand_forecast_endpoint(self):
        """Test the demand forecast endpoint"""
        forecast_data = {
            "sku_id": "SKU123",
            "store_id": "STORE456",
            "forecast_horizon": 7
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/forecast",
            headers={"Content-Type": "application/json"},
            data=json.dumps(forecast_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "sku_id" in data
        assert "store_id" in data
        assert "forecast_dates" in data
        assert "forecast_values" in data
    
    def test_demand_metrics_endpoint(self):
        """Test the demand metrics endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/metrics/SKU123/STORE456?start_date=2023-01-01&end_date=2023-01-07"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "sku_id" in data
        assert "store_id" in data
        assert "mape" in data
        assert "smape" in data
    
    # Inventory Optimization Tests
    def test_inventory_optimize_endpoint(self):
        """Test the inventory optimization endpoint"""
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
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/inventory/optimize",
            headers={"Content-Type": "application/json"},
            data=json.dumps(inventory_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "sku_id" in data
        assert "store_id" in data
        assert "optimal_order_quantity" in data
        assert "reorder_point" in data
    
    def test_inventory_recommendation_endpoint(self):
        """Test the inventory recommendation endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/inventory/recommendation/SKU123/STORE456?current_stock=100&days_to_review=7"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "sku_id" in data
        assert "store_id" in data
        assert "recommended_action" in data
    
    # Routing & Logistics Tests
    def test_routing_optimize_endpoint(self):
        """Test the routing optimization endpoint"""
        routing_data = {
            "vehicle_id": "TRUCK001",
            "depot_location": {"lat": 40.7128, "lng": -74.0060},
            "delivery_locations": [
                {"id": "loc1", "lat": 40.7589, "lng": -73.9851, "demand": 10, "time_window": {"start": "09:00", "end": "12:00"}},
                {"id": "loc2", "lat": 40.7505, "lng": -73.9934, "demand": 15, "time_window": {"start": "13:00", "end": "16:00"}}
            ],
            "vehicle_capacity": 100,
            "max_route_duration": 480
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/routing/optimize",
            headers={"Content-Type": "application/json"},
            data=json.dumps(routing_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "vehicle_id" in data
        assert "optimized_route" in data
        assert "total_distance" in data
    
    def test_routing_status_endpoint(self):
        """Test the routing status endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/routing/status/ROUTE123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "route_id" in data
        assert "status" in data
        assert "current_location" in data
    
    # Supplier Risk Tests
    def test_supplier_risk_endpoint(self):
        """Test the supplier risk endpoint"""
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
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/supplier/risk",
            headers={"Content-Type": "application/json"},
            data=json.dumps(risk_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "supplier_id" in data
        assert "risk_score" in data
        assert "risk_level" in data
    
    def test_supplier_recommendations_endpoint(self):
        """Test the supplier recommendations endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/supplier/recommendations/SUP789?risk_threshold=0.7&max_recommendations=5"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "supplier_id" in data
        assert "recommendations" in data
    
    # Customer Demand Tests
    def test_customer_analyze_endpoint(self):
        """Test the customer analysis endpoint"""
        customer_data = {
            "customer_segment": "PREMIUM",
            "time_horizon_days": 30,
            "historical_data": [
                {"date": "2023-01-01", "sales": 1000, "orders": 50},
                {"date": "2023-01-02", "sales": 1200, "orders": 60}
            ],
            "external_factors": {
                "marketing_campaign": True,
                "holiday_season": False
            }
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/customer/analyze",
            headers={"Content-Type": "application/json"},
            data=json.dumps(customer_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "customer_segment" in data
        assert "demand_forecast" in data
        assert "trend_analysis" in data
    
    def test_customer_trends_endpoint(self):
        """Test the customer trends endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/customer/trends/PREMIUM?start_date=2023-01-01&end_date=2023-03-31"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "customer_segment" in data
        assert "trends" in data
        assert "growth_rate" in data
    
    # Anomaly Detection Tests
    def test_anomaly_detect_endpoint(self):
        """Test the anomaly detection endpoint"""
        anomaly_data = {
            "data": [
                [1.0, 2.0, 3.0],
                [1.1, 2.1, 3.1],
                [10.0, 20.0, 30.0]  # Anomalous point
            ],
            "feature_names": ["feature1", "feature2", "feature3"],
            "contamination": 0.1
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/anomaly/detect",
            headers={"Content-Type": "application/json"},
            data=json.dumps(anomaly_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert "anomaly_scores" in data
        assert "anomaly_indices" in data
    
    def test_anomaly_alerts_endpoint(self):
        """Test the anomaly alerts endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/anomaly/alerts/ALERT123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "alert_id" in data
        assert "anomalies" in data
        assert "severity" in data
    
    # Multi-Agent Coordination Tests
    def test_coordination_plan_endpoint(self):
        """Test the coordination plan endpoint"""
        coordination_data = {
            "agent_states": [
                {"agent_id": "agent1", "position": [0, 0], "velocity": [1, 0]},
                {"agent_id": "agent2", "position": [5, 0], "velocity": [-1, 0]}
            ],
            "environment_state": {"obstacles": []},
            "objectives": ["minimize_travel_time", "avoid_collisions"],
            "constraints": ["max_speed:2.0"],
            "time_horizon": 100
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/coordination/plan",
            headers={"Content-Type": "application/json"},
            data=json.dumps(coordination_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "plan_id" in data
        assert "agent_actions" in data
        assert "expected_outcomes" in data
    
    def test_coordination_status_endpoint(self):
        """Test the coordination status endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/coordination/status/PLAN123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "plan_id" in data
        assert "status" in data
        assert "progress" in data
    
    # Digital Twin Tests
    def test_simulation_run_endpoint(self):
        """Test the simulation run endpoint"""
        simulation_data = {
            "simulation_parameters": {"duration_hours": 8, "random_seed": 42},
            "initial_conditions": {"warehouse_capacity": 1000, "initial_inventory": 500},
            "duration_hours": 8,
            "random_seed": 42
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/simulation/run",
            headers={"Content-Type": "application/json"},
            data=json.dumps(simulation_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "simulation_id" in data
        assert "results" in data
        assert "performance_metrics" in data
    
    def test_simulation_results_endpoint(self):
        """Test the simulation results endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/simulation/results/SIM123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "simulation_id" in data
        assert "zone_results" in data
        assert "throughput" in data
    
    # Explainability Tests
    def test_explanation_prediction_endpoint(self):
        """Test the explanation prediction endpoint"""
        explanation_data = {
            "model_id": "MODEL123",
            "instance": [0.5, 0.8, 0.3],
            "feature_names": ["price", "quality", "brand_recognition"],
            "method": "shap",
            "num_samples": 200
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/explain/prediction",
            headers={"Content-Type": "application/json"},
            data=json.dumps(explanation_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "instance" in data
        assert "feature_importance" in data
    
    def test_explanation_features_endpoint(self):
        """Test the explanation features endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/explain/features/MODEL123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "most_important_features" in data
        assert "feature_interactions" in data
    
    # NLP Tests
    def test_nlp_query_endpoint(self):
        """Test the NLP query endpoint"""
        nlp_data = {
            "query": "What are the top-selling products this month?",
            "context": "Retail sales data for January 2023",
            "max_tokens": 100
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/nlp/query",
            headers={"Content-Type": "application/json"},
            data=json.dumps(nlp_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "response" in data
        assert "confidence" in data
    
    def test_nlp_summary_endpoint(self):
        """Test the NLP summary endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/nlp/summary/DOC123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "document_id" in data
        assert "summary" in data
        assert "key_points" in data
    
    # Knowledge Graph Tests
    def test_kg_query_endpoint(self):
        """Test the knowledge graph query endpoint"""
        kg_data = {
            "query": "Find suppliers for electronics products",
            "entity_types": ["Supplier", "Product"],
            "relationship_types": ["SUPPLIES"],
            "max_results": 5
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/kg/query",
            headers={"Content-Type": "application/json"},
            data=json.dumps(kg_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "results" in data
        assert "entity_count" in data
    
    def test_kg_similarity_endpoint(self):
        """Test the knowledge graph similarity endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/kg/similarity/entity123/Supplier?top_k=5"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "entity_id" in data
        assert "entity_type" in data
        assert "similar_entities" in data
    
    # Causal Inference Tests
    def test_causal_analyze_endpoint(self):
        """Test the causal analysis endpoint"""
        causal_data = {
            "treatment_variable": "price",
            "outcome_variable": "sales",
            "confounding_variables": ["promotion", "season"],
            "data": [
                {"price": 10, "sales": 100, "promotion": 1, "season": "summer"},
                {"price": 15, "sales": 80, "promotion": 0, "season": "winter"}
            ]
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/causal/analyze",
            headers={"Content-Type": "application/json"},
            data=json.dumps(causal_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "treatment_variable" in data
        assert "outcome_variable" in data
        assert "causal_effect" in data
    
    def test_causal_whatif_endpoint(self):
        """Test the causal what-if endpoint"""
        whatif_data = {
            "intervention": {"variable": "price", "value": 12.5},
            "model_id": "CAUSAL_MODEL_123"
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/causal/whatif",
            headers={"Content-Type": "application/json"},
            data=json.dumps(whatif_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "intervention" in data
        assert "predicted_outcome" in data
        assert "confidence_interval" in data
    
    # Computer Vision Tests
    def test_vision_metrics_endpoint(self):
        """Test the computer vision metrics endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/vision/metrics/WAREHOUSE123?start_date=2023-01-01&end_date=2023-01-07"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "warehouse_id" in data
        assert "accuracy" in data
        assert "precision" in data
    
    # Continual Learning Tests
    def test_federated_update_endpoint(self):
        """Test the federated update endpoint"""
        federated_data = {
            "client_id": "CLIENT123",
            "model_weights": {"weight1": 0.5, "weight2": 0.8},
            "training_samples": 100,
            "metrics": {"accuracy": 0.95, "loss": 0.05}
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/learning/federated-update",
            headers={"Content-Type": "application/json"},
            data=json.dumps(federated_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "client_id" in data
        assert "update_accepted" in data
        assert "global_model_version" in data
    
    def test_continual_learning_status_endpoint(self):
        """Test the continual learning status endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/learning/status/MODEL123"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "current_performance" in data
        assert "drift_detected" in data
    
    # Uncertainty Quantification Tests
    def test_uncertainty_quantify_endpoint(self):
        """Test the uncertainty quantification endpoint"""
        uncertainty_data = {
            "model_id": "MODEL123",
            "input_data": {"feature1": 0.5, "feature2": 0.8},
            "uncertainty_method": "ensemble"
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/uncertainty/quantify",
            headers={"Content-Type": "application/json"},
            data=json.dumps(uncertainty_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "prediction" in data
        assert "uncertainty" in data
    
    def test_uncertainty_calibrate_endpoint(self):
        """Test the uncertainty calibration endpoint"""
        calibration_data = {
            "model_id": "MODEL123",
            "calibration_data": [
                {"prediction": 0.9, "actual": 1},
                {"prediction": 0.1, "actual": 0}
            ],
            "method": "platt"
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/uncertainty/calibrate",
            headers={"Content-Type": "application/json"},
            data=json.dumps(calibration_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "calibration_applied" in data
        assert "calibration_metrics" in data
    
    # Model Monitoring Tests
    def test_monitoring_drift_endpoint(self):
        """Test the monitoring drift endpoint"""
        drift_data = {
            "model_id": "MODEL123",
            "reference_data": [{"feature1": 0.5, "feature2": 0.3}, {"feature1": 0.7, "feature2": 0.4}],
            "current_data": [{"feature1": 0.6, "feature2": 0.2}, {"feature1": 0.8, "feature2": 0.5}],
            "drift_threshold": 0.05
        }
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/drift",
            headers={"Content-Type": "application/json"},
            data=json.dumps(drift_data)
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "drift_detected" in data
        assert "drift_score" in data
    
    def test_monitoring_performance_endpoint(self):
        """Test the monitoring performance endpoint"""
        response = requests.get(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/performance/MODEL123?period_start=2023-01-01&period_end=2023-01-07"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "performance_metrics" in data
        assert "alerts" in data

    # Uncertainty – Safety-Stock
    def test_uncertainty_safety_stock_endpoint(self):
        """Test the uncertainty safety-stock endpoint"""
        payload = {
            "model_id": "MODEL123",
            "avg_daily_demand": 100.0,
            "demand_std": 30.0,
            "lead_time_days": 7.0,
            "service_level": 0.95
        }
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/uncertainty/safety-stock",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        assert response.status_code == 200
        data = response.json()
        assert "safety_stock" in data
        assert "reorder_point" in data
        assert "service_level" in data
        assert data["service_level"] == 0.95

    # Monitoring – Log Prediction
    def test_monitoring_log_prediction_endpoint(self):
        """Test the monitoring log prediction endpoint"""
        payload = {
            "model_id": "MODEL123",
            "y_true": 100.0,
            "y_pred": 95.0,
            "features": {"feature1": 0.5, "feature2": 0.3},
        }
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/log",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert data["logged"] is True
        assert data["total_logged"] > 0

    # Monitoring – Metrics
    def test_monitoring_metrics_endpoint(self):
        """Test the monitoring metrics endpoint"""
        payload = {
            "model_id": "MODEL123",
            "metrics": ["accuracy", "precision", "recall"]
        }
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/metrics/MODEL123",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        assert response.status_code == 200
        data = response.json()
        assert "model_id" in data
        assert "metrics" in data
        assert "data_quality" in data
        assert "model_version" in data

    # Monitoring – Fairness
    def test_monitoring_fairness_endpoint(self):
        """Test the monitoring fairness endpoint"""
        payload = {
            "model_id": "MODEL123",
            "sensitive_attributes": ["store_region"],
            "predictions": [
                {"store_region": "north", "prediction": 0.9},
                {"store_region": "south", "prediction": 0.7}
            ],
            "labels": [1.0, 0.0]
        }
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/fairness",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        assert response.status_code == 200
        data = response.json()
        assert "fairness_metrics" in data
        assert "disparities" in data
        assert "recommendations" in data

    # Monitoring – SHAP
    def test_monitoring_shap_endpoint(self):
        """Test the monitoring SHAP explainability endpoint"""
        payload = {
            "model_id": "MODEL123",
            "input_data": {"feature1": 0.5, "feature2": 0.3, "feature3": 0.8},
            "feature_names": ["feature1", "feature2", "feature3"]
        }
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/monitoring/shap",
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload)
        )
        assert response.status_code == 200
        data = response.json()
        assert "shap_values" in data
        assert "baseline" in data
        assert "model_version" in data

if __name__ == "__main__":
    pytest.main([__file__])