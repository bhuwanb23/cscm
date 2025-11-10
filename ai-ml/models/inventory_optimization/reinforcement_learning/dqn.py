"""
Deep Q-Learning (DQN) for Inventory Control

This module implements DQN for discrete action space inventory optimization.
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


class DQNNetwork(nn.Module):
    """Deep Q-Network for inventory control."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [128, 128]):
        """
        Initialize DQN network.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space (number of discrete actions)
            hidden_dims: List of hidden layer dimensions
        """
        super(DQNNetwork, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for DQN")
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            state: State tensor
        
        Returns:
            Q-values for all actions
        """
        return self.network(state)


class ReplayBuffer:
    """Experience replay buffer for DQN."""
    
    def __init__(self, capacity: int = 10000):
        """
        Initialize replay buffer.
        
        Args:
            capacity: Maximum buffer size
        """
        self.buffer = deque(maxlen=capacity)
    
    def push(self, state: np.ndarray, action: int, reward: float, 
             next_state: np.ndarray, done: bool):
        """
        Add experience to buffer.
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether episode is done
        """
        self.buffer.append((state, action, reward, next_state, done))
    
    def sample(self, batch_size: int) -> Tuple:
        """
        Sample batch of experiences.
        
        Args:
            batch_size: Batch size
        
        Returns:
            Tuple of (states, actions, rewards, next_states, dones)
        """
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


class DQNInventoryAgent:
    """
    Deep Q-Learning agent for inventory control.
    
    Uses discrete action space (e.g., order quantities: 0, 10, 20, 30, ...).
    """
    
    def __init__(
        self,
        state_dim: int = 11,  # Dimension of InventoryState
        action_dim: int = 21,  # Number of discrete actions (0 to 200 in steps of 10)
        action_space: Optional[np.ndarray] = None,
        hidden_dims: List[int] = [128, 128],
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        epsilon_start: float = 1.0,
        epsilon_end: float = 0.01,
        epsilon_decay: float = 0.995,
        batch_size: int = 64,
        buffer_size: int = 10000,
        target_update_freq: int = 100,
        device: Optional[str] = None
    ):
        """
        Initialize DQN agent.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Number of discrete actions
            action_space: Array of action values (if None, creates default)
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate
            gamma: Discount factor
            epsilon_start: Initial epsilon for epsilon-greedy
            epsilon_end: Final epsilon
            epsilon_decay: Epsilon decay rate
            batch_size: Batch size for training
            buffer_size: Replay buffer size
            target_update_freq: Frequency of target network updates
            device: Device to use ('cpu' or 'cuda')
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for DQN")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        
        if action_space is None:
            # Default: 0 to 200 in steps of 10
            self.action_space = np.arange(0, 201, 10)
        else:
            self.action_space = action_space
            self.action_dim = len(action_space)
        
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        
        # Device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Networks
        self.q_network = DQNNetwork(state_dim, self.action_dim, hidden_dims).to(self.device)
        self.target_network = DQNNetwork(state_dim, self.action_dim, hidden_dims).to(self.device)
        self.target_network.load_state_dict(self.q_network.state_dict())
        self.target_network.eval()
        
        # Optimizer
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=learning_rate)
        
        # Replay buffer
        self.replay_buffer = ReplayBuffer(buffer_size)
        
        # Training statistics
        self.training_step = 0
        self.loss_history: List[float] = []
    
    def state_to_tensor(self, state: InventoryState) -> np.ndarray:
        """
        Convert InventoryState to feature vector.
        
        Args:
            state: Inventory state
        
        Returns:
            Feature vector
        """
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
        Select action using epsilon-greedy policy.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Order quantity (action value)
        """
        if training and random.random() < self.epsilon:
            # Random action
            action_idx = random.randint(0, self.action_dim - 1)
        else:
            # Greedy action
            state_tensor = torch.FloatTensor(self.state_to_tensor(state)).unsqueeze(0).to(self.device)
            with torch.no_grad():
                q_values = self.q_network(state_tensor)
                action_idx = q_values.argmax().item()
        
        return self.action_space[action_idx]
    
    def update_epsilon(self):
        """Update epsilon for epsilon-greedy exploration."""
        if self.epsilon > self.epsilon_end:
            self.epsilon *= self.epsilon_decay
    
    def train_step(self) -> Optional[float]:
        """
        Perform one training step.
        
        Returns:
            Loss value if training occurred, None otherwise
        """
        if len(self.replay_buffer) < self.batch_size:
            return None
        
        # Sample batch
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)
        
        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.LongTensor(actions).to(self.device)
        rewards = torch.FloatTensor(rewards).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).to(self.device)
        
        # Current Q values
        q_values = self.q_network(states)
        q_value = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)
        
        # Next Q values from target network
        with torch.no_grad():
            next_q_values = self.target_network(next_states)
            next_q_value = next_q_values.max(1)[0]
            target_q_value = rewards + (1 - dones) * self.gamma * next_q_value
        
        # Compute loss
        loss = F.mse_loss(q_value, target_q_value)
        
        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        # Update target network
        self.training_step += 1
        if self.training_step % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())
        
        loss_value = loss.item()
        self.loss_history.append(loss_value)
        
        return loss_value
    
    def save(self, filepath: str):
        """Save model."""
        torch.save({
            'q_network': self.q_network.state_dict(),
            'target_network': self.target_network.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'training_step': self.training_step
        }, filepath)
    
    def load(self, filepath: str):
        """Load model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.q_network.load_state_dict(checkpoint['q_network'])
        self.target_network.load_state_dict(checkpoint['target_network'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.epsilon = checkpoint['epsilon']
        self.training_step = checkpoint['training_step']

