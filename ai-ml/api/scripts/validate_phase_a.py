"""Phase A integration validation: hit each modified endpoint in-process
via FastAPI's TestClient. No uvicorn/port binding required."""
import sys
import os
import json
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from api.main import app  # noqa: E402

client = TestClient(app)

BASE = "/api/v1"

CASES = [
    {
        "label": "1. inventory/batch-optimize (skus)",
        "method": "POST",
        "path": f"{BASE}/inventory/batch-optimize",
        "body": {"skus": ["SKU-001", "SKU-002", "SKU-003"]},
        "expect_keys": ["results", "recommendations", "total_savings", "model_version", "timestamp"],
    },
    {
        "label": "2. routing/edge/deploy (model,target)",
        "method": "POST",
        "path": f"{BASE}/routing/edge/deploy",
        "body": {"model": {"name": "eta-v1", "version": "1.0"}, "target": "edge"},
        "expect_keys": ["deployment_id", "status", "endpoint_url", "model_version", "timestamp"],
    },
    {
        "label": "3. supplier/calibrate (assessments,ground_truth)",
        "method": "POST",
        "path": f"{BASE}/supplier/calibrate",
        "body": {"assessments": [0.1, 0.5, 0.9, 0.3], "ground_truth": [0, 1, 1, 0]},
        "expect_keys": ["calibrated_scores", "calibration_error", "model_version", "timestamp"],
    },
    {
        "label": "4. supplier/backup (primary_supplier_id,requirements nested)",
        "method": "POST",
        "path": f"{BASE}/supplier/backup",
        "body": {
            "primary_supplier_id": "SUP-001",
            "requirements": {
                "product_category": "electronics",
                "min_quality": 0.8,
                "max_lead_time": 14,
                "region": "NA",
            },
        },
        "expect_keys": ["backups", "total_candidates", "model_version", "timestamp"],
    },
    {
        "label": "5. supplier/risk-metrics (range,supplier_id)",
        "method": "POST",
        "path": f"{BASE}/supplier/risk-metrics",
        "body": {"range": "7d", "supplier_id": "SUP-1"},
        "expect_keys": [
            "total_assessments",
            "avg_risk_score",
            "distribution",
            "trends",
            "time_range",
            "model_version",
        ],
    },
    {
        "label": "6. uncertainty/safety-stock (product_id,demand_forecast)",
        "method": "POST",
        "path": f"{BASE}/uncertainty/safety-stock",
        "body": {
            "product_id": "PROD-001",
            "lead_time_days": 7,
            "service_level": 0.95,
            "demand_forecast": 150.0,
        },
        "expect_keys": [
            "safety_stock",
            "reorder_point",
            "uncertainty_bounds",
            "confidence_level",
            "model_version",
            "timestamp",
        ],
    },
    {
        "label": "7. learning/strategic-update (model_state,new_data)",
        "method": "POST",
        "path": f"{BASE}/learning/strategic-update",
        "body": {
            "model_state": {"model_id": "M-1", "learning_rate": 0.005, "weights": [0.1, 0.2]},
            "new_data": [{"x": 1, "y": 0}, {"x": 2, "y": 1}, {"x": 3, "y": 1}],
            "learning_rate": 0.005,
        },
        "expect_keys": [
            "model_id",
            "strategy",
            "metrics",
            "training_metrics",
            "updated_at",
            "model_version",
        ],
    },
    {
        "label": "8. anomaly/alerts/A-001 (legacy GET)",
        "method": "GET",
        "path": f"{BASE}/anomaly/alerts/A-001",
        "body": None,
        "expect_keys": ["alert_id", "anomalies", "model_version", "timestamp"],
    },
    {
        "label": "9. monitoring/drift (model_id,window)",
        "method": "POST",
        "path": f"{BASE}/monitoring/drift",
        "body": {"model_id": "demand-forecaster", "window": "24h"},
        "expect_keys": [
            "model_id",
            "drift_detected",
            "drift_score",
            "affected_features",
            "model_version",
            "timestamp",
        ],
    },
    {
        "label": "10. supplier/calibrate (action=get_status)",
        "method": "POST",
        "path": f"{BASE}/supplier/calibrate",
        "body": {"action": "get_status"},
        "expect_keys": ["calibration_score", "threshold_adjustments", "model_version", "timestamp"],
    },
]

passed = 0
failed = 0
print("=" * 80)
print("Phase A integration validation: real Pydantic schema + endpoint round-trip")
print("=" * 80)

for case in CASES:
    label = case["label"]
    method = case["method"]
    path = case["path"]
    body = case["body"]
    expect = case["expect_keys"]

    if method == "POST":
        resp = client.post(path, json=body)
    else:
        resp = client.get(path)

    ok = resp.status_code == 200
    body_ok = True
    missing = []

    if ok:
        try:
            payload = resp.json()
        except Exception:
            payload = {}
            body_ok = False
        for k in expect:
            if k not in payload:
                body_ok = False
                missing.append(k)
    else:
        payload = {}
        try:
            payload = resp.json()
        except Exception:
            pass

    status_icon = "PASS" if (ok and body_ok) else "FAIL"
    print(f"\n[{status_icon}] {label}")
    print(f"    Status: {resp.status_code}")
    if ok and body_ok:
        print(f"    Body keys present: {sorted(payload.keys())[:8]}{'...' if len(payload) > 8 else ''}")
        passed += 1
    else:
        print(f"    Body: {json.dumps(payload, indent=2)[:500]}")
        if missing:
            print(f"    MISSING keys: {missing}")
        failed += 1

print()
print("=" * 80)
print(f"RESULT: {passed} passed, {failed} failed (out of {len(CASES)})")
print("=" * 80)
sys.exit(0 if failed == 0 else 1)
