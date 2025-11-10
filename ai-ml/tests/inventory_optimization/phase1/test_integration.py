"""
Integration tests for Phase 1: Stochastic Models Implementation

This test demonstrates the complete workflow using real data files.
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
from models.inventory_optimization.stochastic_models.ss_policy import SSPolicyModel
from models.inventory_optimization.stochastic_models.stochastic_optimizer import StochasticInventoryOptimizer


def test_complete_workflow():
    """Test complete workflow from data loading to optimization."""
    # Load test data
    data_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'data', 'test', 'inventory_demand_data.csv')
    data = pd.read_csv(data_path)
    
    # Extract data
    historical_demand = data['demand'].values
    forecast = data['forecast'].values
    holding_cost = data['holding_cost'].iloc[0]
    ordering_cost = data['ordering_cost'].iloc[0]
    shortage_cost = data['shortage_cost'].iloc[0]
    lead_time = int(data['lead_time'].iloc[0])
    
    # Test 1: Enhanced Newsvendor Model
    newsvendor = EnhancedNewsvendorModel(
        holding_cost=holding_cost,
        shortage_cost=shortage_cost,
        distribution_type='normal'
    )
    newsvendor.fit(historical_demand, forecast=forecast)
    optimal_qty_newsvendor = newsvendor.predict_optimal_quantity()
    expected_cost_newsvendor = newsvendor.calculate_expected_cost(optimal_qty_newsvendor)
    service_level_newsvendor = newsvendor.calculate_service_level(optimal_qty_newsvendor)
    
    assert optimal_qty_newsvendor >= 0
    assert expected_cost_newsvendor >= 0
    assert 0 <= service_level_newsvendor <= 1
    
    # Test 2: (s,S) Policy Model
    ss_policy = SSPolicyModel(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    ss_policy.fit(historical_demand, forecast=forecast)
    reorder_point = ss_policy.reorder_point
    order_up_to_level = ss_policy.order_up_to_level
    expected_cost_ss = ss_policy.calculate_expected_cost()
    service_level_ss = ss_policy.calculate_service_level()
    
    assert reorder_point >= 0
    assert order_up_to_level > reorder_point
    assert expected_cost_ss >= 0
    assert 0 <= service_level_ss <= 1
    
    # Test 3: Stochastic Optimizer
    optimizer = StochasticInventoryOptimizer(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    policy = optimizer.optimize_newsvendor(historical_demand, forecast=forecast, n_samples=500)
    
    assert optimizer.is_fitted == True
    assert policy['order_quantity'] >= 0
    assert policy['expected_cost'] >= 0
    
    # Test 4: Compare results
    print(f"\n=== Optimization Results ===")
    print(f"Newsvendor Model:")
    print(f"  Optimal Quantity: {optimal_qty_newsvendor:.2f}")
    print(f"  Expected Cost: {expected_cost_newsvendor:.2f}")
    print(f"  Service Level: {service_level_newsvendor:.2%}")
    print(f"\n(s,S) Policy Model:")
    print(f"  Reorder Point (s): {reorder_point:.2f}")
    print(f"  Order-up-to Level (S): {order_up_to_level:.2f}")
    print(f"  Expected Cost: {expected_cost_ss:.2f}")
    print(f"  Service Level: {service_level_ss:.2%}")
    print(f"\nStochastic Optimizer:")
    print(f"  Optimal Quantity: {policy['order_quantity']:.2f}")
    print(f"  Expected Cost: {policy['expected_cost']:.2f}")


def test_integration_with_inventory_levels():
    """Test integration with inventory levels data."""
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
    
    # Fit (s,S) policy model
    ss_policy = SSPolicyModel(
        holding_cost=holding_cost,
        ordering_cost=ordering_cost,
        shortage_cost=shortage_cost,
        lead_time=lead_time,
        distribution_type='normal'
    )
    ss_policy.fit(historical_demand, forecast=forecast)
    
    # Test predictions for inventory levels
    order_quantities = []
    for _, row in inventory_data.iterrows():
        current_inventory = row['current_inventory']
        order_qty = ss_policy.predict_order_quantity(current_inventory)
        order_quantities.append(order_qty)
        
        # Verify logic
        if current_inventory <= ss_policy.reorder_point:
            assert order_qty > 0
            assert order_qty == ss_policy.order_up_to_level - current_inventory
        else:
            assert order_qty == 0
    
    # Verify that orders are placed when inventory is low
    low_inventory_count = sum(1 for inv in inventory_data['current_inventory'] 
                             if inv <= ss_policy.reorder_point)
    orders_placed = sum(1 for qty in order_quantities if qty > 0)
    
    assert orders_placed > 0
    assert orders_placed <= low_inventory_count


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

