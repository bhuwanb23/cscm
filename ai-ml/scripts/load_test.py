"""
Load test for CSCM AI/ML API.

Spawns a uvicorn server in a subprocess, then sends concurrent HTTP
requests to key endpoints at increasing concurrency levels.

Usage:
    python scripts/load_test.py [--host HOST] [--port PORT] [--concurrency 10 25 50 100]

Requires: httpx, uvicorn, fastapi
"""

import argparse
import concurrent.futures
import json
import logging
import multiprocessing
import sys
import time
import os
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("load_test")

HOST = "127.0.0.1"
PORT = 19876
BASE = f"http://{HOST}:{PORT}/api/v1"

ENDPOINTS = [
    ("GET", "/", {"path": "/"}),
    ("GET", "/health", {"path": "/health"}),
    ("GET", "/metrics", {"path": "/metrics"}),
    ("POST", "/demand/forecast", {"json": {"sku_id": 1, "store_id": 1, "periods": 5}}),
    ("POST", "/demand/sales-forecast", {"json": {"sku_id": 1, "store_id": 1, "periods": 5}}),
    ("POST", "/inventory/recommendation", {"json": {"sku_id": 1, "store_id": 1, "current_stock": 100}}),
    ("POST", "/inventory/ppo-action", {"json": {"state": [1.0, 0.5, 0.0, 0.8]}}),
    ("POST", "/routing/optimize", {"json": {"origin": "A", "destination": "B", "goods": [{"weight": 10, "type": "electronics"}]}}),
    ("POST", "/supplier/risk", {"json": {"features": {"lead_time_mean": 5.0, "lead_time_std": 1.0, "financial_score": 0.8, "reliability_score": 0.9, "on_time_rate": 0.95, "shipments": 500}}}),
    ("POST", "/anomaly/detect", {"json": {"data": [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]}}),
    ("POST", "/explain/prediction", {"json": {"features": {"sales": 100, "price": 10, "promotion": 1}}}),
    ("POST", "/nlp/analyze", {"json": {"text": "Supply chain disruption expected in Q3"}}),
    ("POST", "/kg/query", {"json": {"query": "Find suppliers for electronics"}}),
    ("POST", "/causal/estimate", {"json": {"treatment": "promotion", "outcome": "sales", "data": [[1, 0, 100], [0, 1, 90]]}}),
    ("POST", "/learning/update", {"json": {"model_id": "demand_forecaster", "new_data": [{"sales": 100}]}}),
    ("POST", "/simulation/run", {"json": {"scenario": "test", "steps": 10}}),
    ("POST", "/coordination/schedule", {"json": {"tasks": [{"id": 1, "priority": 5}]}}),
]


def request_endpoint(endpoint):
    import httpx
    method, path, kwargs = endpoint
    url = f"{BASE}{path}"
    try:
        r = getattr(httpx, method.lower())(url, **kwargs, timeout=10)
        return {"status": "ok" if r.is_success else "fail", "code": r.status_code, "url": url}
    except Exception as e:
        return {"status": "error", "code": 0, "url": url, "error": str(e)}


def run_burst(concurrency, endpoints):
    total = len(endpoints)
    results = []
    start = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = [pool.submit(request_endpoint, ep) for ep in endpoints]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())
    elapsed = time.perf_counter() - start
    ok = sum(1 for r in results if r["status"] == "ok")
    fail = sum(1 for r in results if r["status"] == "fail")
    errors = sum(1 for r in results if r["status"] == "error")
    return {
        "concurrency": concurrency,
        "total": total,
        "ok": ok,
        "fail": fail,
        "errors": errors,
        "elapsed": round(elapsed, 3),
        "throughput": round(total / elapsed, 1),
        "avg_latency": round(elapsed / total * 1000, 1),
    }


def wait_for_server(url, timeout=30):
    import httpx
    start = time.perf_counter()
    while time.perf_counter() - start < timeout:
        try:
            r = httpx.get(url, timeout=2)
            return True
        except Exception:
            time.sleep(0.5)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=HOST)
    parser.add_argument("--port", type=int, default=PORT)
    parser.add_argument("--concurrency", type=int, nargs="*", default=[10, 25, 50, 100])
    parser.add_argument("--server-only", action="store_true", help="Only start the server (for external load tests)")
    args = parser.parse_args()

    api_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "api"))
    sys.path.insert(0, api_root)

    runner = os.path.join(api_root, "_run_server.py")

    logger.info(f"Starting server on {args.host}:{args.port} ...")
    import subprocess as sp
    proc = sp.Popen(
        [sys.executable, runner, str(args.host), str(args.port)],
        stdout=sp.DEVNULL,
        stderr=sp.DEVNULL,
    )

    if not wait_for_server(f"http://{args.host}:{args.port}/health"):
        logger.error("Server failed to start")
        sys.exit(1)

    if args.server_only:
        logger.info(f"Server running on {args.host}:{args.port}. Press Ctrl+C to stop.")
        try:
            proc.wait()
        except KeyboardInterrupt:
            proc.terminate()
        return

    logger.info(f"Server ready. Running load tests with concurrency: {args.concurrency}")

    for conc in args.concurrency:
        report = run_burst(conc, ENDPOINTS)
        logger.info(
            f"  concurrency={report['concurrency']:>4d}  "
            f"ok={report['ok']:>3d}  fail={report['fail']:>3d}  "
            f"errors={report['errors']:>3d}  "
            f"{report['elapsed']:>5.1f}s  "
            f"{report['throughput']:>5.1f} req/s  "
            f"avg_latency={report['avg_latency']:>6.1f}ms"
        )

    proc.terminate()
    logger.info("Server stopped. Load test complete.")


if __name__ == "__main__":
    main()
