"""
Cross-Device Optimization for Federated Learning

This module handles heterogeneous device capabilities, resource-aware
scheduling, bandwidth optimization, and adaptive compression for
distributed federated learning across diverse supply chain nodes.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque
from dataclasses import dataclass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class DeviceProfile:
    device_id: str
    compute_score: float
    bandwidth_score: float
    memory_score: float
    reliability_score: float


class DeviceProfiler:
    """
    Profiles and tracks device capabilities for heterogeneous
    federated learning environments.
    """

    def __init__(self, default_compute: float = 1.0, default_bandwidth: float = 1.0):
        self.default_compute = default_compute
        self.default_bandwidth = default_bandwidth
        self.profiles: Dict[str, DeviceProfile] = {}

    def register_device(self, device_id: str, **capabilities) -> DeviceProfile:
        profile = DeviceProfile(
            device_id=device_id,
            compute_score=capabilities.get('compute', self.default_compute),
            bandwidth_score=capabilities.get('bandwidth', self.default_bandwidth),
            memory_score=capabilities.get('memory', 1.0),
            reliability_score=capabilities.get('reliability', 1.0),
        )
        self.profiles[device_id] = profile
        logger.info(f"Device {device_id} registered: compute={profile.compute_score}, "
                    f"bandwidth={profile.bandwidth_score}")
        return profile

    def update_profile(self, device_id: str, **capabilities) -> Optional[DeviceProfile]:
        if device_id not in self.profiles:
            logger.warning(f"Device {device_id} not found")
            return None
        profile = self.profiles[device_id]
        for key, val in capabilities.items():
            attr = f'{key}_score'
            if hasattr(profile, attr):
                setattr(profile, attr, val)
        return profile

    def get_profile(self, device_id: str) -> Optional[DeviceProfile]:
        return self.profiles.get(device_id)

    def get_capability_scores(self) -> Dict[str, Dict[str, float]]:
        return {
            did: {
                'compute': p.compute_score,
                'bandwidth': p.bandwidth_score,
                'memory': p.memory_score,
                'reliability': p.reliability_score,
                'overall': (p.compute_score + p.bandwidth_score + p.memory_score + p.reliability_score) / 4.0,
            }
            for did, p in self.profiles.items()
        }


class ResourceAwareScheduler:
    """
    Schedules training tasks across heterogeneous devices based on
    resource availability and constraints.
    """

    def __init__(self, profiler: DeviceProfiler):
        self.profiler = profiler
        self.task_queue: deque = deque()
        self.schedule_history: List[Dict[str, Any]] = []

    def schedule_round(self, client_ids: List[str],
                       task_requirements: Dict[str, float]) -> List[Tuple[str, int]]:
        scored_clients = []
        for cid in client_ids:
            profile = self.profiler.get_profile(cid)
            if profile is None:
                continue
            score = profile.compute_score * task_requirements.get('compute_weight', 1.0)
            score += profile.bandwidth_score * task_requirements.get('bandwidth_weight', 1.0)
            score += profile.memory_score * task_requirements.get('memory_weight', 1.0)
            scored_clients.append((cid, score))

        scored_clients.sort(key=lambda x: x[1], reverse=True)
        self.schedule_history.append({
            'round': len(self.schedule_history) + 1,
            'scheduled': [c for c, _ in scored_clients],
            'scores': {c: s for c, s in scored_clients},
        })
        return scored_clients

    def get_schedule_summary(self) -> Dict[str, Any]:
        return {
            'rounds_scheduled': len(self.schedule_history),
            'last_round': self.schedule_history[-1] if self.schedule_history else None,
        }


class AdaptiveCompressor:
    """
    Adaptive compression for model updates to optimize bandwidth
    usage in federated learning.
    """

    def __init__(self, initial_compression: float = 0.5, min_compression: float = 0.1):
        self.compression_ratio = initial_compression
        self.min_compression = min_compression
        self.compression_history: List[float] = []

    def compress(self, weights: np.ndarray, bandwidth: float = 1.0) -> Tuple[np.ndarray, Dict[str, Any]]:
        adaptive_ratio = self.compression_ratio * min(1.0, bandwidth)
        adaptive_ratio = max(adaptive_ratio, self.min_compression)

        n_keep = max(1, int(weights.size * adaptive_ratio))
        importance = np.abs(weights)
        threshold = np.sort(importance)[-n_keep] if n_keep < len(importance) else 0

        compressed = weights.copy()
        compressed[importance < threshold] = 0.0

        actual_ratio = np.count_nonzero(compressed) / weights.size
        self.compression_history.append(actual_ratio)

        meta = {
            'target_ratio': adaptive_ratio,
            'actual_ratio': actual_ratio,
            'nonzero_params': np.count_nonzero(compressed),
            'total_params': weights.size,
        }
        return compressed, meta

    def adjust_compression(self, bandwidth_score: float, target_latency_ms: float = 100.0):
        if bandwidth_score < 0.5:
            self.compression_ratio = max(self.compression_ratio * 0.8, self.min_compression)
        elif bandwidth_score > 1.5:
            self.compression_ratio = min(self.compression_ratio * 1.2, 1.0)

    def get_state(self) -> Dict[str, Any]:
        return {
            'current_ratio': self.compression_ratio,
            'avg_actual_ratio': float(np.mean(self.compression_history)) if self.compression_history else 0.0,
            'total_compressions': len(self.compression_history),
        }


class CrossDeviceOptimizer:
    """
    Integrated cross-device optimization system combining profiling,
    scheduling, and compression for heterogeneous federated learning.
    """

    def __init__(self):
        self.profiler = DeviceProfiler()
        self.scheduler = ResourceAwareScheduler(self.profiler)
        self.compressor = AdaptiveCompressor()

    def optimize_round(self, client_ids: List[str],
                       task_req: Optional[Dict[str, float]] = None) -> List[Tuple[str, int]]:
        if task_req is None:
            task_req = {'compute_weight': 1.0, 'bandwidth_weight': 1.0, 'memory_weight': 0.5}
        schedule = self.scheduler.schedule_round(client_ids, task_req)
        for cid, _ in schedule:
            profile = self.profiler.get_profile(cid)
            if profile:
                self.compressor.adjust_compression(profile.bandwidth_score)
        return schedule

    def get_system_state(self) -> Dict[str, Any]:
        return {
            'devices': self.profiler.get_capability_scores(),
            'scheduler': self.scheduler.get_schedule_summary(),
            'compressor': self.compressor.get_state(),
        }


if __name__ == "__main__":
    np.random.seed(42)
    optimizer = CrossDeviceOptimizer()

    devices = [
        ("gpu_server", dict(compute=5.0, bandwidth=8.0, memory=4.0, reliability=0.95)),
        ("edge_node_1", dict(compute=1.0, bandwidth=0.5, memory=0.8, reliability=0.85)),
        ("edge_node_2", dict(compute=0.8, bandwidth=0.3, memory=0.6, reliability=0.80)),
        ("mobile_device", dict(compute=0.3, bandwidth=0.1, memory=0.2, reliability=0.70)),
    ]

    for did, caps in devices:
        optimizer.profiler.register_device(did, **caps)

    schedule = optimizer.optimize_round([d[0] for d in devices])
    print("Scheduling results:")
    for cid, score in schedule:
        print(f"  {cid}: score={score:.2f}")

    weights = np.random.randn(100)
    compressed, meta = optimizer.compressor.compress(weights, bandwidth=0.5)
    print(f"Compression: {meta['nonzero_params']}/{meta['total_params']} "
          f"params kept (ratio={meta['actual_ratio']:.2f})")

    state = optimizer.get_system_state()
    print(f"Devices profiled: {len(state['devices'])}")
