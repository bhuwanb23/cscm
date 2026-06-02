"""
LSTM-based Sequence Anomaly Detector

Implements LSTM networks for detecting anomalies in time series sequences.
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
    raise ImportError("PyTorch required for this module. Install with: pip install torch")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LSTMAnomalyDetector:
    """
    LSTM-based sequence anomaly detector.
    
    Uses LSTM to learn normal sequence patterns and detect anomalies.
    """
    
    def __init__(
        self,
        sequence_length: int = 10,
        hidden_size: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2,
        learning_rate: float = 0.001,
        batch_size: int = 32,
        epochs: int = 50,
        device: Optional[str] = None
    ):
        """
        Initialize LSTM anomaly detector.
        
        Args:
            sequence_length: Length of input sequences
            hidden_size: LSTM hidden size
            num_layers: Number of LSTM layers
            dropout: Dropout rate
            learning_rate: Learning rate
            batch_size: Batch size
            epochs: Number of training epochs
            device: Device ('cpu' or 'cuda')
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch is required for LSTM anomaly detector")
        
        self.sequence_length = sequence_length
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.dropout = dropout
        self.learning_rate = learning_rate
        self.batch_size = batch_size
        self.epochs = epochs
        
        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)
        
        self.model: Optional[nn.Module] = None
        self.scaler = None
        self.is_fitted = False
        self.feature_names: Optional[List[str]] = None
        self.anomaly_threshold: Optional[float] = None
        self.input_dim: Optional[int] = None
    
    def _create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences from time series data.
        
        Args:
            data: Time series data (n_samples, n_features)
        
        Returns:
            Tuple of (X_sequences, y_sequences)
        """
        X, y = [], []
        
        for i in range(len(data) - self.sequence_length):
            X.append(data[i:i + self.sequence_length])
            y.append(data[i + self.sequence_length])
        
        return np.array(X), np.array(y)
    
    def fit(
        self,
        X: np.ndarray,
        feature_names: Optional[List[str]] = None,
        validation_split: float = 0.2
    ):
        """
        Fit the LSTM model.
        
        Args:
            X: Training data (n_samples, n_features)
            feature_names: Optional list of feature names
            validation_split: Validation split ratio
        """
        logger.info(f"Fitting LSTM Anomaly Detector with {X.shape[0]} samples and {X.shape[1]} features")
        
        # Store feature names
        self.feature_names = feature_names
        self.input_dim = X.shape[1]
        
        # Scale features
        from sklearn.preprocessing import StandardScaler
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Create sequences
        X_seq, y_seq = self._create_sequences(X_scaled)
        
        # Create model
        self.model = nn.LSTM(
            input_size=self.input_dim,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers,
            dropout=self.dropout if self.num_layers > 1 else 0,
            batch_first=True
        ).to(self.device)
        
        # Output layer
        self.fc = nn.Linear(self.hidden_size, self.input_dim).to(self.device)
        
        # Split data
        split_idx = int(len(X_seq) * (1 - validation_split))
        X_train = X_seq[:split_idx]
        y_train = y_seq[:split_idx]
        X_val = X_seq[split_idx:]
        y_val = y_seq[split_idx:]
        
        # Convert to tensors
        train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.FloatTensor(y_train))
        val_dataset = TensorDataset(torch.FloatTensor(X_val), torch.FloatTensor(y_val))
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=self.batch_size, shuffle=False)
        
        # Training
        criterion = nn.MSELoss()
        optimizer = optim.Adam(
            list(self.model.parameters()) + list(self.fc.parameters()),
            lr=self.learning_rate
        )
        
        best_val_loss = float('inf')
        
        for epoch in range(self.epochs):
            # Training
            self.model.train()
            self.fc.train()
            train_loss = 0.0
            
            for batch_X, batch_y in train_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                optimizer.zero_grad()
                lstm_out, _ = self.model(batch_X)
                # Take last output
                last_output = lstm_out[:, -1, :]
                pred = self.fc(last_output)
                loss = criterion(pred, batch_y)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
            
            # Validation
            self.model.eval()
            self.fc.eval()
            val_loss = 0.0
            
            with torch.no_grad():
                for batch_X, batch_y in val_loader:
                    batch_X = batch_X.to(self.device)
                    batch_y = batch_y.to(self.device)
                    
                    lstm_out, _ = self.model(batch_X)
                    last_output = lstm_out[:, -1, :]
                    pred = self.fc(last_output)
                    loss = criterion(pred, batch_y)
                    val_loss += loss.item()
            
            train_loss /= len(train_loader)
            val_loss /= len(val_loader)
            
            if val_loss < best_val_loss:
                best_val_loss = val_loss
            
            if (epoch + 1) % 10 == 0:
                logger.info(f"Epoch {epoch+1}/{self.epochs}, Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
        
        # Set anomaly threshold (95th percentile of training prediction errors)
        self.model.eval()
        self.fc.eval()
        with torch.no_grad():
            X_seq_tensor = torch.FloatTensor(X_seq).to(self.device)
            lstm_out, _ = self.model(X_seq_tensor)
            last_output = lstm_out[:, -1, :]
            pred = self.fc(last_output)
            prediction_errors = torch.mean((torch.FloatTensor(y_seq).to(self.device) - pred) ** 2, dim=1).cpu().numpy()
            self.anomaly_threshold = np.percentile(prediction_errors, 95)
        
        self.is_fitted = True
        logger.info(f"LSTM Anomaly Detector fitted successfully. Anomaly threshold: {self.anomaly_threshold:.4f}")
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict anomalies in sequences.
        
        Args:
            X: Data to predict (n_samples, n_features)
        
        Returns:
            Array of predictions: 1 for normal, -1 for anomaly
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Create sequences
        X_seq, y_seq = self._create_sequences(X_scaled)
        
        # Get prediction errors
        self.model.eval()
        self.fc.eval()
        with torch.no_grad():
            X_seq_tensor = torch.FloatTensor(X_seq).to(self.device)
            lstm_out, _ = self.model(X_seq_tensor)
            last_output = lstm_out[:, -1, :]
            pred = self.fc(last_output)
            prediction_errors = torch.mean((torch.FloatTensor(y_seq).to(self.device) - pred) ** 2, dim=1).cpu().numpy()
        
        # Predict based on threshold
        predictions = np.where(prediction_errors > self.anomaly_threshold, -1, 1)
        
        # Pad with normal predictions for the first sequence_length samples
        predictions = np.concatenate([np.ones(self.sequence_length), predictions])
        
        return predictions[:len(X)]
    
    def detect_anomalies(
        self,
        X: np.ndarray,
        threshold: Optional[float] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Detect anomalies with detailed information.
        
        Args:
            X: Data to analyze (n_samples, n_features)
            threshold: Optional custom threshold
        
        Returns:
            Tuple of (predictions, scores, info_dict)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before detection")
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Create sequences
        X_seq, y_seq = self._create_sequences(X_scaled)
        
        # Get prediction errors
        self.model.eval()
        self.fc.eval()
        with torch.no_grad():
            X_seq_tensor = torch.FloatTensor(X_seq).to(self.device)
            lstm_out, _ = self.model(X_seq_tensor)
            last_output = lstm_out[:, -1, :]
            pred = self.fc(last_output)
            prediction_errors = torch.mean((torch.FloatTensor(y_seq).to(self.device) - pred) ** 2, dim=1).cpu().numpy()
        
        # Use threshold
        if threshold is None:
            threshold = self.anomaly_threshold
        
        # Predict
        predictions = np.where(prediction_errors > threshold, -1, 1)
        
        # Pad with normal predictions
        predictions = np.concatenate([np.ones(self.sequence_length), predictions])
        prediction_errors = np.concatenate([np.zeros(self.sequence_length), prediction_errors])
        
        predictions = predictions[:len(X)]
        prediction_errors = prediction_errors[:len(X)]
        
        # Get anomaly indices
        anomaly_indices = np.where(predictions == -1)[0]
        
        # Normalize scores
        if prediction_errors.max() > prediction_errors.min():
            scores_normalized = (prediction_errors - prediction_errors.min()) / (
                prediction_errors.max() - prediction_errors.min() + 1e-8
            )
        else:
            scores_normalized = np.zeros_like(prediction_errors)
        anomaly_probs = scores_normalized
        
        info = {
            'num_anomalies': len(anomaly_indices),
            'anomaly_rate': len(anomaly_indices) / len(X),
            'anomaly_indices': anomaly_indices.tolist(),
            'prediction_errors': prediction_errors.tolist(),
            'anomaly_probs': anomaly_probs.tolist(),
            'mean_error': float(np.mean(prediction_errors)),
            'std_error': float(np.std(prediction_errors)),
            'threshold': float(threshold)
        }
        
        return predictions, prediction_errors, info
    
    def save(self, filepath: str):
        """Save model to file."""
        if not self.is_fitted:
            raise ValueError("Model must be fitted before saving")
        
        model_data = {
            'model_state_dict': self.model.state_dict(),
            'fc_state_dict': self.fc.state_dict(),
            'scaler': self.scaler,
            'sequence_length': self.sequence_length,
            'hidden_size': self.hidden_size,
            'num_layers': self.num_layers,
            'dropout': self.dropout,
            'anomaly_threshold': self.anomaly_threshold,
            'input_dim': self.input_dim,
            'is_fitted': self.is_fitted,
            'feature_names': self.feature_names
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Model saved to {filepath}")
    
    def load(self, filepath: str):
        """Load model from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        # Recreate model
        self.model = nn.LSTM(
            input_size=model_data['input_dim'],
            hidden_size=model_data['hidden_size'],
            num_layers=model_data['num_layers'],
            dropout=model_data['dropout'] if model_data['num_layers'] > 1 else 0,
            batch_first=True
        ).to(self.device)
        
        self.fc = nn.Linear(model_data['hidden_size'], model_data['input_dim']).to(self.device)
        
        self.model.load_state_dict(model_data['model_state_dict'])
        self.fc.load_state_dict(model_data['fc_state_dict'])
        self.scaler = model_data['scaler']
        self.sequence_length = model_data['sequence_length']
        self.hidden_size = model_data['hidden_size']
        self.num_layers = model_data['num_layers']
        self.dropout = model_data['dropout']
        self.anomaly_threshold = model_data['anomaly_threshold']
        self.input_dim = model_data['input_dim']
        self.is_fitted = model_data['is_fitted']
        self.feature_names = model_data['feature_names']
        
        logger.info(f"Model loaded from {filepath}")

