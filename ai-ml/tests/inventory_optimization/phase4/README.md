# Phase 4: Deployment & Integration Tests

This directory contains tests for Phase 4 of Inventory Optimization & Replenishment: Deployment & Integration.

## Test Files

### Core Tests
- **`test_metrics_tracker.py`**: Tests for Metrics Tracker (9 tests)
- **`test_hitl_interface.py`**: Tests for HITL Interface (8 tests)
- **`test_edge_executor.py`**: Tests for Edge Decision Executor (7 tests)
- **`test_central_coordinator.py`**: Tests for Central Coordinator (8 tests)

## Running Tests

```bash
# Run all Phase 4 tests
pytest tests/inventory_optimization/phase4/ -v

# Run specific test file
pytest tests/inventory_optimization/phase4/test_metrics_tracker.py -v
pytest tests/inventory_optimization/phase4/test_hitl_interface.py -v
pytest tests/inventory_optimization/phase4/test_edge_executor.py -v
pytest tests/inventory_optimization/phase4/test_central_coordinator.py -v

# Run with coverage
pytest tests/inventory_optimization/phase4/ --cov=models.inventory_optimization.deployment_integration
```

## Test Coverage

All tests validate:
- Component initialization
- Core functionality
- Integration between components
- Error handling
- Data persistence (export/import)
- Statistics and metrics calculation

## Requirements

- pandas
- numpy
- pytest

## Notes

- All tests use mock data and don't require external services
- Tests validate both individual components and their integration
- Export/import tests use temporary directories
- All 32 tests pass successfully

