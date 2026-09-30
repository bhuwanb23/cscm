"""
Training & Deployment submodule

Torch-backed components (CTDE trainer, digital twin simulator, edge policy
deployment) import best-effort so the pure-Python metrics tracker stays
usable on torch-free machines.
"""

__all__ = []

try:
    from .ctde_trainer import CTDETrainer
    from .digital_twin_simulator import MultiAgentDigitalTwin
    from .edge_policy_deployment import EdgePolicyDeployment
    __all__ += ['CTDETrainer', 'MultiAgentDigitalTwin', 'EdgePolicyDeployment']
except Exception as _exc:  # torch missing or broken
    import logging
    logging.getLogger(__name__).warning('torch-backed training components unavailable: %s', _exc)

from .coordination_metrics import CoordinationMetricsTracker
__all__.append('CoordinationMetricsTracker')
