# Phase 3: Optimization Framework Tests

This directory contains tests for Phase 3 of Inventory Optimization & Replenishment: Optimization Framework.

## Test Files

### Core Tests
- **`test_mip_solver.py`**: Tests for Mixed Integer Programming Solver (5 tests)
- **`test_cp_sat_solver.py`**: Tests for CP-SAT Constraint Optimization (3 tests)
- **`test_batch_optimizer.py`**: Tests for Periodic Batch Optimizer (5 tests)
- **`test_heuristic_algorithms.py`**: Tests for Forecast-Driven Heuristic Algorithms (8 tests)

## Running Tests

```bash
# Run all Phase 3 tests
pytest tests/inventory_optimization/phase3/ -v

# Run specific test file
pytest tests/inventory_optimization/phase3/test_mip_solver.py -v
pytest tests/inventory_optimization/phase3/test_cp_sat_solver.py -v
pytest tests/inventory_optimization/phase3/test_batch_optimizer.py -v
pytest tests/inventory_optimization/phase3/test_heuristic_algorithms.py -v

# Run with coverage
pytest tests/inventory_optimization/phase3/ --cov=models.inventory_optimization.optimization_framework
```

## Test Coverage

All tests validate:
- Component initialization
- Problem creation and preparation
- Optimization execution
- Constraint handling (budget, service level)
- Data loading and processing
- Statistics calculation

## Requirements

- ortools (required for MIP and CP-SAT tests)
- pandas
- numpy
- scipy

## Notes

- MIP and CP-SAT tests will skip if ortools is not available
- Heuristic algorithm tests run independently
- Tests use sample data structures, not actual CSV files
- All tests validate core functionality and constraints

