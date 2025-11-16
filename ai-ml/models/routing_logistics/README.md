# Routing & Logistics Optimization Module

## Overview

This module provides routing and logistics optimization capabilities for the Cognitive Supply Chain Mesh (CSCM) AI/ML system.

## Phase 1: Classical Optimization ✅

### Components

1. **CVRPTW Solver** (`classical_optimization/cvrptw_solver.py`)
   - Capacitated Vehicle Routing Problem with Time Windows
   - Uses Google OR-Tools constraint solver
   - Supports capacity and time window constraints
   - Distance and time matrix support

2. **Gurobi Routing Optimizer** (`classical_optimization/gurobi_routing.py`)
   - MIP-based routing optimization using Gurobi
   - Handles capacity and time window constraints
   - Flow conservation constraints
   - Big-M formulation for time propagation

3. **Time Window Handler** (`classical_optimization/time_windows.py`)
   - Time window validation and adjustment
   - Soft and hard time window constraints
   - Penalty calculation for violations
   - Route feasibility checking
   - Time window merging

See `classical_optimization/README.md` for detailed usage examples.

## Phase 2: ML-Augmented Approaches ✅

### Components

1. **Graph Neural Networks** (`ml_augmented/gnn_route_planner.py`)
   - GCN and GAT architectures for route planning
   - Node embedding learning
   - Route generation using learned embeddings

2. **Learned Heuristics** (`ml_augmented/learned_heuristics.py`)
   - Hybrid heuristics combining classical and learned components
   - Nearest neighbor and time window heuristics
   - GNN-enhanced route selection

3. **RL-based Routing** (`ml_augmented/rl_routing.py`)
   - MADDPG and PPO for routing optimization
   - Routing environment for RL training
   - Reward functions for route optimization

See `ml_augmented/README.md` for detailed usage examples.

## Phase 3: Predictive Models ✅

### Components

1. **Gradient-Boosted Models** (`predictive_models/travel_time_prediction.py`)
   - XGBoost, LightGBM, CatBoost for travel time prediction
   - Feature extraction and importance analysis
   - Uncertainty estimation

2. **LSTM ETA Models** (`predictive_models/lstm_eta.py`)
   - LSTM architecture for sequence-based ETA prediction
   - Time-series modeling for arrival times

3. **Transformer Routing** (`predictive_models/transformer_routing.py`)
   - Small transformer models for routing predictions
   - Multi-head attention mechanisms
   - Edge deployment ready

See `predictive_models/README.md` for detailed usage examples.

## Phase 4: Deployment Infrastructure ✅

### Components

1. **RL Simulator Environment** (`deployment_infrastructure/rl_simulator.py`)
   - Comprehensive simulator for training RL routing agents
   - Realistic routing environment with constraints
   - State representation and reward functions

2. **Traffic Pattern Simulation** (`deployment_infrastructure/traffic_simulation.py`)
   - Realistic traffic pattern simulation
   - Time-of-day and day-of-week patterns
   - Custom patterns and historical data integration

3. **Edge ETA Deployment** (`deployment_infrastructure/edge_deployment.py`)
   - Lightweight model deployment for edge computing
   - Model quantization and optimization
   - Prediction caching and batch support

4. **Metrics Tracking** (`deployment_infrastructure/metrics_tracker.py`)
   - Route efficiency metrics
   - On-time delivery tracking
   - Dashboard data generation

See `deployment_infrastructure/README.md` for detailed usage examples.

## File Structure

```
routing_logistics/
├── __init__.py
├── README.md
├── classical_optimization/
│   ├── __init__.py
│   ├── README.md
│   ├── cvrptw_solver.py
│   ├── gurobi_routing.py
│   └── time_windows.py
├── ml_augmented/
│   ├── __init__.py
│   ├── README.md
│   ├── gnn_route_planner.py
│   ├── learned_heuristics.py
│   └── rl_routing.py
├── predictive_models/
│   ├── __init__.py
│   ├── README.md
│   ├── travel_time_prediction.py
│   ├── lstm_eta.py
│   └── transformer_routing.py
└── deployment_infrastructure/
    ├── __init__.py
    ├── README.md
    ├── rl_simulator.py
    ├── traffic_simulation.py
    ├── edge_deployment.py
    └── metrics_tracker.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all routing tests
pytest tests/routing_logistics/ -v

# Run specific phase tests
pytest tests/routing_logistics/phase1/ -v
pytest tests/routing_logistics/phase2/ -v
pytest tests/routing_logistics/phase3/ -v
pytest tests/routing_logistics/phase4/ -v
```

## Dependencies

- ortools.constraint_solver (required for CVRPTW)
- gurobipy (optional, for Gurobi routing)
- torch (required for ML-augmented and predictive models)
- torch_geometric (optional, for GNN components)
- xgboost, lightgbm, or catboost (for gradient-boosted models)
- numpy
- pandas

