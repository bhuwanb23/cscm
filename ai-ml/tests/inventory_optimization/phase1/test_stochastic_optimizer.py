"""
Test suite for stochastic inventory optimizer
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.inventory_optimization.stochastic_models.stochastic_optimizer import StochasticInventoryOptimizer


def test_stochastic_optimizer_initialization():
    """Test initialization of StochasticInventoryOptimizer."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    assert optimizer.holding_cost == 1.0
    assert optimizer.ordering_cost == 10.0
    assert optimizer.shortage_cost == 5.0
    assert optimizer.lead_time == 7
    assert optimizer.distribution_type == 'normal'
    assert optimizer.is_fitted == False


def test_optimize_newsvendor():
    """Test optimizing Newsvendor problem."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    policy = optimizer.optimize_newsvendor(historical_demand, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'newsvendor'
    assert 'order_quantity' in policy
    assert 'expected_cost' in policy
    assert policy['order_quantity'] >= 0
    assert policy['expected_cost'] >= 0


def test_optimize_newsvendor_with_forecast():
    """Test optimizing Newsvendor problem with ML forecast."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    forecast = np.random.normal(105, 18, 100)  # ML forecast
    
    policy = optimizer.optimize_newsvendor(historical_demand, forecast=forecast, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'newsvendor'
    assert policy['order_quantity'] >= 0


def test_optimize_multi_period():
    """Test optimizing multi-period inventory problem."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    policy = optimizer.optimize_multi_period(historical_demand, n_periods=5, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'multi_period'
    assert 'order_quantities' in policy
    assert 'total_expected_cost' in policy
    assert 'average_order_quantity' in policy
    assert len(policy['order_quantities']) == 5
    assert all(q >= 0 for q in policy['order_quantities'])


def test_optimize_with_constraints():
    """Test optimizing inventory with constraints."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    constraints = {
        'budget': 1000.0,
        'capacity': 200.0,
        'service_level': 0.95
    }
    
    policy = optimizer.optimize_with_constraints(
        historical_demand, constraints, n_samples=500
    )
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'constrained'
    assert 'order_quantity' in policy
    assert 'expected_cost' in policy
    assert 'constraints' in policy
    assert policy['order_quantity'] >= 0
    assert policy['order_quantity'] <= constraints['capacity']


def test_calculate_expected_cost():
    """Test calculating expected cost."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    optimizer.optimize_newsvendor(historical_demand, n_samples=500)
    
    order_quantity = optimizer.optimal_policy['order_quantity']
    expected_cost = optimizer.calculate_expected_cost(order_quantity, n_samples=500)
    
    assert expected_cost >= 0
    assert isinstance(expected_cost, float)


def test_get_optimal_policy():
    """Test getting optimal policy."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    optimizer.optimize_newsvendor(historical_demand, n_samples=500)
    
    policy = optimizer.get_optimal_policy()
    
    assert policy is not None
    assert 'type' in policy
    assert 'order_quantity' in policy or 'order_quantities' in policy


def test_get_model_summary():
    """Test getting model summary."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    optimizer.optimize_newsvendor(historical_demand, n_samples=500)
    
    summary = optimizer.get_model_summary()
    
    assert 'optimal_policy' in summary
    assert 'holding_cost' in summary
    assert 'ordering_cost' in summary
    assert 'shortage_cost' in summary
    assert 'lead_time' in summary
    assert 'distribution_type' in summary
    assert 'distribution_params' in summary


def test_optimize_before_fit():
    """Test that get_optimal_policy raises error if model is not fitted."""
    optimizer = StochasticInventoryOptimizer(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    with pytest.raises(ValueError):
        optimizer.get_optimal_policy()


if __name__ == "__main__":
    pytest.main([__file__])

