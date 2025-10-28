"""
Probabilistic Models for Demand Forecasting

This module implements probabilistic forecasting models for demand forecasting:
- DeepAR
- N-BEATS
- MQRNN
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, Tuple, List
import logging

# Import probabilistic libraries
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    import gluonts
    from gluonts.model.deepar import DeepAREstimator
    from gluonts.model.n_beats import NBEATSEstimator
    from gluonts.mx import Trainer
    from gluonts.dataset.common import ListDataset
    HAS_PYTORCH = True
    HAS_GLUONTS = True
except ImportError:
    HAS_PYTORCH = False
    HAS_GLUONTS = False
    gluonts = None
    DeepAREstimator = None
    NBEATSEstimator = None
    Trainer = None
    ListDataset = None

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeepARModel:
    """DeepAR model for demand forecasting."""
    
    def __init__(self, 
                 freq: str = "D",
                 prediction_length: int = 7,
                 context_length: Optional[int] = None,
                 num_layers: int = 2,
                 num_cells: int = 40,
                 dropout_rate: float = 0.1,
                 epochs: int = 100,
                 **kwargs):
        """
        Initialize DeepAR model.
        
        Args:
            freq: Frequency of the data (e.g., "D" for daily, "H" for hourly)
            prediction_length: Length of the prediction horizon
            context_length: Length of the context window (default: 2 * prediction_length)
            num_layers: Number of RNN layers
            num_cells: Number of RNN cells
            dropout_rate: Dropout rate
            epochs: Number of training epochs
            **kwargs: Additional arguments for DeepAR
        """
        if not HAS_GLUONTS:
            raise ImportError("GluonTS library is not installed")
            
        self.freq = freq
        self.prediction_length = prediction_length
        self.context_length = context_length or 2 * prediction_length
        self.num_layers = num_layers
        self.num_cells = num_cells
        self.dropout_rate = dropout_rate
        self.epochs = epochs
        self.model = None
        self.is_fitted = False
        
        # Store additional parameters
        self.kwargs = kwargs
        
    def _prepare_data(self, data: pd.Series) -> List[Dict]:
        """
        Prepare data for DeepAR model.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            
        Returns:
            List of dictionaries in GluonTS format
        """
        # Convert to GluonTS format
        start_time = data.index[0]
        target = data.values
        
        dataset = [
            {
                "start": start_time,
                "target": target
            }
        ]
        
        return dataset
    
    def fit(self, data: pd.Series, **kwargs) -> 'DeepARModel':
        """
        Fit the DeepAR model to the data.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting DeepAR model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Create GluonTS dataset
        dataset = ListDataset(prepared_data, freq=self.freq)
        
        # Create trainer
        trainer = Trainer(epochs=self.epochs, **self.kwargs.get("trainer_kwargs", {}))
        
        # Create estimator
        self.model = DeepAREstimator(
            freq=self.freq,
            prediction_length=self.prediction_length,
            context_length=self.context_length,
            num_layers=self.num_layers,
            num_cells=self.num_cells,
            dropout_rate=self.dropout_rate,
            trainer=trainer,
            **self.kwargs
        )
        
        # Train model
        self.model.train(dataset)
        
        self.is_fitted = True
        logger.info("DeepAR model fitted successfully")
        return self
    
    def predict(self, data: pd.Series, num_samples: int = 100, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            num_samples: Number of samples to generate for probabilistic forecast
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values (samples x prediction_length)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info("Making predictions with DeepAR model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Create GluonTS dataset
        dataset = ListDataset(prepared_data, freq=self.freq)
        
        # Make predictions
        forecasts = list(self.model.predict(dataset, num_samples=num_samples))
        
        # Extract predictions
        if len(forecasts) > 0:
            # Return samples (each sample is a prediction for the forecast horizon)
            predictions = forecasts[0].samples  # Shape: (num_samples, prediction_length)
            return predictions
        else:
            return np.array([])

class NBEATSModel:
    """N-BEATS model for demand forecasting."""
    
    def __init__(self, 
                 prediction_length: int = 7,
                 context_length: Optional[int] = None,
                 num_stacks: int = 30,
                 num_blocks: int = 1,
                 num_layers: int = 4,
                 layer_widths: int = 512,
                 epochs: int = 100,
                 **kwargs):
        """
        Initialize N-BEATS model.
        
        Args:
            prediction_length: Length of the prediction horizon
            context_length: Length of the context window (default: 2 * prediction_length)
            num_stacks: Number of stacks
            num_blocks: Number of blocks per stack
            num_layers: Number of layers per block
            layer_widths: Width of layers
            epochs: Number of training epochs
            **kwargs: Additional arguments for N-BEATS
        """
        if not HAS_GLUONTS:
            raise ImportError("GluonTS library is not installed")
            
        self.prediction_length = prediction_length
        self.context_length = context_length or 2 * prediction_length
        self.num_stacks = num_stacks
        self.num_blocks = num_blocks
        self.num_layers = num_layers
        self.layer_widths = layer_widths
        self.epochs = epochs
        self.model = None
        self.is_fitted = False
        
        # Store additional parameters
        self.kwargs = kwargs
        
    def _prepare_data(self, data: pd.Series) -> List[Dict]:
        """
        Prepare data for N-BEATS model.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            
        Returns:
            List of dictionaries in GluonTS format
        """
        # Convert to GluonTS format
        start_time = data.index[0]
        target = data.values
        
        dataset = [
            {
                "start": start_time,
                "target": target
            }
        ]
        
        return dataset
    
    def fit(self, data: pd.Series, **kwargs) -> 'NBEATSModel':
        """
        Fit the N-BEATS model to the data.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting N-BEATS model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Create GluonTS dataset
        dataset = ListDataset(prepared_data, freq=getattr(data.index, 'freq', 'D') or 'D')
        
        # Create trainer
        trainer = Trainer(epochs=self.epochs, **self.kwargs.get("trainer_kwargs", {}))
        
        # Create estimator
        self.model = NBEATSEstimator(
            prediction_length=self.prediction_length,
            context_length=self.context_length,
            num_stacks=self.num_stacks,
            num_blocks=self.num_blocks,
            num_layers=self.num_layers,
            layer_widths=self.layer_widths,
            trainer=trainer,
            **self.kwargs
        )
        
        # Train model
        self.model.train(dataset)
        
        self.is_fitted = True
        logger.info("N-BEATS model fitted successfully")
        return self
    
    def predict(self, data: pd.Series, num_samples: int = 100, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            data: Time series data as a pandas Series with datetime index
            num_samples: Number of samples to generate for probabilistic forecast
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values (samples x prediction_length)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info("Making predictions with N-BEATS model")
        
        # Prepare data
        prepared_data = self._prepare_data(data)
        
        # Create GluonTS dataset
        dataset = ListDataset(prepared_data, freq=getattr(data.index, 'freq', 'D') or 'D')
        
        # Make predictions
        forecasts = list(self.model.predict(dataset, num_samples=num_samples))
        
        # Extract predictions
        if len(forecasts) > 0:
            # Return samples (each sample is a prediction for the forecast horizon)
            predictions = forecasts[0].samples  # Shape: (num_samples, prediction_length)
            return predictions
        else:
            return np.array([])

class MQRNNModel(nn.Module):
    """MQRNN (Multi-Quantile Recurrent Neural Network) model for demand forecasting."""
    
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 2, 
                 output_size: int = 1, dropout: float = 0.1, sequence_length: int = 10,
                 quantiles: List[float] = [0.1, 0.5, 0.9]):
        """
        Initialize MQRNN model.
        
        Args:
            input_size: Number of input features
            hidden_size: Number of hidden units
            num_layers: Number of LSTM layers
            output_size: Number of output units
            dropout: Dropout rate
            sequence_length: Length of input sequences
            quantiles: List of quantiles to predict
        """
        super(MQRNNModel, self).__init__()
        
        if not HAS_PYTORCH:
            raise ImportError("PyTorch library is not installed")
            
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_size = output_size
        self.sequence_length = sequence_length
        self.quantiles = quantiles
        
        # LSTM layer
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # Output layers for each quantile
        self.output_layers = nn.ModuleList([
            nn.Linear(hidden_size, output_size) for _ in quantiles
        ])
        
    def forward(self, x):
        """
        Forward pass through the model.
        
        Args:
            x: Input tensor of shape (batch_size, sequence_length, input_size)
            
        Returns:
            Output tensor of shape (batch_size, num_quantiles, output_size)
        """
        # LSTM forward pass
        lstm_out, _ = self.lstm(x)
        
        # Take the last time step output
        last_output = lstm_out[:, -1, :]
        
        # Apply output layers for each quantile
        outputs = []
        for output_layer in self.output_layers:
            output = output_layer(last_output)
            outputs.append(output)
            
        # Stack outputs along a new dimension
        outputs = torch.stack(outputs, dim=1)
        
        return outputs

class ProbabilisticForecaster:
    """Wrapper class for probabilistic forecasting models."""
    
    def __init__(self, model_type: str = 'deepar', device: str = 'cpu', **kwargs):
        """
        Initialize the probabilistic forecaster.
        
        Args:
            model_type: Type of probabilistic model ('deepar', 'nbeats', 'mqrnn')
            device: Device to run the model on ('cpu' or 'cuda')
            **kwargs: Additional arguments for the specific model
        """
        if not (HAS_GLUONTS or HAS_PYTORCH):
            raise ImportError("Required libraries are not installed")
            
        self.model_type = model_type.lower()
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.is_fitted = False
        
        if self.model_type == 'deepar':
            if not HAS_GLUONTS:
                raise ImportError("GluonTS library is required for DeepAR model")
            self.model = DeepARModel(**kwargs)
        elif self.model_type == 'nbeats':
            if not HAS_GLUONTS:
                raise ImportError("GluonTS library is required for N-BEATS model")
            self.model = NBEATSModel(**kwargs)
        elif self.model_type == 'mqrnn':
            if not HAS_PYTORCH:
                raise ImportError("PyTorch library is required for MQRNN model")
            self.model = MQRNNModel(**kwargs)
            self.model.to(self.device)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
    def fit(self, X, y=None, **kwargs) -> 'ProbabilisticForecaster':
        """
        Fit the probabilistic model to the data.
        
        Args:
            X: Feature data (for DeepAR and N-BEATS, this should be a pandas Series with datetime index)
            y: Target data (not used for DeepAR and N-BEATS)
            **kwargs: Additional arguments for training
            
        Returns:
            self: Fitted model
        """
        logger.info(f"Fitting {self.model_type.upper()} model for demand forecasting")
        
        if self.model_type in ['deepar', 'nbeats']:
            # For DeepAR and N-BEATS, X should be a pandas Series with datetime index
            self.model.fit(X, **kwargs)
        elif self.model_type == 'mqrnn':
            # For MQRNN, we need to handle PyTorch training
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
            
            # Define loss function (pinball loss for quantile regression)
            def pinball_loss(y_true, y_pred, quantiles):
                """
                Compute pinball loss for quantile regression.
                """
                losses = []
                for i, q in enumerate(quantiles):
                    errors = y_true - y_pred[:, i, :]
                    losses.append(torch.max(q * errors, (q - 1) * errors))
                return torch.mean(torch.stack(losses))
            
            # Define optimizer
            optimizer = torch.optim.Adam(self.model.parameters(), lr=kwargs.get('learning_rate', 0.001))
            
            # Training loop
            self.model.train()
            epochs = kwargs.get('epochs', 100)
            quantiles = kwargs.get('quantiles', [0.1, 0.5, 0.9])
            
            for epoch in range(epochs):
                total_loss = 0
                for batch_X, batch_y in dataloader:
                    # Forward pass
                    outputs = self.model(batch_X)
                    
                    # Compute pinball loss
                    loss = pinball_loss(batch_y.unsqueeze(1), outputs, quantiles)
                    
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
    
    def predict(self, X, num_samples: int = 100, **kwargs) -> np.ndarray:
        """
        Make predictions using the fitted model.
        
        Args:
            X: Feature data to predict
            num_samples: Number of samples to generate for probabilistic forecast
            **kwargs: Additional arguments for prediction
            
        Returns:
            np.ndarray: Predicted values
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before making predictions")
            
        logger.info(f"Making predictions with {self.model_type.upper()} model")
        
        if self.model_type in ['deepar', 'nbeats']:
            predictions = self.model.predict(X, num_samples=num_samples, **kwargs)
        else:
            # Convert to PyTorch tensor
            X_tensor = torch.FloatTensor(X).to(self.device)
            
            # Make predictions
            self.model.eval()
            with torch.no_grad():
                predictions = self.model(X_tensor)
                
            # Convert back to numpy
            predictions = predictions.cpu().numpy()
            
        return predictions

# Example usage
if __name__ == "__main__":
    # Create sample time series data
    np.random.seed(42)
    n_samples = 1000
    dates = pd.date_range('2023-01-01', periods=n_samples, freq='D')
    # Create a time series with trend and seasonality
    time = np.arange(n_samples)
    trend = 0.02 * time
    seasonal = 10 * np.sin(2 * np.pi * time / 50)  # Seasonal component with period 50
    noise = np.random.normal(0, 1, n_samples)
    data = trend + seasonal + noise
    series = pd.Series(data, index=dates)
    
    # Fit and predict with DeepAR model
    print("=== DeepAR Model ===")
    try:
        deepar_forecaster = ProbabilisticForecaster(model_type='deepar', freq='D', prediction_length=7, epochs=5)
        deepar_forecaster.fit(series)
        deepar_predictions = deepar_forecaster.predict(series, num_samples=50)
        print(f"DeepAR Predictions shape: {deepar_predictions.shape}")
        print(f"DeepAR Predictions (first 5 samples, first 3 time steps): {deepar_predictions[:5, :3]}")
    except Exception as e:
        print(f"Error with DeepAR model: {e}")
    
    # Fit and predict with N-BEATS model
    print("\n=== N-BEATS Model ===")
    try:
        nbeats_forecaster = ProbabilisticForecaster(model_type='nbeats', prediction_length=7, epochs=5)
        nbeats_forecaster.fit(series)
        nbeats_predictions = nbeats_forecaster.predict(series, num_samples=50)
        print(f"N-BEATS Predictions shape: {nbeats_predictions.shape}")
        print(f"N-BEATS Predictions (first 5 samples, first 3 time steps): {nbeats_predictions[:5, :3]}")
    except Exception as e:
        print(f"Error with N-BEATS model: {e}")
    
    # Prepare data for MQRNN
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
    
    # Fit and predict with MQRNN model
    print("\n=== MQRNN Model ===")
    mqrnn_forecaster = ProbabilisticForecaster(model_type='mqrnn', input_size=1, hidden_size=16, num_layers=1, 
                                              quantiles=[0.1, 0.5, 0.9])
    mqrnn_forecaster.fit(X_train, y_train, epochs=20, batch_size=32)
    mqrnn_predictions = mqrnn_forecaster.predict(X_test)
    print(f"MQRNN Predictions shape: {mqrnn_predictions.shape}")
    print(f"MQRNN Predictions (first 5 samples, all quantiles): {mqrnn_predictions[:5, :, 0]}")