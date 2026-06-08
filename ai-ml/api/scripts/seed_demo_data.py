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
import json
import argparse
from datetime import datetime

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


def call(method, path, body=None, params=None, save_body=False):
    try:
        response = client.request(method, path, json=body, params=params, timeout=30)
        code = response.status_code
        parsed = {}
        if save_body:
            try:
                parsed = response.json()
            except Exception:
                parsed = {"_text": response.text[:200]}
        base = {"status": "OK" if code < 400 else ("WARN" if code < 500 else "FAIL"),
                "detail": f"status={code}", "code": code}
        if code >= 400:
            base["detail"] = f"status={code} {'server error' if code >= 500 else 'client error'}"
        if code >= 500:
            base["status"] = "FAIL"
        elif code == 422:
            base["status"] = "WARN"
            base["detail"] = "status=422 (Pydantic rejected sample shape)"
        elif code >= 400:
            base["status"] = "WARN"
            base["detail"] = f"status={code} client_error"
        if save_body:
            base["body"] = parsed
        return base
    except Exception as exc:
        return {"status": "FAIL", "detail": f"exception={type(exc).__name__}: {str(exc)[:60]}", "code": None}


def main(args):
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
    results = []

    save = bool(args.save_responses)
    responses = {}

    for check in CHECKS:
        if check["family"] != current_family:
            current_family = check["family"]
            print()
            print(f"  [{current_family}]")
        result = call(check["method"], check["path"], check.get("body"), check.get("params"), save_body=save)
        results.append({**check, **result})
        if save:
            responses[check["label"]] = {"status": result["status"], "code": result["code"], "body": result.get("body")}
        counts[result["status"]] += 1
        if result["status"] == "FAIL":
            failed.append(check["label"])
        elif result["status"] == "WARN":
            warned.append(check["label"])
        print(f"    [{result['status']}] {check['label']:<32}  {result['detail']}")

    total = len(CHECKS)

    report = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "total": total,
        "ok": counts["OK"],
        "warn": counts["WARN"],
        "fail": counts["FAIL"],
        "failed_endpoints": [{"label": f, "detail": r["detail"]} for f, r in zip(failed, [x for x in results if x["status"] == "FAIL"])],
        "warned_endpoints": [{"label": w, "detail": r["detail"]} for w, r in zip(warned, [x for x in results if x["status"] == "WARN"])],
        "results": [{k: v for k, v in r.items() if k in ("family", "label", "method", "path", "status", "detail", "code")} for r in results],
    }

    print()
    print("=" * 64)
    print(f"  Total: {total} endpoints checked")
    print(f"    OK   : {counts['OK']}")
    print(f"    WARN : {counts['WARN']} (Pydantic rejected sample shape; not a blocker)")
    print(f"    FAIL : {counts['FAIL']}")
    print()
    if failed:
        print("  Failed endpoints (need attention):")
        for f, r in zip(failed, [x for x in results if x["status"] == "FAIL"]):
            print(f"    - {f}: {r['detail']}")
    if warned:
        print("  Warned endpoints (Pydantic rejected the placeholder input):")
        for w, r in zip(warned, [x for x in results if x["status"] == "WARN"]):
            print(f"    - {w}: {r['detail']}")
    print()
    if counts["FAIL"] == 0:
        print("  All endpoints reachable. Mobile app can hit every family.")
    else:
        print(f"  {counts['FAIL']} endpoint(s) failed; fix before booting the mobile app.")

    if args.output:
        out_path = args.output
        with open(out_path, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n  Report written to {out_path}")

    if args.save_responses:
        resp_path = args.save_responses
        with open(resp_path, "w") as f:
            json.dump(responses, f, indent=2, default=str)
        print(f"  Response bodies saved to {resp_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CSCM demo readiness check")
    parser.add_argument("--output", "-o", type=str, default=None, help="Path to write JSON report (default: stdout only)")
    parser.add_argument("--save-responses", type=str, default=None, help="Path to write response bodies per endpoint (default: not saved)")
    main(parser.parse_args())
