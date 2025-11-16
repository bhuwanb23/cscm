# Phase 1: Classical Optimization Tests

This directory contains tests for Phase 1 of Routing & Logistics Optimization: Classical Optimization.

## Test Files

### Core Tests
- **`test_cvrptw_solver.py`**: Tests for CVRPTW Solver (4 tests)
- **`test_gurobi_routing.py`**: Tests for Gurobi Routing Optimizer (3 tests)
- **`test_time_windows.py`**: Tests for Time Window Handler (8 tests)

## Running Tests

```bash
# Run all Phase 1 tests
pytest tests/routing_logistics/phase1/ -v

# Run specific test file
pytest tests/routing_logistics/phase1/test_cvrptw_solver.py -v
pytest tests/routing_logistics/phase1/test_gurobi_routing.py -v
pytest tests/routing_logistics/phase1/test_time_windows.py -v

# Run with coverage
pytest tests/routing_logistics/phase1/ --cov=models.routing_logistics.classical_optimization
```

## Test Coverage

All tests validate:
- Component initialization
- Problem creation and solving
- Time window handling
- Constraint validation
- Route feasibility checking

## Requirements

- ortools.constraint_solver (for CVRPTW tests)
- gurobipy (for Gurobi tests)
- numpy
- pytest

## Notes

- CVRPTW and Gurobi tests will skip if required libraries are not available
- Time window handler tests run independently
- All tests use sample data structures
- 8 tests pass, 8 tests skip (due to optional dependencies)

