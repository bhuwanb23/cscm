"""
Federated Learning System submodule

Implements federated averaging, distributed training management,
privacy-preserving communication, and cross-device optimization
for distributed supply chain learning.
"""

from .fedavg_coordinator import FederatedAveragingCoordinator
from .training_manager import LocalTrainer, TrainingManager
from .privacy_comms import DifferentialPrivacy, SecureAggregator, CrossStoreFLOrchestrator
from .cross_device_opt import (
    DeviceProfiler,
    ResourceAwareScheduler,
    AdaptiveCompressor,
    CrossDeviceOptimizer,
)

__all__ = [
    'FederatedAveragingCoordinator',
    'LocalTrainer',
    'TrainingManager',
    'DifferentialPrivacy',
    'SecureAggregator',
    'CrossStoreFLOrchestrator',
    'DeviceProfiler',
    'ResourceAwareScheduler',
    'AdaptiveCompressor',
    'CrossDeviceOptimizer',
]
