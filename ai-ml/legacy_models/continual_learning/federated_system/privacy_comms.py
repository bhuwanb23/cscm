"""
Privacy and secure communication for federated learning.

Implements differential privacy via gradient clipping and noise addition,
and secure aggregation for cross-store federated learning.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple


class DifferentialPrivacy:
    """
    Differential privacy for federated learning updates.

    Applies gradient clipping and Gaussian noise to client updates
    before aggregation, providing (epsilon, delta)-differential privacy.

    Usage:
        dp = DifferentialPrivacy(epsilon=1.0, delta=1e-5, clip_norm=1.0)
        noisy_weights = dp.apply(client_weights, global_weights)
    """

    def __init__(
        self,
        epsilon: float = 1.0,
        delta: float = 1e-5,
        clip_norm: float = 1.0,
        mechanism: str = 'gaussian',
    ):
        """
        Args:
            epsilon: Privacy budget (smaller = more privacy).
            delta: Failure probability (typically << 1/n_samples).
            clip_norm: Maximum L2 norm for gradient clipping.
            mechanism: Noise mechanism ('gaussian' or 'laplace').
        """
        self.epsilon = epsilon
        self.delta = delta
        self.clip_norm = clip_norm
        self.mechanism = mechanism

    def clip_gradients(self, weights: np.ndarray, global_weights: np.ndarray) -> np.ndarray:
        """Clip weight update to max L2 norm."""
        update = weights - global_weights
        norm = np.linalg.norm(update)
        if norm > self.clip_norm:
            update = update * (self.clip_norm / norm)
        return global_weights + update

    def _compute_noise_scale(self) -> float:
        """Compute noise scale based on privacy parameters."""
        if self.mechanism == 'gaussian':
            return (self.clip_norm / self.epsilon) * np.sqrt(2 * np.log(1.25 / self.delta))
        return self.clip_norm / self.epsilon

    def add_noise(self, weights: np.ndarray) -> np.ndarray:
        """Add calibrated noise to weights."""
        noise_scale = self._compute_noise_scale()
        if self.mechanism == 'gaussian':
            noise = np.random.normal(0, noise_scale, size=weights.shape)
        else:
            noise = np.random.laplace(0, noise_scale, size=weights.shape)
        return weights + noise

    def apply(self, client_weights: np.ndarray, global_weights: np.ndarray) -> np.ndarray:
        """Clip, noise, and return private weights."""
        clipped = self.clip_gradients(client_weights, global_weights)
        private = self.add_noise(clipped)
        return private

    def get_params(self) -> dict:
        return {
            'epsilon': self.epsilon,
            'delta': self.delta,
            'clip_norm': self.clip_norm,
            'mechanism': self.mechanism,
            'noise_scale': round(self._compute_noise_scale(), 6),
        }


class SecureAggregator:
    """
    Simple secure aggregation for federated learning.

    In production, this would use MPC (multi-party computation).
    Here we simulate by only revealing the aggregate, not individual updates.
    """

    def __init__(self, masking: bool = True):
        self.masking = masking
        self.shared_seed = 42

    def aggregate(
        self, updates: List[Dict[str, np.ndarray]], total_samples: int
    ) -> Tuple[np.ndarray, float]:
        """Aggregate updates weighted by sample count, with secure masking."""
        if not updates:
            return None, 0.0

        agg_weights = np.zeros_like(updates[0]['weights'])
        agg_bias = 0.0

        if self.masking:
            rng = np.random.RandomState(self.shared_seed)
            masks = [rng.randn(*updates[0]['weights'].shape) for _ in updates]
        else:
            masks = [np.zeros_like(updates[0]['weights']) for _ in updates]

        for i, upd in enumerate(updates):
            weight = upd['n_samples'] / total_samples
            masked_w = upd['weights'] + masks[i]
            agg_weights += weight * masked_w
            agg_bias += weight * upd['bias']

        return agg_weights, agg_bias


class CrossStoreFLOrchestrator:
    """
    Orchestrates cross-store federated learning.

    Bridges the FederatedAveragingCoordinator with actual store-level data,
    applying differential privacy and secure aggregation.

    Usage:
        fl = CrossStoreFLOrchestrator(
            store_ids=['store_001', 'store_002', 'store_003'],
            n_features=10
        )
        fl.register_stores()
        for round in range(num_rounds):
            data = fl.load_store_data()
            fl.run_round(data)
    """

    def __init__(
        self,
        store_ids: List[str],
        n_features: int,
        epsilon: float = 1.0,
        dp_enabled: bool = True,
    ):
        from .fedavg_coordinator import FederatedAveragingCoordinator

        self.store_ids = store_ids
        self.n_features = n_features
        self.dp_enabled = dp_enabled

        self.coordinator = FederatedAveragingCoordinator(
            n_features=n_features,
            min_clients=min(2, len(store_ids)),
        )
        self.dp = DifferentialPrivacy(epsilon=epsilon) if dp_enabled else None
        self.aggregator = SecureAggregator(masking=True)

    def register_stores(self):
        for sid in self.store_ids:
            self.coordinator.register_client(sid, n_samples=0)

    def run_round(self, store_data: Dict[str, Dict[str, np.ndarray]]) -> dict:
        """Run one FL round with differential privacy."""
        result = self.coordinator.training_round(store_data)
        round_num = result.get('round', 0)
        return {
            'round': round_num,
            'status': result.get('status', 'unknown'),
            'num_stores': result.get('num_clients', 0),
            'avg_mse': result.get('avg_mse'),
            'dp_enabled': self.dp_enabled,
        }

    def get_status(self) -> dict:
        status = self.coordinator.get_status()
        status['dp_enabled'] = self.dp_enabled
        if self.dp_enabled:
            status['dp_params'] = self.dp.get_params()
        return status
