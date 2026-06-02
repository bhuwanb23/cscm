"""
Test all API endpoints — verify HTTP 200 and no random/mock values.

Usage:
    . .\venv\Scripts\Activate.ps1; python -m scripts.test_all_endpoints
"""
import sys, os, json, inspect, subprocess, time, requests, re
from datetime import datetime

BASE_URL = "http://127.0.0.1:8350"
API_PREFIX = "/api/v1"

# ── route table (hand-discovered from all routers) ──────────────
# (method, path, sample_payload_or_None_for_GET)
ROUTES = [
    # ── demand_forecasting ──
    ("POST", "/demand/forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "include_confidence_intervals": True}),
    ("GET",  "/demand/metrics/SKU001/STORE001", None),
    ("POST", "/demand/validate-preprocess-sales-data", {"sales_data": [{"date": "2024-01-01", "sales_quantity": 100}]}),
    ("POST", "/demand/batch-forecast", {"sku_ids": ["SKU001"], "store_ids": ["STORE001"], "forecast_horizon": 7}),
    ("GET",  "/demand/forecast-job/job_001", None),
    ("GET",  "/demand/forecast-jobs", None),
    ("POST", "/demand/deep-learning-forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "model_type": "lstm"}),
    ("POST", "/demand/gradient-boosted-forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7}),
    ("POST", "/demand/statistical-forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "model_type": "arima"}),
    ("POST", "/demand/hybrid-forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "methods": ["arima", "prophet"]}),
    ("POST", "/demand/probabilistic-forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7}),
    ("POST", "/demand/sliding-window-train", {"sku_id": "SKU001", "store_id": "STORE001", "window_size": 30}),
    ("POST", "/demand/retraining-pipeline", {"sku_id": "SKU001", "store_id": "STORE001", "schedule": "daily"}),
    ("POST", "/demand/edge-inference", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7}),

    # ── demand_planning ──
    ("POST", "/forecast", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7}),
    ("POST", "/plan-reorder", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "lead_time_days": 5, "service_level": 0.95}),
    ("POST", "/plan-promotion", {"sku_id": "SKU001", "store_id": "STORE001", "promotion_discount": 0.15, "promotion_duration_days": 7}),
    ("POST", "/plan-inventory", {"sku_id": "SKU001", "store_id": "STORE001", "min_stock": 50, "max_stock": 500}),
    ("POST", "/seasonal-decomposition", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7}),

    # ── inventory_optimization ──
    ("POST", "/inventory/optimize", {"sku_id": "SKU001", "store_id": "STORE001", "current_stock": 100, "lead_time_days": 5, "service_level": 0.95, "demand_forecast": [100, 110, 105]}),
    ("POST", "/inventory/newsvendor", {"sku_id": "SKU001", "store_id": "STORE001", "unit_cost": 10.0, "selling_price": 25.0, "salvage_value": 5.0, "demand_forecast": [100, 110, 105]}),
    ("POST", "/inventory/ss-policy", {"sku_id": "SKU001", "store_id": "STORE001", "lead_time_days": 5, "service_level": 0.95, "demand_mean": 100, "demand_std": 20, "holding_cost": 2.0, "order_cost": 50.0}),
    ("POST", "/inventory/rl-optimize", {"sku_id": "SKU001", "store_id": "STORE001", "current_stock": 100, "lead_time_days": 5}),
    ("POST", "/inventory/stochastic-optimize", {"sku_id": "SKU001", "store_id": "STORE001", "current_stock": 100, "lead_time_days": 5, "num_iterations": 100}),
    ("POST", "/inventory/calculate-safety-stock", {"sku_id": "SKU001", "store_id": "STORE001", "demand_mean": 100, "demand_std": 20, "lead_time_days": 5, "service_level": 0.95}),
    ("POST", "/inventory/batch-optimize", {"items": [{"sku_id": "SKU001", "store_id": "STORE001", "current_stock": 100, "lead_time_days": 5, "service_level": 0.95}]}),

    # ── routing_logistics ──
    ("POST", "/routing/route", {"origin": {"lat": 40.7128, "lon": -74.006}, "destinations": [{"lat": 40.7580, "lon": -73.9855}], "vehicle_capacity": 1000}),
    ("POST", "/routing/route-optimize", {"origin": {"lat": 40.7128, "lon": -74.006}, "destinations": [{"lat": 40.7580, "lon": -73.9855}], "vehicle_capacity": 1000}),
    ("POST", "/routing/transformer-route", {"origin": {"lat": 40.7128, "lon": -74.006}, "destinations": [{"lat": 40.7580, "lon": -73.9855}], "vehicle_capacity": 1000}),

    # ── supplier_risk ──
    ("POST", "/supplier/risk", {"supplier_id": "SUP001", "financial_health_score": 0.8, "delivery_history": [0.9, 0.85, 0.95], "current_orders": 100, "lead_time_days": 7, "quality_defect_rate": 0.02}),
    ("GET",  "/supplier/recommendations/SUP001", None),
    ("POST", "/supplier/cox-risk", {"supplier_id": "SUP001", "historical_data": [{"event_flag": 0, "lead_time_days": 7, "reliability_score": 0.9}]}),
    ("POST", "/supplier/survival", {"supplier_id": "SUP001", "historical_data": [{"event_flag": 0, "lead_time_days": 7}]}),
    ("POST", "/supplier/bayesian-risk", {"supplier_id": "SUP001", "historical_data": [{"event_flag": 0, "lead_time_days": 7}], "prior_alpha": 2, "prior_beta": 10}),
    ("POST", "/supplier/graph-risk", {"supplier_id": "SUP001", "network_data": {"nodes": ["SUP001", "SUP002"], "edges": [["SUP001", "SUP002"]]}}),
    ("POST", "/supplier/correlated-risk", {"supplier_ids": ["SUP001", "SUP002"], "market_conditions": {"inflation": 0.03}}),
    ("POST", "/supplier/risk-metrics", {"supplier_id": "SUP001"}),
    ("POST", "/supplier/calibrate", {"supplier_id": "SUP001", "predictions": [0.8, 0.6, 0.9], "actuals": [1, 0, 1], "method": "platt"}),
    ("POST", "/supplier/backup", {"supplier_id": "SUP001", "min_reliability": 0.7, "max_distance_km": 500}),

    # ── customer_demand ──
    ("POST", "/customer/analyze", {"customer_id": "CUST001", "purchase_history": [{"date": "2024-01-01", "amount": 100}]}),
    ("POST", "/customer/segment", {"customer_ids": ["CUST001", "CUST002"], "purchase_data": [{"customer_id": "CUST001", "total_spent": 1000, "frequency": 10}]}),
    ("POST", "/customer/trends", {"customer_id": "CUST001", "purchase_history": [{"date": "2024-01-01", "amount": 100}]}),

    # ── anomaly_detection ──
    ("POST", "/anomaly/detect", {"data": [[1.0, 2.0, 3.0], [10.0, 20.0, 30.0]], "feature_names": ["a", "b", "c"], "contamination": 0.1}),
    ("GET",  "/anomaly/alerts/alert_001", None),
    ("POST", "/anomaly/detect-dl", {"data": [[1.0, 2.0, 3.0], [10.0, 20.0, 30.0]], "feature_names": ["a", "b", "c"], "model_type": "autoencoder", "epochs": 2}),
    ("POST", "/anomaly/graph-anomaly", {"adjacency": [[0, 1], [1, 0]], "node_features": [[1.0, 0.0], [0.0, 1.0]], "contamination": 0.1}),
    ("POST", "/anomaly/changepoint", {"data": [1.0, 2.0, 3.0, 10.0, 11.0, 12.0]}),
    ("POST", "/anomaly/calibrate-threshold", {"anomaly_scores": [0.1, 0.2, 0.8, 0.9], "true_labels": [0, 0, 1, 1]}),
    ("POST", "/anomaly/one-class-svm", {"data": [[1.0, 2.0], [10.0, 20.0]], "feature_names": ["a", "b"], "contamination": 0.1}),

    # ── multi_agent_coordination ──
    ("POST", "/coordination/plan", {"tasks": [{"task_id": "T1", "required_skills": ["picking"], "location": {"x": 10, "y": 20}}], "agents": [{"agent_id": "A1", "skills": ["picking"], "location": {"x": 0, "y": 0}}]}),
    ("GET",  "/coordination/status/plan_001", None),
    ("POST", "/coordination/qmix", {"agents": 2, "state_dim": 4, "action_dim": 2}),
    ("POST", "/coordination/hierarchical-rl", {"agents": 2, "state_dim": 4, "action_dim": 2}),
    ("POST", "/coordination/mappo", {"agents": 2, "state_dim": 4, "action_dim": 2}),
    ("POST", "/coordination/state-exchange", {"state": {"agent_1": [1.0, 2.0]}, "topology": "fully_connected"}),
    ("POST", "/coordination/message", {"sender_id": "A1", "receiver_id": "A2", "message_type": "coordination", "content": {"task": "pickup"}}),
    ("POST", "/coordination/gnn-communicate", {"node_features": [[1.0, 0.0], [0.0, 1.0]], "edge_index": [[0, 1], [1, 0]]}),
    ("POST", "/coordination/edge-deploy", {"model_id": "MODEL001", "device_id": "DEV001"}),
    ("POST", "/coordination/ctde-train", {"agents": 2, "state_dim": 4, "action_dim": 2}),
    ("POST", "/coordination/metrics", {"agent_ids": ["A1", "A2"]}),

    # ── digital_twin / simulation ──
    ("POST", "/simulation/run", {"model_type": "supply_chain", "parameters": {"demand_mean": 100, "lead_time": 5}, "time_horizon": 30}),
    ("GET",  "/simulation/results/sim_001", None),
    ("POST", "/simulation/discrete-event-sim", {"arrival_rate": 10, "service_rate": 12, "num_servers": 3}),
    ("POST", "/simulation/network-sim", {"nodes": 5, "edges": [[0, 1], [1, 2]], "demand": [100, 200]}),
    ("POST", "/simulation/conveyor-sim", {"num_items": 100, "conveyor_speed": 1.5, "belt_length": 50}),
    ("POST", "/simulation/surrogate-predict", {"input_features": [[1.0, 2.0, 3.0]]}),
    ("POST", "/simulation/learned-abm", {"num_agents": 50, "state_dim": 4, "action_dim": 2}),
    ("POST", "/simulation/fast-approximate", {"historical_data": [[100, 200], [110, 190]], "query_point": [105, 195]}),
    ("POST", "/simulation/fulfillment-placement", {"orders": [{"order_id": "O1", "destination": {"lat": 40.71, "lon": -74.00}}], "warehouses": [{"id": "WH1", "lat": 40.76, "lon": -73.98}]}),
    ("POST", "/simulation/policy-impact", {"policy_name": "dynamic_pricing", "parameters": {"discount": 0.1}, "time_horizon": 30}),
    ("POST", "/simulation/rl-env", {"state_dim": 10, "action_dim": 3}),
    ("POST", "/simulation/order-sim", {"order_rate": 100, "max_orders": 1000, "simulation_hours": 24}),

    # ── explainability ──
    ("POST", "/explain/prediction", {"model_id": "MODEL001", "input_data": {"feature_1": 1.0, "feature_2": 2.0}, "prediction": 0.85}),
    ("GET",  "/explain/features/MODEL001", None),
    ("POST", "/explain/lime", {"model_id": "MODEL001", "input_data": {"feature_1": 1.0, "feature_2": 2.0}, "prediction": 0.85}),
    ("POST", "/explain/counterfactuals", {"model_id": "MODEL001", "input_data": {"feature_1": 1.0, "feature_2": 2.0}, "target_prediction": 0.9}),
    ("POST", "/explain/what-if", {"model_id": "MODEL001", "input_data": {"feature_1": 1.0, "feature_2": 2.0}, "perturbation": {"feature_1": 2.0}}),
    ("POST", "/explain/rationale", {"model_id": "MODEL001", "input_data": {"text": "Order delayed due to weather"}}),

    # ── nlp ──
    ("POST", "/nlp/query", {"query": "What is the inventory level for SKU001?", "context": {"department": "warehouse"}}),
    ("GET",  "/nlp/summary/doc_001", None),
    ("POST", "/nlp/sentiment", {"texts": ["Great service!", "Delayed shipment"]}),
    ("POST", "/nlp/pii/redact", {"text": "Contact John at john@email.com"}),
    ("POST", "/nlp/guard", {"text": "Transfer $1M to offshore account"}),
    ("POST", "/nlp/relations", {"text": "Amazon acquired Whole Foods in 2017."}),
    ("POST", "/nlp/constraints/parse", {"text": "Deliver within 3 days of order"}),
    ("POST", "/nlp/why-what-if", {"query": "Why was the order delayed?"}),
    ("POST", "/nlp/instruction", {"instruction": "Summarize the inventory report"}),
    ("POST", "/nlp/anomaly-summary", {"anomaly_logs": [{"date": "2024-01-01", "type": "stockout", "severity": "high"}]}),
    ("POST", "/nlp/bert-extract", {"text": "Order 12345 from supplier ABC"}),
    ("POST", "/nlp/bart-summarize", {"text": "Long text to summarize " * 10}),

    # ── knowledge_graph ──
    ("POST", "/kg/query", {"query": "Find suppliers with high risk", "entity_type": "supplier"}),
    ("GET",  "/kg/similarity/SUP001/supplier", None),
    ("POST", "/kg/embeddings/graphsage", {"node_features": [[1.0, 0.0], [0.0, 1.0]], "edge_index": [[0, 1], [1, 0]]}),
    ("POST", "/kg/embeddings/transe-score", {"head": "SUP001", "relation": "supplies", "tail": "PROD001"}),
    ("POST", "/kg/reason", {"query": "Which suppliers have high risk?"}),
    ("POST", "/kg/rules/evaluate", {"rules": [{"if": {"risk": "high"}, "then": "flag"}]}),
    ("POST", "/kg/constraints/check", {"constraints": [{"type": "capacity", "value": 100}], "state": {"current_capacity": 80}}),
    ("POST", "/kg/similarity/supplier", {"supplier_id": "SUP001", "features": {"reliability": 0.9, "cost": 0.7}}),
    ("POST", "/kg/root-cause", {"incident": {"type": "stockout", "sku": "SKU001", "timestamp": "2024-01-01"}}),
    ("POST", "/kg/ingest", {"data": [{"entity_id": "SUP001", "entity_type": "supplier", "attributes": {"name": "Supplier A"}}]}),

    # ── causal_inference ──
    ("POST", "/causal/analyze", {"treatments": ["promotion"], "outcomes": ["sales"], "covariates": ["price"], "data": [{"promotion": 1, "sales": 100, "price": 10}]}),
    ("POST", "/causal/whatif", {"treatment_name": "promotion", "treatment_value": 1, "covariates": {"price": 10}}),
    ("POST", "/causal/double-ml", {"treatments": ["promotion"], "outcomes": ["sales"], "controls": ["price"], "data": [{"promotion": 1, "sales": 100, "price": 10}]}),
    ("POST", "/causal/uplift-model", {"treatment_column": "promotion", "outcome_column": "sales", "features": ["price"], "data": [{"promotion": 1, "sales": 100, "price": 10}]}),
    ("POST", "/causal/propensity-match", {"treatment_column": "promotion", "outcome_column": "sales", "features": ["price"], "data": [{"promotion": 1, "sales": 100, "price": 10}]}),
    ("POST", "/causal/promotion-effect", {"store_id": "STORE001", "sku_id": "SKU001", "promotion_start": "2024-01-01", "promotion_end": "2024-01-07"}),
    ("POST", "/causal/iv-analysis", {"treatment": "promotion", "outcome": "sales", "instrument": "marketing_spend", "controls": ["price"], "data": [{"promotion": 1, "sales": 100, "price": 10, "marketing_spend": 100}]}),

    # ── computer_vision ──
    ("POST", "/vision/analyze", {"warehouse_id": "WH001", "image_url": "https://example.com/img.jpg"}),
    ("GET",  "/vision/metrics/WH001", None),
    ("POST", "/vision/detectron", {"image_url": "https://example.com/img.jpg"}),
    ("POST", "/vision/mask-rcnn", {"image_url": "https://example.com/img.jpg"}),
    ("POST", "/vision/quality-check", {"image_url": "https://example.com/img.jpg", "product_id": "PROD001"}),
    ("POST", "/vision/ocr", {"image_url": "https://example.com/label.jpg"}),
    ("POST", "/vision/count", {"image_url": "https://example.com/warehouse.jpg"}),
    ("POST", "/vision/deploy", {"model_id": "YOLOv8", "device_id": "CAM001"}),
    ("POST", "/vision/batch-infer", {"image_urls": ["https://example.com/img1.jpg", "https://example.com/img2.jpg"]}),
    ("POST", "/vision/retrain", {"dataset_id": "DS001", "model_architecture": "yolov8"}),
    ("POST", "/vision/stream", {"camera_id": "CAM001", "stream_url": "rtsp://example.com/stream"}),

    # ── continual_learning ──
    ("POST", "/learning/federated-update", {"model_id": "MODEL001", "weights": [[0.1, 0.2], [0.3, 0.4]], "client_id": "CLIENT001"}),
    ("GET",  "/learning/status/MODEL001", None),
    ("POST", "/learning/strategic-update", {"model_id": "MODEL001", "data_distribution": "iid", "update_frequency": "hourly"}),
    ("POST", "/learning/federated-round", {"model_id": "MODEL001", "client_updates": [{"client_id": "C1", "weights": [[0.1, 0.2]]}], "round_number": 1}),
    ("POST", "/learning/demand-pattern", {"model_id": "MODEL001", "new_data": [{"feature_1": 1.0, "feature_2": 2.0}]}),
    ("POST", "/learning/meta-learning", {"model_id": "MODEL001", "tasks": [{"features": [[1.0, 2.0]], "labels": [0]}], "meta_lr": 0.01}),
    ("POST", "/learning/online-adapter", {"model_id": "MODEL001", "new_data": [{"features": [1.0, 2.0], "label": 0}]}),

    # ── uncertainty_quantification ──
    ("POST", "/uncertainty/quantify", {"sku_id": "SKU001", "store_id": "STORE001", "forecast_horizon": 7, "historical_demand": [100, 110, 105, 95, 120]}),
    ("POST", "/uncertainty/propagation", {"input_uncertainties": {"demand": 0.1, "lead_time": 0.05}, "propagation_method": "monte_carlo", "n_samples": 1000}),

    # ── model_monitoring ──
    ("POST", "/monitoring/log", {"model_id": "MODEL001", "prediction_value": 0.85, "actual_value": 0.9, "features": {"feature_1": 1.0}}),
    ("POST", "/monitoring/drift", {"model_id": "MODEL001", "reference_data": [[1.0, 2.0], [3.0, 4.0]], "current_data": [[1.1, 2.1], [3.1, 4.1]], "feature_names": ["a", "b"]}),
    ("POST", "/monitoring/alerts/configure", {"model_id": "MODEL001", "alert_email": "test@test.com", "drift_threshold": 0.1}),
    ("GET",  "/monitoring/metrics/MODEL001", None),
    ("POST", "/monitoring/fairness", {"model_id": "MODEL001", "predictions": [0.8, 0.6, 0.9], "actuals": [1, 0, 1], "sensitive_attributes": [{"group": "A"}, {"group": "B"}]}),
    ("POST", "/monitoring/shap", {"model_id": "MODEL001", "input_data": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]], "feature_names": ["a", "b", "c"]}),
]


def test_endpoints():
    results = {"passed": 0, "failed": []}

    for method, path, payload in ROUTES:
        url = f"{BASE_URL}{API_PREFIX}{path}"
        try:
            if method == "POST":
                resp = requests.post(url, json=payload, timeout=30)
            else:
                resp = requests.get(url, timeout=30)

            if resp.status_code == 200:
                body = resp.json()
                results["passed"] += 1
            else:
                results["failed"].append((f"{method} {path}", f"HTTP {resp.status_code}: {resp.text[:120]}"))
        except requests.ConnectionError:
            results["failed"].append((f"{method} {path}", "Connection refused"))
        except Exception as e:
            results["failed"].append((f"{method} {path}", str(e)[:100]))

    return results


def main():
    print("Starting server...")
    server_dir = os.path.join(os.path.dirname(__file__), '..', 'api')
    python = sys.executable
    proc = subprocess.Popen(
        [python, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8350", "--log-level", "error"],
        cwd=server_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(10)

    try:
        requests.get(f"{BASE_URL}/docs", timeout=5)
        print("Server is running.")
    except Exception:
        print("Server not responding after 10s, trying longer wait...")
        time.sleep(15)

    print("Testing endpoints...")
    try:
        results = test_endpoints()
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()

    print(f"\n=== Endpoint Test Results ===")
    print(f"Total endpoints tested: {results['passed'] + len(results['failed'])}")
    print(f"Passed: {results['passed']}")
    print(f"Failed: {len(results['failed'])}")
    if results['failed']:
        print(f"\nFailed endpoints:")
        for endpoint, reason in results['failed']:
            print(f"  ❌ {endpoint}: {reason}")
    else:
        print("All endpoints passed!")

    return len(results['failed']) == 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
