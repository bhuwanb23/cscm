"""
Autoencoder-based Anomaly Detector

Implements autoencoder neural networks for anomaly detection.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
import pickle

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    raise ImportError("PyTorch is required for this module. Install with: pip install torch")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Autoencoder(nn.Module):
    """Autoencoder neural network."""
    
    def __init__(
        self,
        input_dim: int,
        encoding_dim: int = 32,
        hidden_dims: List[int] = [64, 32],
        activation: str = 'relu',
        dropout: float = 0.2
    ):
        """
        Initialize autoencoder.
        
        Args:
            input_dim: Input dimension
            encoding_dim: Encoding dimension (bottleneck)
            hidden_dims: Hidden layer dimensions
            activation: Activation function ('relu', 'tanh', 'sigmoid')
            dropout: Dropout rate
        """
        super(Autoencoder, self).__init__()
        
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for autoencoder")
        
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        
        # Activation function
        if activation == 'relu':
            self.activation = nn.ReLU()
        elif activation == 'tanh':
            self.activation = nn.Tanh()
        elif activation == 'sigmoid':
            self.activation = nn.Sigmoid()
        else:
            self.activation = nn.ReLU()
        
        # Encoder
        encoder_layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_dims:
            encoder_layers.append(nn.Linear(prev_dim, hidden_dim))
            encoder_layers.append(self.activation)
            encoder_layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        encoder_layers.append(nn.Linear(prev_dim, encoding_dim))
        self.encoder = nn.Sequential(*encoder_layers)
        
        # Decoder
        decoder_layers = []
        prev_dim = encoding_dim
        
        for hidden_dim in reversed(hidden_dims):
            decoder_layers.append(nn.Linear(prev_dim, hidden_dim))
            decoder_layers.append(self.activation)
            decoder_layers.append(nn.Dropout(dropout))
            prev_dim = hidden_dim
        
        decoder_layers.append(nn.Linear(prev_dim, input_dim))
        self.decoder = nn.Sequential(*decoder_layers)
    
    def forward(self, x):
        """Forward pass."""
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded


class AutoencoderDetector:
    """
    Autoencoder-based anomaly detector.
    
    Uses reconstruction error to identify anomalies.
    """
    
    def __init__(
        self,
        encoding_dim: int = 32,
        hidden_dims: List[int] = [64, 32],
        activation: str = 'relu',
        dropout: float = 0.2,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        epochs: int = 50,
        device: Optional[str] = None
    ):
        """
        Initialize autoencoder detector.
        
        Args:
            encoding_dim: Encoding dimension
            hidden_dims: Hidden layer dimensions
            activation: Activation function
            dropout: Dropout rate
            learning_rate: Learning rate
            batch_size: Batch size
            epochs: Number of training epochs
            device: Device ('cpu' or 'cuda')
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for autoencoder detector")
        
        self.encoding_dim = encoding_dim
        self.hidden_dims = hidden_dims
        self.activation = activation
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.model: Optional[Autoencoder] = None
        self.scaler = None
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
        self.reconstruction_threshold: Optional[float] = None
    
    def fit(
        self,
        X: np.ndarray,
        feature_names: Optional[List[str]] = None,
        validation_split: float = 0.2
    ):
        """
        Fit the autoencoder model.
        
        Args:
            X: Training data (n_samples, n_features)
            feature_names: Optional list of feature names
            validation_split: Validation split ratio
        """
        logger.info(f"Fitting Autoencoder with {X.shape[0]} samples and {X.shape[1]} features")
        
        # Store feature names
        self.feature_names = feature_names
        
        # Scale features
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Create model
        self.model = Autoencoder(
            input_dim=X.shape[1],
            encoding_dim=self.encoding_dim,
            hidden_dims=self.hidden_dims,
            activation=self.activation,
            dropout=self.dropout
        ).to(self.device)
        
        # Split data
        split_idx = int(len(X_scaled) * (1 - validation_split))
        X_train = X_scaled[:split_idx]
        X_val = X_scaled[split_idx:]
        
        # Convert to tensors
        train_dataset = TensorDataset(torch.FloatTensor(X_train))
        val_dataset = TensorDataset(torch.FloatTensor(X_val))
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=self.batch_size, shuffle=False)
        
        # Training
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=self.learning_rate)
        
        best_val_loss = float('inf')
        
        for epoch in range(self.epochs):
            # Training
            self.model.train()
            train_loss = 0.0
            
            for batch in train_loader:
                x = batch[0].to(self.device)
                
                optimizer.zero_grad()
                reconstructed = self.model(x)
                loss = criterion(reconstructed, x)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
            
            # Validation
            self.model.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for batch in val_loader:
                    x = batch[0].to(self.device)
                    reconstructed = self.model(x)
                    loss = criterion(reconstructed, x)
                    val_loss += loss.item()
            
            train_loss /= len(train_loader)
            val_loss /= len(val_loader)
            
            if val_loss < best_val_loss:
                best_val_loss = val_loss
            
            if (epoch + 1) % 10 == 0:
                logger.info(f"Epoch {epoch+1}/{self.epochs}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
        
        # Set reconstruction threshold (95th percentile of training reconstruction errors)
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X_scaled).to(self.device)
            reconstructed = self.model(X_tensor)
            reconstruction_errors = torch.mean((X_tensor - reconstructed) ** 2, dim=1).cpu().numpy()
            self.reconstruction_threshold = np.percentile(reconstruction_errors, 95)
        
        self.is_fitted = True
        logger.info(f"Autoencoder fitted successfully. Reconstruction threshold: {self.reconstruction_threshold:.4f}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomalies.
        
        Args:
            X: Data to predict (n_samples, n_features)
        
        Returns:
            Array of predictions: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get reconstruction errors
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X_scaled).to(self.device)
            reconstructed = self.model(X_tensor)
            reconstruction_errors = torch.mean((X_tensor - reconstructed) ** 2, dim=1).cpu().numpy()
        
        # Predict based on threshold
        predictions = np.where(reconstruction_errors > self.reconstruction_threshold, -1, 1)
        
        return predictions
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies with detailed information.
        
        Args:
            X: Data to analyze (n_samples, n_features)
            threshold: Optional custom threshold for reconstruction errors
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get reconstruction errors
        self.model.eval()
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X_scaled).to(self.device)
            reconstructed = self.model(X_tensor)
            reconstruction_errors = torch.mean((X_tensor - reconstructed) ** 2, dim=1).cpu().numpy()
        
        # Use threshold
        if threshold is None:
            threshold = self.reconstruction_threshold
        
        # Predict
        predictions = np.where(reconstruction_errors > threshold, -1, 1)
        
        # Get anomaly indices
        anomaly_indices = np.where(predictions == -1)[0]
        
        # Normalize scores
        scores_normalized = (reconstruction_errors - reconstruction_errors.min()) / (
            reconstruction_errors.max() - reconstruction_errors.min() + 1e-8
        )
        anomaly_probs = scores_normalized
        
        info = {
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(X),
            'anomaly_indices': anomaly_indices.tolist(),
            'reconstruction_errors': reconstruction_errors.tolist(),
            'anomaly_probs': anomaly_probs.tolist(),
            'mean_error': float(np.mean(reconstruction_errors)),
            'std_error': float(np.std(reconstruction_errors)),
            'threshold': float(threshold)
        }
        
        return predictions, reconstruction_errors, info
    
    def save(self, filepath: str):
        """
        Save model to file.
        
        Args:
            filepath: Path to save model
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before saving")
        
        model_data = {
            'model_state_dict': self.model.state_dict(),
            'scaler': self.scaler,
            'encoding_dim': self.encoding_dim,
            'hidden_dims': self.hidden_dims,
            'activation': self.activation,
            'dropout': self.dropout,
            'reconstruction_threshold': self.reconstruction_threshold,
            'input_dim': self.model.input_dim,
            'is_fitted': self.is_fitted,
            'feature_names': self.feature_names
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """
        Load model from file.
        
        Args:
            filepath: Path to load model from
        """
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        # Recreate model
        self.model = Autoencoder(
            input_dim=model_data['input_dim'],
            encoding_dim=model_data['encoding_dim'],
            hidden_dims=model_data['hidden_dims'],
            activation=model_data['activation'],
            dropout=model_data['dropout']
        ).to(self.device)
        
        self.model.load_state_dict(model_data['model_state_dict'])
        self.scaler = model_data['scaler']
        self.encoding_dim = model_data['encoding_dim']
        self.hidden_dims = model_data['hidden_dims']
        self.activation = model_data['activation']
        self.dropout = model_data['dropout']
        self.reconstruction_threshold = model_data['reconstruction_threshold']
        self.is_fitted = model_data['is_fitted']
        self.feature_names = model_data['feature_names']
        
        logger.info(f"Model loaded from {filepath}")

