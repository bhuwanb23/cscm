#!/usr/bin/env python3
"""Fix guard placement in torch-dependent test modules.

v1 inserted the importorskip line inside module docstrings (docstring body
lines were treated as import-block lines). This version:
  1. removes any guard line found inside a docstring, and
  2. (re-)inserts the guard after the module docstring + import block.
Idempotent.
"""
import re

GUARD = 'pytest.importorskip("torch", reason="torch-backed model tests require PyTorch")\n'

FILES = """
tests/anomaly_detection/phase2/test_autoencoder.py
tests/anomaly_detection/phase2/test_lstm_anomaly.py
tests/anomaly_detection/phase2/test_vae.py
tests/computer_vision/phase4/test_deployment.py
tests/demand_forecasting/phase2/deep_learning/test_models.py
tests/demand_forecasting/phase2/probabilistic/test_models.py
tests/demand_forecasting/phase2/transformer_based/test_models.py
tests/demand_forecasting/phase3/test_edge_inference.py
tests/demand_forecasting/phase3/test_retraining.py
tests/demand_forecasting/phase3/test_sliding_window.py
tests/digital_twin/phase1/test_physics.py
tests/digital_twin/phase2/test_agent_based.py
tests/digital_twin/phase3/test_learned.py
tests/digital_twin/phase4/test_use_cases.py
tests/inventory_optimization/phase2/test_ddpg.py
tests/inventory_optimization/phase2/test_dqn.py
tests/inventory_optimization/phase2/test_ppo.py
tests/multi_agent_coordination/phase1/test_hierarchical_rl.py
tests/multi_agent_coordination/phase1/test_maddpg.py
tests/multi_agent_coordination/phase1/test_mappo.py
tests/multi_agent_coordination/phase1/test_qmix.py
tests/multi_agent_coordination/phase2/test_gnn_communication.py
tests/multi_agent_coordination/phase2/test_message_passing.py
tests/multi_agent_coordination/phase2/test_state_exchange.py
tests/multi_agent_coordination/phase3/test_coordination_metrics.py
tests/multi_agent_coordination/phase3/test_ctde_trainer.py
tests/multi_agent_coordination/phase3/test_digital_twin.py
tests/multi_agent_coordination/phase3/test_edge_policy_deployment.py
tests/routing_logistics/phase2/test_gnn_route_planner.py
tests/routing_logistics/phase2/test_learned_heuristics.py
tests/routing_logistics/phase2/test_rl_routing.py
tests/routing_logistics/phase3/test_lstm_eta.py
tests/routing_logistics/phase3/test_transformer_routing.py
tests/routing_logistics/phase4/test_edge_deployment.py
tests/routing_logistics/phase4/test_metrics_tracker.py
tests/routing_logistics/phase4/test_rl_simulator.py
tests/routing_logistics/phase4/test_traffic_simulation.py
tests/test_uncertainty_quantification_module.py
""".strip().split()


def strip_bad_guards(src: str) -> str:
    """Remove guard lines that sit inside a module docstring."""
    out = []
    in_doc = False
    doc_quote = None
    for line in src.splitlines(keepends=True):
        s = line.strip()
        if not in_doc:
            m = re.match(r'^(r|b|rb|br)?("""|\'\'\')', s)
            if m and s.count(m.group(2)) < 2:  # opens a docstring, not one-liner
                in_doc = True
                doc_quote = m.group(2)
            out.append(line)
        else:
            if GUARD.strip() not in line:
                out.append(line)
            if doc_quote and doc_quote in line:
                in_doc = False
    return "".join(out)


def find_insert_index(lines):
    """Index after module docstring (if any) and the contiguous import block."""
    i = 0
    # module docstring
    if i < len(lines) and lines[i].lstrip().startswith(('"""', "'''")):
        q = lines[i].lstrip()[:3]
        if lines[i].strip().count(q) >= 2 and len(lines[i].strip()) > 3:
            i += 1
        else:
            i += 1
            while i < len(lines) and q not in lines[i]:
                i += 1
            i += 1
    # imports / comments / blanks
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith(("import ", "from ")) or s == "" or s.startswith("#"):
            i += 1
        else:
            break
    return i


changed = fixed = 0
for path in FILES:
    try:
        src = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        print(f"MISSING: {path}")
        continue

    had_guard_anywhere = GUARD.strip() in src
    src = strip_bad_guards(src)

    lines = src.splitlines(keepends=True)
    # Remove a correctly-placed top-level guard too (we re-insert uniformly).
    lines = [l for l in lines if l.strip() != GUARD.strip()]

    idx = find_insert_index(lines)
    block = []
    if not re.search(r"^\s*import pytest", "".join(lines), flags=re.M):
        block.append("import pytest\n")
    block.append(GUARD)
    lines[idx:idx] = block

    out = "".join(lines)
    if out != src:
        open(path, "w", encoding="utf-8", newline="").write(out)
        changed += 1
    if had_guard_anywhere:
        fixed += 1
    print(f"fixed: {path}")

print(f"\n{changed} files rewritten ({fixed} had misplaced/previous guards)")
