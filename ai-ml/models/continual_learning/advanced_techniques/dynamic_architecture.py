"""
Dynamic Architecture Growth for Continual Learning

This module implements network expansion for new tasks, pruning for
efficiency, modularity for task separation, and resource-constrained
scaling in neural architectures.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NetworkExpander:
    """
    Dynamically expands network capacity when new tasks or patterns
    are detected, adding new units to accommodate new knowledge
    without disrupting existing representations.
    """

    def __init__(self,
                 initial_units: int = 10,
                 expansion_threshold: float = 0.3,
                 max_units: int = 1000,
                 expansion_factor: float = 0.5):
        self.initial_units = initial_units
        self.expansion_threshold = expansion_threshold
        self.max_units = max_units
        self.expansion_factor = expansion_factor

        self.n_units = initial_units
        self.expansions: List[int] = []
        self.unit_importance: Dict[str, float] = {}

    def should_expand(self, task_loss: float, baseline_loss: float) -> bool:
        if self.n_units >= self.max_units:
            return False
        loss_ratio = task_loss / (baseline_loss + 1e-10)
        return loss_ratio > (1.0 + self.expansion_threshold)

    def expand(self, n_features: int) -> Dict[str, Any]:
        added = max(1, int(self.n_units * self.expansion_factor))
        added = min(added, self.max_units - self.n_units)

        new_weights = np.random.randn(added, n_features) * 0.01
        new_biases = np.zeros(added)
        output_weights = np.random.randn(added) * 0.01

        self.n_units += added
        self.expansions.append(added)

        result = {
            'units_before': self.n_units - added,
            'units_added': added,
            'units_after': self.n_units,
            'total_expansions': len(self.expansions),
        }
        logger.info(f"Network expanded: +{added} units ({self.n_units} total)")
        return result

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_units': self.n_units,
            'expansion_threshold': self.expansion_threshold,
            'max_units': self.max_units,
            'total_expansions': len(self.expansions),
            'expansions': list(self.expansions),
        }


class NetworkPruner:
    """
    Prunes redundant or low-importance units to maintain efficiency
    during continual learning. Uses magnitude-based and
    importance-based pruning strategies.
    """

    def __init__(self,
                 pruning_threshold: float = 0.01,
                 min_units: int = 5,
                 prune_interval: int = 10):
        self.pruning_threshold = pruning_threshold
        self.min_units = min_units
        self.prune_interval = prune_interval
        self.prune_count = 0
        self.total_pruned = 0

    def compute_importance(self, weights: np.ndarray,
                           activation_history: Optional[np.ndarray] = None) -> np.ndarray:
        magnitude = np.abs(weights)
        if magnitude.ndim > 1:
            magnitude = np.mean(magnitude, axis=1)
        if activation_history is not None:
            frequency = np.mean(activation_history > 0, axis=0) if activation_history.ndim > 1 else activation_history
            importance = magnitude * (1 + frequency)
        else:
            importance = magnitude
        return importance

    def prune(self, weights: np.ndarray, biases: np.ndarray,
              importance: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        if len(weights) <= self.min_units:
            return weights, biases, np.ones(len(weights), dtype=bool)

        max_importance = np.max(importance)
        threshold = max(self.pruning_threshold, max_importance * 0.001)
        mask = importance >= threshold

        n_to_prune = np.sum(~mask)
        if len(weights) - n_to_prune < self.min_units:
            n_survive = len(weights) - self.min_units
            if n_survive > 0:
                sorted_idx = np.argsort(importance)
                keep_idx = sorted_idx[n_survive:]
                mask = np.zeros(len(weights), dtype=bool)
                mask[keep_idx] = True
                n_to_prune = np.sum(~mask)
            else:
                return weights, biases, np.ones(len(weights), dtype=bool)

        pruned_weights = weights[mask]
        pruned_biases = biases[mask]
        self.prune_count += 1
        self.total_pruned += int(n_to_prune)

        logger.info(f"Pruned {n_to_prune} units ({len(pruned_weights)} remaining)")
        return pruned_weights, pruned_biases, mask

    def get_state(self) -> Dict[str, Any]:
        return {
            'pruning_threshold': self.pruning_threshold,
            'min_units': self.min_units,
            'prune_count': self.prune_count,
            'total_pruned': self.total_pruned,
        }


class ModularArchitecture:
    """
    Maintains modularity by assigning separate sub-networks to
    different tasks, enabling task-specific specialization while
    sharing common features.
    """

    def __init__(self, n_shared_units: int = 20, n_task_units: int = 10):
        self.n_shared_units = n_shared_units
        self.n_task_units = n_task_units
        self.task_modules: Dict[str, Dict[str, Any]] = {}
        self.shared_weights: Optional[np.ndarray] = None

    def create_task_module(self, task_id: str, n_features: int) -> Dict[str, Any]:
        if task_id in self.task_modules:
            return {'status': 'exists', 'task_id': task_id}

        total_output = self.n_shared_units + self.n_task_units
        module = {
            'weights': np.random.randn(self.n_task_units, n_features) * 0.01,
            'bias': np.zeros(self.n_task_units),
            'output_weights': np.random.randn(total_output) * 0.01,
            'output_bias': 0.0,
            'created_at': len(self.task_modules),
        }
        if self.shared_weights is None:
            self.shared_weights = np.random.randn(self.n_shared_units, n_features) * 0.01

        self.task_modules[task_id] = module
        logger.info(f"Task module created: {task_id}")
        return {'status': 'created', 'task_id': task_id, 'units': self.n_task_units}

    def forward(self, X: np.ndarray, task_id: str) -> np.ndarray:
        if task_id not in self.task_modules:
            raise ValueError(f"No module for task: {task_id}")

        shared_out = np.dot(X, self.shared_weights.T) if self.shared_weights is not None else 0
        module = self.task_modules[task_id]
        task_out = np.dot(X, module['weights'].T) + module['bias']
        combined = np.concatenate([shared_out, task_out], axis=-1) if isinstance(shared_out, np.ndarray) else task_out
        output = np.dot(combined, module['output_weights']) + module['output_bias']
        return output

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_shared_units': self.n_shared_units,
            'n_task_units': self.n_task_units,
            'n_tasks': len(self.task_modules),
            'tasks': list(self.task_modules.keys()),
        }


class DynamicArchitectureManager:
    """
    Integrated manager combining expansion, pruning, and modularity
    for dynamic architecture management during continual learning.
    """

    def __init__(self,
                 initial_units: int = 10,
                 expansion_threshold: float = 0.3,
                 pruning_threshold: float = 0.01):
        self.expander = NetworkExpander(
            initial_units=initial_units,
            expansion_threshold=expansion_threshold,
        )
        self.pruner = NetworkPruner(pruning_threshold=pruning_threshold)
        self.modular = ModularArchitecture()

    def adapt_architecture(self, task_id: str, n_features: int,
                           task_loss: float, baseline_loss: float,
                           weights: np.ndarray, biases: np.ndarray) -> Dict[str, Any]:
        events = []
        self.modular.create_task_module(task_id, n_features)

        if self.expander.should_expand(task_loss, baseline_loss):
            exp_result = self.expander.expand(n_features)
            events.append(('expansion', exp_result))

        importance = self.pruner.compute_importance(weights)
        pruned_w, pruned_b, mask = self.pruner.prune(weights, biases, importance)
        n_pruned = int(np.sum(~mask))
        if n_pruned > 0:
            events.append(('pruning', {'pruned': n_pruned}))

        return {
            'task_id': task_id,
            'events': events,
            'n_units_before': len(weights),
            'n_units_after': len(pruned_w),
            'expander_state': self.expander.get_state(),
            'pruner_state': self.pruner.get_state(),
            'modular_state': self.modular.get_state(),
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'expander': self.expander.get_state(),
            'pruner': self.pruner.get_state(),
            'modular': self.modular.get_state(),
        }


if __name__ == "__main__":
    np.random.seed(42)
    manager = DynamicArchitectureManager(initial_units=8, expansion_threshold=0.2)
    n_features = 5

    weights = np.random.randn(8, n_features) * 0.01
    biases = np.zeros(8)

    for task_idx in range(3):
        task_id = f"task_{task_idx}"
        task_loss = 0.5 / (task_idx + 1) + np.random.rand() * 0.3
        baseline_loss = 0.2

        result = manager.adapt_architecture(
            task_id, n_features, task_loss, baseline_loss, weights, biases
        )
        print(f"Task {task_id}: units={result['n_units_after']}, "
              f"events={[e[0] for e in result['events']]}")

    state = manager.get_state()
    print(f"Final state: {state['expander']['n_units']} units, "
          f"{state['modular']['n_tasks']} tasks")
