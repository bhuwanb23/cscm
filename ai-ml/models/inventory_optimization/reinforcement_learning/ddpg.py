"""
Deep Deterministic Policy Gradient (DDPG) for Inventory Control

This module implements DDPG for continuous action space inventory optimization.
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
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None

from .digital_twin.inventory_simulator import InventorySimulator, InventoryState

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Actor(nn.Module):
    """Actor network for DDPG."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [256, 256],
                 max_action: float = 200.0):
        """
        Initialize actor network.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space (1 for order quantity)
            hidden_dims: List of hidden layer dimensions
            max_action: Maximum action value
        """
        super(Actor, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for DDPG")
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        layers.append(nn.Tanh())
        
        self.network = nn.Sequential(*layers)
        self.max_action = max_action
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            state: State tensor
        
        Returns:
            Action tensor (scaled to max_action)
        """
        return self.max_action * self.network(state)


class Critic(nn.Module):
    """Critic network for DDPG."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [256, 256]):
        """
        Initialize critic network.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            hidden_dims: List of hidden layer dimensions
        """
        super(Critic, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for DDPG")
        
        # Q1 network
        q1_layers = []
        input_dim = state_dim + action_dim
        
        for hidden_dim in hidden_dims:
            q1_layers.append(nn.Linear(input_dim, hidden_dim))
            q1_layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        q1_layers.append(nn.Linear(input_dim, 1))
        self.q1 = nn.Sequential(*q1_layers)
        
        # Q2 network
        q2_layers = []
        input_dim = state_dim + action_dim
        
        for hidden_dim in hidden_dims:
            q2_layers.append(nn.Linear(input_dim, hidden_dim))
            q2_layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        q2_layers.append(nn.Linear(input_dim, 1))
        self.q2 = nn.Sequential(*q2_layers)
    
    def forward(self, state: torch.Tensor, action: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        
        Args:
            state: State tensor
            action: Action tensor
        
        Returns:
            Tuple of (Q1 value, Q2 value)
        """
        sa = torch.cat([state, action], dim=1)
        q1 = self.q1(sa)
        q2 = self.q2(sa)
        return q1, q2
    
    def q1_forward(self, state: torch.Tensor, action: torch.Tensor) -> torch.Tensor:
        """Forward pass for Q1 only."""
        sa = torch.cat([state, action], dim=1)
        return self.q1(sa)


class ReplayBuffer:
    """Experience replay buffer for DDPG."""
    
    def __init__(self, capacity: int = 100000):
        """Initialize replay buffer."""
        self.buffer = deque(maxlen=capacity)
    
    def push(self, state: np.ndarray, action: float, reward: float,
             next_state: np.ndarray, done: bool):
        """Add experience to buffer."""
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size: int) -> Tuple:
        """Sample batch of experiences."""
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        
        return (
            np.array(states),
            np.array(actions),
            np.array(rewards),
            np.array(next_states),
            np.array(dones)
        )
    
    def __len__(self) -> int:
        """Get buffer size."""
        return len(self.buffer)


class DDPGInventoryAgent:
    """
    Deep Deterministic Policy Gradient agent for inventory control.
    
    Uses continuous action space (order quantity can be any value in [0, max_order]).
    """
    
    def __init__(
        self,
        state_dim: int = 11,
        action_dim: int = 1,
        max_action: float = 200.0,
        hidden_dims: List[int] = [256, 256],
        actor_lr: float = 0.001,
        critic_lr: float = 0.001,
        gamma: float = 0.99,
        tau: float = 0.005,  # Soft update coefficient
        noise_std: float = 0.1,
        noise_decay: float = 0.9995,
        batch_size: int = 64,
        buffer_size: int = 100000,
        device: Optional[str] = None
    ):
        """
        Initialize DDPG agent.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            max_action: Maximum action value
            hidden_dims: Hidden layer dimensions
            actor_lr: Actor learning rate
            critic_lr: Critic learning rate
            gamma: Discount factor
            tau: Soft update coefficient
            noise_std: Initial noise standard deviation
            noise_decay: Noise decay rate
            batch_size: Batch size for training
            buffer_size: Replay buffer size
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for DDPG")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.max_action = max_action
        self.gamma = gamma
        self.tau = tau
        self.noise_std = noise_std
        self.noise_decay = noise_decay
        self.batch_size = batch_size
        
        # Device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Actor networks
        self.actor = Actor(state_dim, action_dim, hidden_dims, max_action).to(self.device)
        self.actor_target = Actor(state_dim, action_dim, hidden_dims, max_action).to(self.device)
        self.actor_target.load_state_dict(self.actor.state_dict())
        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=actor_lr)
        
        # Critic networks
        self.critic = Critic(state_dim, action_dim, hidden_dims).to(self.device)
        self.critic_target = Critic(state_dim, action_dim, hidden_dims).to(self.device)
        self.critic_target.load_state_dict(self.critic.state_dict())
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=critic_lr)
        
        # Replay buffer
        self.replay_buffer = ReplayBuffer(buffer_size)
        
        # Training statistics
        self.training_step = 0
        self.actor_loss_history: List[float] = []
        self.critic_loss_history: List[float] = []
    
    def state_to_tensor(self, state: InventoryState) -> np.ndarray:
        """Convert InventoryState to feature vector."""
        return np.array([
            state.current_inventory / state.max_capacity,
            state.days_since_order / 100.0,
            state.pending_order / state.max_capacity,
            state.days_until_arrival / (state.lead_time + 1),
            state.demand_forecast / 100.0,
            state.demand_std / 50.0,
            state.holding_cost_rate,
            state.shortage_cost_rate / 10.0,
            state.ordering_cost / 100.0,
            state.lead_time / 30.0,
            (state.current_inventory - state.demand_forecast) / state.max_capacity
        ], dtype=np.float32)
    
    def select_action(self, state: InventoryState, training: bool = True) -> float:
        """
        Select action using actor network with noise.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Order quantity
        """
        state_tensor = torch.FloatTensor(self.state_to_tensor(state)).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action = self.actor(state_tensor).cpu().numpy()[0]
        
        if training:
            # Add noise for exploration
            noise = np.random.normal(0, self.noise_std, size=action.shape)
            action = action + noise
            action = np.clip(action, 0, self.max_action)
        
        return float(action[0])
    
    def update_noise(self):
        """Update noise standard deviation."""
        if self.noise_std > 0.01:
            self.noise_std *= self.noise_decay
    
    def train_step(self) -> Optional[Dict[str, float]]:
        """
        Perform one training step.
        
        Returns:
            Dictionary with loss values if training occurred, None otherwise
        """
        if len(self.replay_buffer) < self.batch_size:
            return None
        
        # Sample batch
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)
        
        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.FloatTensor(actions).unsqueeze(1).to(self.device)
        rewards = torch.FloatTensor(rewards).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).to(self.device)
        
        # Update Critic
        with torch.no_grad():
            next_actions = self.actor_target(next_states)
            next_q1, next_q2 = self.critic_target(next_states, next_actions)
            next_q = torch.min(next_q1, next_q2)
            target_q = rewards + (1 - dones) * self.gamma * next_q.squeeze()
        
        current_q1, current_q2 = self.critic(states, actions)
        critic_loss = F.mse_loss(current_q1.squeeze(), target_q) + F.mse_loss(current_q2.squeeze(), target_q)
        
        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()
        
        # Update Actor
        actor_actions = self.actor(states)
        actor_loss = -self.critic.q1_forward(states, actor_actions).mean()
        
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()
        
        # Soft update target networks
        for param, target_param in zip(self.critic.parameters(), self.critic_target.parameters()):
            target_param.data.copy_(self.tau * param.data + (1 - self.tau) * target_param.data)
        
        for param, target_param in zip(self.actor.parameters(), self.actor_target.parameters()):
            target_param.data.copy_(self.tau * param.data + (1 - self.tau) * target_param.data)
        
        self.training_step += 1
        
        actor_loss_value = actor_loss.item()
        critic_loss_value = critic_loss.item()
        
        self.actor_loss_history.append(actor_loss_value)
        self.critic_loss_history.append(critic_loss_value)
        
        return {
            'actor_loss': actor_loss_value,
            'critic_loss': critic_loss_value
        }
    
    def save(self, filepath: str):
        """Save model."""
        torch.save({
            'actor': self.actor.state_dict(),
            'actor_target': self.actor_target.state_dict(),
            'critic': self.critic.state_dict(),
            'critic_target': self.critic_target.state_dict(),
            'actor_optimizer': self.actor_optimizer.state_dict(),
            'critic_optimizer': self.critic_optimizer.state_dict(),
            'noise_std': self.noise_std,
            'training_step': self.training_step
        }, filepath)
    
    def load(self, filepath: str):
        """Load model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.actor.load_state_dict(checkpoint['actor'])
        self.actor_target.load_state_dict(checkpoint['actor_target'])
        self.critic.load_state_dict(checkpoint['critic'])
        self.critic_target.load_state_dict(checkpoint['critic_target'])
        self.actor_optimizer.load_state_dict(checkpoint['actor_optimizer'])
        self.critic_optimizer.load_state_dict(checkpoint['critic_optimizer'])
        self.noise_std = checkpoint['noise_std']
        self.training_step = checkpoint['training_step']

