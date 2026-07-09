"""
Test suite for (s,S) policy model using test data files
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


def test_ss_policy_with_csv_data():
    """Test (s,S) policy model using CSV data file."""
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
    
    # Create and fit model
    model = SSPolicyModel(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    model.fit(historical_demand, forecast=forecast)
    
    assert model.is_fitted == True
    assert model.reorder_point is not None
    assert model.order_up_to_level is not None
    assert model.reorder_point >= 0
    assert model.order_up_to_level > model.reorder_point


def test_ss_policy_predict_with_inventory_data():
    """Test (s,S) policy prediction using inventory levels data."""
    # Load demand data
    demand_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    demand_data = pd.read_csv(demand_path)
    
    # Load inventory levels data
    inventory_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_levels_data.csv')
    inventory_data = pd.read_csv(inventory_path)
    
    # Extract parameters
    historical_demand = demand_data['demand'].values
    forecast = demand_data['forecast'].values
    holding_cost = demand_data['holding_cost'].iloc[0]
    ordering_cost = demand_data['ordering_cost'].iloc[0]
    shortage_cost = demand_data['shortage_cost'].iloc[0]
    lead_time = int(demand_data['lead_time'].iloc[0])
    
    # Create and fit model
    model = SSPolicyModel(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    model.fit(historical_demand, forecast=forecast)
    
    # Test predictions for different inventory levels
    for _, row in inventory_data.head(10).iterrows():
        current_inventory = row['current_inventory']
        order_quantity = model.predict_order_quantity(current_inventory)
        
        assert order_quantity >= 0
        if current_inventory <= model.reorder_point:
            assert order_quantity > 0
        else:
            assert order_quantity == 0


def test_ss_policy_calculate_metrics_with_data():
    """Test calculating metrics using CSV data."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    ordering_cost = data['ordering_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    lead_time = int(data['lead_time'].iloc[0])
    
    # Create and fit model
    model = SSPolicyModel(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    
    model.fit(historical_demand, forecast=forecast)
    
    # Calculate metrics
    expected_cost = model.calculate_expected_cost()
    service_level = model.calculate_service_level()
    
    assert expected_cost >= 0
    assert 0 <= service_level <= 1
    
    # Get summary
    summary = model.get_model_summary()
    assert 'reorder_point' in summary
    assert 'order_up_to_level' in summary
    assert 'expected_cost' in summary
    assert 'service_level' in summary


if __name__ == "__main__":
    pytest.main([__file__])

