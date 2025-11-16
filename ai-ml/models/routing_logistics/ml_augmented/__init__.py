"""
ML-Augmented Approaches for Routing & Logistics

This module implements ML-augmented routing algorithms:
- Graph Neural Networks for route planning
- Learned heuristics with GNNs
- RL-based routing with MADDPG/PPO
"""

from .gnn_route_planner import GNRoutePlanner
from .learned_heuristics import LearnedHeuristic
from .rl_routing import MADDPGRoutingAgent, PPORoutingAgent

__all__ = [
    'GNRoutePlanner',
    'LearnedHeuristic',
    'MADDPGRoutingAgent',
    'PPORoutingAgent'
]

