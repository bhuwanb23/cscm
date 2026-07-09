# Multi-Agent Coordination & Policy Learning Module

## Overview

This module provides multi-agent coordination capabilities for the Cognitive Supply Chain Mesh (CSCM) AI/ML system, enabling cooperative decision-making across multiple agents.

## Phase 1: Multi-Agent Framework ✅

### Components

1. **MADDPG** (`multi_agent_framework/maddpg.py`)
   - Multi-Agent Deep Deterministic Policy Gradient
   - Centralized training with decentralized execution
   - Actor-Critic architecture

2. **MAPPO** (`multi_agent_framework/mappo.py`)
   - Multi-Agent Proximal Policy Optimization
   - GAE for advantage estimation
   - Policy clipping

3. **QMIX** (`multi_agent_framework/qmix.py`)
   - Q-value Mixing for coordination
   - Hypernetworks for value decomposition

4. **Hierarchical RL** (`multi_agent_framework/hierarchical_rl.py`)
   - High-level planners
   - Low-level policies
   - Goal-based hierarchy

See `multi_agent_framework/README.md` for detailed usage examples.

## Phase 2: Communication Protocols ✅

### Components

1. **GNN Communication** (`communication_protocols/gnn_communication.py`)
   - Learned communication with GNNs
   - Graph-based message generation

2. **Message Passing** (`communication_protocols/message_passing.py`)
   - Point-to-point and broadcast messaging
   - Message queues and aggregation

3. **State Exchange** (`communication_protocols/state_exchange.py`)
   - Compressed state summary exchange
   - Neural network-based compression

See `communication_protocols/README.md` for detailed usage examples.

## File Structure

```
multi_agent_coordination/
├── __init__.py
├── README.md
├── multi_agent_framework/
│   ├── __init__.py
│   ├── README.md
│   ├── maddpg.py
│   ├── mappo.py
│   ├── qmix.py
│   └── hierarchical_rl.py
├── communication_protocols/
│   ├── __init__.py
│   ├── README.md
│   ├── gnn_communication.py
│   ├── message_passing.py
│   └── state_exchange.py
└── training_deployment/
    ├── __init__.py
    ├── README.md
    ├── ctde_trainer.py
    ├── digital_twin_simulator.py
    ├── edge_policy_deployment.py
    └── coordination_metrics.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all multi-agent tests
pytest tests/multi_agent_coordination/ -v

# Run specific phase tests
pytest tests/multi_agent_coordination/phase1/ -v
pytest tests/multi_agent_coordination/phase2/ -v
pytest tests/multi_agent_coordination/phase3/ -v
```

## Dependencies

- torch (required)
- torch_geometric (required for GNN communication)
- numpy
- collections (deque)

## Phase 3: Training & Deployment ✅

### Components

1. **CTDE Trainer** (`training_deployment/ctde_trainer.py`)
   - Centralized Training with Decentralized Execution
   - Support for multiple training modes
   - Centralized experience buffer

2. **Digital Twin Simulator** (`training_deployment/digital_twin_simulator.py`)
   - Multi-agent interaction simulation
   - Configurable interaction types
   - Global state computation

3. **Edge Policy Deployment** (`training_deployment/edge_policy_deployment.py`)
   - Lightweight policy networks
   - Model optimization for edge
   - Batch prediction support

4. **Coordination Metrics** (`training_deployment/coordination_metrics.py`)
   - Coordination efficiency tracking
   - Communication efficiency metrics
   - Agent performance tracking

See `training_deployment/README.md` for detailed usage examples.

