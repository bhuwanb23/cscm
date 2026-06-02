"""End-to-end test: auto-discover endpoints, POST with schema-generated payloads."""
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ["SKIP_MODEL_LOAD"] = "1"

# ── suppress deprecation warning from starlette ──
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def _gen_payload(schema):
    """Generate a simple valid payload from an OpenAPI schema dict."""
    if not schema:
        return {}
    props = schema.get("properties", {})
    required = schema.get("required", list(props.keys()))
    payload = {}
    for name in required:
        p = props.get(name, {})
        if name in ("data", "values", "sales_data", "items", "tasks", "agents",
                    "historical_data", "purchase_history", "purchase_data",
                    "prices", "features", "weights", "node_features", "client_updates",
                    "new_data", "anomaly_logs", "reference_data", "current_data",
                    "input_data", "input_features", "image_urls", "client_ids",
                    "action_masks", "agents_config", "orders", "warehouses",
                    "edge_index", "messages", "incidents", "supplier_ids",
                    "input_uncertainties", "states", "predictions", "sensitive_attributes",
                    "features_dict", "alerts", "parameters", "network_data"):
            inner = p.get("items", {}).get("type")
            if p.get("type") == "array" and inner == "object":
                payload[name] = [{}]
            elif p.get("type") == "array" and inner:
                payload[name] = [1.0]
            elif p.get("type") == "array":
                payload[name] = [[1.0, 2.0]]
            else:
                payload[name] = []
            continue

        t = p.get("type", "string")
        if t == "string":
            if "date" in name.lower() or "time" in name.lower() or "timestamp" in name.lower():
                payload[name] = "2024-01-01T00:00:00Z"
            elif "email" in name.lower():
                payload[name] = "test@test.com"
            elif "url" in name.lower():
                payload[name] = "http://example.com/img.jpg"
            elif "promotion" in name.lower():
                payload[name] = "2024-01-01"
            else:
                payload[name] = "test"
        elif t == "number" or t == "integer":
            if "contamination" in name.lower() or "threshold" in name.lower():
                payload[name] = 0.1
            elif "epoch" in name.lower():
                payload[name] = 2
            else:
                payload[name] = 1
        elif t == "boolean":
            payload[name] = False
        elif t == "array":
            inner = p.get("items", {})
            it = inner.get("type", "number")
            if it == "object":
                payload[name] = [{}]
            elif it == "number" or it == "integer":
                payload[name] = [1.0, 2.0]
            elif it == "string":
                payload[name] = ["a"]
            elif it == "array":
                payload[name] = [[1.0, 2.0]]
            else:
                payload[name] = [{}]
        elif t == "object":
            payload[name] = {"key": "val"}
    return payload

passed, failed = 0, []
for route in app.routes:
    if not hasattr(route, 'path') or not hasattr(route, 'methods'):
        continue
    path = route.path
    if path in ("/docs", "/openapi.json", "/redoc"):
        continue

    for method in route.methods:
        if method not in ("GET", "POST"):
            continue

        endpoint = route.endpoint
        payload = {}
        request_body = None

        if hasattr(endpoint, '__wrapped__'):
            endpoint = endpoint.__wrapped__

        import inspect
        sig = inspect.signature(endpoint)
        for pname, param in sig.parameters.items():
            if pname in ('request', 'body', 'query'):
                hint = param.annotation
                if hint is inspect.Parameter.empty:
                    continue
                origin = getattr(hint, '__origin__', None)
                if origin is None and hasattr(hint, 'model_fields'):
                    request_body = hint
                    break
                elif origin is list:
                    args = getattr(hint, '__args__', [])
                    if args and hasattr(args[0], 'model_fields'):
                        request_body = args[0]
                        break

        if request_body is not None:
            try:
                schema = request_body.model_json_schema() if hasattr(request_body, 'model_json_schema') else {}
                payload = _gen_payload(schema)
            except Exception:
                payload = {}

        try:
            if method == "POST":
                resp = client.post(path, json=payload)
            else:
                path_params = {}
                if '{' in path:
                    import re
                    for m in re.finditer(r'\{(\w+)\}', path):
                        path_params[m.group(1)] = "test"
                    try:
                        resp = client.get(path.format(**path_params))
                    except Exception:
                        resp = client.get(path)
                else:
                    resp = client.get(path)

            if resp.status_code == 200:
                passed += 1
            elif resp.status_code == 422:
                failed.append((f"{method} {path}", f"422: {resp.text[:100]}"))
            else:
                failed.append((f"{method} {path}", f"HTTP {resp.status_code}"))
        except Exception as e:
            failed.append((f"{method} {path}", str(e)[:80]))

total = passed + len(failed)
print(f"\n=== E2E Test Results ===")
print(f"Total: {total} | Passed: {passed} | Failed: {len(failed)}")

# Show up to 15 failures for diagnostics
for ep, reason in failed[:15]:
    print(f"  FAIL {ep}: {reason}")
if len(failed) > 15:
    print(f"  ... and {len(failed)-15} more failures")

sys.exit(0 if len(failed) == 0 else 1)
