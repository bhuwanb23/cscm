# Optimization Framework for Inventory Management

## Overview

This module provides optimization algorithms for inventory management, including Mixed Integer Programming (MIP), CP-SAT constraint optimization, periodic batch optimization, and forecast-driven heuristic algorithms.

## Phase 3: Optimization Framework ✅

### Components

1. **Mixed Integer Programming (MIP) Solver** (`mip_solver.py`)
   - Supports ortools and Gurobi solvers
   - Handles budget and service level constraints
   - Optimizes order quantities, inventory levels, and shortages
   - Fixed and variable ordering costs

2. **CP-SAT Constraint Optimization** (`cp_sat_solver.py`)
   - Integer constraint programming
   - Parallel search workers
   - Handles discrete inventory decisions
   - Budget and service level constraints

3. **Periodic Batch Optimization System** (`batch_optimizer.py`)
   - Processes multiple SKU-store combinations in batches
   - Scheduled periodic optimization
   - Loads data from CSV files
   - Saves optimization results

4. **Forecast-Driven Heuristic Algorithms** (`heuristic_algorithms.py`)
   - EOQ (Economic Order Quantity) heuristic
   - Newsvendor heuristic
   - Forecast-based heuristic
   - Safety stock and reorder point calculations

## Usage Examples

### MIP Solver

```python
from models.inventory_optimization.optimization_framework import MIPInventoryOptimizer, InventoryProblem

# Create optimizer
optimizer = MIPInventoryOptimizer(
    solver_type='ortools',  # or 'gurobi'
    time_limit=300,
    mip_gap=0.01
)

# Create problem
problem = InventoryProblem(
    sku_ids=[1, 2],
    store_ids=[1, 2],
    current_inventory={(1, 1): 100.0, (1, 2): 50.0, (2, 1): 75.0, (2, 2): 25.0},
    demand_forecast={(1, 1): 10.0, (1, 2): 8.0, (2, 1): 12.0, (2, 2): 6.0},
    holding_cost={(1, 1): 0.1, (1, 2): 0.1, (2, 1): 0.1, (2, 2): 0.1},
    shortage_cost={(1, 1): 5.0, (1, 2): 5.0, (2, 1): 5.0, (2, 2): 5.0},
    ordering_cost={(1, 1): 10.0, (1, 2): 10.0, (2, 1): 10.0, (2, 2): 10.0},
    unit_cost={(1, 1): 1.0, (1, 2): 1.0, (2, 1): 1.0, (2, 2): 1.0},
    max_capacity={(1, 1): 500.0, (1, 2): 500.0, (2, 1): 500.0, (2, 2): 500.0},
    min_order_quantity={(1, 1): 0.0, (1, 2): 0.0, (2, 1): 0.0, (2, 2): 0.0},
    max_order_quantity={(1, 1): 200.0, (1, 2): 200.0, (2, 1): 200.0, (2, 2): 200.0},
    lead_time={(1, 1): 7, (1, 2): 7, (2, 1): 7, (2, 2): 7},
    budget=1000.0,  # Optional
    service_level=0.95  # Optional
)

# Optimize
result = optimizer.optimize(problem)

print(f"Status: {result['status']}")
print(f"Objective Value: {result['objective_value']}")
print(f"Solution: {result['solution']}")
```

### CP-SAT Solver

```python
from models.inventory_optimization.optimization_framework import CPSATInventoryOptimizer

# Create optimizer
optimizer = CPSATInventoryOptimizer(
    time_limit=300,
    num_search_workers=4
)

# Use same problem structure as MIP
result = optimizer.optimize(problem)
```

### Periodic Batch Optimizer

```python
from models.inventory_optimization.optimization_framework import PeriodicBatchOptimizer
from datetime import datetime

# Create optimizer
optimizer = PeriodicBatchOptimizer(
    optimizer_type='mip',  # or 'cp_sat'
    batch_size=100,
    solver_type='ortools',
    output_dir='./optimization_results'
)

# Run periodic optimization
results = optimizer.optimize_periodic(
    inventory_file='data/processed/processed_inventory.csv',
    forecast_file='data/processed/processed_sales.csv',
    start_date=datetime(2023, 1, 1),
    end_date=datetime(2023, 1, 31),
    frequency='daily',  # 'daily', 'weekly', 'monthly'
    budget=10000.0,
    service_level=0.95
)

# Get statistics
stats = optimizer.get_statistics()
print(f"Total Batches: {stats['total_batches']}")
print(f"Optimal Count: {stats['optimal_count']}")
```

### Forecast-Driven Heuristic

```python
from models.inventory_optimization.optimization_framework import ForecastDrivenHeuristic
import pandas as pd

# Create heuristic optimizer
heuristic = ForecastDrivenHeuristic(
    safety_stock_multiplier=1.5,
    reorder_point_multiplier=1.2
)

# Optimize single SKU-store
result = heuristic.optimize_sku_store(
    current_inventory=100.0,
    demand_forecast=10.0,
    demand_std=3.0,
    lead_time=7,
    max_capacity=500.0,
    method='forecast_based'  # 'eoq', 'newsvendor', 'forecast_based'
)

print(f"Order Quantity: {result['order_quantity']}")
print(f"Total Cost: {result['total_cost']}")
print(f"Fill Rate: {result['fill_rate']:.2%}")

# Optimize batch
inventory_data = pd.read_csv('data/processed/processed_inventory.csv')
forecast_data = pd.read_csv('data/processed/processed_sales.csv')

results = heuristic.optimize_batch(
    inventory_data,
    forecast_data,
    method='forecast_based',
    service_level=0.95
)

# Get statistics
stats = heuristic.get_statistics(results)
print(f"Total Orders: {stats['total_orders']}")
print(f"Average Cost: {stats['avg_cost']}")
```

## File Structure

```
optimization_framework/
├── __init__.py
├── README.md
├── mip_solver.py
├── cp_sat_solver.py
├── batch_optimizer.py
└── heuristic_algorithms.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all Phase 3 tests
pytest tests/inventory_optimization/phase3/ -v

# Run specific test file
pytest tests/inventory_optimization/phase3/test_mip_solver.py -v
pytest tests/inventory_optimization/phase3/test_cp_sat_solver.py -v
pytest tests/inventory_optimization/phase3/test_batch_optimizer.py -v
pytest tests/inventory_optimization/phase3/test_heuristic_algorithms.py -v
```

## Dependencies

- ortools (required for MIP and CP-SAT)
- gurobipy (optional, for Gurobi solver)
- pandas
- numpy
- scipy (for statistical functions)

## Data Requirements

The optimization framework expects data in the following format:

### Inventory Data
- `date`: Date of inventory snapshot
- `sku_id`: SKU identifier
- `store_id`: Store identifier
- `inventory_on_hand`: Current inventory level
- `max_stock_level`: Maximum inventory capacity

### Forecast Data
- `date`: Date of forecast
- `sku_id`: SKU identifier
- `store_id`: Store identifier
- `forecast`: Demand forecast value
- `forecast_std`: Standard deviation of forecast (optional)

## Notes

- MIP solver supports both ortools and Gurobi (if available)
- CP-SAT solver uses integer variables for discrete decisions
- Batch optimizer processes data from CSV files in the `data/processed/` directory
- Heuristic algorithms provide fast approximate solutions
- All optimizers support budget and service level constraints

