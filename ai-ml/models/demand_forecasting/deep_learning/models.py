"""
Deep Learning Models for Demand Forecasting

This module implements deep learning models for demand forecasting:
- LSTM/GRU models
- Seq2Seq models
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple, List
import logging

# Import deep learning libraries
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    torch = None
    nn = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LSTMModel(nn.Module):
    """LSTM model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.2):
        """
        Initialize LSTM model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of LSTM layers
            output_size: Number of output units
            dropout: Dropout rate
        """
        super(LSTMModel, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        
        # LSTM layer
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Dropout layer
        self.dropout = nn.Dropout(dropout)
        
        # Output layer
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        # LSTM forward pass
        lstm_out, _ = self.lstm(x)
        
        # Take the last time step output
        last_output = lstm_out[:, -1, :]
        
        # Apply dropout
        last_output = self.dropout(last_output)
        
        # Linear output layer
        output = self.fc(last_output)
        
        return output

class GRUModel(nn.Module):
    """GRU model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.2):
        """
        Initialize GRU model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of GRU layers
            output_size: Number of output units
            dropout: Dropout rate
        """
        super(GRUModel, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        
        # GRU layer
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Dropout layer
        self.dropout = nn.Dropout(dropout)
        
        # Output layer
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        # GRU forward pass
        gru_out, _ = self.gru(x)
        
        # Take the last time step output
        last_output = gru_out[:, -1, :]
        
        # Apply dropout
        last_output = self.dropout(last_output)
        
        # Linear output layer
        output = self.fc(last_output)
        
        return output

class Seq2SeqModel(nn.Module):
    """Seq2Seq model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.2, sequence_length: int = 10):
        """
        Initialize Seq2Seq model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of layers
            output_size: Number of output units
            dropout: Dropout rate
            sequence_length: Length of input sequences
        """
        super(Seq2SeqModel, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        self.sequence_length = sequence_length
        
        # Encoder
        self.encoder = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Decoder
        self.decoder = nn.LSTM(
            input_size=output_size,  # We'll use the output size as input to decoder
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Output layer
        self.fc = nn.Linear(hidden_size, output_size)
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        batch_size = x.size(0)
        
        # Encoder
        _, (hidden, cell) = self.encoder(x)
        
        # Decoder initial input (zeros)
        decoder_input = torch.zeros(batch_size, 1, self.output_size, device=x.device)
        
        # Decoder initial hidden state from encoder
        decoder_hidden = hidden
        decoder_cell = cell
        
        # Generate output for one time step
        decoder_output, (decoder_hidden, decoder_cell) = self.decoder(decoder_input, (decoder_hidden, decoder_cell))
        
        # Linear output layer
        output = self.fc(decoder_output[:, -1, :])
        
        return output

class DeepLearningForecaster:
    """Wrapper class for deep learning forecasting models."""
    
    def __init__(self, model_type: str = 'lstm', device: str = 'cpu', **kwargs):
        """
        Initialize the deep learning forecaster.
        
        Args:
            model_type: Type of deep learning model ('lstm', 'gru', 'seq2seq')
            device: Device to run the model on ('cpu' or 'cuda')
            **kwargs: Additional arguments for the specific model
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch library is not installed")
            
        self.model_type = model_type.lower()
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.is_fitted = False
        self.input_size = kwargs.get('input_size', 1)
        self.sequence_length = kwargs.get('sequence_length', 10)
        
        if self.model_type == 'lstm':
            self.model = LSTMModel(**kwargs)
        elif self.model_type == 'gru':
            self.model = GRUModel(**kwargs)
        elif self.model_type == 'seq2seq':
            self.model = Seq2SeqModel(**kwargs)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        # Move model to device
        self.model.to(self.device)
        
    def _prepare_sequences(self, data: np.ndarray, sequence_length: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare sequences for training.
        
        Args:
            data: Input data array
            sequence_length: Length of sequences
            
        Returns:
            Tuple of (sequences, targets)
        """
        sequences = []
        targets = []
        
        for i in range(len(data) - sequence_length):
            sequences.append(data[i:i+sequence_length])
            targets.append(data[i+sequence_length])
            
        return np.array(sequences), np.array(targets)
    
    def fit(self, X: np.ndarray, y: np.ndarray, epochs: int = 100, batch_size: int = 32, 
            learning_rate: float = 0.001, **kwargs) -> 'DeepLearningForecaster':
        """
        Fit the deep learning model to the data.
        
        Args:
            X: Feature data (should be time series data)
            y: Target data
            epochs: Number of training epochs
            batch_size: Batch size for training
            learning_rate: Learning rate for optimizer
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} model for demand forecasting")
        
        # Convert data to sequences if needed
        if len(X.shape) == 1:
            # Univariate time series
            sequences, targets = self._prepare_sequences(X, self.sequence_length)
        else:
            # Multivariate time series - assume X is already in sequence format
            sequences = X
            targets = y
            
        # Convert to PyTorch tensors
        X_tensor = torch.FloatTensor(sequences).to(self.device)
        y_tensor = torch.FloatTensor(targets).to(self.device)
        
        # Create dataset and dataloader
        dataset = TensorDataset(X_tensor, y_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
        
        # Define loss function and optimizer
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate)
        
        # Training loop
        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_X, batch_y in dataloader:
                # Forward pass
                outputs = self.model(batch_X)
                loss = criterion(outputs.squeeze(), batch_y)
                
                # Backward pass and optimization
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                total_loss += loss.item()
            
            if (epoch + 1) % 20 == 0:
                logger.info(f'Epoch [{epoch+1}/{epochs}], Loss: {total_loss/len(dataloader):.4f}')
        
        self.is_fitted = True
        logger.info(f"{self.model_type.upper()} model fitted successfully")
        return self
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with {self.model_type.upper()} model on {len(X)} samples")
        
        # Convert to PyTorch tensor
        X_tensor = torch.FloatTensor(X).to(self.device)
        
        # Make predictions
        self.model.eval()
        with torch.no_grad():
            predictions = self.model(X_tensor)
            
        # Convert back to numpy
        predictions = predictions.cpu().numpy()
        return predictions.flatten()

# Example usage
if __name__ == "__main__":
    # Create sample time series data
    np.random.seed(42)
    n_samples = 1000
    # Create a time series with trend and seasonality
    time = np.arange(n_samples)
    trend = 0.02 * time
    seasonal = 10 * np.sin(2 * np.pi * time / 50)  # Seasonal component with period 50
    noise = np.random.normal(0, 1, n_samples)
    data = trend + seasonal + noise
    
    # Prepare data for training (univariate time series)
    sequence_length = 10
    sequences = []
    targets = []
    
    for i in range(len(data) - sequence_length):
        sequences.append(data[i:i+sequence_length])
        targets.append(data[i+sequence_length])
        
    sequences = np.array(sequences)
    targets = np.array(targets)
    
    # Split data
    train_size = int(0.8 * len(sequences))
    X_train, X_test = sequences[:train_size], sequences[train_size:]
    y_train, y_test = targets[:train_size], targets[train_size:]
    
    # Fit and predict with LSTM model
    print("=== LSTM Model ===")
    lstm_forecaster = DeepLearningForecaster(model_type='lstm', input_size=1, hidden_size=32, num_layers=2)
    lstm_forecaster.fit(X_train, y_train, epochs=50, batch_size=32)
    lstm_predictions = lstm_forecaster.predict(X_test)
    print(f"LSTM Predictions (first 5): {lstm_predictions[:5]}")
    
    # Fit and predict with GRU model
    print("\n=== GRU Model ===")
    gru_forecaster = DeepLearningForecaster(model_type='gru', input_size=1, hidden_size=32, num_layers=2)
    gru_forecaster.fit(X_train, y_train, epochs=50, batch_size=32)
    gru_predictions = gru_forecaster.predict(X_test)
    print(f"GRU Predictions (first 5): {gru_predictions[:5]}")
    
    # Fit and predict with Seq2Seq model
    print("\n=== Seq2Seq Model ===")
    seq2seq_forecaster = DeepLearningForecaster(model_type='seq2seq', input_size=1, hidden_size=32, num_layers=2, sequence_length=10)
    seq2seq_forecaster.fit(X_train, y_train, epochs=50, batch_size=32)
    seq2seq_predictions = seq2seq_forecaster.predict(X_test)
    print(f"Seq2Seq Predictions (first 5): {seq2seq_predictions[:5]}")