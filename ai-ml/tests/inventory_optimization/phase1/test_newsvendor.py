"""
Test suite for enhanced Newsvendor model
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel


def test_newsvendor_initialization():
    """Test initialization of EnhancedNewsvendorModel."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    assert model.holding_cost == 1.0
    assert model.shortage_cost == 5.0
    assert model.distribution_type == 'normal'
    assert model.is_fitted == False


def test_newsvendor_fit_normal():
    """Test fitting Newsvendor model with normal distribution."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0
    assert model.demand_distribution_params['type'] == 'normal'


def test_newsvendor_fit_gamma():
    """Test fitting Newsvendor model with gamma distribution."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='gamma'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.gamma(2, 50, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0
    assert model.demand_distribution_params['type'] == 'gamma'


def test_newsvendor_fit_poisson():
    """Test fitting Newsvendor model with Poisson distribution."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='poisson'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.poisson(100, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0
    assert model.demand_distribution_params['type'] == 'poisson'


def test_newsvendor_fit_empirical():
    """Test fitting Newsvendor model with empirical distribution."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='empirical'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    
    model.fit(historical_demand)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0
    assert model.demand_distribution_params['type'] == 'empirical'


def test_newsvendor_fit_with_forecast():
    """Test fitting Newsvendor model with ML forecast."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    # Create sample demand data
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    forecast = np.random.normal(105, 18, 100)  # ML forecast
    
    model.fit(historical_demand, forecast=forecast)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0


def test_newsvendor_predict_optimal_quantity():
    """Test predicting optimal order quantity."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    optimal_qty = model.predict_optimal_quantity()
    
    assert optimal_qty >= 0
    assert optimal_qty == model.optimal_order_quantity


def test_newsvendor_calculate_expected_cost():
    """Test calculating expected cost."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    order_quantity = model.optimal_order_quantity
    expected_cost = model.calculate_expected_cost(order_quantity)
    
    assert expected_cost >= 0
    assert isinstance(expected_cost, float)


def test_newsvendor_calculate_service_level():
    """Test calculating service level."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    order_quantity = model.optimal_order_quantity
    service_level = model.calculate_service_level(order_quantity)
    
    assert 0 <= service_level <= 1
    assert isinstance(service_level, float)


def test_newsvendor_get_model_summary():
    """Test getting model summary."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    np.random.seed(42)
    historical_demand = np.random.normal(100, 20, 100)
    model.fit(historical_demand)
    
    summary = model.get_model_summary()
    
    assert 'optimal_order_quantity' in summary
    assert 'holding_cost' in summary
    assert 'shortage_cost' in summary
    assert 'critical_ratio' in summary
    assert 'distribution_type' in summary
    assert 'expected_cost' in summary
    assert 'service_level' in summary


def test_newsvendor_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    model = EnhancedNewsvendorModel(
        holding_cost=1.0,
        shortage_cost=5.0,
        distribution_type='normal'
    )
    
    with pytest.raises(ValueError):
        model.predict_optimal_quantity()


if __name__ == "__main__":
    pytest.main([__file__])

