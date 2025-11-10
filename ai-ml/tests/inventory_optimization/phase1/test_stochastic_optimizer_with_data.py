"""
Test suite for stochastic optimizer using test data files
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


def test_stochastic_optimizer_with_csv_data():
    """Test stochastic optimizer using CSV data file."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    # Extract demand and forecast
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    ordering_cost = data['ordering_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    lead_time = int(data['lead_time'].iloc[0])
    
    # Create optimizer
    optimizer = StochasticInventoryOptimizer(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    # Test single-period optimization
    policy = optimizer.optimize_newsvendor(historical_demand, forecast=forecast, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'newsvendor'
    assert policy['order_quantity'] >= 0
    assert policy['expected_cost'] >= 0


def test_stochastic_optimizer_multi_period_with_data():
    """Test multi-period optimization using CSV data."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    ordering_cost = data['ordering_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    lead_time = int(data['lead_time'].iloc[0])
    
    # Create optimizer
    optimizer = StochasticInventoryOptimizer(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    # Test multi-period optimization
    policy = optimizer.optimize_multi_period(historical_demand, forecast=forecast, n_periods=10, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'multi_period'
    assert len(policy['order_quantities']) == 10
    assert all(q >= 0 for q in policy['order_quantities'])


def test_stochastic_optimizer_with_constraints():
    """Test constrained optimization using CSV data."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    ordering_cost = data['ordering_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    lead_time = int(data['lead_time'].iloc[0])
    
    # Create optimizer
    optimizer = StochasticInventoryOptimizer(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    # Define constraints
    constraints = {
        'budget': 1000.0,
        'capacity': 200.0,
        'service_level': 0.95
    }
    
    # Test constrained optimization
    policy = optimizer.optimize_with_constraints(
        historical_demand, constraints, forecast=forecast, n_samples=500
    )
    
    assert optimizer.is_fitted == True
    assert policy['type'] == 'constrained'
    assert policy['order_quantity'] >= 0
    assert policy['order_quantity'] <= constraints['capacity']


def test_stochastic_optimizer_with_forecast_samples():
    """Test optimizer with forecast samples from CSV."""
    # Load forecast samples
    samples_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'forecast_samples_data.csv')
    samples_data = pd.read_csv(samples_path)
    
    # Extract forecast samples (first 10 periods)
    forecast_samples = samples_data[[f'forecast_{i+1}' for i in range(10)]].values
    
    # Load demand data
    demand_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    demand_data = pd.read_csv(demand_path)
    
    # Use only first 10 periods for testing
    historical_demand = demand_data['demand'].values[:10]
    holding_cost = demand_data['holding_cost'].iloc[0]
    ordering_cost = demand_data['ordering_cost'].iloc[0]
    shortage_cost = demand_data['shortage_cost'].iloc[0]
    lead_time = int(demand_data['lead_time'].iloc[0])
    
    # Create optimizer
    optimizer = StochasticInventoryOptimizer(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    # Use mean of samples as forecast (for 10 periods)
    forecast = np.mean(forecast_samples, axis=0)
    
    # Test optimization
    policy = optimizer.optimize_newsvendor(historical_demand, forecast=forecast, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['order_quantity'] >= 0


if __name__ == "__main__":
    pytest.main([__file__])

