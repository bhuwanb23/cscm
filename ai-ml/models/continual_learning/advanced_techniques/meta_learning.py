"""
Meta-Learning Adapter for Advanced Continual Learning Techniques

This module implements meta-learning approaches including MAML-style
few-shot adaptation and learning-to-learn strategies for rapid
adaptation to new supply chain scenarios.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MetaLearningAdapter:
    """
    Implements meta-learning for rapid adaptation to new tasks
    using MAML-style gradient-based meta-learning.
    """

    def __init__(self,
                 n_features: int,
                 inner_lr: float = 0.01,
                 outer_lr: float = 0.001,
                 inner_steps: int = 5,
                 meta_batch_size: int = 4):
        self.n_features = n_features
        self.inner_lr = inner_lr
        self.outer_lr = outer_lr
        self.inner_steps = inner_steps
        self.meta_batch_size = meta_batch_size

        self.meta_weights = np.random.randn(n_features) * 0.01
        self.meta_bias = 0.0
        self.meta_training_step = 0
        self.task_history = []

    def _fast_adapt(self, X: np.ndarray, y: np.ndarray,
                    weights: np.ndarray, bias: float) -> Tuple[np.ndarray, float, float]:
        w = weights.copy()
        b = bias
        for _ in range(self.inner_steps):
            y_pred = np.dot(X, w) + b
            loss = np.mean((y_pred - y) ** 2)
            dw = (2 / X.shape[0]) * np.dot(X.T, (y_pred - y))
            db = (2 / X.shape[0]) * np.sum(y_pred - y)
            w -= self.inner_lr * dw
            b -= self.inner_lr * db
        return w, b, loss

    def meta_train_step(self, tasks: List[Dict[str, np.ndarray]]) -> Dict[str, Any]:
        meta_grad_w = np.zeros_like(self.meta_weights)
        meta_grad_b = 0.0
        total_loss = 0.0
        num_tasks = min(len(tasks), self.meta_batch_size)

        for task in tasks[:num_tasks]:
            X_support, y_support = task['support']
            X_query, y_query = task['query']

            adapted_w, adapted_b, _ = self._fast_adapt(
                X_support, y_support, self.meta_weights, self.meta_bias
            )

            y_pred = np.dot(X_query, adapted_w) + adapted_b
            loss = np.mean((y_pred - y_query) ** 2)
            total_loss += loss

            dw = (2 / X_query.shape[0]) * np.dot(X_query.T, (y_pred - y_query))
            db = (2 / X_query.shape[0]) * np.sum(y_pred - y_query)
            meta_grad_w += dw
            meta_grad_b += db

        if num_tasks > 0:
            meta_grad_w /= num_tasks
            meta_grad_b /= num_tasks
            total_loss /= num_tasks

            self.meta_weights -= self.outer_lr * meta_grad_w
            self.meta_bias -= self.outer_lr * meta_grad_b

        self.meta_training_step += 1

        return {
            'step': self.meta_training_step,
            'meta_loss': float(total_loss),
            'num_tasks': num_tasks,
            'weight_norm': float(np.linalg.norm(self.meta_weights)),
        }

    def adapt_to_task(self, X_support: np.ndarray, y_support: np.ndarray,
                      steps: Optional[int] = None) -> Dict[str, Any]:
        n_steps = steps or self.inner_steps
        w = self.meta_weights.copy()
        b = self.meta_bias

        losses = []
        for i in range(n_steps):
            y_pred = np.dot(X_support, w) + b
            loss = np.mean((y_pred - y_support) ** 2)
            losses.append(float(loss))
            dw = (2 / X_support.shape[0]) * np.dot(X_support.T, (y_pred - y_support))
            db = (2 / X_support.shape[0]) * np.sum(y_pred - y_support)
            w -= self.inner_lr * dw
            b -= self.inner_lr * db

        task_info = {
            'adapted_weights': w.copy(),
            'adapted_bias': b,
            'final_loss': float(losses[-1]) if losses else 0.0,
        }
        self.task_history.append(task_info)

        return task_info

    def predict(self, X: np.ndarray, weights: Optional[np.ndarray] = None,
                bias: Optional[float] = None) -> np.ndarray:
        w = weights if weights is not None else self.meta_weights
        b = bias if bias is not None else self.meta_bias
        return np.dot(X, w) + b

    def get_meta_state(self) -> Dict[str, Any]:
        return {
            'n_features': self.n_features,
            'meta_training_step': self.meta_training_step,
            'weight_norm': float(np.linalg.norm(self.meta_weights)),
            'tasks_adapted': len(self.task_history),
            'inner_lr': self.inner_lr,
            'outer_lr': self.outer_lr,
        }


if __name__ == "__main__":
    np.random.seed(42)
    adapter = MetaLearningAdapter(n_features=10, inner_lr=0.01, outer_lr=0.001)

    for episode in range(20):
        tasks = []
        for _ in range(4):
            n_support, n_query = 20, 10
            X_s = np.random.randn(n_support, 10)
            y_s = np.sum(X_s[:, :3], axis=1) + np.random.randn(n_support) * 0.1
            X_q = np.random.randn(n_query, 10)
            y_q = np.sum(X_q[:, :3], axis=1) + np.random.randn(n_query) * 0.1
            tasks.append({'support': (X_s, y_s), 'query': (X_q, y_q)})

        result = adapter.meta_train_step(tasks)
        if (episode + 1) % 5 == 0:
            print(f"Episode {episode+1}: meta_loss={result['meta_loss']:.4f}")

    X_test = np.random.randn(5, 10)
    preds = adapter.predict(X_test)
    print(f"Test predictions: {preds}")
