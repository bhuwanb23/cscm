"""
Periodic Batch Optimization System

This module implements a periodic batch optimization system for inventory management
that processes multiple SKU-store combinations in batches.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging
from pathlib import Path

from .mip_solver import MIPInventoryOptimizer, InventoryProblem
from .cp_sat_solver import CPSATInventoryOptimizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PeriodicBatchOptimizer:
    """
    Periodic batch optimization system for inventory management.
    
    Processes inventory optimization in batches on a scheduled basis.
    """
    
    def __init__(
        self,
        optimizer_type: str = 'mip',  # 'mip' or 'cp_sat'
        batch_size: int = 100,
        solver_type: str = 'ortools',
        time_limit: int = 300,
        output_dir: Optional[str] = None
    ):
        """
        Initialize batch optimizer.
        
        Args:
            optimizer_type: Type of optimizer ('mip' or 'cp_sat')
            batch_size: Number of SKU-store combinations per batch
            solver_type: Solver type for MIP ('ortools' or 'gurobi')
            time_limit: Maximum solving time per batch in seconds
            output_dir: Directory to save optimization results
        """
        self.optimizer_type = optimizer_type
        self.batch_size = batch_size
        self.solver_type = solver_type
        self.time_limit = time_limit
        
        if optimizer_type == 'mip':
            self.optimizer = MIPInventoryOptimizer(
                solver_type=solver_type,
                time_limit=time_limit
            )
        elif optimizer_type == 'cp_sat':
            self.optimizer = CPSATInventoryOptimizer(
                time_limit=time_limit
            )
        else:
            raise ValueError(f"Unknown optimizer type: {optimizer_type}")
        
        self.output_dir = Path(output_dir) if output_dir else None
        if self.output_dir:
            self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.optimization_history: List[Dict[str, Any]] = []
    
    def load_inventory_data(self, filepath: str) -> pd.DataFrame:
        """
        Load inventory data from CSV file.
        
        Args:
            filepath: Path to inventory CSV file
        
        Returns:
            DataFrame with inventory data
        """
        logger.info(f"Loading inventory data from {filepath}")
        df = pd.read_csv(filepath)
        
        # Ensure date column is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    def load_forecast_data(self, filepath: str) -> pd.DataFrame:
        """
        Load demand forecast data from CSV file.
        
        Args:
            filepath: Path to forecast CSV file
        
        Returns:
            DataFrame with forecast data
        """
        logger.info(f"Loading forecast data from {filepath}")
        df = pd.read_csv(filepath)
        
        # Ensure date column is datetime
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
        
        return df
    
    def prepare_problem(
        self,
        inventory_df: pd.DataFrame,
        forecast_df: pd.DataFrame,
        date: Optional[datetime] = None,
        sku_ids: Optional[List[int]] = None,
        store_ids: Optional[List[int]] = None
    ) -> InventoryProblem:
        """
        Prepare inventory optimization problem from data.
        
        Args:
            inventory_df: DataFrame with inventory data
            forecast_df: DataFrame with demand forecasts
            date: Date for optimization (default: latest date)
            sku_ids: List of SKU IDs to optimize (default: all)
            store_ids: List of store IDs to optimize (default: all)
        
        Returns:
            InventoryProblem instance
        """
        if date is None:
            date = inventory_df['date'].max()
        
        # Filter data for the specified date
        inv_data = inventory_df[inventory_df['date'] == date].copy()
        
        if sku_ids is None:
            sku_ids = sorted(inv_data['sku_id'].unique().tolist())
        if store_ids is None:
            store_ids = sorted(inv_data['store_id'].unique().tolist())
        
        # Get forecasts for the date
        forecast_data = forecast_df[forecast_df['date'] == date].copy()
        
        # Initialize problem data structures
        current_inventory = {}
        demand_forecast = {}
        holding_cost = {}
        shortage_cost = {}
        ordering_cost = {}
        unit_cost = {}
        max_capacity = {}
        min_order_quantity = {}
        max_order_quantity = {}
        lead_time = {}
        
        for sku_id in sku_ids:
            for store_id in store_ids:
                key = (sku_id, store_id)
                
                # Current inventory
                inv_row = inv_data[(inv_data['sku_id'] == sku_id) & 
                                  (inv_data['store_id'] == store_id)]
                if not inv_row.empty:
                    current_inventory[key] = float(inv_row['inventory_on_hand'].iloc[0])
                    max_capacity[key] = float(inv_row['max_stock_level'].iloc[0])
                    min_order_quantity[key] = 0.0  # Default
                    max_order_quantity[key] = float(inv_row['max_stock_level'].iloc[0])
                else:
                    current_inventory[key] = 0.0
                    max_capacity[key] = 1000.0
                    min_order_quantity[key] = 0.0
                    max_order_quantity[key] = 1000.0
                
                # Demand forecast
                forecast_row = forecast_data[(forecast_data['sku_id'] == sku_id) &
                                            (forecast_data['store_id'] == store_id)]
                if not forecast_row.empty:
                    if 'forecast' in forecast_row.columns:
                        demand_forecast[key] = float(forecast_row['forecast'].iloc[0])
                    elif 'sales_quantity' in forecast_row.columns:
                        # Use historical average as forecast
                        demand_forecast[key] = float(forecast_row['sales_quantity'].iloc[0])
                    else:
                        demand_forecast[key] = 10.0  # Default
                else:
                    # Use historical average from inventory data
                    hist_data = inventory_df[(inventory_df['sku_id'] == sku_id) &
                                            (inventory_df['store_id'] == store_id)]
                    if not hist_data.empty and 'sales_quantity' in hist_data.columns:
                        demand_forecast[key] = float(hist_data['sales_quantity'].mean())
                    else:
                        demand_forecast[key] = 10.0  # Default
                
                # Costs (defaults, can be customized)
                holding_cost[key] = 0.1
                shortage_cost[key] = 5.0
                ordering_cost[key] = 10.0
                unit_cost[key] = 1.0
                lead_time[key] = 7
        
        problem = InventoryProblem(
            sku_ids=sku_ids,
            store_ids=store_ids,
            current_inventory=current_inventory,
            demand_forecast=demand_forecast,
            holding_cost=holding_cost,
            shortage_cost=shortage_cost,
            ordering_cost=ordering_cost,
            unit_cost=unit_cost,
            max_capacity=max_capacity,
            min_order_quantity=min_order_quantity,
            max_order_quantity=max_order_quantity,
            lead_time=lead_time
        )
        
        return problem
    
    def optimize_batch(
        self,
        problem: InventoryProblem,
        budget: Optional[float] = None,
        service_level: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Optimize a batch of SKU-store combinations.
        
        Args:
            problem: Inventory optimization problem
            budget: Budget constraint (optional)
            service_level: Service level constraint (optional)
        
        Returns:
            Dictionary with optimization results
        """
        logger.info(f"Optimizing batch: {len(problem.sku_ids)} SKUs, {len(problem.store_ids)} stores")
        
        # Add constraints
        problem.budget = budget
        problem.service_level = service_level
        
        # Solve
        result = self.optimizer.optimize(problem)
        
        # Add metadata
        result['timestamp'] = datetime.now()
        result['batch_size'] = len(problem.sku_ids) * len(problem.store_ids)
        result['optimizer_type'] = self.optimizer_type
        
        # Store in history
        self.optimization_history.append(result)
        
        # Save to file if output directory specified
        if self.output_dir:
            self._save_results(result)
        
        return result
    
    def optimize_periodic(
        self,
        inventory_file: str,
        forecast_file: str,
        start_date: datetime,
        end_date: datetime,
        frequency: str = 'daily',  # 'daily', 'weekly', 'monthly'
        budget: Optional[float] = None,
        service_level: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Run periodic batch optimization.
        
        Args:
            inventory_file: Path to inventory data CSV
            forecast_file: Path to forecast data CSV
            start_date: Start date for optimization
            end_date: End date for optimization
            frequency: Optimization frequency
            budget: Budget constraint (optional)
            service_level: Service level constraint (optional)
        
        Returns:
            List of optimization results
        """
        logger.info(f"Starting periodic optimization from {start_date} to {end_date}")
        
        # Load data
        inventory_df = self.load_inventory_data(inventory_file)
        forecast_df = self.load_forecast_data(forecast_file)
        
        # Generate dates based on frequency
        dates = self._generate_dates(start_date, end_date, frequency)
        
        results = []
        
        for date in dates:
            logger.info(f"Optimizing for date: {date}")
            
            # Prepare problem
            problem = self.prepare_problem(inventory_df, forecast_df, date=date)
            
            # Optimize
            result = self.optimize_batch(problem, budget=budget, service_level=service_level)
            result['date'] = date
            
            results.append(result)
        
        logger.info(f"Completed periodic optimization: {len(results)} batches")
        
        return results
    
    def _generate_dates(self, start_date: datetime, end_date: datetime, frequency: str) -> List[datetime]:
        """Generate list of dates based on frequency."""
        dates = []
        current_date = start_date
        
        if frequency == 'daily':
            delta = timedelta(days=1)
        elif frequency == 'weekly':
            delta = timedelta(weeks=1)
        elif frequency == 'monthly':
            delta = timedelta(days=30)  # Approximate
        else:
            raise ValueError(f"Unknown frequency: {frequency}")
        
        while current_date <= end_date:
            dates.append(current_date)
            current_date += delta
        
        return dates
    
    def _save_results(self, result: Dict[str, Any]):
        """Save optimization results to file."""
        if not self.output_dir:
            return
        
        timestamp = result['timestamp'].strftime('%Y%m%d_%H%M%S')
        filename = self.output_dir / f"optimization_{timestamp}.json"
        
        import json
        
        # Convert datetime to string for JSON serialization
        result_copy = result.copy()
        if 'timestamp' in result_copy:
            result_copy['timestamp'] = result_copy['timestamp'].isoformat()
        if 'date' in result_copy:
            result_copy['date'] = result_copy['date'].isoformat()
        
        with open(filename, 'w') as f:
            json.dump(result_copy, f, indent=2)
        
        logger.info(f"Saved results to {filename}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get optimization statistics."""
        if not self.optimization_history:
            return {}
        
        total_batches = len(self.optimization_history)
        optimal_count = sum(1 for r in self.optimization_history if r['status'] == 'optimal')
        feasible_count = sum(1 for r in self.optimization_history if r['status'] == 'feasible')
        
        objective_values = [r['objective_value'] for r in self.optimization_history 
                          if r['objective_value'] is not None]
        
        return {
            'total_batches': total_batches,
            'optimal_count': optimal_count,
            'feasible_count': feasible_count,
            'infeasible_count': total_batches - optimal_count - feasible_count,
            'avg_objective_value': np.mean(objective_values) if objective_values else None,
            'min_objective_value': np.min(objective_values) if objective_values else None,
            'max_objective_value': np.max(objective_values) if objective_values else None
        }

