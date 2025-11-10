# Phase 1: Stochastic Models for Inventory Optimization & Replenishment

## Overview

This module implements Phase 1 of the Inventory Optimization & Replenishment module, providing stochastic inventory optimization models that use ML-based demand forecasting.

## Features

### 1. Enhanced Newsvendor Model with ML Demand Distribution Inputs

The `EnhancedNewsvendorModel` class provides an enhanced Newsvendor model that uses ML-based demand distribution estimation instead of traditional statistical methods.

**Features:**
- Support for multiple distribution types (normal, gamma, Poisson, empirical)
- ML-based demand forecasting integration
- Optimal order quantity calculation
- Expected cost calculation
- Service level calculation

**Example:**
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

# Calculate expected cost
expected_cost = model.calculate_expected_cost(optimal_qty)

# Calculate service level
service_level = model.calculate_service_level(optimal_qty)
```

### 2. (s,S) Policy Models with ML Enhancements

The `SSPolicyModel` class implements (s,S) policy models that use ML-based demand forecasting to determine optimal reorder point (s) and order-up-to level (S).

**Features:**
- ML-based lead-time demand forecasting
- Optimal (s,S) parameter calculation
- Order quantity prediction based on current inventory
- Expected cost calculation
- Service level calculation

**Example:**
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

### 3. Stochastic Inventory Optimization Algorithms

The `StochasticInventoryOptimizer` class provides stochastic inventory optimization algorithms that can handle uncertainty in demand, lead times, and costs.

**Features:**
- Single-period Newsvendor optimization
- Multi-period inventory optimization
- Constrained optimization (budget, capacity, service level)
- Monte Carlo simulation for cost estimation
- ML-based demand forecasting integration

**Example:**
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

## Distribution Types

All models support multiple demand distribution types:

- **Normal**: For normally distributed demand
- **Gamma**: For positively skewed demand
- **Poisson**: For discrete demand
- **Empirical**: For non-parametric demand distributions

## ML Integration

All models can integrate with ML-based demand forecasting models:

- Pass an ML model to the constructor
- Provide forecast data when fitting
- Models automatically use ML forecasts to estimate distribution parameters
- Falls back to statistical estimation if ML forecast is unavailable

## Testing

All components are thoroughly tested. Run tests with:

```bash
pytest tests/phase2/inventory_optimization/stochastic_models/ -v
```

## File Structure

```
stochastic_models/
├── __init__.py
├── README.md
├── newsvendor.py          # Enhanced Newsvendor model
├── ss_policy.py           # (s,S) policy model
└── stochastic_optimizer.py # Stochastic optimization algorithms
```

## Dependencies

- pandas
- numpy
- scipy
- typing

## Usage Examples

See the test files in `tests/phase2/inventory_optimization/stochastic_models/` for comprehensive usage examples.

