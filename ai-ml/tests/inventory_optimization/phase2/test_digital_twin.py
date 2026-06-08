"""
Tests for Digital Twin Simulator
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import (
    InventorySimulator,
    InventoryState,
    DemandModel
)


class TestInventorySimulator:
    """Test cases for InventorySimulator."""
    
    def test_initialization(self):
        """Test simulator initialization."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            holding_cost=0.1,
            shortage_cost=5.0,
            ordering_cost=10.0,
            lead_time=7,
            max_capacity=500.0,
            random_seed=42
        )
        
        assert simulator.current_inventory == 100.0
        assert simulator.holding_cost == 0.1
        assert simulator.shortage_cost == 5.0
        assert simulator.ordering_cost == 10.0
        assert simulator.lead_time == 7
        assert simulator.max_capacity == 500.0
    
    def test_reset(self):
        """Test simulator reset."""
        simulator = InventorySimulator(initial_inventory=100.0, random_seed=42)
        
        # Run some steps
        state = simulator.reset()
        simulator.step(50.0)
        simulator.step(30.0)
        
        # Reset
        state = simulator.reset()
        
        assert simulator.current_inventory == 100.0
        assert simulator.current_period == 0
        assert simulator.total_cost == 0.0
        assert isinstance(state, InventoryState)
    
    def test_get_state(self):
        """Test state retrieval."""
        simulator = InventorySimulator(initial_inventory=100.0, random_seed=42)
        state = simulator.reset()
        
        assert isinstance(state, InventoryState)
        assert state.current_inventory == 100.0
        assert state.days_since_order == 0
        assert state.pending_order == 0.0
        assert state.max_capacity == 500.0
    
    def test_step_no_order(self):
        """Test step without ordering."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            demand_mean=10.0,
            demand_std=2.0,
            random_seed=42
        )
        state = simulator.reset()
        
        next_state, reward, done, info = simulator.step(0.0)
        
        assert next_state.current_inventory >= 0
        assert reward <= 0  # Negative cost
        assert 'demand' in info
        assert 'satisfied_demand' in info
        assert 'total_cost' in info
    
    def test_step_with_order(self):
        """Test step with ordering."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            lead_time=7,
            random_seed=42
        )
        state = simulator.reset()
        
        next_state, reward, done, info = simulator.step(50.0)
        
        assert len(simulator.pending_orders) == 1
        assert simulator.pending_orders[0][0] == 6  # Lead time - 1 (after one step)
        assert simulator.pending_orders[0][1] == 50.0
        assert simulator.total_orders == 1
        assert info['order_quantity'] == 50.0
    
    def test_order_receipt(self):
        """Test order receipt after lead time."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            lead_time=3,
            random_seed=42
        )
        state = simulator.reset()
        
        # Place order
        next_state, _, _, _ = simulator.step(50.0)
        initial_inv = next_state.current_inventory
        
        # Wait for lead time (order placed with lead_time=3, so need 3 steps)
        for _ in range(3):
            next_state, _, _, _ = simulator.step(0.0)
        
        # Order should have arrived
        assert len(simulator.pending_orders) == 0
        assert next_state.current_inventory >= initial_inv  # May have demand, so >=
    
    def test_demand_generation_normal(self):
        """Test normal demand generation."""
        simulator = InventorySimulator(
            demand_model=DemandModel.NORMAL,
            demand_mean=10.0,
            demand_std=2.0,
            random_seed=42
        )
        simulator.reset()
        
        demands = [simulator.generate_demand() for _ in range(100)]
        
        assert all(d >= 0 for d in demands)
        assert np.mean(demands) > 0
        assert np.std(demands) > 0
    
    def test_demand_generation_poisson(self):
        """Test Poisson demand generation."""
        simulator = InventorySimulator(
            demand_model=DemandModel.POISSON,
            demand_mean=10.0,
            random_seed=42
        )
        simulator.reset()
        
        demands = [simulator.generate_demand() for _ in range(100)]
        
        assert all(d >= 0 for d in demands)
        assert all(isinstance(d, (int, float)) for d in demands)
    
    def test_demand_generation_empirical(self):
        """Test empirical demand generation."""
        historical = np.array([10, 12, 8, 15, 11, 9, 13, 10, 14, 12])
        simulator = InventorySimulator(
            demand_model=DemandModel.EMPIRICAL,
            historical_demand=historical,
            random_seed=42
        )
        simulator.reset()
        
        demands = [simulator.generate_demand() for _ in range(100)]
        
        assert all(d >= 0 for d in demands)
        assert all(d in historical for d in demands)  # Should be from historical
    
    def test_demand_generation_seasonal(self):
        """Test seasonal demand generation."""
        simulator = InventorySimulator(
            demand_model=DemandModel.SEASONAL,
            demand_mean=10.0,
            demand_std=2.0,
            seasonality_period=30,
            seasonality_amplitude=0.2,
            random_seed=42
        )
        simulator.reset()
        
        demands = [simulator.generate_demand() for _ in range(100)]
        
        assert all(d >= 0 for d in demands)
        assert len(demands) == 100
    
    def test_cost_calculation(self):
        """Test cost calculation."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            holding_cost=0.1,
            shortage_cost=5.0,
            ordering_cost=10.0,
            random_seed=42
        )
        simulator.reset()
        
        # Step with order
        next_state, reward, done, info = simulator.step(50.0)
        
        assert info['order_cost'] == 10.0
        assert info['holding_cost'] >= 0
        assert info['total_cost'] > 0
    
    def test_stockout_handling(self):
        """Test stockout handling."""
        simulator = InventorySimulator(
            initial_inventory=5.0,
            demand_mean=20.0,
            demand_std=5.0,
            shortage_cost=5.0,
            random_seed=42
        )
        simulator.reset()
        
        next_state, reward, done, info = simulator.step(0.0)
        
        # Should have stockout
        if info['shortage'] > 0:
            assert info['shortage_cost'] > 0
            assert simulator.total_stockouts > 0
    
    def test_get_statistics(self):
        """Test statistics retrieval."""
        simulator = InventorySimulator(random_seed=42)
        simulator.reset()
        
        # Run some steps
        for _ in range(10):
            simulator.step(20.0)
        
        stats = simulator.get_statistics()
        
        assert 'total_periods' in stats
        assert 'total_cost' in stats
        assert 'total_orders' in stats
        assert 'fill_rate' in stats
        assert stats['total_periods'] == 10
        assert stats['total_orders'] == 10
    
    def test_get_history(self):
        """Test history retrieval."""
        simulator = InventorySimulator(random_seed=42)
        simulator.reset()
        
        # Run some steps
        for _ in range(5):
            simulator.step(20.0)
        
        history = simulator.get_history()
        
        assert len(history) == 5
        assert 'demand' in history.columns
        assert 'order_quantity' in history.columns
        assert 'total_cost' in history.columns
    
    def test_capacity_constraint(self):
        """Test capacity constraint."""
        simulator = InventorySimulator(
            initial_inventory=100.0,
            max_capacity=150.0,
            random_seed=42
        )
        simulator.reset()
        
        # Try to order more than capacity allows
        next_state, reward, done, info = simulator.step(200.0)
        
        # Inventory should not exceed capacity
        assert next_state.current_inventory <= simulator.max_capacity
    
    def test_order_quantity_constraints(self):
        """Test order quantity constraints."""
        simulator = InventorySimulator(
            min_order_quantity=10.0,
            max_order_quantity=100.0,
            random_seed=42
        )
        simulator.reset()
        
        # Order below minimum
        next_state, _, _, info = simulator.step(5.0)
        assert info['order_quantity'] == 10.0  # Clipped to minimum
        
        # Order above maximum
        next_state, _, _, info = simulator.step(200.0)
        assert info['order_quantity'] == 100.0  # Clipped to maximum


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

