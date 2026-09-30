"""
Multi-Agent Coordination & Policy Learning Module

This module provides multi-agent coordination capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system.

All exports are torch-backed; each imports best-effort so a missing
optional torch dependency disables only that component.
"""

import importlib
import logging

logger = logging.getLogger(__name__)

__all__ = []

_COMPONENTS = [
    ('multi_agent_framework', 'MADDPGAgent'),
    ('multi_agent_framework', 'MAPPOAgent'),
    ('multi_agent_framework', 'QMIXCoordinator'),
    ('multi_agent_framework', 'HierarchicalRLPlanner'),
    ('communication_protocols', 'GNNCommunication'),
    ('communication_protocols', 'MessagePassingMechanism'),
    ('communication_protocols', 'CompressedStateExchange'),
]

_seen = set()
for _sub, _attr in _COMPONENTS:
    if _sub in _seen:
        try:
            _module = importlib.import_module(f'.{_sub}', __name__)
        except Exception:
            continue
    else:
        try:
            _module = importlib.import_module(f'.{_sub}', __name__)
            _seen.add(_sub)
        except Exception as _exc:
            logger.warning('%s unavailable: %s', _sub, _exc)
            continue
    if hasattr(_module, _attr):
        globals()[_attr] = getattr(_module, _attr)
        __all__.append(_attr)
