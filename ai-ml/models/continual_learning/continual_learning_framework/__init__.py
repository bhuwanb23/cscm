"""
Continual Learning Framework submodule

Provides online learning adapters, incremental model updaters,
knowledge preservation systems, and adaptive learning rate controllers
for streaming and continual learning scenarios.
"""

from .online_adapter import OnlineLearningAdapter, SimpleOnlineAdapter
from .incremental_updater import IncrementalModelUpdater, PyTorchEWC
from .knowledge_preservation import (
    ExperienceReplay,
    KnowledgeDistillation,
    RegularizationPreservation,
    KnowledgePreservationSystem,
)
from .adaptive_lr import AdaptiveLRController, CyclicLRController

__all__ = [
    'OnlineLearningAdapter',
    'SimpleOnlineAdapter',
    'IncrementalModelUpdater',
    'PyTorchEWC',
    'ExperienceReplay',
    'KnowledgeDistillation',
    'RegularizationPreservation',
    'KnowledgePreservationSystem',
    'AdaptiveLRController',
    'CyclicLRController',
]
