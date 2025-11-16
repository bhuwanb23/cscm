"""
Centralized Training with Decentralized Execution (CTDE)

This module implements CTDE training framework for multi-agent systems.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging
from collections import deque
import random

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CTDETrainer:
    """
    Centralized Training with Decentralized Execution trainer.
    
    Implements CTDE framework where agents are trained centrally
    but execute policies independently.
    """
    
    def __init__(
        self,
        agents: List[Any],  # List of agent objects
        global_critic: Optional[Any] = None,
        training_mode: str = 'maddpg'  # 'maddpg', 'mappo', 'qmix'
    ):
        """
        Initialize CTDE trainer.
        
        Args:
            agents: List of agent objects
            global_critic: Global critic network (optional)
            training_mode: Training mode ('maddpg', 'mappo', 'qmix')
        """
        self.agents = agents
        self.num_agents = len(agents)
        self.global_critic = global_critic
        self.training_mode = training_mode
        
        # Centralized experience buffer
        self.centralized_buffer = deque(maxlen=10000)
        
        # Training statistics
        self.training_stats = {
            'episodes': 0,
            'total_steps': 0,
            'avg_reward': 0.0,
            'losses': []
        }
    
    def collect_experience(
        self,
        states: List[np.ndarray],
        actions: List[np.ndarray],
        rewards: List[float],
        next_states: List[np.ndarray],
        dones: List[bool],
        global_state: Optional[np.ndarray] = None,
        next_global_state: Optional[np.ndarray] = None
    ):
        """
        Collect experience from all agents.
        
        Args:
            states: List of agent states
            actions: List of agent actions
            rewards: List of agent rewards
            next_states: List of next agent states
            dones: List of done flags
            global_state: Global state (optional)
            next_global_state: Next global state (optional)
        """
        experience = {
            'states': states,
            'actions': actions,
            'rewards': rewards,
            'next_states': next_states,
            'dones': dones,
            'global_state': global_state,
            'next_global_state': next_global_state
        }
        
        self.centralized_buffer.append(experience)
        self.training_stats['total_steps'] += 1
    
    def train_step(self, batch_size: int = 32) -> Dict[str, Any]:
        """
        Perform centralized training step.
        
        Args:
            batch_size: Batch size
        
        Returns:
            Dictionary of training statistics
        """
        if len(self.centralized_buffer) < batch_size:
            return {}
        
        # Sample batch
        batch = random.sample(self.centralized_buffer, batch_size)
        
        if self.training_mode == 'maddpg':
            return self._train_maddpg(batch)
        elif self.training_mode == 'mappo':
            return self._train_mappo(batch)
        elif self.training_mode == 'qmix':
            return self._train_qmix(batch)
        else:
            raise ValueError(f"Unknown training mode: {self.training_mode}")
    
    def _train_maddpg(self, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train using MADDPG."""
        losses = {}
        
        for agent_id, agent in enumerate(self.agents):
            if hasattr(agent, 'train_step'):
                # Prepare batch for agent
                agent_batch = []
                for exp in batch:
                    agent_batch.append({
                        'states': exp['states'],
                        'actions': exp['actions'],
                        'rewards': exp['rewards'],
                        'next_states': exp['next_states'],
                        'dones': exp['dones']
                    })
                
                agent_losses = agent.train_step(agent_batch)
                losses[f'agent_{agent_id}'] = agent_losses
        
        return losses
    
    def _train_mappo(self, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train using MAPPO."""
        losses = {}
        
        # Extract episode data
        states = np.array([exp['states'] for exp in batch])
        actions = np.array([exp['actions'] for exp in batch])
        rewards = np.array([exp['rewards'] for exp in batch])
        next_states = np.array([exp['next_states'] for exp in batch])
        dones = np.array([exp['dones'] for exp in batch])
        
        for agent_id, agent in enumerate(self.agents):
            if hasattr(agent, 'train_step'):
                agent_states = states[:, agent_id]
                agent_actions = actions[:, agent_id]
                agent_rewards = rewards[:, agent_id]
                agent_next_states = next_states[:, agent_id]
                agent_dones = dones[:, agent_id]
                
                # Get old log probs (would need to store these)
                old_log_probs = np.zeros(len(batch))
                values = np.zeros(len(batch))
                
                agent_losses = agent.train_step(
                    agent_states, agent_actions, old_log_probs,
                    agent_rewards, values, agent_dones
                )
                losses[f'agent_{agent_id}'] = agent_losses
        
        return losses
    
    def _train_qmix(self, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train using QMIX."""
        # QMIX training would be handled by the coordinator
        # This is a placeholder
        return {}
    
    def decentralized_execution(
        self,
        states: List[np.ndarray],
        training: bool = False
    ) -> List[np.ndarray]:
        """
        Decentralized execution - each agent selects action independently.
        
        Args:
            states: List of agent states
            training: Whether in training mode
        
        Returns:
            List of actions
        """
        actions = []
        
        for agent, state in zip(self.agents, states):
            if hasattr(agent, 'select_action'):
                action = agent.select_action(state, training=training)
            elif hasattr(agent, 'select_actions'):
                # For QMIX coordinator
                action = agent.select_actions([state], training=training)[0]
            else:
                raise ValueError(f"Agent does not have select_action method")
            
            actions.append(action)
        
        return actions
    
    def train_episode(
        self,
        env: Any,
        max_steps: int = 1000
    ) -> Dict[str, Any]:
        """
        Train for one episode.
        
        Args:
            env: Environment object
            max_steps: Maximum steps per episode
        
        Returns:
            Episode statistics
        """
        # Reset environment
        states = env.reset()
        
        episode_rewards = [0.0] * self.num_agents
        episode_length = 0
        
        for step in range(max_steps):
            # Decentralized execution
            actions = self.decentralized_execution(states, training=True)
            
            # Step environment
            next_states, rewards, dones, info = env.step(actions)
            
            # Get global state if available
            global_state = getattr(env, 'get_global_state', lambda: None)()
            next_global_state = getattr(env, 'get_global_state', lambda: None)() if not any(dones) else None
            
            # Collect experience
            self.collect_experience(
                states, actions, rewards, next_states, dones,
                global_state, next_global_state
            )
            
            # Update rewards
            for i in range(self.num_agents):
                episode_rewards[i] += rewards[i]
            
            episode_length += 1
            
            # Train if buffer is large enough
            if len(self.centralized_buffer) >= 32:
                self.train_step(batch_size=32)
            
            # Check if done
            if any(dones):
                break
            
            states = next_states
        
        # Update statistics
        self.training_stats['episodes'] += 1
        avg_reward = np.mean(episode_rewards)
        self.training_stats['avg_reward'] = (
            self.training_stats['avg_reward'] * (self.training_stats['episodes'] - 1) +
            avg_reward
        ) / self.training_stats['episodes']
        
        return {
            'episode': self.training_stats['episodes'],
            'rewards': episode_rewards,
            'avg_reward': avg_reward,
            'length': episode_length
        }
    
    def get_training_stats(self) -> Dict[str, Any]:
        """
        Get training statistics.
        
        Returns:
            Dictionary of training statistics
        """
        return self.training_stats.copy()
    
    def save_agents(self, base_path: str):
        """
        Save all agents.
        
        Args:
            base_path: Base path for saving
        """
        for agent_id, agent in enumerate(self.agents):
            if hasattr(agent, 'save'):
                filepath = f"{base_path}_agent_{agent_id}.pth"
                agent.save(filepath)
                logger.info(f"Saved agent {agent_id} to {filepath}")
    
    def load_agents(self, base_path: str):
        """
        Load all agents.
        
        Args:
            base_path: Base path for loading
        """
        for agent_id, agent in enumerate(self.agents):
            if hasattr(agent, 'load'):
                filepath = f"{base_path}_agent_{agent_id}.pth"
                agent.load(filepath)
                logger.info(f"Loaded agent {agent_id} from {filepath}")

