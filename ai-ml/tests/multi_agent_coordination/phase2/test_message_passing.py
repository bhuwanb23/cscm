"""
Tests for Message Passing
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.multi_agent_coordination.communication_protocols.message_passing import (
    MessagePassingMechanism,
    MessageType
)


class TestMessagePassingMechanism:
    """Test cases for MessagePassingMechanism."""
    
    def test_initialization(self):
        """Test mechanism initialization."""
        mechanism = MessagePassingMechanism(num_agents=3)
        
        assert mechanism.num_agents == 3
        assert len(mechanism.message_queues) == 3
    
    def test_send_message(self):
        """Test message sending."""
        mechanism = MessagePassingMechanism(num_agents=2)
        
        mechanism.send_message(
            sender_id=0,
            receiver_id=1,
            message_type=MessageType.STATE_UPDATE,
            content={'vector': np.array([1.0, 2.0, 3.0])}
        )
        
        messages = mechanism.receive_messages(1)
        assert len(messages) == 1
        assert messages[0].sender_id == 0
    
    def test_broadcast_message(self):
        """Test message broadcasting."""
        mechanism = MessagePassingMechanism(num_agents=3)
        
        mechanism.broadcast_message(
            sender_id=0,
            message_type=MessageType.STATUS_UPDATE,
            content={'status': 'ready'}
        )
        
        # Check all agents except sender received message
        for agent_id in [1, 2]:
            messages = mechanism.receive_messages(agent_id)
            assert len(messages) == 1
    
    def test_aggregate_messages(self):
        """Test message aggregation."""
        mechanism = MessagePassingMechanism(num_agents=2, message_dim=4)
        
        # Send multiple messages
        for i in range(3):
            mechanism.send_message(
                sender_id=0,
                receiver_id=1,
                message_type=MessageType.STATE_UPDATE,
                content={'vector': np.array([1.0, 2.0, 3.0, 4.0])}
            )
        
        aggregated = mechanism.aggregate_messages(1, aggregation_method='mean')
        
        assert aggregated.shape == (4,)
        assert np.allclose(aggregated, np.array([1.0, 2.0, 3.0, 4.0]))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

