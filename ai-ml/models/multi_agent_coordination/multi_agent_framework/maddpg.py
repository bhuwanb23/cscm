"""
MADDPG for Cooperative Tasks

This module implements Multi-Agent Deep Deterministic Policy Gradient (MADDPG)
for cooperative multi-agent tasks in supply chain coordination.
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
    from torch.distributions import Normal
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None
    Normal = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Actor(nn.Module):
    """Actor network for MADDPG."""
    
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
        layers.append(nn.Tanh())  # Actions in [-1, 1]
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        return self.network(state)


class Critic(nn.Module):
    """Critic network for MADDPG (takes all agents' states and actions)."""
    
    def __init__(
        self,
        num_agents: int,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [128, 128]
    ):
        """Initialize critic network."""
        super(Critic, self).__init__()
        
        # Input: concatenated states and actions from all agents
        input_dim = num_agents * (state_dim + action_dim)
        
        layers = []
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, 1))
        
        self.network = nn.Sequential(*layers)
    
    def forward(
        self,
        states: torch.Tensor,  # [batch, num_agents, state_dim]
        actions: torch.Tensor   # [batch, num_agents, action_dim]
    ) -> torch.Tensor:
        """Forward pass."""
        batch_size = states.shape[0]
        num_agents = states.shape[1]
        
        # Concatenate states and actions
        x = torch.cat([states, actions], dim=2)  # [batch, num_agents, state_dim + action_dim]
        x = x.view(batch_size, -1)  # [batch, num_agents * (state_dim + action_dim)]
        
        return self.network(x)


class MADDPGAgent:
    """
    Multi-Agent Deep Deterministic Policy Gradient agent.
    
    Implements MADDPG for cooperative multi-agent tasks.
    """
    
    def __init__(
        self,
        agent_id: int,
        num_agents: int,
        state_dim: int,
        action_dim: int,
        learning_rate_actor: float = 0.001,
        learning_rate_critic: float = 0.001,
        gamma: float = 0.99,
        tau: float = 0.01,  # Soft update coefficient
        device: Optional[str] = None
    ):
        """
        Initialize MADDPG agent.
        
        Args:
            agent_id: Unique identifier for this agent
            num_agents: Total number of agents
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            learning_rate_actor: Learning rate for actor
            learning_rate_critic: Learning rate for critic
            gamma: Discount factor
            tau: Soft update coefficient
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for MADDPG")
        
        self.agent_id = agent_id
        self.num_agents = num_agents
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = gamma
        self.tau = tau
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Actor networks
        self.actor = Actor(state_dim, action_dim).to(self.device)
        self.actor_target = Actor(state_dim, action_dim).to(self.device)
        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=learning_rate_actor)
        
        # Critic networks
        self.critic = Critic(num_agents, state_dim, action_dim).to(self.device)
        self.critic_target = Critic(num_agents, state_dim, action_dim).to(self.device)
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=learning_rate_critic)
        
        # Initialize target networks
        self._soft_update(self.actor, self.actor_target, 1.0)
        self._soft_update(self.critic, self.critic_target, 1.0)
        
        # Replay buffer
        self.replay_buffer = deque(maxlen=10000)
        
        # Noise for exploration
        self.noise_scale = 0.1
    
    def select_action(
        self,
        state: np.ndarray,
        training: bool = True
    ) -> np.ndarray:
        """
        Select action using actor network.
        
        Args:
            state: Current state
            training: Whether in training mode
        
        Returns:
            Action array
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action = self.actor(state_tensor).cpu().numpy()[0]
        
        if training:
            # Add noise for exploration
            noise = np.random.normal(0, self.noise_scale, size=action.shape)
            action = np.clip(action + noise, -1, 1)
        
        return action
    
    def train_step(
        self,
        batch: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        Perform training step.
        
        Args:
            batch: Batch of experiences from all agents
        
        Returns:
            Dictionary of losses
        """
        if len(batch) < 32:
            return {}
        
        # Sample batch
        batch_size = min(32, len(batch))
        samples = random.sample(batch, batch_size)
        
        # Extract data
        states = torch.FloatTensor([s['states'] for s in samples]).to(self.device)
        actions = torch.FloatTensor([s['actions'] for s in samples]).to(self.device)
        rewards = torch.FloatTensor([s['rewards'][self.agent_id] for s in samples]).to(self.device)
        next_states = torch.FloatTensor([s['next_states'] for s in samples]).to(self.device)
        dones = torch.FloatTensor([s['dones'] for s in samples]).to(self.device)
        
        # Update critic
        with torch.no_grad():
            # Get target actions from target actors (would need access to other agents' target actors)
            # For now, use current actors as approximation
            next_actions = actions.clone()  # Placeholder - would use target actors
            
            target_q = self.critic_target(next_states, next_actions).squeeze()
            target_q = rewards + (1 - dones) * self.gamma * target_q
        
        current_q = self.critic(states, actions).squeeze()
        critic_loss = F.mse_loss(current_q, target_q)
        
        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()
        
        # Update actor
        # Predict actions for all agents
        predicted_actions = actions.clone()
        predicted_actions[:, self.agent_id] = self.actor(states[:, self.agent_id])
        
        actor_loss = -self.critic(states, predicted_actions).mean()
        
        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()
        
        # Soft update target networks
        self._soft_update(self.actor, self.actor_target, self.tau)
        self._soft_update(self.critic, self.critic_target, self.tau)
        
        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item()
        }
    
    def _soft_update(self, source: nn.Module, target: nn.Module, tau: float):
        """Soft update target network."""
        for target_param, source_param in zip(target.parameters(), source.parameters()):
            target_param.data.copy_(tau * source_param.data + (1 - tau) * target_param.data)
    
    def save(self, filepath: str):
        """Save agent."""
        torch.save({
            'actor_state_dict': self.actor.state_dict(),
            'critic_state_dict': self.critic.state_dict(),
            'actor_target_state_dict': self.actor_target.state_dict(),
            'critic_target_state_dict': self.critic_target.state_dict(),
            'agent_id': self.agent_id,
            'num_agents': self.num_agents,
            'state_dim': self.state_dim,
            'action_dim': self.action_dim
        }, filepath)
    
    def load(self, filepath: str):
        """Load agent."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.actor.load_state_dict(checkpoint['actor_state_dict'])
        self.critic.load_state_dict(checkpoint['critic_state_dict'])
        self.actor_target.load_state_dict(checkpoint['actor_target_state_dict'])
        self.critic_target.load_state_dict(checkpoint['critic_target_state_dict'])

