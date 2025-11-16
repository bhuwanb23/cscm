# Training & Deployment for Multi-Agent Coordination

## Overview

This module provides training and deployment infrastructure for multi-agent coordination systems.

## Phase 3: Training & Deployment ✅

### Components

1. **CTDE Trainer** (`ctde_trainer.py`)
   - Centralized Training with Decentralized Execution
   - Support for MADDPG, MAPPO, and QMIX
   - Centralized experience buffer
   - Decentralized action execution
   - Training statistics tracking

2. **Digital Twin Simulator** (`digital_twin_simulator.py`)
   - Multi-agent interaction simulation
   - Configurable interaction types (cooperative, competitive, mixed)
   - Global state computation
   - Interaction matrix modeling
   - Interaction history tracking

3. **Edge Policy Deployment** (`edge_policy_deployment.py`)
   - Lightweight policy networks for edge nodes
   - Model quantization and pruning support
   - Batch prediction
   - Model size optimization
   - Edge deployment ready

4. **Coordination Metrics** (`coordination_metrics.py`)
   - Coordination efficiency tracking
   - Communication efficiency metrics
   - Agent performance tracking
   - Episode statistics
   - Dashboard data generation

## Usage Examples

### CTDE Training

```python
from models.multi_agent_coordination.training_deployment import CTDETrainer
from models.multi_agent_coordination.multi_agent_framework import MADDPGAgent

# Create agents
agents = []
for agent_id in range(3):
    agent = MADDPGAgent(
        agent_id=agent_id,
        num_agents=3,
        state_dim=10,
        action_dim=5
    )
    agents.append(agent)

# Create CTDE trainer
trainer = CTDETrainer(agents, training_mode='maddpg')

# Training loop
for episode in range(1000):
    stats = trainer.train_episode(env, max_steps=1000)
    print(f"Episode {stats['episode']}, Avg Reward: {stats['avg_reward']:.2f}")
```

### Digital Twin Simulation

```python
from models.multi_agent_coordination.training_deployment import (
    MultiAgentDigitalTwin,
    InteractionType
)

# Create digital twin
simulator = MultiAgentDigitalTwin(
    num_agents=3,
    state_dim=10,
    action_dim=5,
    interaction_type=InteractionType.COOPERATIVE
)

# Reset
states = simulator.reset()

# Simulation loop
for step in range(100):
    # Get actions from agents
    actions = [agent.select_action(state) for agent, state in zip(agents, states)]
    
    # Step simulator
    next_states, rewards, dones, info = simulator.step(actions)
    
    states = next_states
```

### Edge Policy Deployment

```python
from models.multi_agent_coordination.training_deployment import EdgePolicyDeployment

# Create edge deployment
deployment = EdgePolicyDeployment(
    state_dim=10,
    action_dim=5,
    model_type='lightweight'
)

# Load policy
deployment.load_policy('path/to/policy.pth')

# Predict
state = np.random.randn(10)
action = deployment.predict(state, deterministic=True)

# Get model info
info = deployment.get_model_info()
print(f"Model size: {info['model_size_mb']:.2f} MB")
```

### Coordination Metrics

```python
from models.multi_agent_coordination.training_deployment import CoordinationMetricsTracker

# Create tracker
tracker = CoordinationMetricsTracker()

# Record episode
tracker.record_episode(
    episode_id=1,
    num_agents=3,
    episode_length=100,
    total_reward=50.0,
    individual_rewards=[15.0, 20.0, 15.0],
    coordination_score=0.8,
    communication_overhead=0.1,
    action_diversity=0.5
)

# Calculate metrics
efficiency = tracker.calculate_coordination_efficiency()
communication = tracker.calculate_communication_efficiency()
summary = tracker.get_summary_statistics()

# Export
tracker.export_metrics('metrics.csv', format='csv')
```

## Dependencies

- torch (required for CTDE and edge deployment)
- numpy
- pandas
- collections (deque)

## Notes

- CTDE enables centralized training while maintaining decentralized execution
- Digital twin provides safe simulation environment
- Edge deployment supports lightweight models for real-time inference
- Metrics tracking provides comprehensive performance monitoring
- All components are tested and production-ready

