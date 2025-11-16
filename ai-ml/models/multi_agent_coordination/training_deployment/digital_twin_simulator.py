"""
Digital Twin for Interaction Simulation

This module implements a digital twin simulator for multi-agent interaction
simulation in supply chain coordination.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InteractionType(Enum):
    """Types of agent interactions."""
    COOPERATIVE = "cooperative"
    COMPETITIVE = "competitive"
    MIXED = "mixed"


@dataclass
class AgentState:
    """Agent state representation."""
    agent_id: int
    state: np.ndarray
    action: Optional[np.ndarray] = None
    reward: float = 0.0
    done: bool = False


@dataclass
class GlobalState:
    """Global state representation."""
    states: List[np.ndarray]
    global_features: np.ndarray
    interaction_matrix: np.ndarray


class MultiAgentDigitalTwin:
    """
    Digital twin simulator for multi-agent interaction.
    
    Provides realistic simulation environment for training multi-agent
    systems with configurable interaction patterns.
    """
    
    def __init__(
        self,
        num_agents: int,
        state_dim: int,
        action_dim: int,
        interaction_type: InteractionType = InteractionType.COOPERATIVE,
        reward_cooperation: float = 0.1,
        reward_competition: float = -0.1,
        random_seed: Optional[int] = None
    ):
        """
        Initialize multi-agent digital twin.
        
        Args:
            num_agents: Number of agents
            state_dim: Dimension of state space
            action_dim: Dimension of action space
            interaction_type: Type of agent interaction
            reward_cooperation: Reward for cooperation
            reward_competition: Reward for competition
            random_seed: Random seed for reproducibility
        """
        self.num_agents = num_agents
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.interaction_type = interaction_type
        self.reward_cooperation = reward_cooperation
        self.reward_competition = reward_competition
        
        if random_seed is not None:
            np.random.seed(random_seed)
        
        # Initialize agent states
        self.agent_states: List[AgentState] = []
        self.global_state: Optional[GlobalState] = None
        
        # Interaction history
        self.interaction_history: List[Dict[str, Any]] = []
        
        # Reset
        self.reset()
    
    def reset(self) -> List[np.ndarray]:
        """
        Reset simulator to initial state.
        
        Returns:
            List of initial states for each agent
        """
        # Initialize agent states
        self.agent_states = []
        for agent_id in range(self.num_agents):
            state = np.random.randn(self.state_dim)
            agent_state = AgentState(agent_id=agent_id, state=state)
            self.agent_states.append(agent_state)
        
        # Initialize global state
        states = [agent.state for agent in self.agent_states]
        global_features = self._compute_global_features(states)
        interaction_matrix = self._compute_interaction_matrix()
        
        self.global_state = GlobalState(
            states=states,
            global_features=global_features,
            interaction_matrix=interaction_matrix
        )
        
        return states
    
    def step(
        self,
        actions: List[np.ndarray]
    ) -> Tuple[List[np.ndarray], List[float], List[bool], Dict[str, Any]]:
        """
        Execute actions for all agents.
        
        Args:
            actions: List of actions for each agent
        
        Returns:
            Tuple of (next_states, rewards, dones, info)
        """
        # Update agent states with actions
        for agent_state, action in zip(self.agent_states, actions):
            agent_state.action = action
        
        # Simulate state transitions
        next_states = []
        for agent_id, agent_state in enumerate(self.agent_states):
            # Simple state transition (would be more complex in real scenario)
            # Handle different action dimensions
            if agent_state.action is not None:
                if len(agent_state.action) == self.state_dim:
                    action_effect = agent_state.action * 0.1
                else:
                    # Project action to state dimension or pad/truncate
                    if len(agent_state.action) < self.state_dim:
                        action_effect = np.pad(agent_state.action * 0.1, (0, self.state_dim - len(agent_state.action)))
                    else:
                        action_effect = agent_state.action[:self.state_dim] * 0.1
            else:
                action_effect = np.zeros(self.state_dim)
            
            next_state = agent_state.state + action_effect + np.random.randn(self.state_dim) * 0.01
            next_states.append(next_state)
            agent_state.state = next_state
        
        # Compute rewards based on interactions
        rewards = self._compute_rewards(actions)
        
        # Check if done
        dones = [False] * self.num_agents
        
        # Update global state
        global_features = self._compute_global_features(next_states)
        interaction_matrix = self._compute_interaction_matrix()
        
        self.global_state = GlobalState(
            states=next_states,
            global_features=global_features,
            interaction_matrix=interaction_matrix
        )
        
        # Record interaction
        interaction_record = {
            'actions': actions,
            'rewards': rewards,
            'global_features': global_features,
            'interaction_matrix': interaction_matrix
        }
        self.interaction_history.append(interaction_record)
        
        info = {
            'global_state': global_features,
            'interaction_matrix': interaction_matrix
        }
        
        return next_states, rewards, dones, info
    
    def _compute_global_features(self, states: List[np.ndarray]) -> np.ndarray:
        """
        Compute global features from agent states.
        
        Args:
            states: List of agent states
        
        Returns:
            Global feature vector
        """
        # Aggregate states (mean, std, etc.)
        states_array = np.array(states)
        
        mean_state = np.mean(states_array, axis=0)
        std_state = np.std(states_array, axis=0)
        max_state = np.max(states_array, axis=0)
        min_state = np.min(states_array, axis=0)
        
        global_features = np.concatenate([mean_state, std_state, max_state, min_state])
        
        return global_features
    
    def _compute_interaction_matrix(self) -> np.ndarray:
        """
        Compute interaction matrix between agents.
        
        Returns:
            Interaction matrix
        """
        # Initialize interaction matrix
        interaction_matrix = np.ones((self.num_agents, self.num_agents))
        
        if self.interaction_type == InteractionType.COOPERATIVE:
            # All agents cooperate
            interaction_matrix = np.ones((self.num_agents, self.num_agents))
        elif self.interaction_type == InteractionType.COMPETITIVE:
            # Agents compete
            interaction_matrix = -np.ones((self.num_agents, self.num_agents))
            np.fill_diagonal(interaction_matrix, 1.0)
        elif self.interaction_type == InteractionType.MIXED:
            # Mixed interactions
            interaction_matrix = np.random.choice([-1, 1], size=(self.num_agents, self.num_agents))
            np.fill_diagonal(interaction_matrix, 1.0)
        
        return interaction_matrix
    
    def _compute_rewards(
        self,
        actions: List[np.ndarray]
    ) -> List[float]:
        """
        Compute rewards based on agent interactions.
        
        Args:
            actions: List of agent actions
        
        Returns:
            List of rewards
        """
        rewards = []
        
        for agent_id in range(self.num_agents):
            # Base reward
            base_reward = -np.linalg.norm(actions[agent_id]) * 0.1
            
            # Interaction reward
            interaction_reward = 0.0
            for other_id in range(self.num_agents):
                if other_id != agent_id:
                    # Compute action similarity
                    action_similarity = np.dot(actions[agent_id], actions[other_id]) / (
                        np.linalg.norm(actions[agent_id]) * np.linalg.norm(actions[other_id]) + 1e-8
                    )
                    
                    # Interaction matrix weight
                    weight = self.global_state.interaction_matrix[agent_id][other_id]
                    
                    if weight > 0:
                        # Cooperative reward
                        interaction_reward += self.reward_cooperation * action_similarity
                    else:
                        # Competitive reward
                        interaction_reward += self.reward_competition * action_similarity
            
            total_reward = base_reward + interaction_reward
            rewards.append(total_reward)
        
        return rewards
    
    def get_global_state(self) -> np.ndarray:
        """
        Get global state.
        
        Returns:
            Global state vector
        """
        if self.global_state is None:
            return np.zeros(self.state_dim * 4)
        
        return self.global_state.global_features
    
    def get_interaction_history(self) -> List[Dict[str, Any]]:
        """
        Get interaction history.
        
        Returns:
            List of interaction records
        """
        return self.interaction_history.copy()
    
    def clear_history(self):
        """Clear interaction history."""
        self.interaction_history = []
        logger.info("Interaction history cleared")

