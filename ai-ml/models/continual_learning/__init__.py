"""
Continual Learning & Federated Learning Module

This module provides continual learning and federated learning capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system.
"""

from .continual_learning_framework.online_adapter import OnlineLearningAdapter
from .continual_learning_framework.incremental_updater import IncrementalModelUpdater, PyTorchEWC
from .federated_system.fedavg_coordinator import FederatedAveragingCoordinator
from .federated_system.privacy_comms import DifferentialPrivacy, SecureAggregator, CrossStoreFLOrchestrator
from .supply_chain_applications.demand_evolution import DemandPatternEvolution

__all__ = [
    'OnlineLearningAdapter',
    'IncrementalModelUpdater',
    'PyTorchEWC',
    'FederatedAveragingCoordinator',
    'DifferentialPrivacy',
    'SecureAggregator',
    'CrossStoreFLOrchestrator',
    'DemandPatternEvolution'
]