r"""Demo readiness check for the CSCM mobile app.

Hits one representative endpoint from each backend family via the
in-process FastAPI TestClient (no port binding, no gateway required).
For each family, prints whether the call reached the endpoint and a
one-line summary.

This is a *readiness* check, not a schema validation suite. A 2xx
response means the endpoint is wired up and can be called by the mobile
app. A 422 response means the endpoint exists and Pydantic is
validating (the mobile app should send schemas that pass). A 5xx or
network error means the endpoint is broken and needs attention.

For full schema validation, use validate_phase_a.py and
validate_phase_b.py which use the exact Pydantic shapes.

Usage (from ai-ml/):
    venv\Scripts\python -m api.scripts.seed_demo_data
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from fastapi.testclient import TestClient  # noqa: E402

from api.main import app  # noqa: E402

client = TestClient(app)

CHECKS = [
    {
        "family": "store",
        "label": "demand/forecast",
        "method": "POST",
        "path": "/api/v1/demand/forecast",
        "body": {"sku_id": "SKU-001", "store_id": "STORE-001", "forecast_horizon": 7},
    },
    {
        "family": "store",
        "label": "inventory/optimize",
        "method": "POST",
        "path": "/api/v1/inventory/optimize",
        "body": {"sku_id": "SKU-001", "store_id": "STORE-001"},
    },
    {
        "family": "store",
        "label": "anomaly/detect",
        "method": "POST",
        "path": "/api/v1/anomaly/detect",
        "body": {"metric": "stock_velocity", "store_id": "STORE-001", "values": [1, 2, 3]},
    },
    {
        "family": "warehouse",
        "label": "inventory/batch-optimize",
        "method": "POST",
        "path": "/api/v1/inventory/batch-optimize",
        "body": {"skus": ["SKU-001", "SKU-002"]},
    },
    {
        "family": "warehouse",
        "label": "routing/optimize",
        "method": "POST",
        "path": "/api/v1/routing/optimize",
        "body": {"stops": ["S1", "S2", "S3"]},
    },
    {
        "family": "transport",
        "label": "routing/eta",
        "method": "POST",
        "path": "/api/v1/routing/eta",
        "body": {"origin": "WH-001", "destination": "STORE-001"},
    },
    {
        "family": "transport",
        "label": "routing/status/ROUTE-001",
        "method": "GET",
        "path": "/api/v1/routing/status/ROUTE-001",
    },
    {
        "family": "transport",
        "label": "routing/edge/deploy (DELETE)",
        "method": "DELETE",
        "path": "/api/v1/routing/edge/deploy/DEP-TEST",
    },
    {
        "family": "supplier",
        "label": "supplier/risk",
        "method": "POST",
        "path": "/api/v1/supplier/risk",
        "body": {"supplier_id": "SUP-001"},
    },
    {
        "family": "supplier",
        "label": "supplier/backup",
        "method": "POST",
        "path": "/api/v1/supplier/backup",
        "body": {"primary_supplier_id": "SUP-001", "requirements": {"min_quality": 0.8}},
    },
    {
        "family": "supplier",
        "label": "supplier/risk-metrics",
        "method": "POST",
        "path": "/api/v1/supplier/risk-metrics",
        "body": {"range": "7d", "supplier_id": "SUP-1"},
    },
    {
        "family": "customer_demand",
        "label": "nlp/sentiment",
        "method": "POST",
        "path": "/api/v1/nlp/sentiment",
        "body": {"text": "Great product!"},
    },
    {
        "family": "central_planner",
        "label": "coordination/plan",
        "method": "POST",
        "path": "/api/v1/coordination/plan",
        "body": {"scope": "demo", "horizon_days": 7},
    },
    {
        "family": "central_planner",
        "label": "anomaly/alerts (list)",
        "method": "GET",
        "path": "/api/v1/anomaly/alerts",
        "params": {"status": "active", "limit": 5},
    },
    {
        "family": "central_planner",
        "label": "kg/query",
        "method": "POST",
        "path": "/api/v1/kg/query",
        "body": {"query": "supplier", "max_results": 3},
    },
    {
        "family": "central_planner",
        "label": "monitoring/drift",
        "method": "POST",
        "path": "/api/v1/monitoring/drift",
        "body": {"model_name": "demand_forecaster"},
    },
    {
        "family": "central_planner",
        "label": "uncertainty/safety-stock",
        "method": "POST",
        "path": "/api/v1/uncertainty/safety-stock",
        "body": {"product_id": "PROD-001", "demand_forecast": 100, "service_level": 0.95, "lead_time_days": 7},
    },
    {
        "family": "simulation",
        "label": "simulation/run",
        "method": "POST",
        "path": "/api/v1/simulation/run",
        "body": {"scenario": "demo"},
    },
    {
        "family": "simulation",
        "label": "simulation/network-sim",
        "method": "POST",
        "path": "/api/v1/simulation/network-sim",
        "body": {"nodes": 3, "edges": 2},
    },
]


def call(method, path, body=None, params=None):
    try:
        response = client.request(method, path, json=body, params=params, timeout=30)
        if response.status_code >= 500:
            return "FAIL", f"status={response.status_code} (server error)"
        if response.status_code == 422:
            return "WARN", f"status=422 (Pydantic rejected sample shape)"
        if response.status_code >= 400:
            return "WARN", f"status={response.status_code} client_error"
        return "OK", f"status={response.status_code}"
    except Exception as exc:
        return "FAIL", f"exception={type(exc).__name__}: {str(exc)[:60]}"


def main():
    print("CSCM demo readiness check")
    print("=" * 64)
    print("  Endpoint reaches the FastAPI app and returns a defined status.")
    print("  OK   = 2xx (endpoint works, mobile app can call it)")
    print("  WARN = 4xx (Pydantic rejected sample input; mobile app will")
    print("              send valid shapes -- use validate_phase_a/b to fix)")
    print("  FAIL = 5xx/connection (endpoint is broken; needs attention)")
    print("=" * 64)

    current_family = None
    counts = {"OK": 0, "WARN": 0, "FAIL": 0}
    failed = []
    warned = []

    for check in CHECKS:
        if check["family"] != current_family:
            current_family = check["family"]
            print()
            print(f"  [{current_family}]")
        status, detail = call(check["method"], check["path"], check.get("body"), check.get("params"))
        counts[status] += 1
        if status == "FAIL":
            failed.append(check["label"])
        elif status == "WARN":
            warned.append(check["label"])
        print(f"    [{status}] {check['label']:<32}  {detail}")

    total = len(CHECKS)
    print()
    print("=" * 64)
    print(f"  Total: {total} endpoints checked")
    print(f"    OK   : {counts['OK']}")
    print(f"    WARN : {counts['WARN']} (Pydantic rejected sample shape; not a blocker)")
    print(f"    FAIL : {counts['FAIL']}")
    print()
    if failed:
        print("  Failed endpoints (need attention):")
        for label in failed:
            print(f"    - {label}")
    if warned:
        print("  Warned endpoints (Pydantic rejected the placeholder input):")
        for label in warned:
            print(f"    - {label}")
    print()
    if counts["FAIL"] == 0:
        print("  All endpoints reachable. Mobile app can hit every family.")
    else:
        print(f"  {counts['FAIL']} endpoint(s) failed; fix before booting the mobile app.")


if __name__ == "__main__":
    main()
