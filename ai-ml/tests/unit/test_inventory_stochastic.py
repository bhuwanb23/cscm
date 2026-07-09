"""
Unit tests for inventory optimization - stochastic models.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestEnhancedNewsvendor:
    """Tests for inventory_optimization.stochastic_models.newsvendor.EnhancedNewsvendorModel."""

    def test_init(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(holding_cost=1.0, shortage_cost=5.0)
        assert model.holding_cost == 1.0
        assert model.shortage_cost == 5.0

    def test_critical_ratio(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(holding_cost=1.0, shortage_cost=5.0)
        cr = model.shortage_cost / (model.shortage_cost + model.holding_cost)
        assert abs(cr - 5 / 6) < 0.01

    def test_optimal_quantity_normal(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(
            holding_cost=1.0, shortage_cost=5.0, distribution_type='normal'
        )
        demand = np.random.normal(100, 15, 500)
        model.fit(demand)
        q = model.predict_optimal_quantity()
        assert q > 0
        assert q < 500

    def test_optimal_quantity_gamma(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(
            holding_cost=2.0, shortage_cost=10.0, distribution_type='gamma'
        )
        demand = np.random.gamma(5, 20, 500)
        model.fit(demand)
        q = model.predict_optimal_quantity()
        assert q > 0

    def test_optimal_quantity_empirical(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(
            holding_cost=1.0, shortage_cost=5.0, distribution_type='empirical'
        )
        demand = np.array([80, 90, 100, 110, 120, 85, 95, 105, 115, 125] * 50)
        model.fit(demand)
        q = model.predict_optimal_quantity()
        assert q > 0

    def test_expected_cost(self):
        from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
        model = EnhancedNewsvendorModel(holding_cost=1.0, shortage_cost=5.0)
        demand = np.random.normal(100, 15, 500)
        model.fit(demand)
        q = model.predict_optimal_quantity()
        cost = model.calculate_expected_cost(q)
        assert cost >= 0


class TestSSPolicy:
    """Tests for inventory_optimization.stochastic_models.ss_policy.SSPolicyModel."""

    def test_init(self):
        from inventory_optimization.stochastic_models.ss_policy import SSPolicyModel
        model = SSPolicyModel(holding_cost=1.0, ordering_cost=50.0, shortage_cost=5.0)
        assert model.holding_cost == 1.0

    def test_fit_and_predict(self):
        from inventory_optimization.stochastic_models.ss_policy import SSPolicyModel
        model = SSPolicyModel(holding_cost=1.0, ordering_cost=50.0, shortage_cost=5.0)
        demand = np.random.normal(100, 20, 500)
        model.fit(demand)
        q = model.predict_order_quantity(current_inventory=50)
        assert q >= 0


class TestStochasticOptimizer:
    """Tests for inventory_optimization.stochastic_models.stochastic_optimizer.StochasticInventoryOptimizer."""

    def test_init(self):
        from inventory_optimization.stochastic_models.stochastic_optimizer import StochasticInventoryOptimizer
        opt = StochasticInventoryOptimizer(holding_cost=1.0, ordering_cost=50.0, shortage_cost=5.0)
        assert opt.holding_cost == 1.0

    def test_optimize_newsvendor(self):
        from inventory_optimization.stochastic_models.stochastic_optimizer import StochasticInventoryOptimizer
        opt = StochasticInventoryOptimizer(holding_cost=1.0, ordering_cost=50.0, shortage_cost=5.0)
        demand = np.random.normal(100, 20, 500)
        result = opt.optimize_newsvendor(demand)
        assert 'order_quantity' in result
        assert result['order_quantity'] > 0
