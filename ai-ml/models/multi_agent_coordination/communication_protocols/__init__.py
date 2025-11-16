"""
Communication Protocols

This module implements communication protocols for multi-agent coordination:
- Learned communication with GNNs
- Message passing mechanisms
- Compressed state summary exchange
"""

from .gnn_communication import GNNCommunication
from .message_passing import MessagePassingMechanism
from .state_exchange import CompressedStateExchange

__all__ = [
    'GNNCommunication',
    'MessagePassingMechanism',
    'CompressedStateExchange'
]

