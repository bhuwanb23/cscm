# Multi-Agent Framework

## Overview

This module implements multi-agent reinforcement learning algorithms for cooperative tasks in supply chain coordination.

## Phase 1: Multi-Agent Framework ✅

### Components

1. **MADDPG** (`maddpg.py`)
   - Multi-Agent Deep Deterministic Policy Gradient
   - Actor-Critic architecture for each agent
   - Centralized training with decentralized execution
   - Soft target network updates
   - Experience replay buffer

2. **MAPPO** (`mappo.py`)
   - Multi-Agent Proximal Policy Optimization
   - Actor-Critic network per agent
   - Generalized Advantage Estimation (GAE)
   - Policy clipping for stable updates
   - Support for continuous and discrete action spaces

3. **QMIX** (`qmix.py`)
   - Q-value Mixing for multi-agent coordination
   - Individual Q-networks per agent
   - Mixing network for value decomposition
   - Hypernetworks for mixing weights
   - Epsilon-greedy exploration

4. **Hierarchical RL** (`hierarchical_rl.py`)
   - High-level planners for goal setting
   - Low-level policies for action execution
   - Goal-based hierarchical structure
   - Configurable planning horizon

## Usage Examples

### MADDPG

```python
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

# Training loop
for episode in range(1000):
    states = [env.reset() for _ in range(3)]
    
    for step in range(100):
        # Select actions
        actions = [agent.select_action(state) for agent, state in zip(agents, states)]
        
        # Execute actions
        next_states, rewards, dones, info = env.step(actions)
        
        # Store experience
        experience = {
            'states': states,
            'actions': actions,
            'rewards': rewards,
            'next_states': next_states,
            'dones': dones
        }
        
        for agent in agents:
            agent.replay_buffer.append(experience)
        
        # Train agents
        if len(agents[0].replay_buffer) >= 32:
            for agent in agents:
                agent.train_step([experience])
        
        states = next_states
```

### MAPPO

```python
from models.multi_agent_coordination.multi_agent_framework import MAPPOAgent

# Create agents
agents = []
for agent_id in range(3):
    agent = MAPPOAgent(
        agent_id=agent_id,
        num_agents=3,
        state_dim=10,
        action_dim=5
    )
    agents.append(agent)

# Training loop
for episode in range(1000):
    states = [env.reset() for _ in range(3)]
    episode_states = []
    episode_actions = []
    episode_log_probs = []
    episode_rewards = []
    episode_values = []
    
    for step in range(100):
        actions = []
        log_probs = []
        values = []
        
        for agent, state in zip(agents, states):
            action, log_prob, value = agent.select_action(state, training=True)
            actions.append(action)
            log_probs.append(log_prob)
            values.append(value)
        
        next_states, rewards, dones, info = env.step(actions)
        
        episode_states.append(states)
        episode_actions.append(actions)
        episode_log_probs.append(log_probs)
        episode_rewards.append(rewards)
        episode_values.append(values)
        
        states = next_states
    
    # Train agents
    for agent_id, agent in enumerate(agents):
        states_arr = np.array([s[agent_id] for s in episode_states])
        actions_arr = np.array([a[agent_id] for a in episode_actions])
        log_probs_arr = np.array([lp[agent_id] for lp in episode_log_probs])
        rewards_arr = np.array([r[agent_id] for r in episode_rewards])
        values_arr = np.array([v[agent_id] for v in episode_values])
        dones_arr = np.array([False] * len(episode_states))
        
        agent.train_step(states_arr, actions_arr, log_probs_arr, rewards_arr, values_arr, dones_arr)
```

### QMIX

```python
from models.multi_agent_coordination.multi_agent_framework import QMIXCoordinator

# Create coordinator
coordinator = QMIXCoordinator(
    num_agents=3,
    state_dim=10,
    action_dim=5,
    global_state_dim=20
)

# Training loop
for episode in range(1000):
    states = [env.reset() for _ in range(3)]
    global_state = env.get_global_state()
    
    for step in range(100):
        # Select actions
        actions = coordinator.select_actions(states, training=True)
        
        # Execute actions
        next_states, reward, done, info = env.step(actions)
        next_global_state = env.get_global_state()
        
        # Store experience
        experience = {
            'states': states,
            'actions': actions,
            'reward': reward,
            'next_states': next_states,
            'global_state': global_state,
            'next_global_state': next_global_state,
            'done': done
        }
        
        coordinator.replay_buffer.append(experience)
        
        # Train
        if len(coordinator.replay_buffer) >= 32:
            coordinator.train_step(batch_size=32)
        
        states = next_states
        global_state = next_global_state
```

### Hierarchical RL

```python
from models.multi_agent_coordination.multi_agent_framework import HierarchicalRLPlanner

# Create planner
planner = HierarchicalRLPlanner(
    agent_id=0,
    state_dim=10,
    goal_dim=5,
    action_dim=3,
    high_level_horizon=10
)

# Training loop
state = env.reset()
goal = planner.select_goal(state)

for step in range(100):
    # Select action
    action = planner.select_action(state, goal=goal)
    
    # Execute action
    next_state, reward, done, info = env.step(action)
    
    # Update goal if horizon reached
    if planner.goal_step >= planner.high_level_horizon:
        goal = planner.select_goal(next_state)
    
    state = next_state
```

## Dependencies

- torch (required)
- numpy
- collections (deque)

## Notes

- All algorithms support save/load for deployment
- MADDPG uses centralized critics for training
- MAPPO uses GAE for advantage estimation
- QMIX uses hypernetworks for value mixing
- Hierarchical RL separates planning and execution

