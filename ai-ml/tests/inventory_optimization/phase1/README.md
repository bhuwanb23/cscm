# Phase 1: Stochastic Models Tests

This directory contains tests for Phase 1 of Inventory Optimization & Replenishment: Stochastic Models Implementation.

## Test Files

### Core Tests
- **`test_newsvendor.py`**: Tests for Enhanced Newsvendor Model
- **`test_ss_policy.py`**: Tests for (s,S) Policy Model
- **`test_stochastic_optimizer.py`**: Tests for Stochastic Inventory Optimizer

### Data-Driven Tests
- **`test_newsvendor_with_data.py`**: Tests using CSV test data files
- **`test_ss_policy_with_data.py`**: Tests using CSV test data files
- **`test_stochastic_optimizer_with_data.py`**: Tests using CSV test data files

## Running Tests

```bash
# Run all Phase 1 tests
pytest tests/inventory_optimization/phase1/ -v

# Run specific test file
pytest tests/inventory_optimization/phase1/test_newsvendor.py -v

# Run with coverage
pytest tests/inventory_optimization/phase1/ --cov=models.inventory_optimization.stochastic_models
```

## Test Data

Test data files are located in `data/test/`:
- `inventory_demand_data.csv` - Historical demand with forecasts
- `inventory_levels_data.csv` - Inventory levels over time
- `forecast_samples_data.csv` - Probabilistic forecast samples

## Test Coverage

All tests validate:
- Model initialization
- Model fitting with different distribution types
- Optimal parameter calculation
- Cost and service level calculations
- Error handling
- Integration with test data files

