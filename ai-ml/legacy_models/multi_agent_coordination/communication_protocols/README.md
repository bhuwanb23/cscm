# Communication Protocols

## Overview

This module implements communication protocols for multi-agent coordination, including learned communication, message passing, and state compression.

## Phase 2: Communication Protocols ✅

### Components

1. **Learned Communication with GNNs** (`gnn_communication.py`)
   - Graph Neural Network-based communication
   - GCN architecture for message generation
   - Learned communication protocols
   - Configurable connectivity patterns

2. **Message Passing Mechanisms** (`message_passing.py`)
   - Point-to-point messaging
   - Broadcast messaging
   - Message queues per agent
   - Message aggregation (mean, max, sum, concat)
   - Message type classification

3. **Compressed State Summary Exchange** (`state_exchange.py`)
   - State compression using neural networks
   - State decompression
   - Compression ratio optimization
   - Efficient communication bandwidth usage

## Usage Examples

### GNN Communication

```python
from models.multi_agent_coordination.communication_protocols import GNNCommunication

# Create communication system
comm = GNNCommunication(
    num_agents=3,
    state_dim=10,
    message_dim=16
)

# Agent states
states = [
    np.random.randn(10),
    np.random.randn(10),
    np.random.randn(10)
]

# Perform communication
messages = comm.communicate(states)

# Each agent receives a message
for agent_id, message in enumerate(messages):
    print(f"Agent {agent_id} received message: {message}")
```

### Message Passing

```python
from models.multi_agent_coordination.communication_protocols import (
    MessagePassingMechanism,
    MessageType
)

# Create message passing mechanism
mechanism = MessagePassingMechanism(num_agents=3)

# Send point-to-point message
mechanism.send_message(
    sender_id=0,
    receiver_id=1,
    message_type=MessageType.STATE_UPDATE,
    content={'vector': np.array([1.0, 2.0, 3.0])}
)

# Broadcast message
mechanism.broadcast_message(
    sender_id=0,
    message_type=MessageType.STATUS_UPDATE,
    content={'status': 'ready'}
)

# Receive messages
messages = mechanism.receive_messages(agent_id=1)

# Aggregate messages
aggregated = mechanism.aggregate_messages(
    agent_id=1,
    aggregation_method='mean'
)
```

### Compressed State Exchange

```python
from models.multi_agent_coordination.communication_protocols import CompressedStateExchange

# Create state exchange
exchange = CompressedStateExchange(
    state_dim=20,
    compressed_dim=8
)

# Compress state
state = np.random.randn(20)
compressed = exchange.compress_state(state)

# Decompress state
decompressed = exchange.decompress_state(compressed)

# Compression ratio
ratio = exchange.get_compression_ratio()
print(f"Compression ratio: {ratio}")
```

## Dependencies

- torch (required for GNN and state compression)
- torch_geometric (required for GNN communication)
- numpy

## Notes

- GNN communication learns optimal communication patterns
- Message passing provides flexible communication infrastructure
- State compression reduces communication bandwidth
- All components support training and deployment

