# Reinforcement Learning for Inventory Optimization

## Overview

This module implements reinforcement learning algorithms for inventory control and optimization. It provides three main RL algorithms (DQN, DDPG, PPO) along with a digital twin simulator for safe training.

## Phase 2: Reinforcement Learning Approach ✅

### Components

1. **Digital Twin Simulator** (`digital_twin/inventory_simulator.py`)
   - Realistic inventory simulation environment
   - Configurable demand models (Normal, Poisson, Empirical, Seasonal)
   - Cost calculation (holding, shortage, ordering)
   - Lead time and capacity constraints
   - Safe training environment for RL agents

2. **Deep Q-Learning (DQN)** (`dqn.py`)
   - Discrete action space inventory control
   - Experience replay buffer
   - Target network for stable training
   - Epsilon-greedy exploration

3. **Deep Deterministic Policy Gradient (DDPG)** (`ddpg.py`)
   - Continuous action space inventory control
   - Actor-Critic architecture
   - Twin Q-networks for stability
   - Soft target network updates

4. **Proximal Policy Optimization (PPO)** (`ppo.py`)
   - Continuous action space with stochastic policy
   - Actor-Critic architecture
   - Generalized Advantage Estimation (GAE)
   - Policy clipping for stable updates

## Usage Examples

### Digital Twin Simulator

```python
from models.inventory_optimization.reinforcement_learning import InventorySimulator
from models.inventory_optimization.reinforcement_learning.digital_twin.inventory_simulator import DemandModel

# Create simulator
simulator = InventorySimulator(
    initial_inventory=100.0,
    holding_cost=0.1,
    shortage_cost=5.0,
    ordering_cost=10.0,
    lead_time=7,
    max_capacity=500.0,
    demand_model=DemandModel.NORMAL,
    demand_mean=10.0,
    demand_std=3.0,
    random_seed=42
)

# Reset to initial state
state = simulator.reset()

# Run simulation
for step in range(100):
    order_quantity = 50.0  # Your decision
    next_state, reward, done, info = simulator.step(order_quantity)
    
    if done:
        break

# Get statistics
stats = simulator.get_statistics()
print(f"Total Cost: {stats['total_cost']}")
print(f"Fill Rate: {stats['fill_rate']:.2%}")
```

### Deep Q-Learning (DQN)

```python
from models.inventory_optimization.reinforcement_learning import DQNInventoryAgent, InventorySimulator

# Create simulator and agent
simulator = InventorySimulator(initial_inventory=100.0, random_seed=42)
agent = DQNInventoryAgent(
    state_dim=11,
    action_dim=21,  # 0 to 200 in steps of 10
    learning_rate=0.001,
    gamma=0.99,
    device='cpu'
)

# Training loop
state = simulator.reset()
for episode in range(1000):
    state = simulator.reset()
    total_reward = 0
    
    for step in range(100):
        # Select action
        action = agent.select_action(state, training=True)
        
        # Execute action
        next_state, reward, done, info = simulator.step(action)
        
        # Store experience
        state_vector = agent.state_to_tensor(state)
        next_state_vector = agent.state_to_tensor(next_state)
        action_idx = np.where(agent.action_space == action)[0][0]
        
        agent.replay_buffer.push(
            state_vector,
            action_idx,
            reward,
            next_state_vector,
            done
        )
        
        # Train
        if len(agent.replay_buffer) >= agent.batch_size:
            loss = agent.train_step()
        
        state = next_state
        total_reward += reward
        
        if done:
            break
    
    # Update epsilon
    agent.update_epsilon()
    
    if episode % 100 == 0:
        print(f"Episode {episode}, Total Reward: {total_reward:.2f}")
```

### Deep Deterministic Policy Gradient (DDPG)

```python
from models.inventory_optimization.reinforcement_learning import DDPGInventoryAgent, InventorySimulator

# Create simulator and agent
simulator = InventorySimulator(initial_inventory=100.0, random_seed=42)
agent = DDPGInventoryAgent(
    state_dim=11,
    action_dim=1,
    max_action=200.0,
    actor_lr=0.001,
    critic_lr=0.001,
    device='cpu'
)

# Training loop
state = simulator.reset()
for episode in range(1000):
    state = simulator.reset()
    total_reward = 0
    
    for step in range(100):
        # Select action (continuous)
        action = agent.select_action(state, training=True)
        
        # Execute action
        next_state, reward, done, info = simulator.step(action)
        
        # Store experience
        state_vector = agent.state_to_tensor(state)
        next_state_vector = agent.state_to_tensor(next_state)
        
        agent.replay_buffer.push(
            state_vector,
            action,
            reward,
            next_state_vector,
            done
        )
        
        # Train
        if len(agent.replay_buffer) >= agent.batch_size:
            result = agent.train_step()
        
        # Update noise
        agent.update_noise()
        
        state = next_state
        total_reward += reward
        
        if done:
            break
    
    if episode % 100 == 0:
        print(f"Episode {episode}, Total Reward: {total_reward:.2f}")
```

### Proximal Policy Optimization (PPO)

```python
from models.inventory_optimization.reinforcement_learning import PPOInventoryAgent, InventorySimulator

# Create simulator and agent
simulator = InventorySimulator(initial_inventory=100.0, random_seed=42)
agent = PPOInventoryAgent(
    state_dim=11,
    action_dim=1,
    max_action=200.0,
    learning_rate=3e-4,
    gamma=0.99,
    device='cpu'
)

# Training loop
for episode in range(1000):
    state = simulator.reset()
    total_reward = 0
    
    for step in range(100):
        # Select action
        action, log_prob, value = agent.select_action(state, training=True)
        
        # Execute action
        next_state, reward, done, info = simulator.step(action)
        
        # Store transition
        agent.store_transition(
            state=state,
            action=action,
            reward=reward,
            next_state=next_state,
            done=done,
            log_prob=log_prob,
            value=value
        )
        
        state = next_state
        total_reward += reward
        
        if done:
            break
    
    # Train after episode
    if len(agent.rollout_buffer) >= agent.batch_size:
        result = agent.train_step()
    
    # Clear buffer
    agent.clear_buffer()
    
    if episode % 100 == 0:
        print(f"Episode {episode}, Total Reward: {total_reward:.2f}")
```

## File Structure

```
reinforcement_learning/
├── __init__.py
├── README.md
├── dqn.py
├── ddpg.py
├── ppo.py
└── digital_twin/
    ├── __init__.py
    └── inventory_simulator.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all Phase 2 tests
pytest tests/inventory_optimization/phase2/ -v

# Run specific test file
pytest tests/inventory_optimization/phase2/test_digital_twin.py -v
pytest tests/inventory_optimization/phase2/test_dqn.py -v
pytest tests/inventory_optimization/phase2/test_ddpg.py -v
pytest tests/inventory_optimization/phase2/test_ppo.py -v
```

## Dependencies

- PyTorch (required for RL algorithms)
- numpy
- pandas
- scipy

## Notes

- All RL algorithms require PyTorch to be installed
- The digital twin simulator can be used independently without PyTorch
- Tests will skip RL algorithm tests if PyTorch is not available
- The simulator provides a safe environment for training RL agents without affecting real inventory

