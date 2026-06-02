"""
Benchmark script for AI/ML models.
Measures train time, inference time, and memory usage per model.
"""
import time
import sys
import os
import gc
import tracemalloc
import pandas as pd
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

def format_duration(sec):
    if sec < 1:
        return f"{sec*1000:.1f}ms"
    return f"{sec:.2f}s"

def format_mem(bytes_val):
    if bytes_val < 1024:
        return f"{bytes_val}B"
    elif bytes_val < 1024*1024:
        return f"{bytes_val/1024:.1f}KB"
    return f"{bytes_val/(1024*1024):.1f}MB"

def peak_mem_snapshot():
    _, peak = tracemalloc.get_traced_memory()
    return peak

def run_benchmark(name, setup_fn, train_fn=None, infer_fn=None, n_infer=10):
    gc.collect()
    tracemalloc.start()
    results = {"model": name}
    mem_before = peak_mem_snapshot()
    try:
        model = setup_fn()
        mem_after_setup = peak_mem_snapshot()
        results["setup_mem"] = mem_after_setup - mem_before
        if train_fn:
            t0 = time.perf_counter()
            train_fn(model)
            train_time = time.perf_counter() - t0
            results["train_time"] = train_time
            mem_after_train = peak_mem_snapshot()
            results["train_mem"] = mem_after_train - mem_after_setup
        if infer_fn:
            t0 = time.perf_counter()
            for _ in range(n_infer):
                infer_fn(model)
            infer_time = (time.perf_counter() - t0) / n_infer
            results["infer_time"] = infer_time
        results["status"] = "OK"
    except Exception as e:
        results["status"] = f"ERR: {e}"
    finally:
        tracemalloc.stop()
    return results

def bench_demand_forecasting():
    from demand_forecasting.statistical.models import StatisticalForecaster
    import demand_forecasting.deep_learning.models as dl
    from demand_forecasting.hybrid.models import HybridForecaster
    N = 100
    dates = pd.date_range("2024-01-01", periods=N, freq="D")
    series = pd.Series(np.random.randn(N).cumsum() + 100, index=dates, name="sales")
    exog = pd.DataFrame({"promo": np.random.randint(0, 2, N)}, index=dates)
    results = []

    def setup_stat():
        m = StatisticalForecaster(model_type="ets")
        return m
    def train_stat(m):
        m.fit(series)
    def infer_stat(m):
        m.predict(steps=10)
    results.append(run_benchmark("statistical_ets", setup_stat, train_stat, infer_stat))

    def setup_dl():
        return dl.DeepLearningForecaster(model_type="lstm", input_size=5, hidden_size=16, num_layers=1)
    def train_dl(m):
        seq_len = 10
        batch = N
        X = np.random.randn(batch, seq_len, 5)
        y = np.random.randn(batch)
        m.fit(X, y, epochs=2, verbose=0)
    def infer_dl(m):
        m.predict(np.random.randn(1, 10, 5))
    results.append(run_benchmark("deep_learning_lstm", setup_dl, train_dl, infer_dl))

    def setup_hybrid():
        return HybridForecaster()
    def train_hybrid(m):
        m.fit(series, exog=exog)
    def infer_hybrid(m):
        m.predict(steps=5)
    results.append(run_benchmark("hybrid_ensemble", setup_hybrid, train_hybrid, infer_hybrid))

    return results

def bench_inventory_optimization():
    from inventory_optimization.reinforcement_learning.ddpg import DDPGInventoryAgent
    from inventory_optimization.reinforcement_learning.ppo import PPOInventoryAgent
    results = []
    def setup_ddpg():
        return DDPGInventoryAgent(state_dim=11, action_dim=1, max_action=200.0, device="cpu")
    results.append(run_benchmark("ddpg_agent_init", setup_ddpg, n_infer=1))
    def setup_ppo():
        return PPOInventoryAgent(state_dim=11, action_dim=1, max_action=200.0, device="cpu")
    results.append(run_benchmark("ppo_agent_init", setup_ppo, n_infer=1))
    return results

def bench_uncertainty_quantification():
    from uncertainty_quantification.probabilistic_framework.mc_dropout_pytorch import MCDropoutWrapper
    import torch
    import torch.nn as nn
    results = []
    def setup_mc():
        base = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 1))
        return MCDropoutWrapper(base, num_samples=50)
    def infer_mc(m):
        m.predict(torch.randn(1, 10), num_samples=5)
    results.append(run_benchmark("mc_dropout", setup_mc, infer_fn=infer_mc, n_infer=3))
    return results

def bench_model_monitoring():
    from model_monitoring.model_monitoring.adwin_detector import ADWINDetector
    results = []
    def setup_adwin():
        return ADWINDetector(delta=0.01)
    def infer_adwin(m):
        m.update(np.random.randn())
    results.append(run_benchmark("adwin_drift", setup_adwin, infer_fn=infer_adwin, n_infer=100))
    return results

def bench_continual_learning():
    from continual_learning.continual_learning_framework.incremental_updater import PyTorchEWC
    import torch
    import torch.nn as nn
    results = []
    def setup_ewc():
        model = nn.Sequential(nn.Linear(10, 32), nn.ReLU(), nn.Linear(32, 1))
        optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
        return PyTorchEWC(model, optimizer)
    def infer_ewc(m):
        x = torch.randn(1, 10)
        m.model(x)
    results.append(run_benchmark("ewc_init", setup_ewc, infer_fn=infer_ewc, n_infer=5))
    return results

if __name__ == "__main__":
    print("=" * 100)
    print(f"{'Model':<30} {'Status':<12} {'Train':<12} {'Infer':<12} {'Setup Mem':<12} {'Train Mem':<12}")
    print("=" * 100)
    all_results = []
    for bench_fn in [bench_demand_forecasting, bench_inventory_optimization,
                     bench_uncertainty_quantification, bench_model_monitoring,
                     bench_continual_learning]:
        try:
            all_results.extend(bench_fn())
        except Exception as e:
            print(f"  BENCHMARK GROUP FAILED: {e}")
    for r in all_results:
        train = format_duration(r.get("train_time", 0)) if r["status"] == "OK" else "-"
        infer = format_duration(r.get("infer_time", 0)) if r["status"] == "OK" else "-"
        smem = format_mem(r.get("setup_mem", 0)) if r["status"] == "OK" else "-"
        tmem = format_mem(r.get("train_mem", 0)) if r["status"] == "OK" else "-"
        print(f"{r['model']:<30} {r['status']:<12} {train:<12} {infer:<12} {smem:<12} {tmem:<12}")
    print("=" * 100)
