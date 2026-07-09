"""
Proximal Policy Optimization (PPO) for Inventory Control

This module implements PPO for inventory optimization with continuous action space.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging
from collections import deque

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    import torch.nn.functional as F
    from torch.distributions import Normal
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None
    Normal = None

from .digital_twin.inventory_simulator import InventorySimulator, InventoryState

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ActorCritic(nn.Module):
    """Actor-Critic network for PPO."""
    
    def __init__(self, state_dim: int, action_dim: int = 1, hidden_dims: List[int] = [256, 256],
                 max_action: float = 200.0, log_std_min: float = -20.0, log_std_max: float = 2.0):
        """
        Initialize Actor-Critic network.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            hidden_dims: List of hidden layer dimensions
            max_action: Maximum action value
            log_std_min: Minimum log standard deviation
            log_std_max: Maximum log standard deviation
        """
        super(ActorCritic, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for PPO")
        
        # Shared layers
        shared_layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims[:-1]:
            shared_layers.append(nn.Linear(input_dim, hidden_dim))
            shared_layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        self.shared = nn.Sequential(*shared_layers)
        
        # Actor head
        self.actor_mean = nn.Linear(input_dim, action_dim)
        self.actor_log_std = nn.Parameter(torch.zeros(action_dim))
        
        # Critic head
        self.critic = nn.Linear(input_dim, 1)
        
        self.max_action = max_action
        self.log_std_min = log_std_min
        self.log_std_max = log_std_max
    
    def forward(self, state: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Forward pass.
        
        Args:
            state: State tensor
        
        Returns:
            Tuple of (action_mean, action_log_std, value)
        """
        shared = self.shared(state)
        
        mean = self.actor_mean(shared)
        log_std = torch.clamp(self.actor_log_std, self.log_std_min, self.log_std_max)
        value = self.critic(shared)
        
        return mean, log_std, value
    
    def act(self, state: torch.Tensor, deterministic: bool = False) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Sample action from policy.
        
        Args:
            state: State tensor
            deterministic: Whether to use deterministic policy
        
        Returns:
            Tuple of (action, log_prob, value)
        """
        mean, log_std, value = self.forward(state)
        std = torch.exp(log_std)
        
        if deterministic:
            action = torch.tanh(mean) * self.max_action
            log_prob = None
        else:
            dist = Normal(mean, std)
            action_raw = dist.sample()
            action = torch.tanh(action_raw) * self.max_action
            log_prob = dist.log_prob(action_raw) - torch.log(1 - action.pow(2) / (self.max_action ** 2) + 1e-6)
            log_prob = log_prob.sum(dim=-1, keepdim=True)
        
        return action, log_prob, value
    
    def evaluate(self, state: torch.Tensor, action: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Evaluate action under current policy.
        
        Args:
            state: State tensor
            action: Action tensor
        
        Returns:
            Tuple of (log_prob, value, entropy)
        """
        mean, log_std, value = self.forward(state)
        std = torch.exp(log_std)
        
        # Convert action back to raw space
        action_raw = torch.atanh(action / self.max_action)
        
        dist = Normal(mean, std)
        log_prob = dist.log_prob(action_raw) - torch.log(1 - action.pow(2) / (self.max_action ** 2) + 1e-6)
        log_prob = log_prob.sum(dim=-1, keepdim=True)
        
        entropy = dist.entropy().sum(dim=-1, keepdim=True)
        
        return log_prob, value, entropy


class PPOInventoryAgent:
    """
    Proximal Policy Optimization agent for inventory control.
    
    Uses continuous action space with stochastic policy.
    """
    
    def __init__(
        self,
        state_dim: int = 11,
        action_dim: int = 1,
        max_action: float = 200.0,
        hidden_dims: List[int] = [256, 256],
        learning_rate: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_epsilon: float = 0.2,
        value_coef: float = 0.5,
        entropy_coef: float = 0.01,
        max_grad_norm: float = 0.5,
        ppo_epochs: int = 10,
        batch_size: int = 64,
        device: Optional[str] = None
    ):
        """
        Initialize PPO agent.
        
        Args:
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            max_action: Maximum action value
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate
            gamma: Discount factor
            gae_lambda: GAE lambda parameter
            clip_epsilon: PPO clip epsilon
            value_coef: Value loss coefficient
            entropy_coef: Entropy coefficient
            max_grad_norm: Maximum gradient norm for clipping
            ppo_epochs: Number of PPO update epochs
            batch_size: Batch size for training
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for PPO")
        
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.max_action = max_action
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.max_grad_norm = max_grad_norm
        self.ppo_epochs = ppo_epochs
        self.batch_size = batch_size
        
        # Device
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Network
        self.actor_critic = ActorCritic(state_dim, action_dim, hidden_dims, max_action).to(self.device)
        self.optimizer = optim.Adam(self.actor_critic.parameters(), lr=learning_rate)
        
        # Rollout buffer
        self.rollout_buffer: List[Dict[str, Any]] = []
        
        # Training statistics
        self.training_step = 0
        self.policy_loss_history: List[float] = []
        self.value_loss_history: List[float] = []
        self.entropy_history: List[float] = []
    
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
    
    def select_action(self, state: InventoryState, training: bool = True) -> Tuple[float, float, float]:
        """
        Select action using policy network.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Tuple of (action, log_prob, value)
        """
        state_tensor = torch.FloatTensor(self.state_to_tensor(state)).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action, log_prob, value = self.actor_critic.act(state_tensor, deterministic=not training)
        
        return float(action[0, 0].item()), float(log_prob[0, 0].item() if log_prob is not None else 0.0), float(value[0, 0].item())
    
    def store_transition(self, state: InventoryState, action: float, reward: float,
                        next_state: InventoryState, done: bool, log_prob: float, value: float):
        """
        Store transition in rollout buffer.
        
        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether episode is done
            log_prob: Log probability of action
            value: Value estimate
        """
        self.rollout_buffer.append({
            'state': self.state_to_tensor(state),
            'action': action,
            'reward': reward,
            'next_state': self.state_to_tensor(next_state),
            'done': done,
            'log_prob': log_prob,
            'value': value
        })
    
    def compute_gae(self, rewards: np.ndarray, values: np.ndarray, dones: np.ndarray,
                   next_value: float = 0.0) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute Generalized Advantage Estimation.
        
        Args:
            rewards: Array of rewards
            values: Array of value estimates
            dones: Array of done flags
            next_value: Value of next state
        
        Returns:
            Tuple of (advantages, returns)
        """
        advantages = np.zeros_like(rewards)
        last_gae = 0
        
        for t in reversed(range(len(rewards))):
            if dones[t]:
                delta = rewards[t] - values[t]
                last_gae = delta
            else:
                delta = rewards[t] + self.gamma * (next_value if t == len(rewards) - 1 else values[t + 1]) - values[t]
                last_gae = delta + self.gamma * self.gae_lambda * last_gae
            
            advantages[t] = last_gae
        
        returns = advantages + values
        
        return advantages, returns
    
    def train_step(self) -> Optional[Dict[str, float]]:
        """
        Perform PPO training step.
        
        Returns:
            Dictionary with loss values if training occurred, None otherwise
        """
        if len(self.rollout_buffer) < self.batch_size:
            return None
        
        # Extract data from buffer
        states = np.array([t['state'] for t in self.rollout_buffer])
        actions = np.array([t['action'] for t in self.rollout_buffer])
        rewards = np.array([t['reward'] for t in self.rollout_buffer])
        next_states = np.array([t['next_state'] for t in self.rollout_buffer])
        dones = np.array([t['done'] for t in self.rollout_buffer])
        old_log_probs = np.array([t['log_prob'] for t in self.rollout_buffer])
        old_values = np.array([t['value'] for t in self.rollout_buffer])
        
        # Compute next value
        next_state_tensor = torch.FloatTensor(next_states[-1:]).to(self.device)
        with torch.no_grad():
            _, _, next_value = self.actor_critic.forward(next_state_tensor)
            next_value = next_value[0, 0].item()
        
        # Compute GAE
        advantages, returns = self.compute_gae(rewards, old_values, dones, next_value)
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.FloatTensor(actions).unsqueeze(1).to(self.device)
        old_log_probs = torch.FloatTensor(old_log_probs).unsqueeze(1).to(self.device)
        returns = torch.FloatTensor(returns).unsqueeze(1).to(self.device)
        advantages = torch.FloatTensor(advantages).unsqueeze(1).to(self.device)
        
        # PPO update
        total_policy_loss = 0
        total_value_loss = 0
        total_entropy = 0
        
        for epoch in range(self.ppo_epochs):
            # Shuffle data
            indices = torch.randperm(len(states))
            
            for start in range(0, len(states), self.batch_size):
                end = start + self.batch_size
                batch_indices = indices[start:end]
                
                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_returns = returns[batch_indices]
                batch_advantages = advantages[batch_indices]
                
                # Evaluate actions
                log_probs, values, entropy = self.actor_critic.evaluate(batch_states, batch_actions)
                
                # Compute policy loss (PPO clip)
                ratio = torch.exp(log_probs - batch_old_log_probs)
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                policy_loss = -torch.min(surr1, surr2).mean()
                
                # Compute value loss
                value_loss = F.mse_loss(values, batch_returns)
                
                # Total loss
                loss = policy_loss + self.value_coef * value_loss - self.entropy_coef * entropy.mean()
                
                # Optimize
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.actor_critic.parameters(), self.max_grad_norm)
                self.optimizer.step()
                
                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()
                total_entropy += entropy.mean().item()
        
        # Clear buffer
        self.rollout_buffer = []
        
        self.training_step += 1
        
        avg_policy_loss = total_policy_loss / (self.ppo_epochs * (len(states) // self.batch_size + 1))
        avg_value_loss = total_value_loss / (self.ppo_epochs * (len(states) // self.batch_size + 1))
        avg_entropy = total_entropy / (self.ppo_epochs * (len(states) // self.batch_size + 1))
        
        self.policy_loss_history.append(avg_policy_loss)
        self.value_loss_history.append(avg_value_loss)
        self.entropy_history.append(avg_entropy)
        
        return {
            'policy_loss': avg_policy_loss,
            'value_loss': avg_value_loss,
            'entropy': avg_entropy
        }
    
    def clear_buffer(self):
        """Clear rollout buffer."""
        self.rollout_buffer = []
    
    def save(self, filepath: str):
        """Save model."""
        torch.save({
            'actor_critic': self.actor_critic.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'training_step': self.training_step
        }, filepath)
    
    def load(self, filepath: str):
        """Load model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.actor_critic.load_state_dict(checkpoint['actor_critic'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.training_step = checkpoint['training_step']

