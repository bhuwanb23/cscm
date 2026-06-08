"""
Distributed Training Manager for Federated Learning

This module orchestrates local model training across federated clients,
handling model synchronization, partial updates, and fault tolerance
in distributed supply chain environments.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Callable, Tuple
from datetime import datetime, timedelta
import uuid
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LocalTrainer:
    """
    Handles local model training for a single federated client with
    support for multiple optimizers and partial update handling.
    """

    def __init__(self,
                 client_id: str,
                 learning_rate: float = 0.01,
                 local_epochs: int = 5,
                 batch_size: int = 32):
        self.client_id = client_id
        self.learning_rate = learning_rate
        self.local_epochs = local_epochs
        self.batch_size = batch_size
        self.update_count = 0
        self.total_samples_trained = 0
        self.training_history: List[Dict[str, Any]] = []

    def train(self,
              X: np.ndarray,
              y: np.ndarray,
              initial_weights: np.ndarray,
              initial_bias: float) -> Dict[str, Any]:
        n_samples = X.shape[0]
        weights = initial_weights.copy()
        bias = initial_bias

        indices = np.arange(n_samples)
        epoch_losses = []

        for epoch in range(self.local_epochs):
            np.random.shuffle(indices)
            epoch_loss = 0.0
            n_batches = 0

            for start in range(0, n_samples, self.batch_size):
                batch_idx = indices[start:start + self.batch_size]
                X_batch = X[batch_idx]
                y_batch = y[batch_idx]

                y_pred = np.dot(X_batch, weights) + bias
                loss = np.mean((y_pred - y_batch) ** 2)
                epoch_loss += loss
                n_batches += 1

                dw = (2 / X_batch.shape[0]) * np.dot(X_batch.T, (y_pred - y_batch))
                db = (2 / X_batch.shape[0]) * np.sum(y_pred - y_batch)
                weights -= self.learning_rate * dw
                bias -= self.learning_rate * db

            epoch_losses.append(float(epoch_loss / max(n_batches, 1)))

        self.update_count += 1
        self.total_samples_trained += n_samples

        result = {
            'client_id': self.client_id,
            'weights': weights,
            'bias': bias,
            'epoch_losses': epoch_losses,
            'final_loss': epoch_losses[-1] if epoch_losses else 0.0,
            'n_samples': n_samples,
            'update_number': self.update_count,
        }
        self.training_history.append(result)
        return result

    def get_status(self) -> Dict[str, Any]:
        return {
            'client_id': self.client_id,
            'updates_performed': self.update_count,
            'total_samples_trained': self.total_samples_trained,
            'learning_rate': self.learning_rate,
        }


class TrainingManager:
    """
    Orchestrates distributed training across multiple clients with
    fault tolerance and partial update handling.
    """

    def __init__(self,
                 n_features: int,
                 min_clients: int = 2,
                 timeout_seconds: int = 300,
                 max_retries: int = 3):
        self.n_features = n_features
        self.min_clients = min_clients
        self.timeout = timedelta(seconds=timeout_seconds)
        self.max_retries = max_retries

        self.trainers: Dict[str, LocalTrainer] = {}
        self.global_weights = np.random.randn(n_features) * 0.01
        self.global_bias = 0.0
        self.round_results: List[Dict[str, Any]] = []
        self.failed_clients: Dict[str, int] = {}

    def register_client(self, client_id: str, learning_rate: float = 0.01,
                        local_epochs: int = 5) -> Dict[str, Any]:
        if client_id in self.trainers:
            logger.warning(f"Client {client_id} already registered")
            return {'status': 'already_registered', 'client_id': client_id}
        self.trainers[client_id] = LocalTrainer(
            client_id=client_id,
            learning_rate=learning_rate,
            local_epochs=local_epochs,
        )
        if client_id in self.failed_clients:
            del self.failed_clients[client_id]
        logger.info(f"Client {client_id} registered for training")
        return {'status': 'registered', 'client_id': client_id}

    def unregister_client(self, client_id: str) -> Dict[str, Any]:
        if client_id in self.trainers:
            del self.trainers[client_id]
            logger.info(f"Client {client_id} unregistered")
            return {'status': 'unregistered', 'client_id': client_id}
        return {'status': 'not_found', 'client_id': client_id}

    def run_training_round(self,
                           client_data: Dict[str, Dict[str, np.ndarray]],
                           max_failures: int = 1) -> Dict[str, Any]:
        available_clients = [cid for cid in client_data if cid in self.trainers]
        if len(available_clients) < self.min_clients:
            return {
                'round': len(self.round_results) + 1,
                'status': 'skipped',
                'reason': f'Need {self.min_clients} clients, have {len(available_clients)}',
            }

        successful_updates: List[Dict[str, Any]] = []
        failed_clients_round: List[str] = []
        total_samples = 0

        for client_id in available_clients:
            data = client_data[client_id]
            trainer = self.trainers[client_id]
            retries = 0
            success = False

            while retries <= self.max_retries and not success:
                try:
                    result = trainer.train(
                        data['X'], data['y'],
                        self.global_weights.copy(),
                        self.global_bias,
                    )
                    successful_updates.append(result)
                    total_samples += result['n_samples']
                    success = True
                except Exception as e:
                    retries += 1
                    logger.warning(f"Client {client_id} failed (attempt {retries}): {e}")
                    if retries > self.max_retries:
                        failed_clients_round.append(client_id)
                        self.failed_clients[client_id] = self.failed_clients.get(client_id, 0) + 1

        if not successful_updates:
            return {
                'round': len(self.round_results) + 1,
                'status': 'failed',
                'reason': 'All clients failed',
                'failed_clients': failed_clients_round,
            }

        aggregated_weights = np.zeros_like(self.global_weights)
        aggregated_bias = 0.0
        avg_final_loss = 0.0

        for update in successful_updates:
            weight = update['n_samples'] / total_samples
            aggregated_weights += weight * update['weights']
            aggregated_bias += weight * update['bias']
            avg_final_loss += weight * update['final_loss']

        self.global_weights = aggregated_weights
        self.global_bias = aggregated_bias

        round_result = {
            'round': len(self.round_results) + 1,
            'status': 'completed',
            'num_clients': len(successful_updates),
            'total_samples': total_samples,
            'avg_final_loss': avg_final_loss,
            'failed_clients': failed_clients_round,
            'weight_norm': float(np.linalg.norm(self.global_weights)),
        }
        self.round_results.append(round_result)

        if failed_clients_round:
            logger.warning(f"Round {round_result['round']}: {len(failed_clients_round)} client(s) failed")

        for fc in failed_clients_round:
            if self.failed_clients.get(fc, 0) > 3:
                self.unregister_client(fc)
                logger.info(f"Client {fc} evicted after {self.failed_clients[fc]} failures")

        return round_result

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.dot(X, self.global_weights) + self.global_bias

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_features': self.n_features,
            'registered_clients': len(self.trainers),
            'rounds_completed': len(self.round_results),
            'failed_clients': dict(self.failed_clients),
            'min_clients': self.min_clients,
            'global_weight_norm': float(np.linalg.norm(self.global_weights)),
        }

    def get_client_statuses(self) -> Dict[str, Any]:
        return {cid: trainer.get_status() for cid, trainer in self.trainers.items()}


if __name__ == "__main__":
    np.random.seed(42)
    manager = TrainingManager(n_features=5, min_clients=2)

    for cid in ["store_a", "store_b", "store_c", "store_d"]:
        manager.register_client(cid)

    for round_idx in range(3):
        client_data = {}
        for cid in manager.trainers:
            n = 40
            X = np.random.randn(n, 5)
            y = np.sum(X[:, :2], axis=1) + np.random.randn(n) * 0.1
            client_data[cid] = {'X': X, 'y': y}

        result = manager.run_training_round(client_data)
        print(f"Round {result['round']}: loss={result.get('avg_final_loss', 0):.4f}, "
              f"clients={result.get('num_clients', 0)}, status={result['status']}")

    X_test = np.random.randn(5, 5)
    preds = manager.predict(X_test)
    print(f"Test predictions: {preds}")
