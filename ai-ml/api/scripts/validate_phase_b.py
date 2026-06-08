"""Phase B endpoint validation: in-process via FastAPI TestClient."""
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
        "label": "1. GET /anomaly/alerts (list all active, default limit)",
        "method": "GET",
        "path": f"{BASE}/anomaly/alerts",
        "body": None,
        "expect_keys": ["alerts", "total", "limit", "offset", "filters", "model_version", "timestamp"],
        "extra_assert": lambda b: b.get("total", 0) >= 1 and len(b.get("alerts", [])) >= 1,
    },
    {
        "label": "2. GET /anomaly/alerts?status=acknowledged (filtered list)",
        "method": "GET",
        "path": f"{BASE}/anomaly/alerts?status=acknowledged&limit=10",
        "body": None,
        "expect_keys": ["alerts", "total", "filters", "model_version"],
        "extra_assert": lambda b: all(
            a.get("status") == "acknowledged" for a in b.get("alerts", [])
        ),
    },
    {
        "label": "3. GET /anomaly/alerts?limit=2&offset=1 (pagination)",
        "method": "GET",
        "path": f"{BASE}/anomaly/alerts?limit=2&offset=1",
        "body": None,
        "expect_keys": ["alerts", "total", "limit", "offset"],
        "extra_assert": lambda b: b.get("limit") == 2 and b.get("offset") == 1 and len(b.get("alerts", [])) <= 2,
    },
    {
        "label": "4. POST /anomaly/alerts/ALERT-001/acknowledge",
        "method": "POST",
        "path": f"{BASE}/anomaly/alerts/ALERT-001/acknowledge",
        "body": {"user_id": "ops-team-42", "notes": "Investigating, supplier notified"},
        "expect_keys": [
            "alert_id",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_at",
            "notes",
            "model_version",
            "timestamp",
        ],
        "extra_assert": lambda b: b.get("acknowledged") is True and b.get("alert_id") == "ALERT-001",
    },
    {
        "label": "5. POST /anomaly/alerts/ALERT-099/acknowledge (no notes)",
        "method": "POST",
        "path": f"{BASE}/anomaly/alerts/ALERT-099/acknowledge",
        "body": {"user_id": "auto-system"},
        "expect_keys": ["alert_id", "acknowledged", "acknowledged_by", "acknowledged_at", "model_version"],
        "extra_assert": lambda b: b.get("acknowledged_by") == "auto-system",
    },
    {
        "label": "6. DELETE /routing/edge/deploy/DEP-001 (new edge undeploy endpoint)",
        "method": "DELETE",
        "path": f"{BASE}/routing/edge/deploy/DEP-001",
        "body": None,
        "expect_keys": ["deployment_id", "status", "model_version", "timestamp"],
        "extra_assert": lambda b: b.get("status") == "removed" and b.get("deployment_id") == "DEP-001",
    },
    {
        "label": "7. DELETE /routing/edge/deploy/{auto-gen-id} (un-deploy a fresh one)",
        "method": "POST",
        "path": f"{BASE}/routing/edge/deploy",
        "body": {"model": {"name": "eta-v2"}, "target": "edge"},
        "expect_keys": ["deployment_id", "status", "endpoint_url", "model_version"],
        "extra_assert": lambda b: b.get("status") == "deployed",
    },
    # --- Mesh endpoints ---
    {
        "label": "9. POST /coordination/plan (mesh coordination)",
        "method": "POST",
        "path": f"{BASE}/coordination/plan",
        "body": {"agent_states": [{"id": "agent-1", "state": "idle"}], "environment_state": {"temperature": 25}, "objectives": ["minimize_cost"], "constraints": ["max_delivery_time:48h"], "time_horizon": 100},
        "expect_keys": ["plan_id", "agent_actions", "expected_outcomes", "coordination_metrics", "model_version", "timestamp"],
    },
    {
        "label": "10. POST /kg/query (knowledge graph query)",
        "method": "POST",
        "path": f"{BASE}/kg/query",
        "body": {"query": "supplier", "entity_types": ["supplier"], "max_results": 5},
        "expect_keys": ["query", "results", "entity_count", "relationship_count", "model_version", "timestamp"],
        "extra_assert": lambda b: b.get("query") == "supplier",
    },
    {
        "label": "11. POST /monitoring/drift (model drift detection)",
        "method": "POST",
        "path": f"{BASE}/monitoring/drift",
        "body": {"model_id": "demand_forecaster", "drift_threshold": 0.05, "window": "24h"},
        "expect_keys": ["model_id", "drift_detected", "drift_score", "affected_features", "model_version", "timestamp"],
    },
]

passed = 0
failed = 0
print("=" * 80)
print("Phase B integration validation: 2 new anomaly + 1 new routing endpoints")
print("=" * 80)

# Track deployment_id from step 7 to use in step 8 (chained)
last_deployment_id = None

for idx, case in enumerate(CASES, start=1):
    label = case["label"]
    method = case["method"]
    path = case["path"]
    body = case["body"]
    expect = case["expect_keys"]
    extra = case.get("extra_assert")

    if method == "POST":
        resp = client.post(path, json=body)
    elif method == "DELETE":
        resp = client.delete(path)
    else:
        resp = client.get(path)

    ok = resp.status_code == 200
    body_ok = True
    extra_ok = True
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
        if body_ok and extra:
            try:
                extra_ok = bool(extra(payload))
            except Exception as e:
                extra_ok = False
                payload["__extra_error__"] = str(e)
    else:
        payload = {}
        try:
            payload = resp.json()
        except Exception:
            pass

    # Chain: step 7 returns a deployment_id; step 8 will use it
    if idx == 7 and ok and body_ok:
        last_deployment_id = payload.get("deployment_id")

    if last_deployment_id and idx == 7:
        # Append a step 8: DELETE the just-deployed one
        chained = {
            "label": f"8. DELETE /routing/edge/deploy/{last_deployment_id} (chained from #7)",
            "method": "DELETE",
            "path": f"{BASE}/routing/edge/deploy/{last_deployment_id}",
            "body": None,
            "expect_keys": ["deployment_id", "status", "model_version", "timestamp"],
            "extra_assert": lambda b, did=last_deployment_id: b.get("status") == "removed" and b.get("deployment_id") == did,
        }
        CASES.append(chained)

    status_icon = "PASS" if (ok and body_ok and extra_ok) else "FAIL"
    print(f"\n[{status_icon}] {label}")
    print(f"    Status: {resp.status_code}")
    if ok and body_ok and extra_ok:
        print(f"    Body keys: {sorted(payload.keys())[:8]}{'...' if len(payload) > 8 else ''}")
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
