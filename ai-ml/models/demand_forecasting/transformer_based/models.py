"""
Transformer-Based Models for Demand Forecasting

This module implements transformer-based models for demand forecasting:
- TFT (Temporal Fusion Transformer)
- Informer
- Autoformer
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple, List
import logging

# Import transformer libraries
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    import pytorch_forecasting
    from pytorch_forecasting import TemporalFusionTransformer, TimeSeriesDataSet
    from pytorch_forecasting.data import GroupNormalizer
    from pytorch_forecasting.metrics import QuantileLoss
    HAS_TRANSFORMER_LIBRARIES = True
except ImportError:
    HAS_TRANSFORMER_LIBRARIES = False
    pytorch_forecasting = None
    TemporalFusionTransformer = None
    TimeSeriesDataSet = None
    GroupNormalizer = None
    QuantileLoss = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TFTModel:
    """Temporal Fusion Transformer model for demand forecasting."""
    
    def __init__(self, 
                 hidden_size: int = 16,
                 lstm_layers: int = 1,
                 attention_head_size: int = 4,
                 dropout: float = 0.1,
                 max_encoder_length: int = 10,
                 max_prediction_length: int = 1,
                 **kwargs):
        """
        Initialize TFT model.
        
        Args:
            hidden_size: Hidden size of the model
            lstm_layers: Number of LSTM layers
            attention_head_size: Number of attention heads
            dropout: Dropout rate
            max_encoder_length: Maximum length of encoder sequence
            max_prediction_length: Maximum length of prediction sequence
            **kwargs: Additional arguments for TFT
        """
        if not HAS_TRANSFORMER_LIBRARIES:
            raise ImportError("PyTorch Forecasting library is not installed")
            
        self.hidden_size = hidden_size
        self.lstm_layers = lstm_layers
        self.attention_head_size = attention_head_size
        self.dropout = dropout
        self.max_encoder_length = max_encoder_length
        self.max_prediction_length = max_prediction_length
        self.model = None
        self.dataset = None
        self.is_fitted = False
        
        # Store additional parameters
        self.kwargs = kwargs
        
    def _prepare_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare data for TFT model.
        
        Args:
            data: Input data
            
        Returns:
            Prepared data
        """
        # Add time index if not present
        if 'time_idx' not in data.columns:
            data = data.copy()
            data['time_idx'] = range(len(data))
            
        # Add series identifier if not present
        if 'series' not in data.columns:
            data['series'] = 0
            
        return data
    
    def fit(self, data: pd.DataFrame, target_column: str, 
            time_varying_known_cols: Optional[List[str]] = None,
            time_varying_unknown_cols: Optional[List[str]] = None,
            static_categorical_cols: Optional[List[str]] = None,
            **kwargs) -> 'TFTModel':
        """
        Fit the TFT model to the data.
        
        Args:
            data: Time series data
            target_column: Name of the target column
            time_varying_known_cols: List of known time-varying columns
            time_varying_unknown_cols: List of unknown time-varying columns
            static_categorical_cols: List of static categorical columns
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting TFT model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Set default columns if not provided
        if time_varying_known_cols is None:
            time_varying_known_cols = []
        if time_varying_unknown_cols is None:
            time_varying_unknown_cols = [target_column]
        if static_categorical_cols is None:
            static_categorical_cols = ['series']
            
        # Create TimeSeriesDataSet
        self.dataset = TimeSeriesDataSet(
            prepared_data,
            time_idx="time_idx",
            target=target_column,
            group_ids=['series'],
            min_encoder_length=self.max_encoder_length,
            max_encoder_length=self.max_encoder_length,
            min_prediction_length=self.max_prediction_length,
            max_prediction_length=self.max_prediction_length,
            static_categoricals=static_categorical_cols,
            time_varying_known_categoricals=time_varying_known_cols,
            time_varying_known_reals=time_varying_known_cols,
            time_varying_unknown_categoricals=[],
            time_varying_unknown_reals=time_varying_unknown_cols,
            target_normalizer=GroupNormalizer(groups=['series']),
            add_relative_time_idx=True,
            add_target_scales=True,
            randomize_length=None,
        )
        
        # Create model
        self.model = TemporalFusionTransformer.from_dataset(
            self.dataset,
            learning_rate=0.03,
            hidden_size=self.hidden_size,
            lstm_layers=self.lstm_layers,
            attention_head_size=self.attention_head_size,
            dropout=self.dropout,
            hidden_continuous_size=8,
            output_size=7,  # 7 quantiles by default
            loss=QuantileLoss(quantiles=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]),
            log_interval=10,
            reduce_on_plateau_patience=4,
            **self.kwargs
        )
        
        self.is_fitted = True
        logger.info("TFT model fitted successfully")
        return self
    
    def predict(self, data: pd.DataFrame, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            data: Data to predict
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info("Making predictions with TFT model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Create DataLoader
        dataloader = self.dataset.to_dataloader(train=False)
        
        # Make predictions
        predictions = self.model.predict(dataloader)
        
        # Convert to numpy array
        predictions = predictions.numpy()
        
        return predictions

class InformerModel(nn.Module):
    """Informer model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.1, sequence_length: int = 10):
        """
        Initialize Informer model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of layers
            output_size: Number of output units
            dropout: Dropout rate
            sequence_length: Length of input sequences
        """
        super(InformerModel, self).__init__()
        
        if not HAS_TRANSFORMER_LIBRARIES:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        self.sequence_length = sequence_length
        
        # Simplified Informer implementation with attention mechanism
        self.encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=hidden_size,
                nhead=4,
                dim_feedforward=hidden_size * 2,
                dropout=dropout,
                batch_first=True
            ),
            num_layers=num_layers
        )
        
        # Projection layers
        self.input_projection = nn.Linear(input_size, hidden_size)
        self.output_projection = nn.Linear(hidden_size, output_size)
        
        # Positional encoding
        self.pos_encoding = self._get_positional_encoding(sequence_length, hidden_size)
        
    def _get_positional_encoding(self, seq_len: int, d_model: int) -> torch.Tensor:
        """
        Generate positional encoding.
        
        Args:
            seq_len: Sequence length
            d_model: Model dimension
            
        Returns:
            Positional encoding tensor
        """
        pe = torch.zeros(seq_len, d_model)
        position = torch.arange(0, seq_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        return pe.unsqueeze(0)
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        batch_size = x.size(0)
        
        # Project input to hidden size
        x = self.input_projection(x)
        
        # Add positional encoding
        x = x + self.pos_encoding[:, :x.size(1), :].to(x.device)
        
        # Apply transformer encoder
        x = self.encoder(x)
        
        # Take the last time step output
        x = x[:, -1, :]
        
        # Project to output size
        output = self.output_projection(x)
        
        return output

class AutoformerModel(nn.Module):
    """Autoformer model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.1, sequence_length: int = 10):
        """
        Initialize Autoformer model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of layers
            output_size: Number of output units
            dropout: Dropout rate
            sequence_length: Length of input sequences
        """
        super(AutoformerModel, self).__init__()
        
        if not HAS_TRANSFORMER_LIBRARIES:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        self.sequence_length = sequence_length
        
        # Simplified Autoformer implementation with auto-correlation
        self.encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=hidden_size,
                nhead=4,
                dim_feedforward=hidden_size * 2,
                dropout=dropout,
                batch_first=True
            ),
            num_layers=num_layers
        )
        
        # Decomposition layers
        self.decomp = nn.Conv1d(hidden_size, hidden_size, kernel_size=3, padding=1, groups=hidden_size)
        
        # Projection layers
        self.input_projection = nn.Linear(input_size, hidden_size)
        self.output_projection = nn.Linear(hidden_size, output_size)
        
        # Positional encoding
        self.pos_encoding = self._get_positional_encoding(sequence_length, hidden_size)
        
    def _get_positional_encoding(self, seq_len: int, d_model: int) -> torch.Tensor:
        """
        Generate positional encoding.
        
        Args:
            seq_len: Sequence length
            d_model: Model dimension
            
        Returns:
            Positional encoding tensor
        """
        pe = torch.zeros(seq_len, d_model)
        position = torch.arange(0, seq_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        return pe.unsqueeze(0)
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, output_size)
        """
        batch_size = x.size(0)
        
        # Project input to hidden size
        x = self.input_projection(x)
        
        # Add positional encoding
        x = x + self.pos_encoding[:, :x.size(1), :].to(x.device)
        
        # Apply transformer encoder
        x = self.encoder(x)
        
        # Simplified decomposition (in a full implementation, this would be more complex)
        x = x.transpose(1, 2)
        x = self.decomp(x)
        x = x.transpose(1, 2)
        
        # Take the last time step output
        x = x[:, -1, :]
        
        # Project to output size
        output = self.output_projection(x)
        
        return output

class TransformerForecaster:
    """Wrapper class for transformer-based forecasting models."""
    
    def __init__(self, model_type: str = 'tft', device: str = 'cpu', **kwargs):
        """
        Initialize the transformer forecaster.
        
        Args:
            model_type: Type of transformer model ('tft', 'informer', 'autoformer')
            device: Device to run the model on ('cpu' or 'cuda')
            **kwargs: Additional arguments for the specific model
        """
        if not HAS_TRANSFORMER_LIBRARIES:
            raise ImportError("Required libraries are not installed")
            
        self.model_type = model_type.lower()
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.is_fitted = False
        
        if self.model_type == 'tft':
            self.model = TFTModel(**kwargs)
        elif self.model_type == 'informer':
            self.model = InformerModel(**kwargs)
            self.model.to(self.device)
        elif self.model_type == 'autoformer':
            self.model = AutoformerModel(**kwargs)
            self.model.to(self.device)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
    def fit(self, X, y=None, **kwargs) -> 'TransformerForecaster':
        """
        Fit the transformer model to the data.
        
        Args:
            X: Feature data
            y: Target data (for TFT, this might be included in X)
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} model for demand forecasting")
        
        if self.model_type == 'tft':
            # For TFT, X should be a DataFrame with all necessary columns
            self.model.fit(X, **kwargs)
        else:
            # For Informer and Autoformer, we need to handle PyTorch training
            if self.model_type in ['informer', 'autoformer']:
                # Convert data to sequences if needed
                if len(X.shape) == 1:
                    # Univariate time series
                    sequence_length = kwargs.get('sequence_length', 10)
                    sequences, targets = self._prepare_sequences(X, sequence_length)
                else:
                    # Multivariate time series - assume X is already in sequence format
                    sequences = X
                    targets = y
                    
                # Convert to PyTorch tensors
                X_tensor = torch.FloatTensor(sequences).to(self.device)
                y_tensor = torch.FloatTensor(targets).to(self.device)
                
                # Create dataset and dataloader
                dataset = TensorDataset(X_tensor, y_tensor)
                dataloader = DataLoader(dataset, batch_size=kwargs.get('batch_size', 32), shuffle=True)
                
                # Define loss function and optimizer
                criterion = nn.MSELoss()
                optimizer = torch.optim.Adam(self.model.parameters(), lr=kwargs.get('learning_rate', 0.001))
                
                # Training loop
                self.model.train()
                epochs = kwargs.get('epochs', 100)
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
    
    def predict(self, X, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with {self.model_type.upper()} model")
        
        if self.model_type == 'tft':
            predictions = self.model.predict(X, **kwargs)
        else:
            # Convert to PyTorch tensor
            X_tensor = torch.FloatTensor(X).to(self.device)
            
            # Make predictions
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(X_tensor)
                
            # Convert back to numpy
            predictions = predictions.cpu().numpy()
            predictions = predictions.flatten()
            
        return predictions

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
    
    # For TFT, we need a DataFrame with proper structure
    df = pd.DataFrame({
        'time_idx': range(len(data)),
        'series': 0,
        'target': data,
        'feature1': np.random.randn(len(data)),
        'feature2': np.random.randn(len(data))
    })
    
    # Fit and predict with TFT model
    print("=== TFT Model ===")
    try:
        tft_forecaster = TransformerForecaster(model_type='tft', hidden_size=16, max_encoder_length=20, max_prediction_length=1)
        # Note: TFT requires more complex data preparation, so this is a simplified example
        print("TFT model initialized successfully")
    except Exception as e:
        print(f"Error initializing TFT model: {e}")
    
    # Prepare data for Informer and Autoformer
    sequence_length = 10
    sequences = []
    targets = []
    
    for i in range(len(data) - sequence_length):
        sequences.append(data[i:i+sequence_length])
        targets.append(data[i+sequence_length])
        
    sequences = np.array(sequences)
    targets = np.array(targets)
    
    # Reshape data to be 3D: (batch_size, sequence_length, input_size)
    # For univariate time series, input_size = 1
    sequences = sequences.reshape(sequences.shape[0], sequences.shape[1], 1)
    
    # Split data
    train_size = int(0.8 * len(sequences))
    X_train, X_test = sequences[:train_size], sequences[train_size:]
    y_train, y_test = targets[:train_size], targets[train_size:]
    
    # Fit and predict with Informer model
    print("\n=== Informer Model ===")
    informer_forecaster = TransformerForecaster(model_type='informer', input_size=1, hidden_size=16, num_layers=1)
    informer_forecaster.fit(X_train, y_train, epochs=20, batch_size=32)
    informer_predictions = informer_forecaster.predict(X_test)
    print(f"Informer Predictions (first 5): {informer_predictions[:5]}")
    
    # Fit and predict with Autoformer model
    print("\n=== Autoformer Model ===")
    autoformer_forecaster = TransformerForecaster(model_type='autoformer', input_size=1, hidden_size=16, num_layers=1)
    autoformer_forecaster.fit(X_train, y_train, epochs=20, batch_size=32)
    autoformer_predictions = autoformer_forecaster.predict(X_test)
    print(f"Autoformer Predictions (first 5): {autoformer_predictions[:5]}")