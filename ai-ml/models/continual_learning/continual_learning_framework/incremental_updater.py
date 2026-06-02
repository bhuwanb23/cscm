"""
Incremental Model Updater for Continual Learning

This module implements incremental updating strategies that allow models
to adapt to new data without full retraining, using techniques such as
elastic weight consolidation and progressive neural networks.
"""

import numpy as np
import logging
from typing import Optional, Dict, Any, List, Tuple
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IncrementalModelUpdater:
    """
    Implements incremental model updating with multiple update strategies
    including full-batch retraining, sliding window, and elastic weight consolidation.
    """

    def __init__(self,
                 model: Any = None,
                 strategy: str = 'sliding_window',
                 window_size: int = 1000,
                 learning_rate: float = 0.01,
                 ewc_lambda: float = 0.4):
        """
        Initialize the incremental model updater.

        Args:
            model: Base model to update incrementally
            strategy: Update strategy ('full_batch', 'sliding_window', 'ewc')
            window_size: Maximum samples to keep for sliding window
            learning_rate: Learning rate for incremental updates
            ewc_lambda: Regularization strength for elastic weight consolidation
        """
        self.base_model = model
        self.strategy = strategy
        self.window_size = window_size
        self.learning_rate = learning_rate
        self.ewc_lambda = ewc_lambda

        self.X_buffer = []
        self.y_buffer = []
        self.total_samples_seen = 0
        self.update_count = 0

        self.weights = None
        self.bias = 0.0
        self.fisher_information = None
        self.optimal_weights = None

    def _init_params(self, n_features: int):
        """Initialize model parameters if not already set."""
        if self.weights is None:
            self.weights = np.random.randn(n_features) * 0.01
        if self.fisher_information is None:
            self.fisher_information = np.zeros(n_features)

    def _compute_fisher(self, X: np.ndarray, y: np.ndarray) -> np.ndarray:
        """Compute Fisher information matrix diagonal for EWC."""
        y_pred = np.dot(X, self.weights) + self.bias
        gradients = (2 / X.shape[0]) * np.dot(X.T, (y_pred - y))
        return gradients ** 2

    def update(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """
        Update the model with a new batch of data using the configured strategy.

        Args:
            X_batch: Input features
            y_batch: Target values

        Returns:
            Dictionary with update metrics
        """
        self._init_params(X_batch.shape[1])
        batch_size = X_batch.shape[0]
        self.total_samples_seen += batch_size

        if self.strategy == 'full_batch':
            metrics = self._update_full_batch(X_batch, y_batch)
        elif self.strategy == 'ewc':
            metrics = self._update_ewc(X_batch, y_batch)
        else:
            metrics = self._update_sliding_window(X_batch, y_batch)

        self.update_count += 1
        metrics['update_count'] = self.update_count
        metrics['total_samples_seen'] = self.total_samples_seen
        return metrics

    def _update_full_batch(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """Update using all data (full batch gradient descent)."""
        y_pred = np.dot(X_batch, self.weights) + self.bias

        dw = (2 / X_batch.shape[0]) * np.dot(X_batch.T, (y_pred - y_batch))
        db = (2 / X_batch.shape[0]) * np.sum(y_pred - y_batch)

        self.weights -= self.learning_rate * dw
        self.bias -= self.learning_rate * db

        mse = np.mean((y_pred - y_batch) ** 2)
        return {
            'strategy': 'full_batch',
            'batch_size': X_batch.shape[0],
            'mse': float(mse),
            'weight_norm': float(np.linalg.norm(self.weights))
        }

    def _update_sliding_window(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """Update using a sliding window of recent data."""
        for x, y in zip(X_batch, y_batch):
            self.X_buffer.append(x)
            self.y_buffer.append(y)

        if len(self.X_buffer) > self.window_size:
            excess = len(self.X_buffer) - self.window_size
            self.X_buffer = self.X_buffer[excess:]
            self.y_buffer = self.y_buffer[excess:]

        X_window = np.array(self.X_buffer)
        y_window = np.array(self.y_buffer)

        y_pred = np.dot(X_window, self.weights) + self.bias

        dw = (2 / X_window.shape[0]) * np.dot(X_window.T, (y_pred - y_window))
        db = (2 / X_window.shape[0]) * np.sum(y_pred - y_window)

        self.weights -= self.learning_rate * dw
        self.bias -= self.learning_rate * db

        mse = np.mean((y_pred - y_window) ** 2)
        return {
            'strategy': 'sliding_window',
            'window_size': len(self.X_buffer),
            'mse': float(mse),
            'weight_norm': float(np.linalg.norm(self.weights))
        }

    def _update_ewc(self, X_batch: np.ndarray, y_batch: np.ndarray) -> Dict[str, Any]:
        """Update using Elastic Weight Consolidation to prevent catastrophic forgetting."""
        if self.optimal_weights is not None:
            prev_weights = self.optimal_weights.copy()

        y_pred = np.dot(X_batch, self.weights) + self.bias

        dw_data = (2 / X_batch.shape[0]) * np.dot(X_batch.T, (y_pred - y_batch))
        db_data = (2 / X_batch.shape[0]) * np.sum(y_pred - y_batch)

        if self.optimal_weights is not None:
            dw_ewc = self.ewc_lambda * self.fisher_information * (self.weights - prev_weights)
            dw = dw_data + dw_ewc
        else:
            dw = dw_data

        db = db_data

        self.weights -= self.learning_rate * dw
        self.bias -= self.learning_rate * db

        fisher = self._compute_fisher(X_batch, y_batch)
        self.fisher_information = (self.fisher_information * (self.total_samples_seen - X_batch.shape[0])
                                   + fisher * X_batch.shape[0]) / self.total_samples_seen

        self.optimal_weights = self.weights.copy()

        mse = np.mean((y_pred - y_batch) ** 2)
        return {
            'strategy': 'ewc',
            'batch_size': X_batch.shape[0],
            'mse': float(mse),
            'ewc_penalty': float(np.sum(self.fisher_information * (self.weights ** 2))) if self.optimal_weights is not None else 0.0,
            'weight_norm': float(np.linalg.norm(self.weights))
        }

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using the current model.

        Args:
            X: Input features

        Returns:
            Predictions
        """
        if self.weights is None:
            return np.zeros(X.shape[0])
        return np.dot(X, self.weights) + self.bias

    def get_state(self) -> Dict[str, Any]:
        """
        Get the current state of the updater.

        Returns:
            Dictionary with current state
        """
        return {
            'strategy': self.strategy,
            'window_size': self.window_size,
            'update_count': self.update_count,
            'total_samples_seen': self.total_samples_seen,
            'buffer_size': len(self.X_buffer),
            'weight_norm': float(np.linalg.norm(self.weights)) if self.weights is not None else 0.0,
        }

    def reset(self):
        """Reset the updater to initial state."""
        self.X_buffer = []
        self.y_buffer = []
        self.total_samples_seen = 0
        self.update_count = 0
        self.weights = None
        self.bias = 0.0
        self.fisher_information = None
        self.optimal_weights = None
        logger.info("IncrementalModelUpdater reset to initial state")


class PyTorchEWC:
    """
    Elastic Weight Consolidation for PyTorch nn.Module.

    Computes per-parameter Fisher information and adds an EWC penalty
    to the loss to prevent catastrophic forgetting.

    Usage:
        model = LSTMModel(...)
        optimizer = torch.optim.Adam(model.parameters())
        ewc = PyTorchEWC(model, optimizer)

        # After training on task A:
        ewc.register_task(dataloader_a)

        # During training on task B:
        loss = ewc.compute_loss(task_b_loss)
        loss.backward()
        optimizer.step()
    """

    def __init__(
        self,
        model: "torch.nn.Module",
        optimizer: "torch.optim.Optimizer",
        ewc_lambda: float = 0.4,
        device: Optional["torch.device"] = None,
    ):
        import torch
        self.model = model
        self.optimizer = optimizer
        self.ewc_lambda = ewc_lambda
        self.device = device or next(model.parameters()).device

        self.fisher_diags: Dict[str, torch.Tensor] = {}
        self.optimal_params: Dict[str, torch.Tensor] = {}
        self._registered = False

    def register_task(self, dataloader: "torch.utils.data.DataLoader", loss_fn: Optional[callable] = None) -> dict:
        """
        Compute Fisher information on a task's data and save optimal params.

        Args:
            dataloader: DataLoader for the task to remember.
            loss_fn: Loss function (default: MSELoss).

        Returns:
            Dict with Fisher diagonal mean and total params count.
        """
        import torch
        self.model.train()
        total_fisher: Dict[str, torch.Tensor] = {}
        n_samples = 0

        for batch in dataloader:
            if isinstance(batch, (list, tuple)):
                X = batch[0].to(self.device)
                y = batch[1].to(self.device) if len(batch) > 1 else None
            else:
                X = batch.to(self.device)
                y = None

            self.optimizer.zero_grad()
            output = self.model(X)

            if y is not None:
                fn = loss_fn or torch.nn.MSELoss()
                loss = fn(output, y)
            else:
                loss = output.norm() ** 2

            loss.backward()

            for name, param in self.model.named_parameters():
                if param.grad is not None:
                    fisher = param.grad ** 2
                    if name not in total_fisher:
                        total_fisher[name] = fisher.detach().clone()
                    else:
                        total_fisher[name] += fisher.detach().clone()

            n_samples += X.shape[0]

        for name in total_fisher:
            total_fisher[name] /= max(n_samples, 1)

        self.fisher_diags = {k: v.clone() for k, v in total_fisher.items()}
        self.optimal_params = {k: p.detach().clone() for k, p in self.model.named_parameters()}
        self._registered = True

        fisher_mean = float(torch.mean(torch.cat([v.flatten() for v in total_fisher.values()])).item())
        return {"fisher_mean": fisher_mean, "n_samples": n_samples, "n_params": len(total_fisher)}

    def compute_ewc_penalty(self) -> "torch.Tensor":
        """Compute the EWC penalty term."""
        import torch
        if not self._registered:
            return torch.zeros(1, device=self.device)

        penalty = torch.zeros(1, device=self.device)
        for name, param in self.model.named_parameters():
            if name in self.fisher_diags and name in self.optimal_params:
                diff = param - self.optimal_params[name]
                penalty += (self.fisher_diags[name] * diff ** 2).sum()

        return 0.5 * self.ewc_lambda * penalty

    def compute_loss(self, task_loss: "torch.Tensor") -> "torch.Tensor":
        """Add EWC penalty to the task loss."""
        return task_loss + self.compute_ewc_penalty()

    def get_state(self) -> dict:
        return {
            "registered": self._registered,
            "ewc_lambda": self.ewc_lambda,
            "n_fisher_params": len(self.fisher_diags),
            "n_optimal_params": len(self.optimal_params),
        }
