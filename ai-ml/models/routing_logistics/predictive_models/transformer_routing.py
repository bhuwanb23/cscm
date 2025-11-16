"""
Small Transformers for Routing Predictions

This module implements small transformer models for routing predictions.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
import math

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    import torch.nn.functional as F
    from torch.utils.data import Dataset, DataLoader
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None
    optim = None
    F = None
    Dataset = None
    DataLoader = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PositionalEncoding(nn.Module):
    """Positional encoding for transformer."""
    
    def __init__(self, d_model: int, max_len: int = 100):
        """Initialize positional encoding."""
        super(PositionalEncoding, self).__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        self.register_buffer('pe', pe)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass."""
        x = x + self.pe[:x.size(0), :]
        return x


class TransformerRoutingModel(nn.Module):
    """
    Small transformer model for routing predictions.
    """
    
    def __init__(
        self,
        input_dim: int = 10,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        dim_feedforward: int = 128,
        dropout: float = 0.1,
        max_seq_length: int = 100
    ):
        """
        Initialize transformer routing model.
        
        Args:
            input_dim: Dimension of input features
            d_model: Model dimension
            nhead: Number of attention heads
            num_layers: Number of transformer layers
            dim_feedforward: Feedforward dimension
            dropout: Dropout rate
            max_seq_length: Maximum sequence length
        """
        super(TransformerRoutingModel, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for transformer routing model")
        
        self.d_model = d_model
        
        # Input projection
        self.input_projection = nn.Linear(input_dim, d_model)
        
        # Positional encoding
        self.pos_encoder = PositionalEncoding(d_model, max_seq_length)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=False
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Output layers
        self.output_projection = nn.Linear(d_model, 1)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Input tensor [seq_length, batch_size, input_dim]
            mask: Optional attention mask
        
        Returns:
            Predictions [batch_size, 1]
        """
        # Project input
        x = self.input_projection(x) * math.sqrt(self.d_model)
        
        # Add positional encoding
        x = self.pos_encoder(x)
        
        # Apply dropout
        x = self.dropout(x)
        
        # Transformer encoder
        x = self.transformer_encoder(x, mask=mask)
        
        # Use last time step
        x = x[-1]  # [batch_size, d_model]
        
        # Output projection
        output = self.output_projection(x)
        
        return output


class TransformerRoutingPredictor:
    """
    Transformer-based routing predictor.
    """
    
    def __init__(
        self,
        input_dim: int = 10,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        learning_rate: float = 0.001,
        device: Optional[str] = None
    ):
        """
        Initialize transformer routing predictor.
        
        Args:
            input_dim: Dimension of input features
            d_model: Model dimension
            nhead: Number of attention heads
            num_layers: Number of transformer layers
            learning_rate: Learning rate
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for transformer routing predictor")
        
        self.input_dim = input_dim
        self.d_model = d_model
        self.nhead = nhead
        self.num_layers = num_layers
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.model = TransformerRoutingModel(
            input_dim=input_dim,
            d_model=d_model,
            nhead=nhead,
            num_layers=num_layers
        ).to(self.device)
        
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        self.criterion = nn.MSELoss()
        self.is_trained = False
    
    def train(
        self,
        sequences: np.ndarray,
        targets: np.ndarray,
        epochs: int = 100,
        batch_size: int = 32,
        validation_split: float = 0.2
    ):
        """
        Train transformer routing model.
        
        Args:
            sequences: Input sequences [num_samples, seq_length, input_dim]
            targets: Target values [num_samples]
            epochs: Number of training epochs
            batch_size: Batch size
            validation_split: Validation split ratio
        """
        logger.info(f"Training transformer routing model on {len(sequences)} samples")
        
        # Convert to tensors
        sequences = torch.FloatTensor(sequences)
        targets = torch.FloatTensor(targets)
        
        # Split data
        split_idx = int(len(sequences) * (1 - validation_split))
        train_sequences = sequences[:split_idx]
        train_targets = targets[:split_idx]
        val_sequences = sequences[split_idx:]
        val_targets = targets[split_idx:]
        
        # Training loop
        self.model.train()
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            # Shuffle training data
            indices = torch.randperm(len(train_sequences))
            train_sequences = train_sequences[indices]
            train_targets = train_targets[indices]
            
            train_loss = 0.0
            num_batches = (len(train_sequences) + batch_size - 1) // batch_size
            
            for i in range(0, len(train_sequences), batch_size):
                batch_sequences = train_sequences[i:i+batch_size]
                batch_targets = train_targets[i:i+batch_size]
                
                # Reshape for transformer: [seq_length, batch_size, input_dim]
                batch_sequences = batch_sequences.transpose(0, 1).to(self.device)
                batch_targets = batch_targets.to(self.device)
                
                # Forward pass
                predictions = self.model(batch_sequences).squeeze()
                loss = self.criterion(predictions, batch_targets)
                
                # Backward pass
                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                
                train_loss += loss.item()
            
            # Validation
            self.model.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for i in range(0, len(val_sequences), batch_size):
                    batch_sequences = val_sequences[i:i+batch_size]
                    batch_targets = val_targets[i:i+batch_size]
                    
                    batch_sequences = batch_sequences.transpose(0, 1).to(self.device)
                    batch_targets = batch_targets.to(self.device)
                    
                    predictions = self.model(batch_sequences).squeeze()
                    loss = self.criterion(predictions, batch_targets)
                    val_loss += loss.item()
            
            self.model.train()
            
            avg_train_loss = train_loss / num_batches
            num_val_batches = (len(val_sequences) + batch_size - 1) // batch_size
            avg_val_loss = val_loss / num_val_batches if num_val_batches > 0 else 0.0
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}, Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
            
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
        
        self.is_trained = True
        logger.info("Training completed")
    
    def predict(self, sequence: np.ndarray) -> float:
        """
        Predict from sequence.
        
        Args:
            sequence: Input sequence [seq_length, input_dim]
        
        Returns:
            Prediction
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        self.model.eval()
        
        sequence_tensor = torch.FloatTensor(sequence).unsqueeze(1).to(self.device)  # [seq_length, 1, input_dim]
        
        with torch.no_grad():
            prediction = self.model(sequence_tensor).squeeze().item()
        
        return prediction
    
    def save(self, filepath: str):
        """Save model."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'input_dim': self.input_dim,
            'd_model': self.d_model,
            'nhead': self.nhead,
            'num_layers': self.num_layers
        }, filepath)
    
    def load(self, filepath: str):
        """Load model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.is_trained = True

