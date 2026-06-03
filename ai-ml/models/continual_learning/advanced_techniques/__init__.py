"""
Advanced Continual Learning Techniques submodule

Provides meta-learning, dynamic architecture growth, and curriculum
learning strategies for advanced continual learning scenarios.
"""

from .meta_learning import MetaLearningAdapter
from .dynamic_architecture import (
    NetworkExpander,
    NetworkPruner,
    ModularArchitecture,
    DynamicArchitectureManager,
)
from .curriculum_learning import (
    DifficultyScorer,
    CurriculumScheduler,
    TaskSequencer,
    CurriculumLearningManager,
)

__all__ = [
    'MetaLearningAdapter',
    'NetworkExpander',
    'NetworkPruner',
    'ModularArchitecture',
    'DynamicArchitectureManager',
    'DifficultyScorer',
    'CurriculumScheduler',
    'TaskSequencer',
    'CurriculumLearningManager',
]
