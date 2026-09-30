"""
Multi-Agent Framework

This module implements multi-agent reinforcement learning algorithms:
- MADDPG for cooperative tasks
- MAPPO algorithms
- QMIX coordination models
- Hierarchical RL with high-level planners

All algorithms are torch-backed; each imports best-effort so a missing
optional torch dependency disables only that algorithm.
"""

import importlib
import logging

logger = logging.getLogger(__name__)

__all__ = []

_ALGORITHMS = ['maddpg', 'mappo', 'qmix', 'hierarchical_rl']
_ATTRS = {
    'maddpg': 'MADDPGAgent',
    'mappo': 'MAPPOAgent',
    'qmix': 'QMIXCoordinator',
    'hierarchical_rl': 'HierarchicalRLPlanner',
}

for _mod, _attr in _ATTRS.items():
    try:
        globals()[_attr] = getattr(importlib.import_module(f'.{_mod}', __name__), _attr)
        __all__.append(_attr)
    except Exception as _exc:  # torch missing or broken
        logger.warning('%s unavailable: %s', _mod, _exc)
