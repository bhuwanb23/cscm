"""
RL-based Routing with MADDPG/PPO

This module implements reinforcement learning for routing optimization.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging
from collections import deque
import random

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    import torch.nn.functional as F
    from torch.distributions import Categorical, Normal
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None
    Categorical = None
    Normal = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RoutingEnvironment:
    """
    Environment for routing RL training.
    """
    
    def __init__(
        self,
        locations: List[Dict[str, Any]],
        distance_matrix: Optional[np.ndarray] = None,
        time_matrix: Optional[np.ndarray] = None
    ):
        """
        Initialize routing environment.
        
        Args:
            locations: List of location dictionaries
            distance_matrix: Distance matrix (optional)
            time_matrix: Time matrix (optional)
        """
        self.locations = locations
        self.num_locations = len(locations)
        self.distance_matrix = distance_matrix
        self.time_matrix = time_matrix
        
        self.reset()
    
    def reset(self) -> np.ndarray:
        """
        Reset environment.
        
        Returns:
            Initial state
        """
        self.current_route = [0]  # Start at depot
        self.visited = set([0])
        self.current_node = 0
        self.current_time = 0.0
        
        return self.get_state()
    
    def get_state(self) -> np.ndarray:
        """
        Get current state representation.
        
        Returns:
            State vector
        """
        # State: [current_node, current_time, visited_mask, remaining_demand]
        state = np.zeros(self.num_locations * 2 + 2)
        
        state[0] = self.current_node
        state[1] = self.current_time
        
        # Visited mask
        for i in range(self.num_locations):
            state[2 + i] = 1.0 if i in self.visited else 0.0
        
        # Remaining demand
        for i in range(self.num_locations):
            if i not in self.visited:
                state[2 + self.num_locations + i] = self.locations[i].get('demand', 0.0)
        
        return state
    
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, Dict[str, Any]]:
        """
        Execute action.
        
        Args:
            action: Next node to visit
        
        Returns:
            Tuple of (next_state, reward, done, info)
        """
        if action in self.visited or action < 0 or action >= self.num_locations:
            # Invalid action
            reward = -100.0
            done = True
            info = {'invalid_action': True}
            return self.get_state(), reward, done, info
        
        # Calculate travel time/distance
        if self.time_matrix is not None:
            travel_time = self.time_matrix[self.current_node][action]
        elif self.distance_matrix is not None:
            travel_time = self.distance_matrix[self.current_node][action] / 50.0
        else:
            prev_loc = self.locations[self.current_node]
            next_loc = self.locations[action]
            dist = np.sqrt((prev_loc['x'] - next_loc['x'])**2 + (prev_loc['y'] - next_loc['y'])**2)
            travel_time = dist / 50.0
        
        # Update state
        self.current_node = action
        self.current_route.append(action)
        self.visited.add(action)
        self.current_time += travel_time
        
        # Add service time
        service_time = self.locations[action].get('service_time', 0.0)
        self.current_time += service_time
        
        # Calculate reward
        reward = self._calculate_reward(action, travel_time)
        
        # Check if done
        done = len(self.visited) == self.num_locations
        
        info = {
            'route': self.current_route.copy(),
            'time': self.current_time,
            'distance': self._calculate_route_distance()
        }
        
        return self.get_state(), reward, done, info
    
    def _calculate_reward(self, action: int, travel_time: float) -> float:
        """Calculate reward for action."""
        # Base reward: negative distance/time
        reward = -travel_time
        
        # Penalty for time window violations
        location = self.locations[action]
        time_window_start = location.get('time_window_start', 0.0)
        time_window_end = location.get('time_window_end', float('inf'))
        
        if self.current_time < time_window_start:
            # Too early
            reward -= (time_window_start - self.current_time) * 0.1
        elif self.current_time > time_window_end:
            # Too late - large penalty
            reward -= (self.current_time - time_window_end) * 10.0
        
        # Bonus for completing route
        if len(self.visited) == self.num_locations:
            reward += 100.0
        
        return reward
    
    def _calculate_route_distance(self) -> float:
        """Calculate total route distance."""
        if self.distance_matrix is not None:
            total = 0.0
            for i in range(len(self.current_route) - 1):
                total += self.distance_matrix[self.current_route[i]][self.current_route[i+1]]
            return total
        else:
            total = 0.0
            for i in range(len(self.current_route) - 1):
                prev_loc = self.locations[self.current_route[i]]
                next_loc = self.locations[self.current_route[i+1]]
                dist = np.sqrt((prev_loc['x'] - next_loc['x'])**2 + (prev_loc['y'] - next_loc['y'])**2)
                total += dist
            return total


class Actor(nn.Module):
    """Actor network for MADDPG/PPO."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [128, 128]):
        """Initialize actor network."""
        super(Actor, self).__init__()
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        layers.append(nn.Softmax(dim=-1))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        return self.network(state)


class Critic(nn.Module):
    """Critic network for MADDPG/PPO."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [128, 128]):
        """Initialize critic network."""
        super(Critic, self).__init__()
        
        layers = []
        input_dim = state_dim + action_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, 1))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor, action: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        x = torch.cat([state, action], dim=1)
        return self.network(x)


class MADDPGRoutingAgent:
    """
    Multi-Agent Deep Deterministic Policy Gradient for routing.
    
    Simplified version for single-agent routing.
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        device: Optional[str] = None
    ):
        """
        Initialize MADDPG routing agent.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            learning_rate: Learning rate
            gamma: Discount factor
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for MADDPG")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Networks (simplified for single agent)
        self.actor = Actor(state_dim, action_dim).to(self.device)
        self.critic = Critic(state_dim, action_dim).to(self.device)
        
        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=learning_rate)
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=learning_rate)
        
        self.replay_buffer = deque(maxlen=10000)
    
    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        """
        Select action.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Action (node index)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action_probs = self.actor(state_tensor)
        
        if training:
            dist = Categorical(action_probs)
            action = dist.sample().item()
        else:
            action = torch.argmax(action_probs).item()
        
        return action
    
    def train_step(self, batch_size: int = 32):
        """Perform training step."""
        if len(self.replay_buffer) < batch_size:
            return None
        
        batch = random.sample(self.replay_buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        
        states = torch.FloatTensor(np.array(states)).to(self.device)
        actions = torch.LongTensor(actions).to(self.device)
        rewards = torch.FloatTensor(rewards).to(self.device)
        next_states = torch.FloatTensor(np.array(next_states)).to(self.device)
        dones = torch.FloatTensor(dones).to(self.device)
        
        # Update critic
        with torch.no_grad():
            next_action_probs = self.actor(next_states)
            next_actions = torch.argmax(next_action_probs, dim=1)
            next_q = self.critic(next_states, next_action_probs)
            target_q = rewards + (1 - dones) * self.gamma * next_q.squeeze()
        
        current_q = self.critic(states, self.actor(states))
        critic_loss = F.mse_loss(current_q.squeeze(), target_q)
        
        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()
        
        # Update actor
        actor_loss = -self.critic(states, self.actor(states)).mean()
        
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()
        
        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item()
        }


class PPORoutingAgent:
    """
    Proximal Policy Optimization for routing.
    """
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        learning_rate: float = 3e-4,
        gamma: float = 0.99,
        clip_epsilon: float = 0.2,
        device: Optional[str] = None
    ):
        """
        Initialize PPO routing agent.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            learning_rate: Learning rate
            gamma: Discount factor
            clip_epsilon: PPO clip epsilon
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for PPO")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.clip_epsilon = clip_epsilon
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Actor-Critic network
        self.actor = Actor(state_dim, action_dim).to(self.device)
        self.critic = Critic(state_dim, action_dim).to(self.device)
        
        self.optimizer = optim.Adam(
            list(self.actor.parameters()) + list(self.critic.parameters()),
            lr=learning_rate
        )
        
        self.rollout_buffer = []
    
    def select_action(self, state: np.ndarray, training: bool = True) -> Tuple[int, float, float]:
        """
        Select action.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Tuple of (action, log_prob, value)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action_probs = self.actor(state_tensor)
            value = self.critic(state_tensor, action_probs)
        
        if training:
            dist = Categorical(action_probs)
            action = dist.sample()
            log_prob = dist.log_prob(action)
            return action.item(), log_prob.item(), value.item()
        else:
            action = torch.argmax(action_probs)
            return action.item(), 0.0, value.item()
    
    def train_step(self):
        """Perform PPO training step."""
        if len(self.rollout_buffer) < 32:
            return None
        
        # Extract data
        states = np.array([t['state'] for t in self.rollout_buffer])
        actions = np.array([t['action'] for t in self.rollout_buffer])
        rewards = np.array([t['reward'] for t in self.rollout_buffer])
        old_log_probs = np.array([t['log_prob'] for t in self.rollout_buffer])
        values = np.array([t['value'] for t in self.rollout_buffer])
        
        # Calculate returns
        returns = []
        G = 0
        for reward in reversed(rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)
        
        returns = np.array(returns)
        advantages = returns - values
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.LongTensor(actions).to(self.device)
        old_log_probs = torch.FloatTensor(old_log_probs).to(self.device)
        returns = torch.FloatTensor(returns).to(self.device)
        advantages = torch.FloatTensor(advantages).to(self.device)
        
        # PPO update
        action_probs = self.actor(states)
        dist = Categorical(action_probs)
        log_probs = dist.log_prob(actions)
        
        ratio = torch.exp(log_probs - old_log_probs)
        surr1 = ratio * advantages
        surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * advantages
        actor_loss = -torch.min(surr1, surr2).mean()
        
        values_pred = self.critic(states, action_probs)
        critic_loss = F.mse_loss(values_pred.squeeze(), returns)
        
        total_loss = actor_loss + 0.5 * critic_loss
        
        self.optimizer.zero_grad()
        total_loss.backward()
        self.optimizer.step()
        
        # Clear buffer
        self.rollout_buffer = []
        
        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'total_loss': total_loss.item()
        }

