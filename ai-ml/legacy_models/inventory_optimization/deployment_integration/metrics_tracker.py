"""
Metrics Tracking for Inventory Optimization

This module implements comprehensive metrics tracking including:
- Fill rate
- Days of supply
- Inventory turns
- Service level metrics
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InventoryMetricsTracker:
    """
    Comprehensive metrics tracker for inventory optimization.
    
    Tracks fill rate, days of supply, inventory turns, and other key metrics.
    """
    
    def __init__(self):
        """Initialize metrics tracker."""
        self.metrics_history: List[Dict[str, Any]] = []
        self.sku_store_metrics: Dict[Tuple[int, int], Dict[str, Any]] = defaultdict(dict)
    
    def calculate_fill_rate(
        self,
        demand: float,
        satisfied_demand: float
    ) -> float:
        """
        Calculate fill rate (service level).
        
        Args:
            demand: Total demand
            satisfied_demand: Demand that was satisfied
        
        Returns:
            Fill rate (0-1)
        """
        if demand == 0:
            return 1.0
        
        return min(1.0, satisfied_demand / demand)
    
    def calculate_days_of_supply(
        self,
        current_inventory: float,
        average_daily_demand: float
    ) -> float:
        """
        Calculate days of supply (inventory coverage).
        
        Args:
            current_inventory: Current inventory level
            average_daily_demand: Average daily demand
        
        Returns:
            Days of supply
        """
        if average_daily_demand == 0:
            return float('inf')
        
        return current_inventory / average_daily_demand
    
    def calculate_inventory_turns(
        self,
        cost_of_goods_sold: float,
        average_inventory_value: float
    ) -> float:
        """
        Calculate inventory turnover ratio.
        
        Args:
            cost_of_goods_sold: Total COGS over period
            average_inventory_value: Average inventory value over period
        
        Returns:
            Inventory turnover ratio
        """
        if average_inventory_value == 0:
            return 0.0
        
        return cost_of_goods_sold / average_inventory_value
    
    def calculate_inventory_turns_alternative(
        self,
        sales_quantity: float,
        average_inventory_quantity: float
    ) -> float:
        """
        Calculate inventory turnover using quantity-based method.
        
        Args:
            sales_quantity: Total sales quantity over period
            average_inventory_quantity: Average inventory quantity over period
        
        Returns:
            Inventory turnover ratio
        """
        if average_inventory_quantity == 0:
            return 0.0
        
        return sales_quantity / average_inventory_quantity
    
    def track_period_metrics(
        self,
        sku_id: int,
        store_id: int,
        date: datetime,
        current_inventory: float,
        demand: float,
        satisfied_demand: float,
        sales_quantity: float = 0.0,
        inventory_value: float = 0.0,
        cogs: float = 0.0
    ) -> Dict[str, Any]:
        """
        Track metrics for a single period.
        
        Args:
            sku_id: SKU identifier
            store_id: Store identifier
            date: Date of the period
            current_inventory: Current inventory level
            demand: Total demand
            satisfied_demand: Demand that was satisfied
            sales_quantity: Sales quantity (optional)
            inventory_value: Inventory value (optional)
            cogs: Cost of goods sold (optional)
        
        Returns:
            Dictionary with calculated metrics
        """
        key = (sku_id, store_id)
        
        # Calculate fill rate
        fill_rate = self.calculate_fill_rate(demand, satisfied_demand)
        
        # Calculate days of supply (need average daily demand)
        # For now, use current period demand as proxy
        avg_daily_demand = demand  # Can be improved with historical average
        days_of_supply = self.calculate_days_of_supply(current_inventory, avg_daily_demand)
        
        # Calculate inventory turns (if data available)
        inventory_turns = None
        if sales_quantity > 0 and current_inventory > 0:
            # Use quantity-based method
            inventory_turns = self.calculate_inventory_turns_alternative(
                sales_quantity,
                current_inventory
            )
        elif cogs > 0 and inventory_value > 0:
            # Use value-based method
            inventory_turns = self.calculate_inventory_turns(cogs, inventory_value)
        
        # Calculate stockout rate
        stockout_rate = 1.0 - fill_rate if demand > 0 else 0.0
        
        # Calculate inventory utilization
        # This would need max_capacity, using a default for now
        max_capacity = current_inventory * 2  # Placeholder
        inventory_utilization = current_inventory / max_capacity if max_capacity > 0 else 0.0
        
        metrics = {
            'sku_id': sku_id,
            'store_id': store_id,
            'date': date,
            'current_inventory': current_inventory,
            'demand': demand,
            'satisfied_demand': satisfied_demand,
            'fill_rate': fill_rate,
            'days_of_supply': days_of_supply,
            'inventory_turns': inventory_turns,
            'stockout_rate': stockout_rate,
            'inventory_utilization': inventory_utilization,
            'sales_quantity': sales_quantity,
            'inventory_value': inventory_value,
            'cogs': cogs
        }
        
        # Store in history
        self.metrics_history.append(metrics)
        
        # Update SKU-store metrics
        if key not in self.sku_store_metrics:
            self.sku_store_metrics[key] = {
                'total_demand': 0.0,
                'total_satisfied': 0.0,
                'total_sales': 0.0,
                'periods': 0,
                'dates': []
            }
        
        self.sku_store_metrics[key]['total_demand'] += demand
        self.sku_store_metrics[key]['total_satisfied'] += satisfied_demand
        self.sku_store_metrics[key]['total_sales'] += sales_quantity
        self.sku_store_metrics[key]['periods'] += 1
        self.sku_store_metrics[key]['dates'].append(date)
        
        return metrics
    
    def get_aggregate_metrics(
        self,
        sku_id: Optional[int] = None,
        store_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get aggregate metrics for specified filters.
        
        Args:
            sku_id: Filter by SKU ID (optional)
            store_id: Filter by store ID (optional)
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            Dictionary with aggregate metrics
        """
        # Filter metrics
        filtered_metrics = self.metrics_history.copy()
        
        if sku_id is not None:
            filtered_metrics = [m for m in filtered_metrics if m['sku_id'] == sku_id]
        
        if store_id is not None:
            filtered_metrics = [m for m in filtered_metrics if m['store_id'] == store_id]
        
        if start_date is not None:
            filtered_metrics = [m for m in filtered_metrics if m['date'] >= start_date]
        
        if end_date is not None:
            filtered_metrics = [m for m in filtered_metrics if m['date'] <= end_date]
        
        if not filtered_metrics:
            return {
                'avg_fill_rate': 0.0,
                'avg_days_of_supply': 0.0,
                'avg_inventory_turns': 0.0,
                'total_demand': 0.0,
                'total_satisfied': 0.0,
                'periods': 0
            }
        
        # Calculate aggregates
        total_demand = sum(m['demand'] for m in filtered_metrics)
        total_satisfied = sum(m['satisfied_demand'] for m in filtered_metrics)
        avg_fill_rate = total_satisfied / total_demand if total_demand > 0 else 0.0
        
        avg_days_of_supply = np.mean([m['days_of_supply'] for m in filtered_metrics 
                                     if m['days_of_supply'] != float('inf')])
        
        inventory_turns_list = [m['inventory_turns'] for m in filtered_metrics 
                               if m['inventory_turns'] is not None]
        avg_inventory_turns = np.mean(inventory_turns_list) if inventory_turns_list else None
        
        avg_inventory = np.mean([m['current_inventory'] for m in filtered_metrics])
        
        return {
            'avg_fill_rate': avg_fill_rate,
            'avg_days_of_supply': avg_days_of_supply,
            'avg_inventory_turns': avg_inventory_turns,
            'total_demand': total_demand,
            'total_satisfied': total_satisfied,
            'total_shortage': total_demand - total_satisfied,
            'avg_inventory': avg_inventory,
            'periods': len(filtered_metrics)
        }
    
    def get_sku_store_metrics(self, sku_id: int, store_id: int) -> Dict[str, Any]:
        """
        Get metrics for a specific SKU-store combination.
        
        Args:
            sku_id: SKU identifier
            store_id: Store identifier
        
        Returns:
            Dictionary with SKU-store metrics
        """
        key = (sku_id, store_id)
        
        if key not in self.sku_store_metrics:
            return {
                'total_demand': 0.0,
                'total_satisfied': 0.0,
                'fill_rate': 0.0,
                'periods': 0
            }
        
        metrics = self.sku_store_metrics[key]
        fill_rate = metrics['total_satisfied'] / metrics['total_demand'] if metrics['total_demand'] > 0 else 0.0
        
        return {
            'sku_id': sku_id,
            'store_id': store_id,
            'total_demand': metrics['total_demand'],
            'total_satisfied': metrics['total_satisfied'],
            'total_sales': metrics['total_sales'],
            'fill_rate': fill_rate,
            'periods': metrics['periods'],
            'date_range': {
                'start': min(metrics['dates']) if metrics['dates'] else None,
                'end': max(metrics['dates']) if metrics['dates'] else None
            }
        }
    
    def export_metrics(self, filepath: str):
        """
        Export metrics to CSV file.
        
        Args:
            filepath: Path to output CSV file
        """
        if not self.metrics_history:
            logger.warning("No metrics to export")
            return
        
        df = pd.DataFrame(self.metrics_history)
        df.to_csv(filepath, index=False)
        logger.info(f"Exported {len(df)} metrics to {filepath}")
    
    def load_metrics(self, filepath: str):
        """
        Load metrics from CSV file.
        
        Args:
            filepath: Path to input CSV file
        """
        df = pd.read_csv(filepath)
        df['date'] = pd.to_datetime(df['date'])
        
        self.metrics_history = df.to_dict('records')
        
        # Rebuild SKU-store metrics
        self.sku_store_metrics = defaultdict(dict)
        for metric in self.metrics_history:
            key = (metric['sku_id'], metric['store_id'])
            if key not in self.sku_store_metrics:
                self.sku_store_metrics[key] = {
                    'total_demand': 0.0,
                    'total_satisfied': 0.0,
                    'total_sales': 0.0,
                    'periods': 0,
                    'dates': []
                }
            
            self.sku_store_metrics[key]['total_demand'] += metric['demand']
            self.sku_store_metrics[key]['total_satisfied'] += metric['satisfied_demand']
            self.sku_store_metrics[key]['total_sales'] += metric.get('sales_quantity', 0.0)
            self.sku_store_metrics[key]['periods'] += 1
            self.sku_store_metrics[key]['dates'].append(metric['date'])
        
        logger.info(f"Loaded {len(self.metrics_history)} metrics from {filepath}")

