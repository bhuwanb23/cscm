"""
Reinforcement Learning Models for Inventory Optimization

This module implements RL-based inventory control algorithms:
- Deep Q-Learning (DQN) for discrete action spaces
- DDPG for continuous action spaces
- PPO for policy optimization

Torch-backed agents import best-effort so the pure-Python simulator stays
usable on torch-free machines.
"""

__all__ = []

try:
    from .dqn import DQNInventoryAgent
    from .ddpg import DDPGInventoryAgent
    from .ppo import PPOInventoryAgent
    __all__ += ['DQNInventoryAgent', 'DDPGInventoryAgent', 'PPOInventoryAgent']
except Exception as _exc:  # torch missing or broken
    import logging
    logging.getLogger(__name__).warning('RL torch agents unavailable: %s', _exc)

from .digital_twin.inventory_simulator import InventorySimulator
__all__.append('InventorySimulator')
