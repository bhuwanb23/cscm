# ML-Augmented Approaches for Routing & Logistics

## Overview

This module implements ML-augmented routing algorithms using Graph Neural Networks, learned heuristics, and reinforcement learning.

## Phase 2: ML-Augmented Approaches ✅

### Components

1. **Graph Neural Networks for Route Planning** (`gnn_route_planner.py`)
   - GCN (Graph Convolutional Network) route planner
   - GAT (Graph Attention Network) route planner
   - Node embedding learning for routing decisions
   - Route generation using learned embeddings

2. **Learned Heuristics** (`learned_heuristics.py`)
   - Hybrid heuristics combining classical and learned components
   - Nearest neighbor heuristic
   - Time window priority heuristic
   - GNN-enhanced route selection

3. **RL-based Routing** (`rl_routing.py`)
   - MADDPG (Multi-Agent Deep Deterministic Policy Gradient) for routing
   - PPO (Proximal Policy Optimization) for routing
   - Routing environment for RL training
   - Reward functions for route optimization

## Usage Examples

### GNN Route Planner

```python
from models.routing_logistics.ml_augmented import GNRoutePlanner

# Create GNN planner
planner = GNRoutePlanner(model_type='gcn', hidden_dim=64)

# Define locations
locations = [
    {'x': 0.0, 'y': 0.0, 'demand': 0.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
    {'x': 10.0, 'y': 10.0, 'demand': 10.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
    {'x': 20.0, 'y': 20.0, 'demand': 15.0, 'time_window_start': 0.0, 'time_window_end': 100.0}
]

# Generate route
route = planner.generate_route(locations, start_node=0)
print(f"Route: {route}")
```

### Learned Heuristics

```python
from models.routing_logistics.ml_augmented import LearnedHeuristic

# Create learned heuristic
heuristic = LearnedHeuristic(heuristic_weight=0.5)

# Generate route using hybrid heuristic
route = heuristic.generate_route(
    locations,
    start_node=0,
    heuristic_type='hybrid'
)
```

### RL-based Routing

```python
from models.routing_logistics.ml_augmented import RoutingEnvironment, MADDPGRoutingAgent

# Create environment
locations = [
    {'x': 0.0, 'y': 0.0, 'demand': 0.0},
    {'x': 10.0, 'y': 10.0, 'demand': 10.0},
    {'x': 20.0, 'y': 20.0, 'demand': 15.0}
]

env = RoutingEnvironment(locations)

# Create agent
agent = MADDPGRoutingAgent(state_dim=10, action_dim=3)

# Training loop
state = env.reset()
for step in range(100):
    action = agent.select_action(state, training=True)
    next_state, reward, done, info = env.step(action)
    
    agent.replay_buffer.append((state, action, reward, next_state, done))
    
    if len(agent.replay_buffer) >= 32:
        agent.train_step(batch_size=32)
    
    if done:
        state = env.reset()
    else:
        state = next_state
```

## Dependencies

- torch (required)
- torch_geometric (required for GNN components)
- numpy
- pandas

## Notes

- GNN components require torch_geometric
- RL components require PyTorch
- Tests will skip if required libraries are not available
- Models can be saved and loaded for deployment

