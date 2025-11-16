"""
Hierarchical RL with High-Level Planners

This module implements hierarchical reinforcement learning with high-level
planners for multi-agent coordination in supply chain optimization.
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
    from torch.distributions import Categorical
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None
    Categorical = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class HighLevelPlanner(nn.Module):
    """High-level planner network."""
    
    def __init__(
        self,
        state_dim: int,
        goal_dim: int,
        hidden_dims: List[int] = [128, 128]
    ):
        """Initialize high-level planner."""
        super(HighLevelPlanner, self).__init__()
        
        layers = []
        input_dim = state_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, goal_dim))
        layers.append(nn.Tanh())  # Goals in [-1, 1]
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        return self.network(state)


class LowLevelPolicy(nn.Module):
    """Low-level policy network."""
    
    def __init__(
        self,
        state_dim: int,
        goal_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [128, 128]
    ):
        """Initialize low-level policy."""
        super(LowLevelPolicy, self).__init__()
        
        layers = []
        input_dim = state_dim + goal_dim  # Concatenate state and goal
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(input_dim, hidden_dim))
            layers.append(nn.ReLU())
            input_dim = hidden_dim
        
        layers.append(nn.Linear(input_dim, action_dim))
        
        self.network = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor, goal: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        x = torch.cat([state, goal], dim=1)
        return self.network(x)


class HierarchicalRLPlanner:
    """
    Hierarchical RL planner with high-level planners.
    
    Implements hierarchical RL for multi-agent coordination with
    high-level goal setting and low-level policy execution.
    """
    
    def __init__(
        self,
        agent_id: int,
        state_dim: int,
        goal_dim: int,
        action_dim: int,
        high_level_horizon: int = 10,  # Steps per high-level goal
        learning_rate_high: float = 0.001,
        learning_rate_low: float = 0.001,
        gamma: float = 0.99,
        device: Optional[str] = None
    ):
        """
        Initialize hierarchical RL planner.
        
        Args:
            agent_id: Unique identifier for this agent
            state_dim: Dimension of state space
            goal_dim: Dimension of goal space
            action_dim: Dimension of action space
            high_level_horizon: Number of steps per high-level goal
            learning_rate_high: Learning rate for high-level planner
            learning_rate_low: Learning rate for low-level policy
            gamma: Discount factor
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for hierarchical RL")
        
        self.agent_id = agent_id
        self.state_dim = state_dim
        self.goal_dim = goal_dim
        self.action_dim = action_dim
        self.high_level_horizon = high_level_horizon
        self.gamma = gamma
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # High-level planner
        self.high_level_planner = HighLevelPlanner(state_dim, goal_dim).to(self.device)
        self.high_level_optimizer = optim.Adam(
            self.high_level_planner.parameters(),
            lr=learning_rate_high
        )
        
        # Low-level policy
        self.low_level_policy = LowLevelPolicy(state_dim, goal_dim, action_dim).to(self.device)
        self.low_level_optimizer = optim.Adam(
            self.low_level_policy.parameters(),
            lr=learning_rate_low
        )
        
        # Current goal and step counter
        self.current_goal = None
        self.goal_step = 0
        
        # Replay buffers
        self.high_level_buffer = deque(maxlen=1000)
        self.low_level_buffer = deque(maxlen=5000)
    
    def select_goal(self, state: np.ndarray) -> np.ndarray:
        """
        Select high-level goal.
        
        Args:
            state: Current state
        
        Returns:
            Goal vector
        """
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            goal = self.high_level_planner(state_tensor).cpu().numpy()[0]
        
        self.current_goal = goal
        self.goal_step = 0
        
        return goal
    
    def select_action(
        self,
        state: np.ndarray,
        goal: Optional[np.ndarray] = None,
        training: bool = True
    ) -> np.ndarray:
        """
        Select action using low-level policy.
        
        Args:
            state: Current state
            goal: Current goal (uses stored goal if None)
            training: Whether in training mode
        
        Returns:
            Action vector
        """
        if goal is None:
            if self.current_goal is None:
                goal = self.select_goal(state)
            else:
                goal = self.current_goal
        
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        goal_tensor = torch.FloatTensor(goal).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            action = self.low_level_policy(state_tensor, goal_tensor).cpu().numpy()[0]
        
        self.goal_step += 1
        
        # Update goal if horizon reached
        if self.goal_step >= self.high_level_horizon:
            self.current_goal = None
        
        return action
    
    def train_high_level(
        self,
        states: np.ndarray,
        goals: np.ndarray,
        rewards: np.ndarray,
        next_states: np.ndarray
    ) -> Dict[str, float]:
        """
        Train high-level planner.
        
        Args:
            states: States array
            goals: Goals array
            rewards: Rewards array
            next_states: Next states array
        
        Returns:
            Dictionary of losses
        """
        states_t = torch.FloatTensor(states).to(self.device)
        goals_t = torch.FloatTensor(goals).to(self.device)
        rewards_t = torch.FloatTensor(rewards).to(self.device)
        next_states_t = torch.FloatTensor(next_states).to(self.device)
        
        # Predict goals
        predicted_goals = self.high_level_planner(states_t)
        
        # Goal prediction loss (encourage goals that lead to high rewards)
        goal_loss = F.mse_loss(predicted_goals, goals_t)
        
        # Reward-based loss (higher rewards for better goals)
        reward_weight = torch.exp(rewards_t / 10.0)  # Scale rewards
        weighted_loss = (goal_loss * reward_weight).mean()
        
        self.high_level_optimizer.zero_grad()
        weighted_loss.backward()
        self.high_level_optimizer.step()
        
        return {
            'high_level_loss': weighted_loss.item(),
            'goal_prediction_loss': goal_loss.item()
        }
    
    def train_low_level(
        self,
        states: np.ndarray,
        goals: np.ndarray,
        actions: np.ndarray,
        rewards: np.ndarray,
        next_states: np.ndarray
    ) -> Dict[str, float]:
        """
        Train low-level policy.
        
        Args:
            states: States array
            goals: Goals array
            actions: Actions array
            rewards: Rewards array
            next_states: Next states array
        
        Returns:
            Dictionary of losses
        """
        states_t = torch.FloatTensor(states).to(self.device)
        goals_t = torch.FloatTensor(goals).to(self.device)
        actions_t = torch.FloatTensor(actions).to(self.device)
        rewards_t = torch.FloatTensor(rewards).to(self.device)
        next_states_t = torch.FloatTensor(next_states).to(self.device)
        
        # Predict actions
        predicted_actions = self.low_level_policy(states_t, goals_t)
        
        # Action prediction loss
        action_loss = F.mse_loss(predicted_actions, actions_t)
        
        # Reward-based loss
        reward_weight = torch.exp(rewards_t / 10.0)
        weighted_loss = (action_loss * reward_weight).mean()
        
        self.low_level_optimizer.zero_grad()
        weighted_loss.backward()
        self.low_level_optimizer.step()
        
        return {
            'low_level_loss': weighted_loss.item(),
            'action_prediction_loss': action_loss.item()
        }
    
    def save(self, filepath: str):
        """Save planner."""
        torch.save({
            'high_level_planner_state_dict': self.high_level_planner.state_dict(),
            'low_level_policy_state_dict': self.low_level_policy.state_dict(),
            'agent_id': self.agent_id,
            'state_dim': self.state_dim,
            'goal_dim': self.goal_dim,
            'action_dim': self.action_dim,
            'high_level_horizon': self.high_level_horizon
        }, filepath)
    
    def load(self, filepath: str):
        """Load planner."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.high_level_planner.load_state_dict(checkpoint['high_level_planner_state_dict'])
        self.low_level_policy.load_state_dict(checkpoint['low_level_policy_state_dict'])

