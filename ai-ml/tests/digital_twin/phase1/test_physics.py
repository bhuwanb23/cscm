"""
Tests for Phase 1 physics-based simulators.
"""

import pytest
import os
import sys
import json

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA_DIR = os.path.join(ROOT, 'data', 'test')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from digital_twin.physics_based import warehouse_process, conveyor_flow, des_framework


def test_warehouse_process():
    layout = os.path.join(DATA_DIR, 'warehouse_layout.json')
    sim = warehouse_process.WarehouseProcessSimulator.from_layout(layout)
    result = sim.simulate()
    assert 'throughput_units_per_hour' in result


def test_conveyor_flow():
    config = os.path.join(DATA_DIR, 'conveyor_config.json')
    sim = conveyor_flow.ConveyorFlowSimulator.from_config(config)
    metrics = sim.simulate(num_containers=50)
    assert metrics['mean_travel_time_seconds'] > 0


def test_des_framework():
    sim = des_framework.DiscreteEventSimulator()
    def sample_action(ts):
        sim.record(f"tick-{ts}")
    sim.schedule(1.0, sample_action)
    sim.schedule(2.0, sample_action)
    sim.run()
    assert len(sim.history) == 2
