# Phase 2: Reinforcement Learning Tests

This directory contains tests for Phase 2 of Inventory Optimization & Replenishment: Reinforcement Learning Approach.

## Test Files

### Core Tests
- **`test_digital_twin.py`**: Tests for Digital Twin Simulator (16 tests)
- **`test_dqn.py`**: Tests for Deep Q-Learning Agent (10 tests)
- **`test_ddpg.py`**: Tests for DDPG Agent (10 tests)
- **`test_ppo.py`**: Tests for PPO Agent (10 tests)

## Running Tests

```bash
# Run all Phase 2 tests
pytest tests/inventory_optimization/phase2/ -v

# Run specific test file
pytest tests/inventory_optimization/phase2/test_digital_twin.py -v
pytest tests/inventory_optimization/phase2/test_dqn.py -v
pytest tests/inventory_optimization/phase2/test_ddpg.py -v
pytest tests/inventory_optimization/phase2/test_ppo.py -v

# Run with coverage
pytest tests/inventory_optimization/phase2/ --cov=models.inventory_optimization.reinforcement_learning
```

## Test Coverage

All tests validate:
- Component initialization
- State conversion and action selection
- Training procedures
- Model save/load functionality
- Integration with digital twin simulator
- Error handling

## Requirements

- PyTorch (required for RL algorithms)
- numpy
- pandas
- pytest

## Notes

- RL algorithm tests will skip if PyTorch is not available
- Digital twin simulator tests run independently of PyTorch
- All integration tests use the digital twin simulator for safe training

