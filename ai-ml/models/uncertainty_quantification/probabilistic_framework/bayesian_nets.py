"""
Bayesian Neural Networks for Uncertainty Quantification

This module implements Bayesian neural networks to estimate uncertainty
in deep learning models through Monte Carlo dropout and variational inference.
"""

import numpy as np
import logging
from typing import Tuple, Optional, Dict, Any

HAS_TF = False
try:
    import tensorflow as tf
    from tensorflow_probability import distributions as tfd
    import tensorflow_probability as tfp
    HAS_TF = True
except ImportError:
    tf = None
    tfd = None
    tfp = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BayesianNeuralNetwork:
    """
    Bayesian Neural Network implementation using Monte Carlo dropout
    for uncertainty quantification.
    """
    
    def __init__(self, 
                 input_dim: int, 
                 hidden_dims: list = [64, 32], 
                 activation: str = 'relu',
                 dropout_rate: float = 0.1,
                 num_mc_samples: int = 100):
        """
        Initialize the Bayesian Neural Network.
        
        Args:
            input_dim: Dimension of input features
            hidden_dims: List of hidden layer dimensions
            activation: Activation function for hidden layers
            dropout_rate: Dropout rate for uncertainty estimation
            num_mc_samples: Number of Monte Carlo samples for uncertainty
        """
        self.input_dim = input_dim
        self.hidden_dims = hidden_dims
        self.activation = activation
        self.dropout_rate = dropout_rate
        self.num_mc_samples = num_mc_samples
        self.model = None
        self._build_model()
        
    def _build_model(self):
        """Build the Bayesian neural network model."""
        if not HAS_TF:
            raise ImportError("TensorFlow and TensorFlow Probability are required for BayesianNeuralNetwork. "
                            "Install with: pip install tensorflow tensorflow-probability")
        inputs = tf.keras.Input(shape=(self.input_dim,))
        x = inputs
        
        # Hidden layers with dropout for uncertainty
        for dim in self.hidden_dims:
            x = tf.keras.layers.Dense(dim, activation=self.activation)(x)
            x = tf.keras.layers.Dropout(self.dropout_rate)(x, training=True)  # Always on for MC dropout
        
        # Output layer (for regression, we output mean and log-variance)
        mean_output = tf.keras.layers.Dense(1, name='mean')(x)
        log_var_output = tf.keras.layers.Dense(1, name='log_var')(x)
        
        self.model = tf.keras.Model(inputs=inputs, outputs=[mean_output, log_var_output])
        
        # Compile the model
        self.model.compile(
            optimizer='adam',
            loss=self._negative_log_likelihood_loss,
            metrics=['mae']
        )
        
    def _negative_log_likelihood_loss(self, y_true, y_pred):
        """Custom loss function incorporating aleatoric uncertainty."""
        mean_pred, log_var_pred = y_pred
        precision = tf.math.exp(-log_var_pred)
        return tf.reduce_mean(precision * (y_true - mean_pred)**2 + log_var_pred)
        
    def fit(self, X_train: np.ndarray, y_train: np.ndarray, 
            epochs: int = 100, batch_size: int = 32, validation_split: float = 0.2):
        """
        Train the Bayesian neural network.
        
        Args:
            X_train: Training features
            y_train: Training targets
            epochs: Number of training epochs
            batch_size: Training batch size
            validation_split: Fraction of data to use for validation
        """
        logger.info("Training Bayesian Neural Network...")
        history = self.model.fit(
            X_train, [y_train, y_train],  # Both outputs get same target
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=0
        )
        logger.info("Training completed.")
        return history
    
    def predict_with_uncertainty(self, X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Make predictions with uncertainty estimates using Monte Carlo dropout.
        
        Args:
            X: Input features
            
        Returns:
            Tuple of (mean_predictions, epistemic_uncertainty, aleatoric_uncertainty)
        """
        # Run multiple forward passes to collect predictions
        mc_predictions = []
        for _ in range(self.num_mc_samples):
            mean_preds, log_var_preds = self.model(X, training=True)  # Enable dropout
            mc_predictions.append([mean_preds.numpy(), log_var_preds.numpy()])
        
        # Convert to arrays
        mc_means = np.array([pred[0] for pred in mc_predictions])
        mc_log_vars = np.array([pred[1] for pred in mc_predictions])
        
        # Calculate statistics
        mean_prediction = np.mean(mc_means, axis=0).flatten()
        epistemic_uncertainty = np.var(mc_means, axis=0).flatten()  # Uncertainty from model
        aleatoric_uncertainty = np.mean(np.exp(mc_log_vars), axis=0).flatten()  # Data uncertainty
        
        return mean_prediction, epistemic_uncertainty, aleatoric_uncertainty
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make standard predictions (mean of posterior predictive).
        
        Args:
            X: Input features
            
        Returns:
            Mean predictions
        """
        mean_pred, _ = self.model(X)
        return mean_pred.numpy().flatten()


if __name__ == "__main__":
    # Example usage
    np.random.seed(42)
    tf.random.set_seed(42)
    
    # Generate synthetic data
    n_samples = 1000
    X = np.random.randn(n_samples, 5)
    y = np.sum(X[:, :2], axis=1) + np.random.randn(n_samples) * 0.1
    
    # Create and train model
    bnn = BayesianNeuralNetwork(input_dim=5, hidden_dims=[32, 16])
    bnn.fit(X, y, epochs=50)
    
    # Make predictions with uncertainty
    X_test = X[:10]  # First 10 samples
    means, epistemic, aleatoric = bnn.predict_with_uncertainty(X_test)
    
    print("Predictions with uncertainty:")
    for i in range(len(means)):
        total_uncertainty = epistemic[i] + aleatoric[i]
        print(f"Sample {i+1}: Pred = {means[i]:.3f}, "
              f"Total Uncertainty = {total_uncertainty:.3f}")