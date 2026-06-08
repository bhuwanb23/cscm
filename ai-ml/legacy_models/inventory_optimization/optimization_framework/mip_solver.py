"""
Mixed Integer Programming (MIP) Solver for Inventory Optimization

This module implements MIP-based inventory optimization using ortools and gurobipy.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
from dataclasses import dataclass

try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False
    pywraplp = None

try:
    import gurobipy as gp
    from gurobipy import GRB
    HAS_GUROBI = True
except ImportError:
    HAS_GUROBI = False
    gp = None
    GRB = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class InventoryProblem:
    """Data class for inventory optimization problem."""
    sku_ids: List[int]
    store_ids: List[int]
    current_inventory: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> inventory
    demand_forecast: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> forecast
    holding_cost: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> cost
    shortage_cost: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> cost
    ordering_cost: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> cost
    unit_cost: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> cost
    max_capacity: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> capacity
    min_order_quantity: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> min_qty
    max_order_quantity: Dict[Tuple[int, int], float]  # (sku_id, store_id) -> max_qty
    lead_time: Dict[Tuple[int, int], int]  # (sku_id, store_id) -> lead_time
    budget: Optional[float] = None
    service_level: Optional[float] = None


class MIPInventoryOptimizer:
    """
    Mixed Integer Programming solver for inventory optimization.
    
    Supports both ortools and Gurobi solvers.
    """
    
    def __init__(
        self,
        solver_type: str = 'ortools',  # 'ortools' or 'gurobi'
        time_limit: int = 300,  # seconds
        mip_gap: float = 0.01,  # 1% optimality gap
        verbose: bool = False
    ):
        """
        Initialize MIP optimizer.
        
        Args:
            solver_type: Solver to use ('ortools' or 'gurobi')
            time_limit: Maximum solving time in seconds
            mip_gap: Optimality gap tolerance
            verbose: Whether to print solver output
        """
        self.solver_type = solver_type
        self.time_limit = time_limit
        self.mip_gap = mip_gap
        self.verbose = verbose
        
        if solver_type == 'gurobi' and not HAS_GUROBI:
            logger.warning("Gurobi not available, falling back to ortools")
            self.solver_type = 'ortools'
        
        if solver_type == 'ortools' and not HAS_ORTOOLS:
            raise ImportError("ortools is required for MIP optimization")
    
    def _create_ortools_model(self, problem: InventoryProblem) -> Tuple[Any, Dict]:
        """
        Create ortools MIP model.
        
        Args:
            problem: Inventory optimization problem
        
        Returns:
            Tuple of (solver, variables_dict)
        """
        solver = pywraplp.Solver.CreateSolver('SCIP')
        if solver is None:
            raise RuntimeError("Failed to create ortools solver")
        
        solver.SetTimeLimit(self.time_limit * 1000)  # Convert to milliseconds
        
        # Decision variables
        order_vars = {}  # (sku_id, store_id) -> order quantity
        inventory_vars = {}  # (sku_id, store_id) -> ending inventory
        shortage_vars = {}  # (sku_id, store_id) -> shortage amount
        order_binary = {}  # (sku_id, store_id) -> binary order indicator
        
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Order quantity (continuous, but can be made integer)
                min_qty = problem.min_order_quantity.get(key, 0.0)
                max_qty = problem.max_order_quantity.get(key, 1000.0)
                order_vars[key] = solver.NumVar(min_qty, max_qty, f'order_{sku_id}_{store_id}')
                
                # Binary variable for fixed ordering cost
                order_binary[key] = solver.BoolVar(f'order_binary_{sku_id}_{store_id}')
                
                # Ending inventory
                max_cap = problem.max_capacity.get(key, 10000.0)
                inventory_vars[key] = solver.NumVar(0, max_cap, f'inv_{sku_id}_{store_id}')
                
                # Shortage amount
                max_demand = problem.demand_forecast.get(key, 0.0) * 2
                shortage_vars[key] = solver.NumVar(0, max_demand, f'shortage_{sku_id}_{store_id}')
        
        # Objective: minimize total cost
        objective = solver.Objective()
        objective.SetMinimization()
        
        total_cost = 0
        
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Ordering cost (fixed + variable)
                ordering_cost = problem.ordering_cost.get(key, 10.0)
                unit_cost = problem.unit_cost.get(key, 1.0)
                total_cost += ordering_cost * order_binary[key]
                total_cost += unit_cost * order_vars[key]
                
                # Holding cost
                holding_cost = problem.holding_cost.get(key, 0.1)
                total_cost += holding_cost * inventory_vars[key]
                
                # Shortage cost
                shortage_cost = problem.shortage_cost.get(key, 5.0)
                total_cost += shortage_cost * shortage_vars[key]
        
        objective.SetCoefficient(total_cost, 1.0)
        
        # Constraints
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                # Inventory balance: ending_inv = current_inv + order - demand + shortage
                current_inv = problem.current_inventory.get(key, 0.0)
                demand = problem.demand_forecast.get(key, 0.0)
                
                constraint = solver.Constraint(
                    current_inv - demand,
                    current_inv - demand,
                    f'balance_{sku_id}_{store_id}'
                )
                constraint.SetCoefficient(inventory_vars[key], 1)
                constraint.SetCoefficient(order_vars[key], 1)
                constraint.SetCoefficient(shortage_vars[key], -1)
                
                # Order quantity constraints: order <= M * order_binary
                M = problem.max_order_quantity.get(key, 1000.0)
                constraint = solver.Constraint(0, M, f'order_binary_{sku_id}_{store_id}')
                constraint.SetCoefficient(order_vars[key], 1)
                constraint.SetCoefficient(order_binary[key], -M)
                
                # Minimum order quantity: order >= min_qty * order_binary
                min_qty = problem.min_order_quantity.get(key, 0.0)
                if min_qty > 0:
                    constraint = solver.Constraint(0, solver.infinity(), f'min_order_{sku_id}_{store_id}')
                    constraint.SetCoefficient(order_vars[key], 1)
                    constraint.SetCoefficient(order_binary[key], -min_qty)
                
                # Capacity constraint
                max_cap = problem.max_capacity.get(key, 10000.0)
                constraint = solver.Constraint(0, max_cap, f'capacity_{sku_id}_{store_id}')
                constraint.SetCoefficient(inventory_vars[key], 1)
        
        # Budget constraint
        if problem.budget is not None:
            constraint = solver.Constraint(0, problem.budget, 'budget')
            for sku_id in problem.sku_ids:
                for store_id in problem.store_ids:
                    key = (sku_id, store_id)
                    unit_cost = problem.unit_cost.get(key, 1.0)
                    constraint.SetCoefficient(order_vars[key], unit_cost)
        
        # Service level constraint
        if problem.service_level is not None:
            total_demand = sum(problem.demand_forecast.get((sku_id, store_id), 0.0)
                            for sku_id in problem.sku_ids
                            for store_id in problem.store_ids)
            
            if total_demand > 0:
                min_satisfied = total_demand * problem.service_level
                constraint = solver.Constraint(min_satisfied, solver.infinity(), 'service_level')
                for sku_id in problem.sku_ids:
                    for store_id in problem.store_ids:
                        key = (sku_id, store_id)
                        demand = problem.demand_forecast.get(key, 0.0)
                        constraint.SetCoefficient(inventory_vars[key], 1)
                        constraint.SetCoefficient(shortage_vars[key], 1)
        
        variables = {
            'order_vars': order_vars,
            'inventory_vars': inventory_vars,
            'shortage_vars': shortage_vars,
            'order_binary': order_binary
        }
        
        return solver, variables
    
    def _create_gurobi_model(self, problem: InventoryProblem) -> Tuple[Any, Dict]:
        """
        Create Gurobi MIP model.
        
        Args:
            problem: Inventory optimization problem
        
        Returns:
            Tuple of (model, variables_dict)
        """
        model = gp.Model("InventoryOptimization")
        model.setParam('TimeLimit', self.time_limit)
        model.setParam('MIPGap', self.mip_gap)
        model.setParam('OutputFlag', 1 if self.verbose else 0)
        
        # Decision variables
        order_vars = {}
        inventory_vars = {}
        shortage_vars = {}
        order_binary = {}
        
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                
                min_qty = problem.min_order_quantity.get(key, 0.0)
                max_qty = problem.max_order_quantity.get(key, 1000.0)
                order_vars[key] = model.addVar(lb=min_qty, ub=max_qty, vtype=GRB.CONTINUOUS,
                                             name=f'order_{sku_id}_{store_id}')
                
                order_binary[key] = model.addVar(vtype=GRB.BINARY, name=f'order_binary_{sku_id}_{store_id}')
                
                max_cap = problem.max_capacity.get(key, 10000.0)
                inventory_vars[key] = model.addVar(lb=0, ub=max_cap, vtype=GRB.CONTINUOUS,
                                                 name=f'inv_{sku_id}_{store_id}')
                
                max_demand = problem.demand_forecast.get(key, 0.0) * 2
                shortage_vars[key] = model.addVar(lb=0, ub=max_demand, vtype=GRB.CONTINUOUS,
                                                 name=f'shortage_{sku_id}_{store_id}')
        
        # Objective
        total_cost = 0
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                ordering_cost = problem.ordering_cost.get(key, 10.0)
                unit_cost = problem.unit_cost.get(key, 1.0)
                holding_cost = problem.holding_cost.get(key, 0.1)
                shortage_cost = problem.shortage_cost.get(key, 5.0)
                
                total_cost += ordering_cost * order_binary[key]
                total_cost += unit_cost * order_vars[key]
                total_cost += holding_cost * inventory_vars[key]
                total_cost += shortage_cost * shortage_vars[key]
        
        model.setObjective(total_cost, GRB.MINIMIZE)
        
        # Constraints
        for sku_id in problem.sku_ids:
            for store_id in problem.store_ids:
                key = (sku_id, store_id)
                current_inv = problem.current_inventory.get(key, 0.0)
                demand = problem.demand_forecast.get(key, 0.0)
                
                # Inventory balance
                model.addConstr(
                    inventory_vars[key] == current_inv + order_vars[key] - demand + shortage_vars[key],
                    name=f'balance_{sku_id}_{store_id}'
                )
                
                # Order binary constraint
                M = problem.max_order_quantity.get(key, 1000.0)
                model.addConstr(order_vars[key] <= M * order_binary[key],
                               name=f'order_binary_{sku_id}_{store_id}')
                
                min_qty = problem.min_order_quantity.get(key, 0.0)
                if min_qty > 0:
                    model.addConstr(order_vars[key] >= min_qty * order_binary[key],
                                   name=f'min_order_{sku_id}_{store_id}')
                
                # Capacity
                max_cap = problem.max_capacity.get(key, 10000.0)
                model.addConstr(inventory_vars[key] <= max_cap, name=f'capacity_{sku_id}_{store_id}')
        
        # Budget constraint
        if problem.budget is not None:
            budget_expr = gp.quicksum(
                problem.unit_cost.get((sku_id, store_id), 1.0) * order_vars[(sku_id, store_id)]
                for sku_id in problem.sku_ids
                for store_id in problem.store_ids
            )
            model.addConstr(budget_expr <= problem.budget, name='budget')
        
        # Service level constraint
        if problem.service_level is not None:
            total_demand = sum(problem.demand_forecast.get((sku_id, store_id), 0.0)
                            for sku_id in problem.sku_ids
                            for store_id in problem.store_ids)
            
            if total_demand > 0:
                satisfied_expr = gp.quicksum(
                    inventory_vars[(sku_id, store_id)] + shortage_vars[(sku_id, store_id)]
                    for sku_id in problem.sku_ids
                    for store_id in problem.store_ids
                )
                model.addConstr(satisfied_expr >= total_demand * problem.service_level, name='service_level')
        
        model.update()
        
        variables = {
            'order_vars': order_vars,
            'inventory_vars': inventory_vars,
            'shortage_vars': shortage_vars,
            'order_binary': order_binary
        }
        
        return model, variables
    
    def optimize(self, problem: InventoryProblem) -> Dict[str, Any]:
        """
        Solve inventory optimization problem.
        
        Args:
            problem: Inventory optimization problem
        
        Returns:
            Dictionary with solution and metrics
        """
        logger.info(f"Solving MIP problem with {self.solver_type} solver")
        
        if self.solver_type == 'ortools':
            solver, variables = self._create_ortools_model(problem)
            status = solver.Solve()
            
            if status == pywraplp.Solver.OPTIMAL:
                solution = {}
                for key in problem.sku_ids:
                    for store_id in problem.store_ids:
                        sku_key = (key, store_id)
                        solution[sku_key] = {
                            'order_quantity': variables['order_vars'][sku_key].solution_value(),
                            'ending_inventory': variables['inventory_vars'][sku_key].solution_value(),
                            'shortage': variables['shortage_vars'][sku_key].solution_value(),
                            'order_placed': variables['order_binary'][sku_key].solution_value() > 0.5
                        }
                
                return {
                    'status': 'optimal',
                    'objective_value': solver.Objective().Value(),
                    'solution': solution
                }
            elif status == pywraplp.Solver.FEASIBLE:
                logger.warning("Solution is feasible but may not be optimal")
                solution = {}
                for key in problem.sku_ids:
                    for store_id in problem.store_ids:
                        sku_key = (key, store_id)
                        solution[sku_key] = {
                            'order_quantity': variables['order_vars'][sku_key].solution_value(),
                            'ending_inventory': variables['inventory_vars'][sku_key].solution_value(),
                            'shortage': variables['shortage_vars'][sku_key].solution_value(),
                            'order_placed': variables['order_binary'][sku_key].solution_value() > 0.5
                        }
                
                return {
                    'status': 'feasible',
                    'objective_value': solver.Objective().Value(),
                    'solution': solution
                }
            else:
                return {
                    'status': 'infeasible',
                    'objective_value': None,
                    'solution': None
                }
        
        elif self.solver_type == 'gurobi':
            model, variables = self._create_gurobi_model(problem)
            model.optimize()
            
            order_vars = variables['order_vars']
            inventory_vars = variables['inventory_vars']
            shortage_vars = variables['shortage_vars']
            order_binary = variables['order_binary']
            
            if model.status == GRB.OPTIMAL:
                solution = {}
                for key in problem.sku_ids:
                    for store_id in problem.store_ids:
                        sku_key = (key, store_id)
                        solution[sku_key] = {
                            'order_quantity': order_vars[sku_key].X,
                            'ending_inventory': inventory_vars[sku_key].X,
                            'shortage': shortage_vars[sku_key].X,
                            'order_placed': order_binary[sku_key].X > 0.5
                        }
                
                return {
                    'status': 'optimal',
                    'objective_value': model.ObjVal,
                    'solution': solution
                }
            elif model.status == GRB.TIME_LIMIT:
                if model.SolCount > 0:
                    solution = {}
                    for key in problem.sku_ids:
                        for store_id in problem.store_ids:
                            sku_key = (key, store_id)
                            solution[sku_key] = {
                                'order_quantity': order_vars[sku_key].X,
                                'ending_inventory': inventory_vars[sku_key].X,
                                'shortage': shortage_vars[sku_key].X,
                                'order_placed': order_binary[sku_key].X > 0.5
                            }
                    
                    return {
                        'status': 'time_limit',
                        'objective_value': model.ObjVal,
                        'solution': solution
                    }
            else:
                return {
                    'status': 'infeasible',
                    'objective_value': None,
                    'solution': None
                }
        
        return {
            'status': 'error',
            'objective_value': None,
            'solution': None
        }

