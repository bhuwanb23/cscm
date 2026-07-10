"""
Unit tests for inventory optimization - RL simulator and deployment.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestInventorySimulator:
    """Tests for inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator."""

    def test_init(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import InventorySimulator
        sim = InventorySimulator(initial_inventory=100.0, random_seed=42)
        assert sim is not None

    def test_reset(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import InventorySimulator
        sim = InventorySimulator(initial_inventory=100.0, random_seed=42)
        state = sim.reset()
        assert state.current_inventory == 100.0

    def test_step_no_order(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import InventorySimulator
        sim = InventorySimulator(initial_inventory=100.0, demand_mean=10.0, demand_std=2.0, random_seed=42)
        sim.reset()
        next_state, reward, done, info = sim.step(0.0)
        assert next_state.current_inventory >= 0
        assert 'demand' in info

    def test_step_with_order(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import InventorySimulator
        sim = InventorySimulator(initial_inventory=100.0, lead_time=7, random_seed=42)
        sim.reset()
        next_state, reward, done, info = sim.step(50.0)
        assert info['order_quantity'] == 50.0

    def test_demand_models(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import (
            InventorySimulator, DemandModel
        )
        for model_type in [DemandModel.NORMAL, DemandModel.POISSON, DemandModel.SEASONAL]:
            sim = InventorySimulator(demand_model=model_type, random_seed=42)
            sim.reset()
            d = sim.generate_demand()
            assert d >= 0

    def test_statistics(self):
        from inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import InventorySimulator
        sim = InventorySimulator(random_seed=42)
        sim.reset()
        for _ in range(10):
            sim.step(20.0)
        stats = sim.get_statistics()
        assert 'total_periods' in stats
        assert stats['total_periods'] == 10


class TestForecastDrivenHeuristic:
    """Tests for inventory_optimization.optimization_framework.heuristic_algorithms."""

    def test_init(self):
        from inventory_optimization.optimization_framework.heuristic_algorithms import ForecastDrivenHeuristic
        h = ForecastDrivenHeuristic()
        assert h.safety_stock_multiplier == 1.5

    def test_safety_stock(self):
        from inventory_optimization.optimization_framework.heuristic_algorithms import ForecastDrivenHeuristic
        h = ForecastDrivenHeuristic()
        ss = h.calculate_safety_stock(demand_forecast=100, demand_std=20, lead_time=7, service_level=0.95)
        assert ss > 0

    def test_reorder_point(self):
        from inventory_optimization.optimization_framework.heuristic_algorithms import ForecastDrivenHeuristic
        h = ForecastDrivenHeuristic()
        rp = h.calculate_reorder_point(demand_forecast=100, demand_std=20, lead_time=7)
        assert rp > 0

    def test_order_quantity(self):
        from inventory_optimization.optimization_framework.heuristic_algorithms import ForecastDrivenHeuristic
        h = ForecastDrivenHeuristic()
        oq = h.calculate_order_quantity(
            current_inventory=50, demand_forecast=100, demand_std=20,
            lead_time=7, max_capacity=500, service_level=0.95
        )
        assert oq >= 0


class TestMetricsTracker:
    """Tests for inventory_optimization.deployment_integration.metrics_tracker."""

    def test_init(self):
        from inventory_optimization.deployment_integration.metrics_tracker import InventoryMetricsTracker
        t = InventoryMetricsTracker()
        assert t is not None

    def test_calculate_metrics(self):
        from inventory_optimization.deployment_integration.metrics_tracker import InventoryMetricsTracker
        t = InventoryMetricsTracker()
        fill_rate = t.calculate_fill_rate(demand=100, satisfied_demand=95)
        assert fill_rate == 0.95
        turns = t.calculate_inventory_turns(cost_of_goods_sold=10000, average_inventory_value=2000)
        assert turns == 5.0
        dos = t.calculate_days_of_supply(current_inventory=100, average_daily_demand=10)
        assert dos == 10.0
