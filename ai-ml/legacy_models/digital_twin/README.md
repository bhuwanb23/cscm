# Digital Twin & Simulation Models

## Structure
- `physics_based/`: deterministic simulators (warehouse, conveyor, DES)
- `agent_based/`: multi-node, order, routing environments
- `learned/`: surrogate & approximation models
- `use_cases/`: RL environment, policy impact, placement

## Data
Sample configs stored under `data/test`: warehouse layout, conveyor config, agent network, order stream.

## Tests
See `tests/digital_twin/phase1-4`. Run with `pytest tests/digital_twin/ -v` (after activating venv).
