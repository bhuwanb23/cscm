# Inventory Optimization & Replenishment Module

## Overview

This module provides inventory optimization and replenishment capabilities for the Cognitive Supply Chain Mesh (CSCM) AI/ML system.

## Phase 1: Stochastic Models Implementation ✅

### Components

1. **Enhanced Newsvendor Model** (`stochastic_models/newsvendor.py`)
   - ML-based demand distribution estimation
   - Support for multiple distribution types (normal, gamma, Poisson, empirical)
   - Optimal order quantity calculation
   - Expected cost and service level calculation

2. **(s,S) Policy Model** (`stochastic_models/ss_policy.py`)
   - ML-based lead-time demand forecasting
   - Optimal reorder point (s) and order-up-to level (S) calculation
   - Order quantity prediction based on current inventory
   - Expected cost and service level calculation

3. **Stochastic Inventory Optimizer** (`stochastic_models/stochastic_optimizer.py`)
   - Single-period Newsvendor optimization
   - Multi-period inventory optimization
   - Constrained optimization (budget, capacity, service level)
   - Monte Carlo simulation for cost estimation

### Usage Examples

#### Enhanced Newsvendor Model

```python
from models.inventory_optimization.stochastic_models import EnhancedNewsvendorModel

model = EnhancedNewsvendorModel(
    holding_cost=1.0,
    shortage_cost=5.0,
    distribution_type='normal',
    demand_model=ml_forecast_model  # Optional ML model
)

# Fit with historical demand
model.fit(historical_demand, forecast=ml_forecast)

# Get optimal order quantity
optimal_qty = model.predict_optimal_quantity()

# Calculate metrics
expected_cost = model.calculate_expected_cost(optimal_qty)
service_level = model.calculate_service_level(optimal_qty)
```

#### (s,S) Policy Model

```python
from models.inventory_optimization.stochastic_models import SSPolicyModel

model = SSPolicyModel(
    holding_cost=1.0,
    ordering_cost=10.0,
    shortage_cost=5.0,
    lead_time=7,
    distribution_type='normal',
    demand_model=ml_forecast_model  # Optional ML model
)

# Fit with historical demand
model.fit(historical_demand, forecast=ml_forecast)

# Get optimal (s,S) parameters
reorder_point = model.reorder_point
order_up_to_level = model.order_up_to_level

# Predict order quantity based on current inventory
current_inventory = 50
order_quantity = model.predict_order_quantity(current_inventory)
```

#### Stochastic Optimizer

```python
from models.inventory_optimization.stochastic_models import StochasticInventoryOptimizer

optimizer = StochasticInventoryOptimizer(
    holding_cost=1.0,
    ordering_cost=10.0,
    shortage_cost=5.0,
    lead_time=7,
    distribution_type='normal',
    demand_model=ml_forecast_model  # Optional ML model
)

# Optimize single-period Newsvendor problem
policy = optimizer.optimize_newsvendor(historical_demand, forecast=ml_forecast)

# Optimize multi-period problem
policy = optimizer.optimize_multi_period(historical_demand, n_periods=10)

# Optimize with constraints
constraints = {
    'budget': 1000.0,
    'capacity': 200.0,
    'service_level': 0.95
}
policy = optimizer.optimize_with_constraints(historical_demand, constraints)
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all Phase 1 tests
pytest tests/inventory_optimization/phase1/ -v

# Run with coverage
pytest tests/inventory_optimization/phase1/ --cov=models.inventory_optimization.stochastic_models
```

## Test Data

Test data files are located in `data/test/`:
- `inventory_demand_data.csv` - Historical demand with ML forecasts
- `inventory_levels_data.csv` - Inventory levels over time
- `forecast_samples_data.csv` - Probabilistic forecast samples

## File Structure

```
inventory_optimization/
├── __init__.py
├── README.md
└── stochastic_models/
    ├── __init__.py
    ├── README.md
    ├── newsvendor.py
    ├── ss_policy.py
    └── stochastic_optimizer.py
```

## Dependencies

- pandas
- numpy
- scipy
- typing

## Future Phases

- Phase 2: Reinforcement Learning Approach
- Phase 3: Optimization Framework
- Phase 4: Deployment & Integration

