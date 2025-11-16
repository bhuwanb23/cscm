"""
LSTM-based ETA Models

This module implements LSTM models for Estimated Time of Arrival (ETA) prediction.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging

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


class ETADataset(Dataset):
    """Dataset for ETA prediction."""
    
    def __init__(self, sequences: np.ndarray, targets: np.ndarray):
        """
        Initialize dataset.
        
        Args:
            sequences: Input sequences [num_samples, seq_length, features]
            targets: Target ETAs [num_samples]
        """
        self.sequences = torch.FloatTensor(sequences)
        self.targets = torch.FloatTensor(targets)
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        return self.sequences[idx], self.targets[idx]


class LSTMETAModel(nn.Module):
    """
    LSTM model for ETA prediction.
    """
    
    def __init__(
        self,
        input_dim: int = 10,  # Features per time step
        hidden_dim: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2,
        output_dim: int = 1  # ETA prediction
    ):
        """
        Initialize LSTM ETA model.
        
        Args:
            input_dim: Dimension of input features
            hidden_dim: Hidden dimension
            num_layers: Number of LSTM layers
            dropout: Dropout rate
            output_dim: Output dimension
        """
        super(LSTMETAModel, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for LSTM ETA model")
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_dim,
            hidden_dim,
            num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Output layer
        self.fc = nn.Linear(hidden_dim, output_dim)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            x: Input tensor [batch_size, seq_length, input_dim]
        
        Returns:
            ETA predictions [batch_size, output_dim]
        """
        # LSTM forward
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # Use last hidden state
        last_hidden = h_n[-1]  # [batch_size, hidden_dim]
        
        # Apply dropout
        last_hidden = self.dropout(last_hidden)
        
        # Output layer
        output = self.fc(last_hidden)
        
        return output


class LSTMETAPredictor:
    """
    LSTM-based ETA predictor.
    """
    
    def __init__(
        self,
        input_dim: int = 10,
        hidden_dim: int = 64,
        num_layers: int = 2,
        learning_rate: float = 0.001,
        device: Optional[str] = None
    ):
        """
        Initialize LSTM ETA predictor.
        
        Args:
            input_dim: Dimension of input features
            hidden_dim: Hidden dimension
            num_layers: Number of LSTM layers
            learning_rate: Learning rate
            device: Device to use
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for LSTM ETA predictor")
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.model = LSTMETAModel(
            input_dim=input_dim,
            hidden_dim=hidden_dim,
            num_layers=num_layers
        ).to(self.device)
        
        self.optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        self.criterion = nn.MSELoss()
        self.is_trained = False
    
    def _prepare_sequences(
        self,
        data: pd.DataFrame,
        sequence_length: int = 10,
        target_column: str = 'eta'
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare sequences for LSTM training.
        
        Args:
            data: Input data
            sequence_length: Length of input sequences
            target_column: Target column name
        
        Returns:
            Tuple of (sequences, targets)
        """
        # Extract features (excluding target)
        feature_columns = [col for col in data.columns if col != target_column]
        features = data[feature_columns].values
        
        # Extract targets
        targets = data[target_column].values
        
        sequences = []
        sequence_targets = []
        
        for i in range(len(data) - sequence_length):
            seq = features[i:i+sequence_length]
            target = targets[i+sequence_length-1]
            
            sequences.append(seq)
            sequence_targets.append(target)
        
        return np.array(sequences), np.array(sequence_targets)
    
    def train(
        self,
        data: pd.DataFrame,
        sequence_length: int = 10,
        target_column: str = 'eta',
        epochs: int = 100,
        batch_size: int = 32,
        validation_split: float = 0.2
    ):
        """
        Train LSTM ETA model.
        
        Args:
            data: Training data
            sequence_length: Length of input sequences
            target_column: Target column name
            epochs: Number of training epochs
            batch_size: Batch size
            validation_split: Validation split ratio
        """
        logger.info(f"Training LSTM ETA model on {len(data)} samples")
        
        # Prepare sequences
        sequences, targets = self._prepare_sequences(data, sequence_length, target_column)
        
        # Split data
        split_idx = int(len(sequences) * (1 - validation_split))
        train_sequences = sequences[:split_idx]
        train_targets = targets[:split_idx]
        val_sequences = sequences[split_idx:]
        val_targets = targets[split_idx:]
        
        # Create datasets
        train_dataset = ETADataset(train_sequences, train_targets)
        val_dataset = ETADataset(val_sequences, val_targets)
        
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Training loop
        self.model.train()
        best_val_loss = float('inf')
        
        for epoch in range(epochs):
            train_loss = 0.0
            
            for batch_sequences, batch_targets in train_loader:
                batch_sequences = batch_sequences.to(self.device)
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
                for batch_sequences, batch_targets in val_loader:
                    batch_sequences = batch_sequences.to(self.device)
                    batch_targets = batch_targets.to(self.device)
                    
                    predictions = self.model(batch_sequences).squeeze()
                    loss = self.criterion(predictions, batch_targets)
                    val_loss += loss.item()
            
            self.model.train()
            
            avg_train_loss = train_loss / len(train_loader)
            avg_val_loss = val_loss / len(val_loader)
            
            if epoch % 10 == 0:
                logger.info(f"Epoch {epoch}, Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}")
            
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
        
        self.is_trained = True
        logger.info("Training completed")
    
    def predict(
        self,
        sequence: np.ndarray
    ) -> float:
        """
        Predict ETA from sequence.
        
        Args:
            sequence: Input sequence [seq_length, input_dim]
        
        Returns:
            Predicted ETA
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        self.model.eval()
        
        sequence_tensor = torch.FloatTensor(sequence).unsqueeze(0).to(self.device)
        
        with torch.no_grad():
            prediction = self.model(sequence_tensor).squeeze().item()
        
        return prediction
    
    def save(self, filepath: str):
        """Save model."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
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

