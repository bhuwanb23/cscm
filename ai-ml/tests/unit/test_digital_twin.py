"""
Unit tests for digital twin simulators.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestWarehouseSimulator:
    """Tests for digital_twin.physics_based.warehouse_process.WarehouseProcessSimulator."""

    def test_init_with_zones(self):
        from digital_twin.physics_based.warehouse_process import WarehouseProcessSimulator, Zone
        zones = [Zone(name="picking", capacity=100, process_rate=10.0)]
        sim = WarehouseProcessSimulator(zones=zones, arrival_rate_per_hour=5.0)
        assert sim is not None

    def test_simulate(self):
        from digital_twin.physics_based.warehouse_process import WarehouseProcessSimulator, Zone
        zones = [Zone(name="picking", capacity=100, process_rate=10.0)]
        sim = WarehouseProcessSimulator(zones=zones, arrival_rate_per_hour=5.0)
        result = sim.simulate(random_seed=42)
        assert result is not None


class TestConveyorFlow:
    """Tests for digital_twin.physics_based.conveyor_flow."""

    def test_init_with_segments(self):
        from digital_twin.physics_based.conveyor_flow import ConveyorFlowSimulator, ConveyorSegment
        segments = [ConveyorSegment(segment_id="s1", length=10.0, speed=1.0)]
        sim = ConveyorFlowSimulator(segments=segments)
        assert sim is not None


class TestDiscreteEventSimulator:
    """Tests for digital_twin.physics_based.des_framework.DiscreteEventSimulator."""

    def test_init_and_schedule(self):
        from digital_twin.physics_based.des_framework import DiscreteEventSimulator
        sim = DiscreteEventSimulator()
        sim.schedule(timestamp=1.0, action=lambda t: None)
        assert sim is not None


class TestOrderSimulationEngine:
    """Tests for digital_twin.agent_based.order_simulator.OrderSimulationEngine."""

    def test_init(self):
        import pandas as pd
        from digital_twin.agent_based.order_simulator import OrderSimulationEngine
        df = pd.DataFrame({
            'order_id': [1, 2, 3],
            'timestamp': pd.date_range('2023-01-01', periods=3, freq='h'),
            'quantity': [10, 20, 15],
        })
        engine = OrderSimulationEngine(orders=df)
        assert engine is not None
