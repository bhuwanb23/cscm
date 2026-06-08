"""
Compressed State Summary Exchange

This module implements compressed state summary exchange for efficient
multi-agent communication.
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StateCompressor(nn.Module):
    """State compression network."""
    
    def __init__(
        self,
        input_dim: int,
        compressed_dim: int,
        hidden_dims: List[int] = [128, 64]
    ):
        """Initialize state compressor."""
        super(StateCompressor, self).__init__()
        
        layers = []
        current_dim = input_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(current_dim, hidden_dim))
            layers.append(nn.ReLU())
            current_dim = hidden_dim
        
        layers.append(nn.Linear(current_dim, compressed_dim))
        
        self.encoder = nn.Sequential(*layers)
    
    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Compress state."""
        return self.encoder(state)


class StateDecompressor(nn.Module):
    """State decompression network."""
    
    def __init__(
        self,
        compressed_dim: int,
        output_dim: int,
        hidden_dims: List[int] = [64, 128]
    ):
        """Initialize state decompressor."""
        super(StateDecompressor, self).__init__()
        
        layers = []
        current_dim = compressed_dim
        
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(current_dim, hidden_dim))
            layers.append(nn.ReLU())
            current_dim = hidden_dim
        
        layers.append(nn.Linear(current_dim, output_dim))
        
        self.decoder = nn.Sequential(*layers)
    
    def forward(self, compressed: torch.Tensor) -> torch.Tensor:
        """Decompress state."""
        return self.decoder(compressed)


class CompressedStateExchange:
    """
    Compressed state summary exchange for multi-agent communication.
    
    Implements compression and decompression of agent states for efficient
    communication in multi-agent systems.
    """
    
    def __init__(
        self,
        state_dim: int,
        compressed_dim: int = 16,
        learning_rate: float = 0.001,
        device: Optional[str] = None
    ):
        """
        Initialize compressed state exchange.
        
        Args:
            state_dim: Dimension of original state
            compressed_dim: Dimension of compressed state
            learning_rate: Learning rate
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for compressed state exchange")
        
        self.state_dim = state_dim
        self.compressed_dim = compressed_dim
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        # Compressor and decompressor
        self.compressor = StateCompressor(state_dim, compressed_dim).to(self.device)
        self.decompressor = StateDecompressor(compressed_dim, state_dim).to(self.device)
        
        # Optimizer
        params = list(self.compressor.parameters()) + list(self.decompressor.parameters())
        self.optimizer = optim.Adam(params, lr=learning_rate)
        
        self.is_trained = False
    
    def compress_state(self, state: np.ndarray) -> np.ndarray:
        """
        Compress state.
        
        Args:
            state: Original state
        
        Returns:
            Compressed state
        """
        self.compressor.eval()
        
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            compressed = self.compressor(state_tensor)
        
        return compressed.cpu().numpy()[0]
    
    def decompress_state(self, compressed: np.ndarray) -> np.ndarray:
        """
        Decompress state.
        
        Args:
            compressed: Compressed state
        
        Returns:
            Decompressed state
        """
        self.decompressor.eval()
        
        compressed_tensor = torch.FloatTensor(compressed).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            decompressed = self.decompressor(compressed_tensor)
        
        return decompressed.cpu().numpy()[0]
    
    def compress_states(self, states: List[np.ndarray]) -> List[np.ndarray]:
        """
        Compress multiple states.
        
        Args:
            states: List of original states
        
        Returns:
            List of compressed states
        """
        return [self.compress_state(state) for state in states]
    
    def decompress_states(self, compressed_states: List[np.ndarray]) -> List[np.ndarray]:
        """
        Decompress multiple states.
        
        Args:
            compressed_states: List of compressed states
        
        Returns:
            List of decompressed states
        """
        return [self.decompress_state(compressed) for compressed in compressed_states]
    
    def train(
        self,
        states: np.ndarray,
        epochs: int = 100,
        batch_size: int = 32
    ):
        """
        Train compressor and decompressor.
        
        Args:
            states: Training states
            epochs: Number of training epochs
            batch_size: Batch size
        """
        logger.info(f"Training state compression on {len(states)} states")
        
        self.compressor.train()
        self.decompressor.train()
        
        states_tensor = torch.FloatTensor(states).to(self.device)
        
        for epoch in range(epochs):
            total_loss = 0
            num_batches = (len(states) + batch_size - 1) // batch_size
            
            for i in range(0, len(states), batch_size):
                batch = states_tensor[i:i+batch_size]
                
                # Forward pass
                compressed = self.compressor(batch)
                decompressed = self.decompressor(compressed)
                
                # Reconstruction loss
                loss = F.mse_loss(decompressed, batch)
                
                # Update
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                total_loss += loss.item()
            
            if epoch % 10 == 0:
                avg_loss = total_loss / num_batches
                logger.info(f"Epoch {epoch}, Loss: {avg_loss:.4f}")
        
        self.is_trained = True
        logger.info("Training completed")
    
    def get_compression_ratio(self) -> float:
        """
        Get compression ratio.
        
        Returns:
            Compression ratio (compressed_dim / state_dim)
        """
        return self.compressed_dim / self.state_dim
    
    def save(self, filepath: str):
        """Save compressor and decompressor."""
        torch.save({
            'compressor_state_dict': self.compressor.state_dict(),
            'decompressor_state_dict': self.decompressor.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'state_dim': self.state_dim,
            'compressed_dim': self.compressed_dim
        }, filepath)
    
    def load(self, filepath: str):
        """Load compressor and decompressor."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.compressor.load_state_dict(checkpoint['compressor_state_dict'])
        self.decompressor.load_state_dict(checkpoint['decompressor_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.is_trained = True

