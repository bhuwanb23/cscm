"""
Digital Twin Simulator for Inventory Management

This module implements a realistic inventory simulation environment
for safe reinforcement learning training.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandModel(Enum):
    """Demand generation models."""
    NORMAL = "normal"
    POISSON = "poisson"
    EMPIRICAL = "empirical"
    SEASONAL = "seasonal"


@dataclass
class InventoryState:
    """Inventory state representation."""
    current_inventory: float
    days_since_order: int
    pending_order: float
    days_until_arrival: int
    demand_forecast: float
    demand_std: float
    holding_cost_rate: float
    shortage_cost_rate: float
    ordering_cost: float
    lead_time: int
    max_capacity: float
    min_order_quantity: float
    max_order_quantity: float


class InventorySimulator:
    """
    Digital Twin Simulator for Inventory Management.
    
    Provides a realistic simulation environment for training RL agents
    with configurable demand patterns, costs, and constraints.
    """
    
    def __init__(
        self,
        initial_inventory: float = 100.0,
        holding_cost: float = 0.1,
        shortage_cost: float = 5.0,
        ordering_cost: float = 10.0,
        lead_time: int = 7,
        max_capacity: float = 500.0,
        min_order_quantity: float = 0.0,
        max_order_quantity: float = 200.0,
        demand_model: DemandModel = DemandModel.NORMAL,
        demand_mean: float = 10.0,
        demand_std: float = 3.0,
        historical_demand: Optional[np.ndarray] = None,
        seasonality_period: int = 30,
        seasonality_amplitude: float = 0.2,
        random_seed: Optional[int] = None
    ):
        """
        Initialize the inventory simulator.
        
        Args:
            initial_inventory: Starting inventory level
            holding_cost: Cost per unit per period for holding inventory
            shortage_cost: Cost per unit per period for stockouts
            ordering_cost: Fixed cost per order
            lead_time: Number of periods for order delivery
            max_capacity: Maximum inventory capacity
            min_order_quantity: Minimum order quantity
            max_order_quantity: Maximum order quantity
            demand_model: Type of demand generation model
            demand_mean: Mean demand per period
            demand_std: Standard deviation of demand
            historical_demand: Historical demand data for empirical model
            seasonality_period: Period for seasonal patterns
            seasonality_amplitude: Amplitude of seasonal variation
            random_seed: Random seed for reproducibility
        """
        self.initial_inventory = initial_inventory
        self.holding_cost = holding_cost
        self.shortage_cost = shortage_cost
        self.ordering_cost = ordering_cost
        self.lead_time = lead_time
        self.max_capacity = max_capacity
        self.min_order_quantity = min_order_quantity
        self.max_order_quantity = max_order_quantity
        self.demand_model = demand_model
        self.demand_mean = demand_mean
        self.demand_std = demand_std
        self.historical_demand = historical_demand
        self.seasonality_period = seasonality_period
        self.seasonality_amplitude = seasonality_amplitude
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        # State variables
        self.current_inventory = initial_inventory
        self.pending_orders: List[Tuple[int, float]] = []  # (days_until_arrival, quantity)
        self.current_period = 0
        self.total_cost = 0.0
        self.total_orders = 0
        self.total_stockouts = 0
        self.total_demand = 0.0
        
        # Demand forecast (simple moving average)
        self.demand_history: List[float] = []
        self.demand_forecast = demand_mean
        self.demand_forecast_std = demand_std
        
        # Statistics
        self.history: List[Dict[str, Any]] = []
    
    def reset(self) -> InventoryState:
        """
        Reset the simulator to initial state.
        
        Returns:
            Initial inventory state
        """
        self.current_inventory = self.initial_inventory
        self.pending_orders = []
        self.current_period = 0
        self.total_cost = 0.0
        self.total_orders = 0
        self.total_stockouts = 0
        self.total_demand = 0.0
        self.demand_history = []
        self.demand_forecast = self.demand_mean
        self.demand_forecast_std = self.demand_std
        self.history = []
        
        return self.get_state()
    
    def get_state(self) -> InventoryState:
        """
        Get current inventory state.
        
        Returns:
            Current inventory state
        """
        # Calculate days until next order arrival
        days_until_arrival = min([days for days, _ in self.pending_orders], default=self.lead_time + 1)
        
        # Calculate pending order quantity
        pending_order_qty = sum([qty for _, qty in self.pending_orders])
        
        return InventoryState(
            current_inventory=self.current_inventory,
            days_since_order=self.current_period,
            pending_order=pending_order_qty,
            days_until_arrival=days_until_arrival,
            demand_forecast=self.demand_forecast,
            demand_std=self.demand_forecast_std,
            holding_cost_rate=self.holding_cost,
            shortage_cost_rate=self.shortage_cost,
            ordering_cost=self.ordering_cost,
            lead_time=self.lead_time,
            max_capacity=self.max_capacity,
            min_order_quantity=self.min_order_quantity,
            max_order_quantity=self.max_order_quantity
        )
    
    def generate_demand(self) -> float:
        """
        Generate demand for current period.
        
        Returns:
            Demand quantity
        """
        if self.demand_model == DemandModel.NORMAL:
            demand = max(0, np.random.normal(self.demand_mean, self.demand_std))
        elif self.demand_model == DemandModel.POISSON:
            demand = np.random.poisson(self.demand_mean)
        elif self.demand_model == DemandModel.EMPIRICAL:
            if self.historical_demand is not None and len(self.historical_demand) > 0:
                demand = np.random.choice(self.historical_demand)
            else:
                demand = max(0, np.random.normal(self.demand_mean, self.demand_std))
        elif self.demand_model == DemandModel.SEASONAL:
            seasonal_factor = 1 + self.seasonality_amplitude * np.sin(
                2 * np.pi * self.current_period / self.seasonality_period
            )
            demand = max(0, np.random.normal(
                self.demand_mean * seasonal_factor,
                self.demand_std
            ))
        else:
            demand = max(0, np.random.normal(self.demand_mean, self.demand_std))
        
        return demand
    
    def step(self, order_quantity: float) -> Tuple[InventoryState, float, bool, Dict[str, Any]]:
        """
        Execute one simulation step.
        
        Args:
            order_quantity: Order quantity to place (0 if no order)
        
        Returns:
            Tuple of (next_state, reward, done, info)
        """
        # Place order if quantity > 0
        if order_quantity > 0:
            order_quantity = max(self.min_order_quantity, min(order_quantity, self.max_order_quantity))
            self.pending_orders.append((self.lead_time, order_quantity))
            self.total_orders += 1
            order_cost = self.ordering_cost
        else:
            order_cost = 0.0
        
        # Receive pending orders
        received_quantity = 0.0
        updated_orders = []
        for days_until_arrival, qty in self.pending_orders:
            if days_until_arrival <= 1:
                received_quantity += qty
            else:
                updated_orders.append((days_until_arrival - 1, qty))
        self.pending_orders = updated_orders
        
        # Update inventory with received orders
        self.current_inventory += received_quantity
        
        # Generate and satisfy demand
        demand = self.generate_demand()
        self.total_demand += demand
        
        # Update demand history and forecast
        self.demand_history.append(demand)
        if len(self.demand_history) > 10:
            self.demand_history.pop(0)
        
        # Update forecast (simple moving average)
        if len(self.demand_history) > 0:
            self.demand_forecast = np.mean(self.demand_history)
            self.demand_forecast_std = np.std(self.demand_history) if len(self.demand_history) > 1 else self.demand_std
        
        # Satisfy demand
        satisfied_demand = min(self.current_inventory, demand)
        self.current_inventory -= satisfied_demand
        
        # Calculate costs
        holding_cost = self.holding_cost * self.current_inventory
        shortage = max(0, demand - satisfied_demand)
        shortage_cost = self.shortage_cost * shortage
        
        if shortage > 0:
            self.total_stockouts += 1
        
        period_cost = order_cost + holding_cost + shortage_cost
        self.total_cost += period_cost
        
        # Calculate reward (negative cost)
        reward = -period_cost
        
        # Update period
        self.current_period += 1
        
        # Check if done (optional: can set max periods)
        done = False
        
        # Store history
        info = {
            'demand': demand,
            'satisfied_demand': satisfied_demand,
            'shortage': shortage,
            'order_quantity': order_quantity,
            'received_quantity': received_quantity,
            'holding_cost': holding_cost,
            'shortage_cost': shortage_cost,
            'order_cost': order_cost,
            'total_cost': self.total_cost,
            'period': self.current_period
        }
        self.history.append(info)
        
        next_state = self.get_state()
        
        return next_state, reward, done, info
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get simulation statistics.
        
        Returns:
            Dictionary of statistics
        """
        fill_rate = 1.0 - (self.total_stockouts / max(1, self.current_period))
        avg_demand = self.total_demand / max(1, self.current_period)
        avg_cost = self.total_cost / max(1, self.current_period)
        
        return {
            'total_periods': self.current_period,
            'total_cost': self.total_cost,
            'avg_cost_per_period': avg_cost,
            'total_orders': self.total_orders,
            'total_stockouts': self.total_stockouts,
            'fill_rate': fill_rate,
            'total_demand': self.total_demand,
            'avg_demand': avg_demand,
            'current_inventory': self.current_inventory
        }
    
    def get_history(self) -> pd.DataFrame:
        """
        Get simulation history as DataFrame.
        
        Returns:
            DataFrame with simulation history
        """
        return pd.DataFrame(self.history)

