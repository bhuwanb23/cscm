"""
CP-SAT Constraint Optimization for Inventory Management

This module implements CP-SAT (Constraint Programming - Satisfiability) 
for inventory optimization using ortools.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    from ortools.sat.python import cp_model
    HAS_ORTOOLS_SAT = True
except ImportError:
    HAS_ORTOOLS_SAT = False
    cp_model = None

from .mip_solver import InventoryProblem

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CPSATInventoryOptimizer:
    """
    CP-SAT solver for inventory optimization.
    
    Uses constraint programming for discrete inventory decisions.
    """
    
    def __init__(
        self,
        time_limit: int = 300,  # seconds
        num_search_workers: int = 4,
        verbose: bool = False
    ):
        """
        Initialize CP-SAT optimizer.
        
        Args:
            time_limit: Maximum solving time in seconds
            num_search_workers: Number of parallel search workers
            verbose: Whether to print solver output
        """
        if not HAS_ORTOOLS_SAT:
            raise ImportError("ortools.sat is required for CP-SAT optimization")
        
        self.time_limit = time_limit
        self.num_search_workers = num_search_workers
        self.verbose = verbose
    
    def optimize(self, problem: InventoryProblem) -> Dict[str, Any]:
        """
        Solve inventory optimization problem using CP-SAT.
        
        Args:
            problem: Inventory optimization problem
        
        Returns:
            Dictionary with solution and metrics
        """
        logger.info("Solving CP-SAT inventory optimization problem")
        
        model = cp_model.CpModel()
        
        # Decision variables
        order_vars = {}  # (sku_id, store_id) -> order quantity (integer)
        inventory_vars = {}  # (sku_id, store_id) -> ending inventory (integer)
        shortage_vars = {}  # (sku_id, store_id) -> shortage amount (integer)
        order_binary = {}  # (sku_id, store_id) -> binary order indicator
        
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Order quantity (integer)
                min_qty = int(problem.min_order_quantity.get(key, 0.0))
                max_qty = int(problem.max_order_quantity.get(key, 1000.0))
                order_vars[key] = model.NewIntVar(min_qty, max_qty, f'order_{sku_id}_{store_id}')
                
                # Binary variable for fixed ordering cost
                order_binary[key] = model.NewBoolVar(f'order_binary_{sku_id}_{store_id}')
                
                # Ending inventory (integer)
                max_cap = int(problem.max_capacity.get(key, 10000.0))
                inventory_vars[key] = model.NewIntVar(0, max_cap, f'inv_{sku_id}_{store_id}')
                
                # Shortage amount (integer)
                max_demand = int(problem.demand_forecast.get(key, 0.0) * 2)
                shortage_vars[key] = model.NewIntVar(0, max_demand, f'shortage_{sku_id}_{store_id}')
        
        # Objective: minimize total cost
        objective_terms = []
        
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Ordering cost (fixed + variable)
                ordering_cost = int(problem.ordering_cost.get(key, 10.0) * 100)  # Scale for integer
                unit_cost = int(problem.unit_cost.get(key, 1.0) * 100)
                objective_terms.append(ordering_cost * order_binary[key])
                objective_terms.append(unit_cost * order_vars[key])
                
                # Holding cost
                holding_cost = int(problem.holding_cost.get(key, 0.1) * 100)
                objective_terms.append(holding_cost * inventory_vars[key])
                
                # Shortage cost
                shortage_cost = int(problem.shortage_cost.get(key, 5.0) * 100)
                objective_terms.append(shortage_cost * shortage_vars[key])
        
        model.Minimize(sum(objective_terms))
        
        # Constraints
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Inventory balance: ending_inv = current_inv + order - demand + shortage
                current_inv = int(problem.current_inventory.get(key, 0.0))
                demand = int(problem.demand_forecast.get(key, 0.0))
                
                model.Add(
                    inventory_vars[key] == current_inv + order_vars[key] - demand + shortage_vars[key]
                )
                
                # Order quantity constraints: order <= M * order_binary
                M = int(problem.max_order_quantity.get(key, 1000.0))
                model.Add(order_vars[key] <= M * order_binary[key])
                
                # Minimum order quantity: order >= min_qty * order_binary
                min_qty = int(problem.min_order_quantity.get(key, 0.0))
                if min_qty > 0:
                    model.Add(order_vars[key] >= min_qty * order_binary[key])
                
                # Capacity constraint
                max_cap = int(problem.max_capacity.get(key, 10000.0))
                model.Add(inventory_vars[key] <= max_cap)
        
        # Budget constraint
        if problem.budget is not None:
            budget_expr = []
            for sku_id in problem.sku_ids:
                for store_id in problem.store_ids:
                    key = (sku_id, store_id)
                    unit_cost = int(problem.unit_cost.get(key, 1.0) * 100)
                    budget_expr.append(unit_cost * order_vars[key])
            
            budget_limit = int(problem.budget * 100)
            model.Add(sum(budget_expr) <= budget_limit)
        
        # Service level constraint
        if problem.service_level is not None:
            total_demand = sum(int(problem.demand_forecast.get((sku_id, store_id), 0.0))
                            for sku_id in problem.sku_ids
                            for store_id in problem.store_ids)
            
            if total_demand > 0:
                satisfied_expr = []
                for sku_id in problem.sku_ids:
                    for store_id in problem.store_ids:
                        key = (sku_id, store_id)
                        satisfied_expr.append(inventory_vars[key])
                        satisfied_expr.append(shortage_vars[key])
                
                min_satisfied = int(total_demand * problem.service_level)
                model.Add(sum(satisfied_expr) >= min_satisfied)
        
        # Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = self.time_limit
        solver.parameters.num_search_workers = self.num_search_workers
        solver.parameters.log_search_progress = self.verbose
        
        status = solver.Solve(model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            solution = {}
            for sku_id in problem.sku_ids:
                for store_id in problem.store_ids:
                    key = (sku_id, store_id)
                    solution[key] = {
                        'order_quantity': solver.Value(order_vars[key]),
                        'ending_inventory': solver.Value(inventory_vars[key]),
                        'shortage': solver.Value(shortage_vars[key]),
                        'order_placed': solver.Value(order_binary[key]) == 1
                    }
            
            objective_value = solver.ObjectiveValue() / 100.0  # Scale back
            
            return {
                'status': 'optimal' if status == cp_model.OPTIMAL else 'feasible',
                'objective_value': objective_value,
                'solution': solution
            }
        else:
            return {
                'status': 'infeasible',
                'objective_value': None,
                'solution': None
            }

