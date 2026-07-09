"""
Auto-Rollback Manager for Advanced MLOps

This module implements automatic rollback of model deployments when
performance degradation is detected, with safety checks and audit logging.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RollbackTrigger(Enum):
    METRIC_DEGRADATION = "metric_degradation"
    ERROR_SPIKE = "error_spike"
    LATENCY_INCREASE = "latency_increase"
    DRIFT_DETECTED = "drift_detected"
    MANUAL = "manual"


class AutoRollbackManager:
    """
    Monitors deployed model performance and automatically rolls back
    to a previous version when degradation exceeds configured thresholds.
    Includes safety checks, gradual rollback, and audit logging.
    """

    def __init__(self,
                 system_name: str = "cscm_auto_rollback",
                 degradation_threshold: float = 0.1,
                 min_samples_before_rollback: int = 50,
                 cooldown_minutes: int = 120):
        """
        Args:
            system_name: Name identifier for this rollback manager
            degradation_threshold: Fractional degradation allowed before rollback
            min_samples_before_rollback: Minimum samples before rollback decision
            cooldown_minutes: Minutes to wait after rollback before allowing promotion
        """
        self.system_name = system_name
        self.degradation_threshold = degradation_threshold
        self.min_samples_before_rollback = min_samples_before_rollback
        self.cooldown_minutes = cooldown_minutes

        self.deployments: Dict[str, Dict[str, Any]] = {}
        self.rollback_history: List[Dict[str, Any]] = []
        self.metrics_buffer: Dict[str, List[Dict[str, float]]] = {}
        self.baseline_metrics: Dict[str, Dict[str, float]] = {}

    def register_deployment(self,
                            deployment_id: str,
                            model_id: str,
                            baseline_metrics: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Register a deployment for rollback monitoring.

        Args:
            deployment_id: Unique deployment identifier
            model_id: Model version ID
            baseline_metrics: Expected performance baseline

        Returns:
            Dict with registration confirmation
        """
        if deployment_id in self.deployments:
            return {'status': 'error', 'error': 'deployment already registered'}

        self.deployments[deployment_id] = {
            'deployment_id': deployment_id,
            'model_id': model_id,
            'registered_at': datetime.now().isoformat(),
            'current_state': 'active',
            'previous_version_id': None,
            'metrics': {},
        }
        self.metrics_buffer[deployment_id] = []
        self.baseline_metrics[deployment_id] = baseline_metrics or {}

        logger.info(f"Deployment {deployment_id} (model {model_id}) registered")
        return {'status': 'registered', 'deployment_id': deployment_id}

    def record_metrics(self,
                       deployment_id: str,
                       metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Record performance metrics for a deployment.

        Args:
            deployment_id: Deployment ID
            metrics: Dict of metric_name -> value

        Returns:
            Dict with rollback evaluation
        """
        if deployment_id not in self.metrics_buffer:
            return {'status': 'error', 'error': 'deployment not registered'}

        entry = {'timestamp': datetime.now().isoformat(), **metrics}
        self.metrics_buffer[deployment_id].append(entry)
        self.deployments[deployment_id]['metrics'] = metrics

        if len(self.metrics_buffer[deployment_id]) >= self.min_samples_before_rollback:
            return self._evaluate_rollback(deployment_id)

        return {'status': 'monitoring', 'samples': len(self.metrics_buffer[deployment_id])}

    def _evaluate_rollback(self, deployment_id: str) -> Dict[str, Any]:
        """Evaluate if rollback is needed."""
        buffer = self.metrics_buffer[deployment_id]
        baseline = self.baseline_metrics.get(deployment_id, {})

        if not baseline:
            return {'status': 'monitoring', 'reason': 'no_baseline'}

        recent = buffer[-self.min_samples_before_rollback:]
        triggers = []

        for metric, baseline_val in baseline.items():
            recent_values = [r.get(metric) for r in recent if metric in r]
            if not recent_values:
                continue
            current_val = float(np.mean(recent_values))
            if baseline_val == 0:
                continue
            degradation = (current_val - baseline_val) / abs(baseline_val)

            if degradation > self.degradation_threshold:
                triggers.append({
                    'metric': metric,
                    'baseline': baseline_val,
                    'current': current_val,
                    'degradation': float(degradation),
                    'threshold': self.degradation_threshold,
                })

        if len(triggers) > 0:
            return self._execute_rollback(deployment_id, triggers)

        return {'status': 'healthy', 'reason': 'within_threshold'}

    def _execute_rollback(self,
                          deployment_id: str,
                          triggers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Execute rollback for a deployment."""
        dep = self.deployments[deployment_id]
        dep['current_state'] = 'rolled_back'
        dep['rolled_back_at'] = datetime.now().isoformat()

        record = {
            'rollback_id': f"rb_{deployment_id}_{len(self.rollback_history) + 1}",
            'deployment_id': deployment_id,
            'model_id': dep['model_id'],
            'trigger': 'metric_degradation',
            'triggers': triggers,
            'rolled_back_at': dep['rolled_back_at'],
            'cooldown_until': (
                datetime.fromisoformat(dep['rolled_back_at']).timestamp() + self.cooldown_minutes * 60
            ),
        }
        self.rollback_history.append(record)

        logger.warning(
            f"Rollback triggered for {deployment_id} ({dep['model_id']}): "
            f"{len(triggers)} metrics exceeded threshold"
        )
        return {
            'status': 'rolled_back',
            'rollback_id': record['rollback_id'],
            'reason': 'metric_degradation',
            'triggers': triggers,
            'deployment_id': deployment_id,
            'model_id': dep['model_id'],
        }

    def manual_rollback(self,
                        deployment_id: str,
                        reason: str,
                        initiated_by: str) -> Dict[str, Any]:
        """Manually trigger a rollback."""
        if deployment_id not in self.deployments:
            return {'status': 'error', 'error': 'deployment not found'}

        dep = self.deployments[deployment_id]
        dep['current_state'] = 'rolled_back'
        dep['rolled_back_at'] = datetime.now().isoformat()

        record = {
            'rollback_id': f"rb_{deployment_id}_{len(self.rollback_history) + 1}",
            'deployment_id': deployment_id,
            'model_id': dep['model_id'],
            'trigger': 'manual',
            'reason': reason,
            'initiated_by': initiated_by,
            'rolled_back_at': dep['rolled_back_at'],
        }
        self.rollback_history.append(record)
        logger.warning(f"Manual rollback for {deployment_id} by {initiated_by}: {reason}")
        return record

    def get_rollback_status(self, deployment_id: str) -> Dict[str, Any]:
        """Get current rollback status for a deployment."""
        dep = self.deployments.get(deployment_id)
        if not dep:
            return {'status': 'error', 'error': 'deployment not found'}

        deployment_rollbacks = [r for r in self.rollback_history
                                if r['deployment_id'] == deployment_id]
        buffer = self.metrics_buffer.get(deployment_id, [])

        return {
            'deployment_id': deployment_id,
            'model_id': dep['model_id'],
            'state': dep['current_state'],
            'registered_at': dep['registered_at'],
            'total_rollbacks': len(deployment_rollbacks),
            'recent_rollbacks': deployment_rollbacks[-3:] if deployment_rollbacks else [],
            'samples_collected': len(buffer),
            'baseline': self.baseline_metrics.get(deployment_id, {}),
        }

    def can_promote(self, deployment_id: str) -> Dict[str, Any]:
        """Check if a new deployment can be promoted (cooldown check)."""
        dep = self.deployments.get(deployment_id)
        if not dep:
            return {'can_promote': False, 'reason': 'not_registered'}

        if dep['current_state'] == 'active':
            return {'can_promote': True, 'reason': 'already_active'}

        last_rb = [r for r in self.rollback_history if r['deployment_id'] == deployment_id]
        if not last_rb:
            return {'can_promote': True, 'reason': 'no_rollbacks'}

        latest = last_rb[-1]
        if isinstance(latest.get('cooldown_until'), (int, float)):
            now = datetime.now().timestamp()
            remaining = latest['cooldown_until'] - now
            if remaining > 0:
                return {
                    'can_promote': False,
                    'reason': f'in_cooldown ({remaining / 60:.0f} min remaining)',
                    'remaining_seconds': int(remaining),
                }

        return {'can_promote': True, 'reason': 'cooldown_expired'}

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        return {
            'system_name': self.system_name,
            'deployments': {k: {'state': v['current_state'], 'model_id': v['model_id']}
                           for k, v in self.deployments.items()},
            'total_rollbacks': len(self.rollback_history),
            'active_rollbacks': [r for r in self.rollback_history
                                 if r['deployment_id'] in self.deployments
                                 and self.deployments[r['deployment_id']]['current_state'] == 'rolled_back'],
        }


if __name__ == "__main__":
    rb = AutoRollbackManager(degradation_threshold=0.08)
    rb.register_deployment("dep_demand_v2", "demand_v2", baseline_metrics={'mae': 10.0})

    for _ in range(60):
        rb.record_metrics("dep_demand_v2", {'mae': 10.0 + np.random.randn() * 2 + 1.5})

    status = rb.get_rollback_status("dep_demand_v2")
    print(f"State: {status['state']}, Rollbacks: {status['total_rollbacks']}")
    print(rb.can_promote("dep_demand_v2"))
