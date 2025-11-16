"""
Learned Communication with GNNs

This module implements learned communication protocols using Graph Neural Networks
for multi-agent coordination.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None

try:
    from torch_geometric.nn import GCNConv, MessagePassing
    from torch_geometric.data import Data, Batch
    HAS_TORCH_GEOMETRIC = True
except ImportError:
    HAS_TORCH_GEOMETRIC = False
    GCNConv = None
    MessagePassing = None
    Data = None
    Batch = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CommunicationGCN(nn.Module):
    """GCN for learned communication."""
    
    def __init__(
        self,
        input_dim: int,
        hidden_dim: int,
        message_dim: int,
        num_layers: int = 2
    ):
        """Initialize communication GCN."""
        super(CommunicationGCN, self).__init__()
        
        if not HAS_TORCH_GEOMETRIC:
            raise ImportError("torch_geometric is required for GNN communication")
        
        self.num_layers = num_layers
        self.convs = nn.ModuleList()
        
        # First layer
        self.convs.append(GCNConv(input_dim, hidden_dim))
        
        # Hidden layers
        for _ in range(num_layers - 2):
            self.convs.append(GCNConv(hidden_dim, hidden_dim))
        
        # Output layer (message dimension)
        self.convs.append(GCNConv(hidden_dim, message_dim))
        
        self.activation = nn.ReLU()
    
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = self.activation(x)
        
        # Final layer
        x = self.convs[-1](x, edge_index)
        
        return x


class GNNCommunication:
    """
    Learned communication using Graph Neural Networks.
    
    Implements GNN-based communication for multi-agent coordination.
    """
    
    def __init__(
        self,
        num_agents: int,
        state_dim: int,
        message_dim: int = 32,
        hidden_dim: int = 64,
        num_layers: int = 2,
        learning_rate: float = 0.001,
        device: Optional[str] = None
    ):
        """
        Initialize GNN communication.
        
        Args:
            num_agents: Number of agents
            state_dim: Dimension of agent state
            message_dim: Dimension of communication messages
            hidden_dim: Hidden dimension
            num_layers: Number of GCN layers
            learning_rate: Learning rate
            device: Device to use
        """
        if not HAS_TORCH_GEOMETRIC:
            raise ImportError("torch_geometric is required for GNN communication")
        
        self.num_agents = num_agents
        self.state_dim = state_dim
        self.message_dim = message_dim
        self.hidden_dim = hidden_dim
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Communication GCN
        self.communication_gcn = CommunicationGCN(
            input_dim=state_dim,
            hidden_dim=hidden_dim,
            message_dim=message_dim,
            num_layers=num_layers
        ).to(self.device)
        
        self.optimizer = optim.Adam(self.communication_gcn.parameters(), lr=learning_rate)
        self.is_trained = False
    
    def create_communication_graph(
        self,
        states: List[np.ndarray],
        connectivity: Optional[np.ndarray] = None
    ) -> Data:
        """
        Create communication graph from agent states.
        
        Args:
            states: List of agent states
            connectivity: Connectivity matrix (None = fully connected)
        
        Returns:
            PyTorch Geometric Data object
        """
        num_agents = len(states)
        
        # Node features (agent states)
        x = torch.FloatTensor(np.array(states)).to(self.device)
        
        # Edge connectivity
        if connectivity is not None:
            edge_index = []
            for i in range(num_agents):
                for j in range(num_agents):
                    if connectivity[i][j] > 0:
                        edge_index.append([i, j])
            edge_index = torch.LongTensor(edge_index).t().contiguous().to(self.device)
        else:
            # Fully connected
            edge_index = []
            for i in range(num_agents):
                for j in range(num_agents):
                    if i != j:
                        edge_index.append([i, j])
            edge_index = torch.LongTensor(edge_index).t().contiguous().to(self.device)
        
        return Data(x=x, edge_index=edge_index)
    
    def communicate(
        self,
        states: List[np.ndarray],
        connectivity: Optional[np.ndarray] = None
    ) -> List[np.ndarray]:
        """
        Perform communication between agents.
        
        Args:
            states: List of agent states
            connectivity: Connectivity matrix (None = fully connected)
        
        Returns:
            List of received messages for each agent
        """
        self.communication_gcn.eval()
        
        # Create graph
        graph = self.create_communication_graph(states, connectivity)
        
        with torch.no_grad():
            # Generate messages
            messages = self.communication_gcn(graph.x, graph.edge_index)
        
        # Convert to numpy
        messages_np = messages.cpu().numpy()
        
        return [messages_np[i] for i in range(len(states))]
    
    def train(
        self,
        training_data: List[Dict[str, Any]],
        epochs: int = 100,
        batch_size: int = 32
    ):
        """
        Train communication network.
        
        Args:
            training_data: List of training examples
            epochs: Number of training epochs
            batch_size: Batch size
        """
        logger.info(f"Training GNN communication on {len(training_data)} examples")
        
        self.communication_gcn.train()
        
        for epoch in range(epochs):
            total_loss = 0
            
            for i in range(0, len(training_data), batch_size):
                batch = training_data[i:i+batch_size]
                
                # Placeholder training - would need proper loss function
                # This is a simplified version
                self.optimizer.zero_grad()
                
                # Dummy loss for demonstration
                loss = torch.tensor(0.0, requires_grad=True)
                
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}, Loss: {total_loss / len(training_data):.4f}")
        
        self.is_trained = True
        logger.info("Training completed")
    
    def save(self, filepath: str):
        """Save communication network."""
        torch.save({
            'communication_gcn_state_dict': self.communication_gcn.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'num_agents': self.num_agents,
            'state_dim': self.state_dim,
            'message_dim': self.message_dim
        }, filepath)
    
    def load(self, filepath: str):
        """Load communication network."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.communication_gcn.load_state_dict(checkpoint['communication_gcn_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.is_trained = True

