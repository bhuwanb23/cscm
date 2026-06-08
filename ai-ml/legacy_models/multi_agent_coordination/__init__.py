"""
Multi-Agent Coordination & Policy Learning Module

This module provides multi-agent coordination capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system.
"""

from .multi_agent_framework.maddpg import MADDPGAgent
from .multi_agent_framework.mappo import MAPPOAgent
from .multi_agent_framework.qmix import QMIXCoordinator
from .multi_agent_framework.hierarchical_rl import HierarchicalRLPlanner

from .communication_protocols.gnn_communication import GNNCommunication
from .communication_protocols.message_passing import MessagePassingMechanism
from .communication_protocols.state_exchange import CompressedStateExchange

__all__ = [
    'MADDPGAgent',
    'MAPPOAgent',
    'QMIXCoordinator',
    'HierarchicalRLPlanner',
    'GNNCommunication',
    'MessagePassingMechanism',
    'CompressedStateExchange'
]

