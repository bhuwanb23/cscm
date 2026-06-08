"""
Test suite for enhanced Newsvendor model using test data files
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel


def test_newsvendor_with_csv_data():
    """Test Newsvendor model using CSV data file."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    # Extract demand and forecast
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    
    # Create and fit model
    model = EnhancedNewsvendorModel(
        holding_cost=holding_cost,
        shortage_cost=shortage_cost,
        distribution_type='normal'
    )
    
    model.fit(historical_demand, forecast=forecast)
    
    assert model.is_fitted == True
    assert model.optimal_order_quantity is not None
    assert model.optimal_order_quantity >= 0
    
    # Test with different distribution types
    for dist_type in ['normal', 'gamma', 'poisson', 'empirical']:
        model = EnhancedNewsvendorModel(
            holding_cost=holding_cost,
            shortage_cost=shortage_cost,
            distribution_type=dist_type
        )
        model.fit(historical_demand, forecast=forecast)
        assert model.is_fitted == True
        assert model.optimal_order_quantity >= 0


def test_newsvendor_calculate_metrics_with_data():
    """Test calculating metrics using CSV data."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    
    # Create and fit model
    model = EnhancedNewsvendorModel(
        holding_cost=holding_cost,
        shortage_cost=shortage_cost,
        distribution_type='normal'
    )
    
    model.fit(historical_demand, forecast=forecast)
    
    # Calculate metrics
    optimal_qty = model.predict_optimal_quantity()
    expected_cost = model.calculate_expected_cost(optimal_qty)
    service_level = model.calculate_service_level(optimal_qty)
    
    assert optimal_qty >= 0
    assert expected_cost >= 0
    assert 0 <= service_level <= 1
    
    # Get summary
    summary = model.get_model_summary()
    assert 'optimal_order_quantity' in summary
    assert 'expected_cost' in summary
    assert 'service_level' in summary


if __name__ == "__main__":
    pytest.main([__file__])

