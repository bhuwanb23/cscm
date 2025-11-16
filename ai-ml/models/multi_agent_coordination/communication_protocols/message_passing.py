"""
Message Passing Mechanisms

This module implements message passing mechanisms for multi-agent communication.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging
from enum import Enum

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


class MessageType(Enum):
    """Message types."""
    STATE_UPDATE = "state_update"
    ACTION_COORDINATION = "action_coordination"
    GOAL_SHARING = "goal_sharing"
    RESOURCE_REQUEST = "resource_request"
    STATUS_UPDATE = "status_update"


class Message:
    """Message data structure."""
    
    def __init__(
        self,
        sender_id: int,
        receiver_id: int,
        message_type: MessageType,
        content: Dict[str, Any],
        timestamp: float = 0.0
    ):
        """
        Initialize message.
        
        Args:
            sender_id: Sender agent ID
            receiver_id: Receiver agent ID
            message_type: Type of message
            content: Message content
            timestamp: Timestamp
        """
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.message_type = message_type
        self.content = content
        self.timestamp = timestamp


class MessagePassingMechanism:
    """
    Message passing mechanism for multi-agent communication.
    
    Implements various message passing strategies for agent coordination.
    """
    
    def __init__(
        self,
        num_agents: int,
        message_dim: int = 32,
        max_message_queue: int = 100
    ):
        """
        Initialize message passing mechanism.
        
        Args:
            num_agents: Number of agents
            message_dim: Dimension of messages
            max_message_queue: Maximum message queue size
        """
        self.num_agents = num_agents
        self.message_dim = message_dim
        self.max_message_queue = max_message_queue
        
        # Message queues for each agent
        self.message_queues: Dict[int, List[Message]] = {
            agent_id: [] for agent_id in range(num_agents)
        }
        
        # Message history
        self.message_history: List[Message] = []
    
    def send_message(
        self,
        sender_id: int,
        receiver_id: int,
        message_type: MessageType,
        content: Dict[str, Any],
        timestamp: Optional[float] = None
    ):
        """
        Send message from one agent to another.
        
        Args:
            sender_id: Sender agent ID
            receiver_id: Receiver agent ID
            message_type: Type of message
            content: Message content
            timestamp: Timestamp (defaults to current time)
        """
        import time
        if timestamp is None:
            timestamp = time.time()
        
        message = Message(sender_id, receiver_id, message_type, content, timestamp)
        
        # Add to receiver's queue
        if receiver_id in self.message_queues:
            queue = self.message_queues[receiver_id]
            queue.append(message)
            
            # Limit queue size
            if len(queue) > self.max_message_queue:
                queue.pop(0)
        
        # Add to history
        self.message_history.append(message)
        
        # Limit history size
        if len(self.message_history) > self.max_message_queue * self.num_agents:
            self.message_history.pop(0)
    
    def broadcast_message(
        self,
        sender_id: int,
        message_type: MessageType,
        content: Dict[str, Any],
        exclude_agents: Optional[List[int]] = None
    ):
        """
        Broadcast message to all agents.
        
        Args:
            sender_id: Sender agent ID
            message_type: Type of message
            content: Message content
            exclude_agents: List of agent IDs to exclude
        """
        if exclude_agents is None:
            exclude_agents = [sender_id]
        
        for receiver_id in range(self.num_agents):
            if receiver_id not in exclude_agents:
                self.send_message(sender_id, receiver_id, message_type, content)
    
    def receive_messages(
        self,
        agent_id: int,
        message_type: Optional[MessageType] = None,
        clear_queue: bool = True
    ) -> List[Message]:
        """
        Receive messages for an agent.
        
        Args:
            agent_id: Agent ID
            message_type: Filter by message type (None = all types)
            clear_queue: Whether to clear queue after receiving
        
        Returns:
            List of messages
        """
        if agent_id not in self.message_queues:
            return []
        
        queue = self.message_queues[agent_id]
        
        if message_type is not None:
            messages = [m for m in queue if m.message_type == message_type]
        else:
            messages = queue.copy()
        
        if clear_queue:
            self.message_queues[agent_id] = []
        
        return messages
    
    def aggregate_messages(
        self,
        agent_id: int,
        aggregation_method: str = 'mean'  # 'mean', 'max', 'sum', 'concat'
    ) -> np.ndarray:
        """
        Aggregate messages for an agent.
        
        Args:
            agent_id: Agent ID
            aggregation_method: Aggregation method
        
        Returns:
            Aggregated message vector
        """
        messages = self.receive_messages(agent_id, clear_queue=False)
        
        if not messages:
            return np.zeros(self.message_dim)
        
        # Extract message vectors from content
        message_vectors = []
        for msg in messages:
            if 'vector' in msg.content:
                message_vectors.append(np.array(msg.content['vector']))
        
        if not message_vectors:
            return np.zeros(self.message_dim)
        
        message_vectors = np.array(message_vectors)
        
        # Aggregate
        if aggregation_method == 'mean':
            aggregated = np.mean(message_vectors, axis=0)
        elif aggregation_method == 'max':
            aggregated = np.max(message_vectors, axis=0)
        elif aggregation_method == 'sum':
            aggregated = np.sum(message_vectors, axis=0)
        elif aggregation_method == 'concat':
            aggregated = np.concatenate(message_vectors, axis=0)
        else:
            aggregated = np.mean(message_vectors, axis=0)
        
        # Ensure correct dimension
        if len(aggregated) > self.message_dim:
            aggregated = aggregated[:self.message_dim]
        elif len(aggregated) < self.message_dim:
            padded = np.zeros(self.message_dim)
            padded[:len(aggregated)] = aggregated
            aggregated = padded
        
        return aggregated
    
    def get_message_statistics(self) -> Dict[str, Any]:
        """
        Get message passing statistics.
        
        Returns:
            Dictionary of statistics
        """
        total_messages = len(self.message_history)
        
        # Count by type
        type_counts = {}
        for msg in self.message_history:
            msg_type = msg.message_type.value
            type_counts[msg_type] = type_counts.get(msg_type, 0) + 1
        
        # Queue sizes
        queue_sizes = {
            agent_id: len(queue)
            for agent_id, queue in self.message_queues.items()
        }
        
        return {
            'total_messages': total_messages,
            'messages_by_type': type_counts,
            'queue_sizes': queue_sizes,
            'num_agents': self.num_agents
        }
    
    def clear_all_queues(self):
        """Clear all message queues."""
        for agent_id in self.message_queues:
            self.message_queues[agent_id] = []
        logger.info("All message queues cleared")

