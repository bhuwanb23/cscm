"""
Continual Learning & Federated Learning Module

This module provides continual learning and federated learning capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system.
"""

from .continual_learning_framework import (
    OnlineLearningAdapter,
    SimpleOnlineAdapter,
    IncrementalModelUpdater,
    PyTorchEWC,
    ExperienceReplay,
    KnowledgeDistillation,
    RegularizationPreservation,
    KnowledgePreservationSystem,
    AdaptiveLRController,
    CyclicLRController,
)
from .federated_system import (
    FederatedAveragingCoordinator,
    LocalTrainer,
    TrainingManager,
    DifferentialPrivacy,
    SecureAggregator,
    CrossStoreFLOrchestrator,
    DeviceProfiler,
    ResourceAwareScheduler,
    AdaptiveCompressor,
    CrossDeviceOptimizer,
)
from .advanced_techniques import (
    MetaLearningAdapter,
    NetworkExpander,
    NetworkPruner,
    ModularArchitecture,
    DynamicArchitectureManager,
    DifficultyScorer,
    CurriculumScheduler,
    TaskSequencer,
    CurriculumLearningManager,
)
from .supply_chain_applications import (
    DemandPatternEvolution,
    SafetyStockOptimizer,
    ReplenishmentStrategy,
    InventoryAdaptationManager,
    SupplierPerformanceTracker,
    RiskAssessor,
    SupplierLearningManager,
)

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
    'MetaLearningAdapter',
    'NetworkExpander',
    'NetworkPruner',
    'ModularArchitecture',
    'DynamicArchitectureManager',
    'DifficultyScorer',
    'CurriculumScheduler',
    'TaskSequencer',
    'CurriculumLearningManager',
    'DemandPatternEvolution',
    'SafetyStockOptimizer',
    'ReplenishmentStrategy',
    'InventoryAdaptationManager',
    'SupplierPerformanceTracker',
    'RiskAssessor',
    'SupplierLearningManager',
]