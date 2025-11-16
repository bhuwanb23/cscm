"""
Training & Deployment for Multi-Agent Coordination

This module provides training and deployment infrastructure for multi-agent systems:
- Centralized Training with Decentralized Execution (CTDE)
- Digital twin for interaction simulation
- Lightweight policy networks for edge deployment
- Metrics for coordination efficiency
"""

from .ctde_trainer import CTDETrainer
from .digital_twin_simulator import MultiAgentDigitalTwin
from .edge_policy_deployment import EdgePolicyDeployment
from .coordination_metrics import CoordinationMetricsTracker

__all__ = [
    'CTDETrainer',
    'MultiAgentDigitalTwin',
    'EdgePolicyDeployment',
    'CoordinationMetricsTracker'
]

