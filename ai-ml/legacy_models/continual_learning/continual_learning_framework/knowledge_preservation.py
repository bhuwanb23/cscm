"""
Knowledge Preservation System for Continual Learning

This module implements techniques to prevent catastrophic forgetting,
including replay buffers, knowledge distillation, and regularization
methods for preserving previously learned knowledge.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExperienceReplay:
    """
    Experience replay buffer for continual learning that stores and replays
    past experiences to prevent catastrophic forgetting.
    """

    def __init__(self, capacity: int = 10000, strategy: str = 'reservoir'):
        self.capacity = capacity
        self.strategy = strategy
        self.buffer_X: List[np.ndarray] = []
        self.buffer_y: List[np.ndarray] = []
        self.insert_count = 0

    def add(self, X: np.ndarray, y: np.ndarray) -> int:
        batch_size = X.shape[0]
        for i in range(batch_size):
            x_i = X[i]
            y_i = y[i] if y.ndim > 0 else y
            self._insert(x_i, y_i)
        return len(self.buffer_X)

    def _insert(self, x: np.ndarray, y: np.ndarray):
        if self.strategy == 'reservoir':
            if len(self.buffer_X) < self.capacity:
                self.buffer_X.append(x)
                self.buffer_y.append(y)
            else:
                idx = np.random.randint(0, self.insert_count + 1)
                if idx < self.capacity:
                    self.buffer_X[idx] = x
                    self.buffer_y[idx] = y
        elif self.strategy == 'fifo':
            if len(self.buffer_X) >= self.capacity:
                self.buffer_X.pop(0)
                self.buffer_y.pop(0)
            self.buffer_X.append(x)
            self.buffer_y.append(y)
        else:
            self.buffer_X.append(x)
            self.buffer_y.append(y)
        self.insert_count += 1

    def sample(self, batch_size: int) -> Tuple[np.ndarray, np.ndarray]:
        if len(self.buffer_X) == 0:
            return np.array([]), np.array([])
        n = min(batch_size, len(self.buffer_X))
        indices = np.random.choice(len(self.buffer_X), size=n, replace=False)
        X_batch = np.array([self.buffer_X[i] for i in indices])
        y_batch = np.array([self.buffer_y[i] for i in indices])
        return X_batch, y_batch

    def get_size(self) -> int:
        return len(self.buffer_X)

    def clear(self):
        self.buffer_X.clear()
        self.buffer_y.clear()
        self.insert_count = 0


class KnowledgeDistillation:
    """
    Knowledge distillation for model compression and knowledge transfer.
    Transfers knowledge from a teacher model to a student model.
    """

    def __init__(self, temperature: float = 3.0, alpha: float = 0.7):
        self.temperature = temperature
        self.alpha = alpha

    def distill_loss(self, student_logits: np.ndarray, teacher_logits: np.ndarray,
                     true_labels: np.ndarray) -> float:
        soft_targets = self._softmax(teacher_logits / self.temperature)
        soft_preds = self._softmax(student_logits / self.temperature)
        distillation_loss = self._kl_divergence(soft_targets, soft_preds)
        student_loss = np.mean((student_logits - true_labels) ** 2)
        total_loss = self.alpha * distillation_loss + (1 - self.alpha) * student_loss
        return float(total_loss)

    def _softmax(self, x: np.ndarray, axis: int = -1) -> np.ndarray:
        x_max = np.max(x, axis=axis, keepdims=True)
        exp_x = np.exp(x - x_max)
        return exp_x / np.sum(exp_x, axis=axis, keepdims=True)

    def _kl_divergence(self, p: np.ndarray, q: np.ndarray) -> float:
        eps = 1e-10
        return float(np.sum(p * np.log(p / (q + eps) + eps)))


class RegularizationPreservation:
    """
    Elastic weight consolidation and synaptic intelligence regularization
    to preserve important weights during continual learning.
    """

    def __init__(self, lambda_reg: float = 0.5, method: str = 'ewc'):
        self.lambda_reg = lambda_reg
        self.method = method
        self.fisher_information: Optional[np.ndarray] = None
        self.optimal_weights: Optional[np.ndarray] = None
        self.omega: Optional[np.ndarray] = None

    def compute_fisher(self, X: np.ndarray, y: np.ndarray,
                       weights: np.ndarray, bias: float) -> np.ndarray:
        y_pred = np.dot(X, weights) + bias
        grad = (2 / X.shape[0]) * np.dot(X.T, (y_pred - y))
        fisher = grad ** 2
        if self.fisher_information is None:
            self.fisher_information = fisher
        else:
            self.fisher_information = 0.9 * self.fisher_information + 0.1 * fisher
        self.optimal_weights = weights.copy()
        return self.fisher_information

    def compute_regularization_loss(self, weights: np.ndarray) -> float:
        if self.optimal_weights is None or self.fisher_information is None:
            return 0.0
        diff = weights - self.optimal_weights
        if self.method == 'ewc':
            loss = float(0.5 * self.lambda_reg * np.sum(self.fisher_information * diff ** 2))
        else:
            if self.omega is None:
                self.omega = np.ones_like(weights)
            loss = float(0.5 * self.lambda_reg * np.sum(self.omega * diff ** 2))
        return loss


class KnowledgePreservationSystem:
    """
    Integrated system combining replay, distillation, and regularization
    for comprehensive knowledge preservation during continual learning.
    """

    def __init__(self,
                 replay_capacity: int = 10000,
                 distillation_temp: float = 3.0,
                 reg_lambda: float = 0.5):
        self.replay = ExperienceReplay(capacity=replay_capacity)
        self.distillation = KnowledgeDistillation(temperature=distillation_temp)
        self.regularization = RegularizationPreservation(lambda_reg=reg_lambda)
        self.metrics_history: List[Dict[str, Any]] = []

    def preserve(self, X_batch: np.ndarray, y_batch: np.ndarray,
                 weights: np.ndarray, bias: float,
                 teacher_logits: Optional[np.ndarray] = None) -> Dict[str, Any]:
        buffer_size = self.replay.add(X_batch, y_batch)
        fisher = self.regularization.compute_fisher(X_batch, y_batch, weights, bias)
        reg_loss = self.regularization.compute_regularization_loss(weights)

        replay_X, replay_y = self.replay.sample(min(128, buffer_size))
        replay_mse = float(np.mean((np.dot(replay_X, weights) + bias - replay_y) ** 2)) if len(replay_X) > 0 else 0.0

        distill_loss = 0.0
        if teacher_logits is not None and len(replay_X) > 0:
            student_logits = np.dot(replay_X, weights) + bias
            distill_loss = self.distillation.distill_loss(student_logits, teacher_logits, replay_y)

        metrics = {
            'buffer_size': buffer_size,
            'fisher_mean': float(np.mean(fisher)),
            'regularization_loss': reg_loss,
            'replay_mse': replay_mse,
            'distillation_loss': distill_loss,
        }
        self.metrics_history.append(metrics)
        return metrics

    def get_state(self) -> Dict[str, Any]:
        return {
            'buffer_size': self.replay.get_size(),
            'total_inserts': self.replay.insert_count,
            'reg_method': self.regularization.method,
            'distillation_temp': self.distillation.temperature,
            'fisher_available': self.regularization.fisher_information is not None,
        }


if __name__ == "__main__":
    np.random.seed(42)
    kps = KnowledgePreservationSystem(replay_capacity=500)

    X = np.random.randn(32, 5)
    y = np.sum(X[:, :3], axis=1) + np.random.randn(32) * 0.1
    w = np.random.randn(5) * 0.01
    b = 0.0

    for step in range(10):
        metrics = kps.preserve(X, y, w, b)
        if (step + 1) % 5 == 0:
            print(f"Step {step+1}: buffer={metrics['buffer_size']}, "
                  f"fisher={metrics['fisher_mean']:.4f}")

    replay_X, replay_y = kps.replay.sample(10)
    print(f"Replay sample: X={replay_X.shape}, y={replay_y.shape}")
    print(f"State: {kps.get_state()}")
