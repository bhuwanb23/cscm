"""
MAPPO Algorithms

This module implements Multi-Agent Proximal Policy Optimization (MAPPO)
for cooperative multi-agent tasks.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging

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


class ActorCritic(nn.Module):
    """Actor-Critic network for MAPPO."""
    
    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [128, 128],
        continuous: bool = True
    ):
        """Initialize actor-critic network."""
        super(ActorCritic, self).__init__()
        
        self.continuous = continuous
        
        # Shared layers
        shared_layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims[:-1]:
            shared_layers.append(nn.Linear(input_dim, hidden_dim))
            shared_layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        self.shared = nn.Sequential(*shared_layers)
        
        # Actor head
        if continuous:
            self.actor_mean = nn.Linear(input_dim, action_dim)
            self.actor_std = nn.Linear(input_dim, action_dim)
        else:
            self.actor = nn.Linear(input_dim, action_dim)
        
        # Critic head
        self.critic = nn.Linear(input_dim, 1)
    
    def forward(
        self,
        state: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor, Optional[torch.Tensor]]:
        """
        Forward pass.
        
        Returns:
            Tuple of (action_distribution, value, entropy)
        """
        x = self.shared(state)
        
        # Value
        value = self.critic(x)
        
        # Action
        if self.continuous:
            mean = self.actor_mean(x)
            std = F.softplus(self.actor_std(x)) + 1e-5
            dist = Normal(mean, std)
            entropy = dist.entropy().mean()
        else:
            logits = self.actor(x)
            dist = Categorical(logits=logits)
            entropy = dist.entropy().mean()
        
        return dist, value, entropy


class MAPPOAgent:
    """
    Multi-Agent Proximal Policy Optimization agent.
    
    Implements MAPPO for cooperative multi-agent tasks.
    """
    
    def __init__(
        self,
        agent_id: int,
        num_agents: int,
        state_dim: int,
        action_dim: int,
        learning_rate: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_epsilon: float = 0.2,
        value_coef: float = 0.5,
        entropy_coef: float = 0.01,
        continuous: bool = True,
        device: Optional[str] = None
    ):
        """
        Initialize MAPPO agent.
        
        Args:
            agent_id: Unique identifier for this agent
            num_agents: Total number of agents
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            learning_rate: Learning rate
            gamma: Discount factor
            gae_lambda: GAE lambda parameter
            clip_epsilon: PPO clip epsilon
            value_coef: Value loss coefficient
            entropy_coef: Entropy coefficient
            continuous: Whether action space is continuous
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for MAPPO")
        
        self.agent_id = agent_id
        self.num_agents = num_agents
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.continuous = continuous
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Actor-Critic network
        self.ac_network = ActorCritic(
            state_dim, action_dim, continuous=continuous
        ).to(self.device)
        
        self.optimizer = optim.Adam(self.ac_network.parameters(), lr=learning_rate)
        
        # Rollout buffer
        self.rollout_buffer = []
    
    def select_action(
        self,
        state: np.ndarray,
        training: bool = True
    ) -> Tuple[np.ndarray, float, float]:
        """
        Select action using actor network.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Tuple of (action, log_prob, value)
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            dist, value, _ = self.ac_network(state_tensor)
            
            if training:
                action = dist.sample()
                log_prob = dist.log_prob(action).sum(dim=-1) if self.continuous else dist.log_prob(action)
            else:
                if self.continuous:
                    action = dist.mean
                    log_prob = torch.tensor(0.0)
                else:
                    action = dist.probs.argmax(dim=-1)
                    log_prob = dist.log_prob(action)
        
        action_np = action.cpu().numpy()[0] if self.continuous else action.item()
        log_prob_np = log_prob.item()
        value_np = value.item()
        
        return action_np, log_prob_np, value_np
    
    def compute_gae(
        self,
        rewards: np.ndarray,
        values: np.ndarray,
        next_values: np.ndarray,
        dones: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute Generalized Advantage Estimation.
        
        Args:
            rewards: Rewards array
            values: Value estimates
            next_values: Next value estimates
            dones: Done flags
        
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
                delta = rewards[t] + self.gamma * next_values[t] - values[t]
                last_gae = delta + self.gamma * self.gae_lambda * last_gae
            
            advantages[t] = last_gae
        
        returns = advantages + values
        
        return advantages, returns
    
    def train_step(
        self,
        states: np.ndarray,
        actions: np.ndarray,
        old_log_probs: np.ndarray,
        rewards: np.ndarray,
        values: np.ndarray,
        dones: np.ndarray
    ) -> Dict[str, float]:
        """
        Perform MAPPO training step.
        
        Args:
            states: States array
            actions: Actions array
            old_log_probs: Old log probabilities
            rewards: Rewards array
            values: Value estimates
            dones: Done flags
        
        Returns:
            Dictionary of losses
        """
        # Compute advantages
        next_values = np.append(values[1:], 0.0)
        advantages, returns = self.compute_gae(rewards, values, next_values, dones)
        
        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
        
        # Convert to tensors
        states_t = torch.FloatTensor(states).to(self.device)
        actions_t = torch.FloatTensor(actions).to(self.device) if self.continuous else torch.LongTensor(actions).to(self.device)
        old_log_probs_t = torch.FloatTensor(old_log_probs).to(self.device)
        returns_t = torch.FloatTensor(returns).to(self.device)
        advantages_t = torch.FloatTensor(advantages).to(self.device)
        
        # Forward pass
        dist, values_pred, entropy = self.ac_network(states_t)
        
        # Compute log probabilities
        if self.continuous:
            log_probs = dist.log_prob(actions_t).sum(dim=-1)
        else:
            log_probs = dist.log_prob(actions_t)
        
        # PPO loss
        ratio = torch.exp(log_probs - old_log_probs_t)
        surr1 = ratio * advantages_t
        surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * advantages_t
        actor_loss = -torch.min(surr1, surr2).mean()
        
        # Value loss
        critic_loss = F.mse_loss(values_pred.squeeze(), returns_t)
        
        # Entropy loss
        entropy_loss = -entropy.mean()
        
        # Total loss
        total_loss = actor_loss + self.value_coef * critic_loss + self.entropy_coef * entropy_loss
        
        # Update
        self.optimizer.zero_grad()
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.ac_network.parameters(), 0.5)
        self.optimizer.step()
        
        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'entropy_loss': entropy_loss.item(),
            'total_loss': total_loss.item()
        }
    
    def save(self, filepath: str):
        """Save agent."""
        torch.save({
            'ac_network_state_dict': self.ac_network.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'agent_id': self.agent_id,
            'num_agents': self.num_agents,
            'state_dim': self.state_dim,
            'action_dim': self.action_dim,
            'continuous': self.continuous
        }, filepath)
    
    def load(self, filepath: str):
        """Load agent."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.ac_network.load_state_dict(checkpoint['ac_network_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])

