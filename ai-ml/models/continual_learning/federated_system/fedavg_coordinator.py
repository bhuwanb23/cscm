"""
Federated Averaging Coordinator for Federated Learning

This module implements the Federated Averaging (FedAvg) algorithm for
distributed model training across multiple supply chain nodes while
preserving data locality and privacy.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FederatedAveragingCoordinator:
    """
    Coordinates federated learning across multiple client nodes using
    the Federated Averaging (FedAvg) algorithm.
    """

    def __init__(self,
                 n_features: int,
                 fraction_fit: float = 1.0,
                 min_clients: int = 2,
                 num_rounds: int = 10,
                 local_epochs: int = 5,
                 learning_rate: float = 0.01):
        """
        Initialize the federated averaging coordinator.

        Args:
            n_features: Number of input features
            fraction_fit: Fraction of clients used per round
            min_clients: Minimum clients required for training
            num_rounds: Number of federated training rounds
            local_epochs: Number of local training epochs per client
            learning_rate: Learning rate for local updates
        """
        self.n_features = n_features
        self.fraction_fit = fraction_fit
        self.min_clients = min_clients
        self.num_rounds = num_rounds
        self.local_epochs = local_epochs
        self.learning_rate = learning_rate

        self.global_weights = np.random.randn(n_features) * 0.01
        self.global_bias = 0.0
        self.clients = {}
        self.round_history = []
        self.coordinator_id = str(uuid.uuid4())[:8]

    def register_client(self, client_id: str, n_samples: int = 0) -> Dict[str, Any]:
        """
        Register a client for federated learning.

        Args:
            client_id: Unique client identifier
            n_samples: Number of samples the client has

        Returns:
            Dictionary with registration status
        """
        if client_id in self.clients:
            logger.warning(f"Client {client_id} already registered, updating")
        self.clients[client_id] = {
            'n_samples': n_samples,
            'registered_at': datetime.now().isoformat(),
            'rounds_participated': 0,
        }
        logger.info(f"Client {client_id} registered (samples: {n_samples})")
        return {'status': 'registered', 'client_id': client_id}

    def _select_clients(self) -> List[str]:
        """Select a subset of clients for this round."""
        available = list(self.clients.keys())
        if len(available) < self.min_clients:
            logger.warning(f"Only {len(available)} clients, need {self.min_clients}")
            return available
        n_select = max(int(len(available) * self.fraction_fit), self.min_clients)
        selected = list(np.random.choice(available, size=min(n_select, len(available)), replace=False))
        return selected

    def _local_train(self,
                     X: np.ndarray,
                     y: np.ndarray,
                     weights: np.ndarray,
                     bias: float) -> Dict[str, Any]:
        """Perform local training on client data."""
        local_weights = weights.copy()
        local_bias = bias

        for _ in range(self.local_epochs):
            y_pred = np.dot(X, local_weights) + local_bias
            dw = (2 / X.shape[0]) * np.dot(X.T, (y_pred - y))
            db = (2 / X.shape[0]) * np.sum(y_pred - y)
            local_weights -= self.learning_rate * dw
            local_bias -= self.learning_rate * db

        mse = np.mean((np.dot(X, local_weights) + local_bias - y) ** 2)
        return {
            'weights': local_weights,
            'bias': local_bias,
            'mse': float(mse),
            'n_samples': X.shape[0],
        }

    def training_round(self, client_data: Dict[str, Dict[str, np.ndarray]]) -> Dict[str, Any]:
        """
        Execute one round of federated averaging.

        Args:
            client_data: Dictionary mapping client_id to {'X': features, 'y': targets}

        Returns:
            Dictionary with round results
        """
        selected_clients = self._select_clients()
        if len(selected_clients) < self.min_clients:
            return {
                'round': len(self.round_history) + 1,
                'status': 'skipped',
                'reason': f'Need {self.min_clients} clients, have {len(selected_clients)}',
                'selected_clients': selected_clients,
            }

        logger.info(f"Round {len(self.round_history) + 1}: {len(selected_clients)} clients selected")

        client_updates = []
        total_samples = 0

        for client_id in selected_clients:
            if client_id not in client_data:
                logger.warning(f"Client {client_id} selected but no data provided")
                continue

            data = client_data[client_id]
            result = self._local_train(
                data['X'], data['y'],
                self.global_weights.copy(),
                self.global_bias
            )
            client_updates.append(result)
            total_samples += result['n_samples']
            self.clients[client_id]['rounds_participated'] += 1
            self.clients[client_id]['n_samples'] = result['n_samples']

        if not client_updates:
            return {
                'round': len(self.round_history) + 1,
                'status': 'failed',
                'reason': 'No valid client updates',
                'selected_clients': selected_clients,
            }

        aggregated_weights = np.zeros_like(self.global_weights)
        aggregated_bias = 0.0
        avg_mse = 0.0

        for update in client_updates:
            weight = update['n_samples'] / total_samples
            aggregated_weights += weight * update['weights']
            aggregated_bias += weight * update['bias']
            avg_mse += weight * update['mse']

        self.global_weights = aggregated_weights
        self.global_bias = aggregated_bias

        round_result = {
            'round': len(self.round_history) + 1,
            'status': 'completed',
            'num_clients': len(client_updates),
            'total_samples': total_samples,
            'avg_mse': avg_mse,
            'selected_clients': selected_clients,
            'weight_norm': float(np.linalg.norm(self.global_weights)),
        }
        self.round_history.append(round_result)
        return round_result

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Make predictions using the current global model.

        Args:
            X: Input features

        Returns:
            Predictions
        """
        return np.dot(X, self.global_weights) + self.global_bias

    def get_global_model(self) -> Dict[str, Any]:
        """
        Get the current global model state.

        Returns:
            Dictionary with global model parameters
        """
        return {
            'weights': self.global_weights.tolist(),
            'bias': float(self.global_bias),
            'n_features': self.n_features,
            'rounds_completed': len(self.round_history),
            'num_clients': len(self.clients),
        }

    def get_status(self) -> Dict[str, Any]:
        """
        Get the federated system status.

        Returns:
            Dictionary with system status
        """
        return {
            'coordinator_id': self.coordinator_id,
            'num_clients': len(self.clients),
            'rounds_completed': len(self.round_history),
            'fraction_fit': self.fraction_fit,
            'min_clients': self.min_clients,
            'clients': {
                cid: info
                for cid, info in self.clients.items()
            },
            'last_round': self.round_history[-1] if self.round_history else None,
        }


if __name__ == "__main__":
    np.random.seed(42)
    coordinator = FederatedAveragingCoordinator(n_features=5, num_rounds=5)

    for client_id in ["warehouse_a", "warehouse_b", "warehouse_c", "warehouse_d"]:
        coordinator.register_client(client_id, n_samples=200)

    for round_idx in range(3):
        client_data = {}
        for client_id in coordinator.clients:
            n = 50
            X = np.random.randn(n, 5)
            y = np.sum(X[:, :2], axis=1) + np.random.randn(n) * 0.1
            client_data[client_id] = {'X': X, 'y': y}

        result = coordinator.training_round(client_data)
        print(f"Round {result['round']}: MSE={result.get('avg_mse', 0):.4f}, "
              f"Clients={result.get('num_clients', 0)}, Status={result['status']}")

    X_test = np.random.randn(5, 5)
    preds = coordinator.predict(X_test)
    print(f"Test predictions: {preds}")
