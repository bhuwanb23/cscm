"""
Continual Learning & Federated Learning Module

This module provides continual learning and federated learning capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system.
"""

from .continual_learning_framework.online_adapter import OnlineLearningAdapter
from .continual_learning_framework.incremental_updater import IncrementalModelUpdater
from .federated_system.fedavg_coordinator import FederatedAveragingCoordinator
from .supply_chain_applications.demand_evolution import DemandPatternEvolution

__all__ = [
    'OnlineLearningAdapter',
    'IncrementalModelUpdater',
    'FederatedAveragingCoordinator',
    'DemandPatternEvolution'
]