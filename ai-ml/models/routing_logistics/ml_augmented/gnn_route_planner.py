"""
Graph Neural Networks for Route Planning

This module implements GNN-based route planning for logistics optimization.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    F = None

try:
    from torch_geometric.nn import GCNConv, GATConv, MessagePassing
    from torch_geometric.data import Data, Batch
    HAS_TORCH_GEOMETRIC = True
except ImportError:
    HAS_TORCH_GEOMETRIC = False
    GCNConv = None
    GATConv = None
    MessagePassing = None
    Data = None
    Batch = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GCNRoutePlanner(nn.Module):
    """
    Graph Convolutional Network for route planning.
    
    Uses GCN layers to learn node embeddings for routing decisions.
    """
    
    def __init__(
        self,
        input_dim: int = 5,  # x, y, demand, time_window_start, time_window_end
        hidden_dim: int = 64,
        output_dim: int = 1,  # Route score or next node probability
        num_layers: int = 3,
        dropout: float = 0.2
    ):
        """
        Initialize GCN route planner.
        
        Args:
            input_dim: Dimension of node features
            hidden_dim: Hidden dimension
            output_dim: Output dimension
            num_layers: Number of GCN layers
            dropout: Dropout rate
        """
        super(GCNRoutePlanner, self).__init__()
        
        if not HAS_TORCH_GEOMETRIC:
            raise ImportError("torch_geometric is required for GNN route planning")
        
        self.num_layers = num_layers
        self.convs = nn.ModuleList()
        
        # First layer
        self.convs.append(GCNConv(input_dim, hidden_dim))
        
        # Hidden layers
        for _ in range(num_layers - 2):
            self.convs.append(GCNConv(hidden_dim, hidden_dim))
        
        # Output layer
        self.convs.append(GCNConv(hidden_dim, output_dim))
        
        self.dropout = nn.Dropout(dropout)
        self.activation = nn.ReLU()
    
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Node feature matrix [num_nodes, input_dim]
            edge_index: Edge connectivity [2, num_edges]
        
        Returns:
            Node embeddings [num_nodes, output_dim]
        """
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = self.activation(x)
            x = self.dropout(x)
        
        # Final layer
        x = self.convs[-1](x, edge_index)
        
        return x


class GATRoutePlanner(nn.Module):
    """
    Graph Attention Network for route planning.
    
    Uses GAT layers with attention mechanism for routing decisions.
    """
    
    def __init__(
        self,
        input_dim: int = 5,
        hidden_dim: int = 64,
        output_dim: int = 1,
        num_layers: int = 3,
        num_heads: int = 4,
        dropout: float = 0.2
    ):
        """
        Initialize GAT route planner.
        
        Args:
            input_dim: Dimension of node features
            hidden_dim: Hidden dimension
            output_dim: Output dimension
            num_layers: Number of GAT layers
            num_heads: Number of attention heads
            dropout: Dropout rate
        """
        super(GATRoutePlanner, self).__init__()
        
        if not HAS_TORCH_GEOMETRIC:
            raise ImportError("torch_geometric is required for GNN route planning")
        
        self.num_layers = num_layers
        self.convs = nn.ModuleList()
        
        # First layer
        self.convs.append(GATConv(input_dim, hidden_dim, heads=num_heads, dropout=dropout))
        
        # Hidden layers
        for _ in range(num_layers - 2):
            self.convs.append(GATConv(hidden_dim * num_heads, hidden_dim, heads=num_heads, dropout=dropout))
        
        # Output layer (single head)
        self.convs.append(GATConv(hidden_dim * num_heads, output_dim, heads=1, dropout=dropout))
        
        self.dropout = nn.Dropout(dropout)
        self.activation = nn.ReLU()
    
    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Node feature matrix [num_nodes, input_dim]
            edge_index: Edge connectivity [2, num_edges]
        
        Returns:
            Node embeddings [num_nodes, output_dim]
        """
        for i, conv in enumerate(self.convs[:-1]):
            x = conv(x, edge_index)
            x = self.activation(x)
            x = self.dropout(x)
        
        # Final layer
        x = self.convs[-1](x, edge_index)
        
        return x


class GNRoutePlanner:
    """
    Graph Neural Network route planner.
    
    Uses GNNs to learn route planning heuristics from data.
    """
    
    def __init__(
        self,
        model_type: str = 'gcn',  # 'gcn' or 'gat'
        input_dim: int = 5,
        hidden_dim: int = 64,
        num_layers: int = 3,
        learning_rate: float = 0.001,
        device: Optional[str] = None
    ):
        """
        Initialize GNN route planner.
        
        Args:
            model_type: Type of GNN ('gcn' or 'gat')
            input_dim: Dimension of node features
            hidden_dim: Hidden dimension
            num_layers: Number of layers
            learning_rate: Learning rate
            device: Device to use
        """
        if not HAS_TORCH_GEOMETRIC:
            raise ImportError("torch_geometric is required for GNN route planning")
        
        self.model_type = model_type
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Create model
        if model_type == 'gcn':
            self.model = GCNRoutePlanner(
                input_dim=input_dim,
                hidden_dim=hidden_dim,
                output_dim=1,
                num_layers=num_layers
            ).to(self.device)
        elif model_type == 'gat':
            self.model = GATRoutePlanner(
                input_dim=input_dim,
                hidden_dim=hidden_dim,
                output_dim=1,
                num_layers=num_layers
            ).to(self.device)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        self.is_trained = False
    
    def _create_graph(
        self,
        locations: List[Dict[str, Any]],
        distance_matrix: Optional[np.ndarray] = None
    ) -> Data:
        """
        Create graph from locations.
        
        Args:
            locations: List of location dictionaries
            distance_matrix: Distance matrix (optional)
        
        Returns:
            PyTorch Geometric Data object
        """
        num_nodes = len(locations)
        
        # Node features: [x, y, demand, time_window_start, time_window_end]
        node_features = []
        for loc in locations:
            features = [
                loc.get('x', 0.0),
                loc.get('y', 0.0),
                loc.get('demand', 0.0),
                loc.get('time_window_start', 0.0),
                loc.get('time_window_end', float('inf'))
            ]
            node_features.append(features)
        
        x = torch.FloatTensor(node_features)
        
        # Create edges (fully connected or based on distance matrix)
        if distance_matrix is not None:
            # Create edges for nodes within threshold distance
            threshold = np.percentile(distance_matrix[distance_matrix > 0], 50)
            edge_index = []
            for i in range(num_nodes):
                for j in range(num_nodes):
                    if i != j and distance_matrix[i][j] <= threshold:
                        edge_index.append([i, j])
            
            if not edge_index:
                # Fallback to fully connected
                edge_index = [[i, j] for i in range(num_nodes) for j in range(num_nodes) if i != j]
        else:
            # Fully connected graph
            edge_index = [[i, j] for i in range(num_nodes) for j in range(num_nodes) if i != j]
        
        edge_index = torch.LongTensor(edge_index).t().contiguous()
        
        return Data(x=x, edge_index=edge_index)
    
    def predict_next_node(
        self,
        locations: List[Dict[str, Any]],
        current_route: List[int],
        distance_matrix: Optional[np.ndarray] = None
    ) -> int:
        """
        Predict next node in route using GNN.
        
        Args:
            locations: List of location dictionaries
            current_route: Current route (list of visited node indices)
            distance_matrix: Distance matrix (optional)
        
        Returns:
            Next node index
        """
        self.model.eval()
        
        # Create graph
        graph = self._create_graph(locations, distance_matrix)
        graph = graph.to(self.device)
        
        with torch.no_grad():
            # Get node embeddings
            node_embeddings = self.model(graph.x, graph.edge_index)
            
            # Get scores for unvisited nodes
            unvisited = [i for i in range(len(locations)) if i not in current_route]
            
            if not unvisited:
                return -1  # All nodes visited
            
            # Use embeddings to score nodes
            scores = node_embeddings[unvisited].squeeze()
            
            # Select node with highest score
            next_node_idx = unvisited[torch.argmax(scores).item()]
            
            return next_node_idx
    
    def generate_route(
        self,
        locations: List[Dict[str, Any]],
        start_node: int = 0,
        distance_matrix: Optional[np.ndarray] = None
    ) -> List[int]:
        """
        Generate complete route using GNN.
        
        Args:
            locations: List of location dictionaries
            start_node: Starting node index
            distance_matrix: Distance matrix (optional)
        
        Returns:
            Route as list of node indices
        """
        route = [start_node]
        
        while len(route) < len(locations):
            next_node = self.predict_next_node(locations, route, distance_matrix)
            
            if next_node == -1:
                break
            
            route.append(next_node)
        
        return route
    
    def train(
        self,
        training_data: List[Dict[str, Any]],
        epochs: int = 100,
        batch_size: int = 32
    ):
        """
        Train GNN on routing data.
        
        Args:
            training_data: List of training examples with locations and optimal routes
            epochs: Number of training epochs
            batch_size: Batch size
        """
        logger.info(f"Training GNN route planner on {len(training_data)} examples")
        
        self.model.train()
        
        for epoch in range(epochs):
            total_loss = 0
            
            # Simple training loop (would need proper loss function for routing)
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
        """Save model."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'model_type': self.model_type,
            'input_dim': self.input_dim,
            'hidden_dim': self.hidden_dim,
            'num_layers': self.num_layers
        }, filepath)
    
    def load(self, filepath: str):
        """Load model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.is_trained = True

