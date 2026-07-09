"""
Adaptive Learning Rate Controller for Continual Learning

This module provides automatic learning rate adjustment based on data
distribution changes, balancing stability and plasticity during
continual learning.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AdaptiveLRController:
    """
    Automatically adjusts learning rate based on gradient statistics,
    loss landscape, and convergence monitoring to balance
    stability vs plasticity.
    """

    def __init__(self,
                 initial_lr: float = 0.01,
                 min_lr: float = 1e-6,
                 max_lr: float = 0.1,
                 window_size: int = 50,
                 patience: int = 5,
                 factor: float = 0.5):
        self.lr = initial_lr
        self.min_lr = min_lr
        self.max_lr = max_lr
        self.window_size = window_size
        self.patience = patience
        self.factor = factor

        self.loss_history = deque(maxlen=window_size)
        self.gradient_norms = deque(maxlen=window_size)
        self.lr_history = [initial_lr]

        self.best_loss = float('inf')
        self.convergence_counter = 0
        self.degradation_counter = 0
        self.total_adjustments = 0

    def step(self, loss: float, grad_norm: Optional[float] = None) -> Dict[str, Any]:
        self.loss_history.append(loss)
        if grad_norm is not None:
            self.gradient_norms.append(grad_norm)

        adjustment = None
        reason = 'none'

        if len(self.loss_history) >= self.window_size:
            recent_losses = list(self.loss_history)[-self.patience:]
            avg_recent = np.mean(recent_losses)
            early_losses = list(self.loss_history)[:self.patience]
            avg_early = np.mean(early_losses)

            if avg_recent > avg_early * 1.05:
                self.degradation_counter += 1
            else:
                self.degradation_counter = 0

            if self.degradation_counter >= self.patience:
                self.lr = max(self.lr * self.factor, self.min_lr)
                adjustment = 'degradation'
                reason = f'Loss increasing for {self.patience} steps'
                self.degradation_counter = 0
                self.total_adjustments += 1

        if loss < self.best_loss:
            self.best_loss = loss
            self.convergence_counter = 0
        else:
            self.convergence_counter += 1

        if self.convergence_counter >= self.patience * 2 and grad_norm is not None:
            if grad_norm < 1e-4:
                self.lr = min(self.lr * 1.5, self.max_lr)
                adjustment = 'stuck'
                reason = f'Gradient norm too small ({grad_norm:.6f})'
                self.convergence_counter = 0
                self.total_adjustments += 1

        if len(self.gradient_norms) >= self.window_size:
            recent_grads = list(self.gradient_norms)[-10:]
            grad_var = np.var(recent_grads)
            if grad_var > 1.0 and adjustment is None:
                self.lr = max(self.lr * 0.8, self.min_lr)
                adjustment = 'instability'
                reason = f'High gradient variance ({grad_var:.4f})'
                self.total_adjustments += 1

        self.lr_history.append(self.lr)

        result = {
            'learning_rate': self.lr,
            'adjustment': adjustment,
            'reason': reason,
            'best_loss': float(self.best_loss) if self.best_loss != float('inf') else None,
            'convergence_streak': self.convergence_counter,
            'total_adjustments': self.total_adjustments,
        }
        return result

    def get_lr(self) -> float:
        return self.lr

    def set_lr(self, lr: float):
        self.lr = max(self.min_lr, min(lr, self.max_lr))
        self.lr_history.append(self.lr)

    def reset(self, initial_lr: Optional[float] = None):
        if initial_lr is not None:
            self.lr = initial_lr
        self.loss_history.clear()
        self.gradient_norms.clear()
        self.best_loss = float('inf')
        self.convergence_counter = 0
        self.degradation_counter = 0
        self.total_adjustments = 0
        logger.info(f"AdaptiveLRController reset to lr={self.lr}")


class CyclicLRController:
    """
    Cyclic learning rate scheduler for continual learning that
    periodically varies learning rate to escape saddle points
    and adapt to new data distributions.
    """

    def __init__(self,
                 base_lr: float = 0.001,
                 max_lr: float = 0.01,
                 step_size: int = 20,
                 mode: str = 'triangular'):
        self.base_lr = base_lr
        self.max_lr = max_lr
        self.step_size = step_size
        self.mode = mode
        self.cycle_count = 0
        self.step_in_cycle = 0

    def step(self) -> float:
        self.step_in_cycle += 1
        cycle = np.floor(1 + self.step_in_cycle / (2 * self.step_size))
        x = np.abs(self.step_in_cycle / self.step_size - 2 * cycle + 1)

        if self.mode == 'triangular':
            lr = self.base_lr + (self.max_lr - self.base_lr) * max(0, 1 - x)
        elif self.mode == 'triangular2':
            lr = self.base_lr + (self.max_lr - self.base_lr) * max(0, 1 - x) / (2 ** (cycle - 1))
        else:
            lr = self.base_lr + (self.max_lr - self.base_lr) * (1 - x) ** 2

        if self.step_in_cycle >= 2 * self.step_size:
            self.step_in_cycle = 0
            self.cycle_count += 1

        return lr

    def get_state(self) -> Dict[str, Any]:
        return {
            'current_lr': self.step(),
            'cycle': self.cycle_count,
            'step_in_cycle': self.step_in_cycle,
            'base_lr': self.base_lr,
            'max_lr': self.max_lr,
            'mode': self.mode,
        }


if __name__ == "__main__":
    np.random.seed(42)
    controller = AdaptiveLRController(initial_lr=0.01, patience=3)

    lr_values = []
    for step in range(100):
        loss = 0.5 / (1 + step * 0.1) + np.random.randn() * 0.02
        grad_norm = np.random.exponential(0.1)
        result = controller.step(loss, grad_norm)
        lr_values.append(result['learning_rate'])

        if result['adjustment']:
            print(f"Step {step+1}: lr={result['learning_rate']:.6f} "
                  f"(adj={result['adjustment']}: {result['reason']})")

    cyclic = CyclicLRController(base_lr=0.001, max_lr=0.01, step_size=10)
    for i in range(30):
        lr = cyclic.step()
        if (i + 1) % 5 == 0:
            print(f"Cyclic step {i+1}: lr={lr:.6f}")
