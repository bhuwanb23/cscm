"""
Forecast-Driven Heuristic Algorithms for Inventory Optimization

This module implements heuristic algorithms that use demand forecasts
to make inventory decisions.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ForecastDrivenHeuristic:
    """
    Forecast-driven heuristic algorithms for inventory optimization.
    
    Uses demand forecasts to make inventory decisions using various heuristics.
    """
    
    def __init__(
        self,
        safety_stock_multiplier: float = 1.5,
        reorder_point_multiplier: float = 1.2,
        max_order_multiplier: float = 2.0
    ):
        """
        Initialize heuristic optimizer.
        
        Args:
            safety_stock_multiplier: Multiplier for safety stock calculation
            reorder_point_multiplier: Multiplier for reorder point calculation
            max_order_multiplier: Multiplier for maximum order quantity
        """
        self.safety_stock_multiplier = safety_stock_multiplier
        self.reorder_point_multiplier = reorder_point_multiplier
        self.max_order_multiplier = max_order_multiplier
    
    def calculate_safety_stock(
        self,
        demand_forecast: float,
        demand_std: float,
        lead_time: int,
        service_level: float = 0.95
    ) -> float:
        """
        Calculate safety stock using forecast and service level.
        
        Args:
            demand_forecast: Expected demand
            demand_std: Standard deviation of demand
            lead_time: Lead time in periods
            service_level: Desired service level (0-1)
        
        Returns:
            Safety stock quantity
        """
        # Z-score for service level
        from scipy import stats
        z_score = stats.norm.ppf(service_level)
        
        # Safety stock = z * std * sqrt(lead_time)
        safety_stock = z_score * demand_std * np.sqrt(lead_time)
        
        return max(0, safety_stock * self.safety_stock_multiplier)
    
    def calculate_reorder_point(
        self,
        demand_forecast: float,
        demand_std: float,
        lead_time: int,
        service_level: float = 0.95
    ) -> float:
        """
        Calculate reorder point using forecast.
        
        Args:
            demand_forecast: Expected demand
            demand_std: Standard deviation of demand
            lead_time: Lead time in periods
            service_level: Desired service level (0-1)
        
        Returns:
            Reorder point quantity
        """
        # Lead time demand
        lead_time_demand = demand_forecast * lead_time
        
        # Safety stock
        safety_stock = self.calculate_safety_stock(
            demand_forecast, demand_std, lead_time, service_level
        )
        
        # Reorder point = lead time demand + safety stock
        reorder_point = lead_time_demand + safety_stock
        
        return max(0, reorder_point * self.reorder_point_multiplier)
    
    def calculate_order_quantity(
        self,
        current_inventory: float,
        demand_forecast: float,
        demand_std: float,
        lead_time: int,
        max_capacity: float,
        service_level: float = 0.95,
        method: str = 'eoq'  # 'eoq', 'newsvendor', 'forecast_based'
    ) -> float:
        """
        Calculate order quantity using heuristic methods.
        
        Args:
            current_inventory: Current inventory level
            demand_forecast: Expected demand
            demand_std: Standard deviation of demand
            lead_time: Lead time in periods
            max_capacity: Maximum inventory capacity
            service_level: Desired service level (0-1)
            method: Heuristic method to use
        
        Returns:
            Order quantity
        """
        if method == 'eoq':
            # Economic Order Quantity (simplified)
            # EOQ = sqrt(2 * demand * ordering_cost / holding_cost)
            # Using defaults
            ordering_cost = 10.0
            holding_cost = 0.1
            eoq = np.sqrt(2 * demand_forecast * ordering_cost / holding_cost)
            
            # Adjust based on current inventory
            reorder_point = self.calculate_reorder_point(
                demand_forecast, demand_std, lead_time, service_level
            )
            
            if current_inventory <= reorder_point:
                order_qty = max(0, eoq - current_inventory)
            else:
                order_qty = 0.0
        
        elif method == 'newsvendor':
            # Newsvendor heuristic
            # Critical ratio
            holding_cost = 0.1
            shortage_cost = 5.0
            critical_ratio = shortage_cost / (holding_cost + shortage_cost)
            
            # Order up to level
            from scipy import stats
            z_score = stats.norm.ppf(critical_ratio)
            order_up_to = demand_forecast + z_score * demand_std
            
            order_qty = max(0, order_up_to - current_inventory)
        
        elif method == 'forecast_based':
            # Simple forecast-based heuristic
            # Order to cover lead time demand + safety stock
            lead_time_demand = demand_forecast * lead_time
            safety_stock = self.calculate_safety_stock(
                demand_forecast, demand_std, lead_time, service_level
            )
            
            target_inventory = lead_time_demand + safety_stock
            order_qty = max(0, target_inventory - current_inventory)
        
        else:
            raise ValueError(f"Unknown method: {method}")
        
        # Apply capacity constraint
        order_qty = min(order_qty, max_capacity - current_inventory)
        order_qty = max(0, order_qty)
        
        return order_qty
    
    def optimize_sku_store(
        self,
        current_inventory: float,
        demand_forecast: float,
        demand_std: float,
        lead_time: int,
        max_capacity: float,
        holding_cost: float = 0.1,
        shortage_cost: float = 5.0,
        ordering_cost: float = 10.0,
        service_level: float = 0.95,
        method: str = 'forecast_based'
    ) -> Dict[str, Any]:
        """
        Optimize inventory for a single SKU-store combination.
        
        Args:
            current_inventory: Current inventory level
            demand_forecast: Expected demand
            demand_std: Standard deviation of demand
            lead_time: Lead time in periods
            max_capacity: Maximum inventory capacity
            holding_cost: Holding cost per unit per period
            shortage_cost: Shortage cost per unit per period
            ordering_cost: Fixed ordering cost
            service_level: Desired service level (0-1)
            method: Heuristic method to use
        
        Returns:
            Dictionary with optimization results
        """
        # Calculate order quantity
        order_quantity = self.calculate_order_quantity(
            current_inventory,
            demand_forecast,
            demand_std,
            lead_time,
            max_capacity,
            service_level,
            method
        )
        
        # Calculate expected ending inventory
        ending_inventory = current_inventory + order_quantity - demand_forecast
        ending_inventory = max(0, min(ending_inventory, max_capacity))
        
        # Calculate expected shortage
        expected_shortage = max(0, demand_forecast - (current_inventory + order_quantity))
        
        # Calculate costs
        order_cost = ordering_cost if order_quantity > 0 else 0.0
        holding_cost_total = holding_cost * ending_inventory
        shortage_cost_total = shortage_cost * expected_shortage
        total_cost = order_cost + holding_cost_total + shortage_cost_total
        
        # Calculate service level
        fill_rate = 1.0 - (expected_shortage / max(demand_forecast, 1.0))
        
        return {
            'order_quantity': order_quantity,
            'ending_inventory': ending_inventory,
            'expected_shortage': expected_shortage,
            'total_cost': total_cost,
            'order_cost': order_cost,
            'holding_cost': holding_cost_total,
            'shortage_cost': shortage_cost_total,
            'fill_rate': fill_rate,
            'service_level': min(1.0, fill_rate)
        }
    
    def optimize_batch(
        self,
        inventory_data: pd.DataFrame,
        forecast_data: pd.DataFrame,
        method: str = 'forecast_based',
        service_level: float = 0.95
    ) -> pd.DataFrame:
        """
        Optimize inventory for a batch of SKU-store combinations.
        
        Args:
            inventory_data: DataFrame with inventory data
            forecast_data: DataFrame with demand forecasts
            method: Heuristic method to use
            service_level: Desired service level (0-1)
        
        Returns:
            DataFrame with optimization results
        """
        logger.info(f"Optimizing batch with {method} method")
        
        results = []
        
        for idx, row in inventory_data.iterrows():
            sku_id = row['sku_id']
            store_id = row['store_id']
            current_inventory = row['inventory_on_hand']
            max_capacity = row.get('max_stock_level', 1000.0)
            
            # Get forecast
            forecast_row = forecast_data[
                (forecast_data['sku_id'] == sku_id) &
                (forecast_data['store_id'] == store_id)
            ]
            
            if forecast_row.empty:
                # Use default forecast
                demand_forecast = 10.0
                demand_std = 3.0
            else:
                demand_forecast = float(forecast_row['forecast'].iloc[0] if 'forecast' in forecast_row.columns 
                                      else forecast_row['sales_quantity'].iloc[0] if 'sales_quantity' in forecast_row.columns 
                                      else 10.0)
                demand_std = float(forecast_row.get('forecast_std', 3.0).iloc[0] if 'forecast_std' in forecast_row.columns 
                                 else 3.0)
            
            # Default lead time
            lead_time = 7
            
            # Optimize
            result = self.optimize_sku_store(
                current_inventory=current_inventory,
                demand_forecast=demand_forecast,
                demand_std=demand_std,
                lead_time=lead_time,
                max_capacity=max_capacity,
                service_level=service_level,
                method=method
            )
            
            result['sku_id'] = sku_id
            result['store_id'] = store_id
            results.append(result)
        
        return pd.DataFrame(results)
    
    def get_statistics(self, results: pd.DataFrame) -> Dict[str, Any]:
        """
        Get statistics from optimization results.
        
        Args:
            results: DataFrame with optimization results
        
        Returns:
            Dictionary with statistics
        """
        return {
            'total_orders': int(results['order_quantity'].sum()),
            'avg_order_quantity': float(results['order_quantity'].mean()),
            'total_cost': float(results['total_cost'].sum()),
            'avg_cost': float(results['total_cost'].mean()),
            'avg_fill_rate': float(results['fill_rate'].mean()),
            'avg_service_level': float(results['service_level'].mean()),
            'total_shortage': float(results['expected_shortage'].sum()),
            'orders_placed': int((results['order_quantity'] > 0).sum())
        }

