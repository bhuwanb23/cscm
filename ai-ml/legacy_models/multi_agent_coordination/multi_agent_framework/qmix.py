"""
QMIX Coordination Models

This module implements QMIX (Q-value Mixing) for multi-agent coordination
in supply chain optimization.
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class QNetwork(nn.Module):
    """Q-network for individual agent."""
    
    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [64, 64]):
        """Initialize Q-network."""
        super(QNetwork, self).__init__()
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        return self.network(state)


class MixingNetwork(nn.Module):
    """Mixing network for QMIX."""
    
    def __init__(
        self,
        num_agents: int,
        state_dim: int,
        hidden_dim: int = 64
    ):
        """Initialize mixing network."""
        super(MixingNetwork, self).__init__()
        
        self.num_agents = num_agents
        self.state_dim = state_dim
        
        # Hypernetworks for mixing weights
        self.hyper_w1 = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, num_agents * hidden_dim)
        )
        
        self.hyper_w2 = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
        self.hyper_b1 = nn.Linear(state_dim, hidden_dim)
        self.hyper_b2 = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
    
    def forward(
        self,
        q_values: torch.Tensor,  # [batch, num_agents]
        state: torch.Tensor      # [batch, state_dim]
    ) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            q_values: Q-values from all agents
            state: Global state
        
        Returns:
            Mixed Q-value
        """
        batch_size = q_values.shape[0]
        
        # First layer
        w1 = torch.abs(self.hyper_w1(state))
        w1 = w1.view(batch_size, self.num_agents, -1)
        b1 = self.hyper_b1(state)
        b1 = b1.view(batch_size, 1, -1)
        
        hidden = F.elu(torch.bmm(q_values.unsqueeze(1), w1) + b1)
        
        # Second layer
        w2 = torch.abs(self.hyper_w2(state))
        w2 = w2.view(batch_size, -1, 1)
        b2 = self.hyper_b2(state)
        
        q_total = torch.bmm(hidden, w2) + b2
        
        return q_total.squeeze()


class QMIXCoordinator:
    """
    QMIX coordinator for multi-agent coordination.
    
    Implements Q-value mixing for cooperative multi-agent tasks.
    """
    
    def __init__(
        self,
        num_agents: int,
        state_dim: int,
        action_dim: int,
        global_state_dim: int,
        learning_rate: float = 0.0005,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01,
        device: Optional[str] = None
    ):
        """
        Initialize QMIX coordinator.
        
        Args:
            num_agents: Number of agents
            state_dim: Dimension of individual agent state
            action_dim: Dimension of action space
            global_state_dim: Dimension of global state
            learning_rate: Learning rate
            gamma: Discount factor
            epsilon: Epsilon for epsilon-greedy
            epsilon_decay: Epsilon decay rate
            epsilon_min: Minimum epsilon
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for QMIX")
        
        self.num_agents = num_agents
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.global_state_dim = global_state_dim
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Individual Q-networks for each agent
        self.q_networks = nn.ModuleList([
            QNetwork(state_dim, action_dim).to(self.device)
            for _ in range(num_agents)
        ])
        
        self.q_targets = nn.ModuleList([
            QNetwork(state_dim, action_dim).to(self.device)
            for _ in range(num_agents)
        ])
        
        # Mixing network
        self.mixing_network = MixingNetwork(num_agents, global_state_dim).to(self.device)
        self.mixing_target = MixingNetwork(num_agents, global_state_dim).to(self.device)
        
        # Optimizer
        params = list(self.q_networks.parameters()) + list(self.mixing_network.parameters())
        self.optimizer = optim.RMSprop(params, lr=learning_rate)
        
        # Initialize target networks
        self._update_target_networks(1.0)
        
        # Replay buffer
        self.replay_buffer = deque(maxlen=5000)
    
    def select_actions(
        self,
        states: List[np.ndarray],
        training: bool = True
    ) -> List[int]:
        """
        Select actions for all agents.
        
        Args:
            states: List of states for each agent
            training: Whether in training mode
        
        Returns:
            List of actions
        """
        actions = []
        
        for agent_id, state in enumerate(states):
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                q_values = self.q_networks[agent_id](state_tensor)
            
            if training and np.random.random() < self.epsilon:
                action = np.random.randint(self.action_dim)
            else:
                action = q_values.argmax().item()
            
            actions.append(action)
        
        return actions
    
    def train_step(self, batch_size: int = 32) -> Dict[str, float]:
        """
        Perform training step.
        
        Args:
            batch_size: Batch size
        
        Returns:
            Dictionary of losses
        """
        if len(self.replay_buffer) < batch_size:
            return {}
        
        # Sample batch
        batch = random.sample(self.replay_buffer, batch_size)
        
        # Extract data
        states = torch.FloatTensor([b['states'] for b in batch]).to(self.device)
        actions = torch.LongTensor([b['actions'] for b in batch]).to(self.device)
        rewards = torch.FloatTensor([b['reward'] for b in batch]).to(self.device)
        next_states = torch.FloatTensor([b['next_states'] for b in batch]).to(self.device)
        global_states = torch.FloatTensor([b['global_state'] for b in batch]).to(self.device)
        next_global_states = torch.FloatTensor([b['next_global_state'] for b in batch]).to(self.device)
        dones = torch.FloatTensor([b['done'] for b in batch]).to(self.device)
        
        # Compute Q-values
        q_values = []
        for agent_id in range(self.num_agents):
            q_vals = self.q_networks[agent_id](states[:, agent_id])
            q_values.append(q_vals.gather(1, actions[:, agent_id:agent_id+1]))
        
        q_values = torch.cat(q_values, dim=1)  # [batch, num_agents]
        q_total = self.mixing_network(q_values, global_states)
        
        # Compute target Q-values
        with torch.no_grad():
            next_q_values = []
            for agent_id in range(self.num_agents):
                next_q_vals = self.q_targets[agent_id](next_states[:, agent_id])
                next_q_values.append(next_q_vals.max(dim=1, keepdim=True)[0])
            
            next_q_values = torch.cat(next_q_values, dim=1)  # [batch, num_agents]
            next_q_total = self.mixing_target(next_q_values, next_global_states)
            
            target_q = rewards + (1 - dones) * self.gamma * next_q_total
        
        # Loss
        loss = F.mse_loss(q_total, target_q)
        
        # Update
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.mixing_network.parameters(), 10.0)
        self.optimizer.step()
        
        # Update epsilon
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        
        # Soft update target networks
        self._update_target_networks(0.005)
        
        return {
            'loss': loss.item(),
            'epsilon': self.epsilon
        }
    
    def _update_target_networks(self, tau: float):
        """Update target networks."""
        for q_net, q_target in zip(self.q_networks, self.q_targets):
            for target_param, param in zip(q_target.parameters(), q_net.parameters()):
                target_param.data.copy_(tau * param.data + (1 - tau) * target_param.data)
        
        for target_param, param in zip(self.mixing_target.parameters(), self.mixing_network.parameters()):
            target_param.data.copy_(tau * param.data + (1 - tau) * target_param.data)
    
    def save(self, filepath: str):
        """Save coordinator."""
        torch.save({
            'q_networks_state_dict': [q.state_dict() for q in self.q_networks],
            'q_targets_state_dict': [q.state_dict() for q in self.q_targets],
            'mixing_network_state_dict': self.mixing_network.state_dict(),
            'mixing_target_state_dict': self.mixing_target.state_dict(),
            'num_agents': self.num_agents,
            'state_dim': self.state_dim,
            'action_dim': self.action_dim,
            'global_state_dim': self.global_state_dim,
            'epsilon': self.epsilon
        }, filepath)
    
    def load(self, filepath: str):
        """Load coordinator."""
        checkpoint = torch.load(filepath, map_location=self.device)
        for q_net, state_dict in zip(self.q_networks, checkpoint['q_networks_state_dict']):
            q_net.load_state_dict(state_dict)
        for q_target, state_dict in zip(self.q_targets, checkpoint['q_targets_state_dict']):
            q_target.load_state_dict(state_dict)
        self.mixing_network.load_state_dict(checkpoint['mixing_network_state_dict'])
        self.mixing_target.load_state_dict(checkpoint['mixing_target_state_dict'])
        self.epsilon = checkpoint.get('epsilon', self.epsilon_min)

