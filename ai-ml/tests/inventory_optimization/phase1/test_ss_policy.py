"""
Test suite for (s,S) policy model
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.stochastic_models.ss_policy import SSPolicyModel


def test_ss_policy_initialization():
    """Test initialization of SSPolicyModel."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    assert model.holding_cost == 1.0
    assert model.ordering_cost == 10.0
    assert model.shortage_cost == 5.0
    assert model.lead_time == 7
    assert model.distribution_type == 'normal'
    assert model.is_fitted == False


def test_ss_policy_fit_normal():
    """Test fitting (s,S) policy model with normal distribution."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.reorder_point is not None
    assert model.order_up_to_level is not None
    assert model.reorder_point >= 0
    assert model.order_up_to_level > model.reorder_point
    assert model.demand_distribution_params['type'] == 'normal'


def test_ss_policy_fit_gamma():
    """Test fitting (s,S) policy model with gamma distribution."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='gamma'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.gamma(2, 50, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.reorder_point is not None
    assert model.order_up_to_level is not None
    assert model.reorder_point >= 0
    assert model.order_up_to_level > model.reorder_point


def test_ss_policy_fit_poisson():
    """Test fitting (s,S) policy model with Poisson distribution."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='poisson'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.poisson(100, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.reorder_point is not None
    assert model.order_up_to_level is not None
    assert model.reorder_point >= 0
    assert model.order_up_to_level > model.reorder_point


def test_ss_policy_fit_with_forecast():
    """Test fitting (s,S) policy model with ML forecast."""
    model = SSPolicyModel(
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
    
    model.fit(historical_demand, forecast=forecast)
    
    assert model.is_fitted == True
    assert model.reorder_point is not None
    assert model.order_up_to_level is not None


def test_ss_policy_predict_order_quantity():
    """Test predicting order quantity based on current inventory."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    # Test when inventory is below reorder point
    current_inventory = model.reorder_point - 10
    order_quantity = model.predict_order_quantity(current_inventory)
    
    assert order_quantity > 0
    assert order_quantity == model.order_up_to_level - current_inventory
    
    # Test when inventory is above reorder point
    current_inventory = model.reorder_point + 10
    order_quantity = model.predict_order_quantity(current_inventory)
    
    assert order_quantity == 0


def test_ss_policy_calculate_expected_cost():
    """Test calculating expected cost."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    expected_cost = model.calculate_expected_cost()
    
    assert expected_cost >= 0
    assert isinstance(expected_cost, float)


def test_ss_policy_calculate_service_level():
    """Test calculating service level."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    service_level = model.calculate_service_level()
    
    assert 0 <= service_level <= 1
    assert isinstance(service_level, float)


def test_ss_policy_get_model_summary():
    """Test getting model summary."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    summary = model.get_model_summary()
    
    assert 'reorder_point' in summary
    assert 'order_up_to_level' in summary
    assert 'holding_cost' in summary
    assert 'ordering_cost' in summary
    assert 'shortage_cost' in summary
    assert 'lead_time' in summary
    assert 'expected_cost' in summary
    assert 'service_level' in summary


def test_ss_policy_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    model = SSPolicyModel(
        holding_cost=1.0,
        ordering_cost=10.0,
        shortage_cost=5.0,
        lead_time=7,
        distribution_type='normal'
    )
    
    with pytest.raises(ValueError):
        model.predict_order_quantity(50)


if __name__ == "__main__":
    pytest.main([__file__])

