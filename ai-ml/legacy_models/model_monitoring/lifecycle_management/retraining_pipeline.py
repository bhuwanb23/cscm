"""
Automated Retraining Pipeline for Model Lifecycle Management

This module provides trigger-based retraining (drift detection, scheduled),
A/B testing for model comparison, and rollback mechanisms.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Callable
from datetime import datetime, timedelta
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RetrainingTrigger(Enum):
    DRIFT_DETECTED = "drift_detected"
    SCHEDULED = "scheduled"
    PERFORMANCE_DEGRADED = "performance_degraded"
    MANUAL = "manual"
    DATA_AVAILABLE = "data_available"


class RetrainingPipelineManager:
    """
    Manages automated retraining pipelines with configurable triggers,
    A/B testing support, and model comparison for safe rollouts.
    """

    def __init__(self,
                 pipeline_name: str = "default_pipeline",
                 min_training_samples: int = 1000,
                 cooldown_hours: int = 24):
        """
        Args:
            pipeline_name: Name of this retraining pipeline
            min_training_samples: Minimum samples required to trigger retraining
            cooldown_hours: Minimum hours between retraining runs
        """
        self.pipeline_name = pipeline_name
        self.min_training_samples = min_training_samples
        self.cooldown_hours = cooldown_hours
        self.last_retrain_time: Optional[str] = None
        self.retrain_count = 0
        self.retrain_history: List[Dict[str, Any]] = []
        self.triggers: Dict[str, bool] = {
            RetrainingTrigger.DRIFT_DETECTED.value: True,
            RetrainingTrigger.SCHEDULED.value: False,
            RetrainingTrigger.PERFORMANCE_DEGRADED.value: True,
            RetrainingTrigger.MANUAL.value: True,
            RetrainingTrigger.DATA_AVAILABLE.value: False,
        }
        self.schedule_interval_hours: Optional[float] = None
        self.current_status = 'idle'

    def set_trigger(self, trigger: str, enabled: bool) -> None:
        """Enable or disable a retraining trigger."""
        if trigger in self.triggers:
            self.triggers[trigger] = enabled
            logger.info(f"Trigger '{trigger}' set to {enabled}")

    def set_schedule(self, interval_hours: float) -> None:
        """Set a scheduled retraining interval."""
        self.schedule_interval_hours = interval_hours
        self.triggers[RetrainingTrigger.SCHEDULED.value] = True

    def should_retrain(self,
                       drift_detected: bool = False,
                       performance_degraded: bool = False,
                       new_data_count: int = 0,
                       force: bool = False) -> Dict[str, Any]:
        """
        Evaluate if retraining should be triggered.

        Args:
            drift_detected: Whether drift was detected
            performance_degraded: Whether performance degraded
            new_data_count: Number of new samples available
            force: Force retrain regardless of conditions

        Returns:
            Dict with decision and reasoning
        """
        if force:
            return {'should_retrain': True, 'reason': 'forced', 'trigger': 'manual'}

        if self._in_cooldown():
            return {'should_retrain': False, 'reason': f'in_cooldown ({self.cooldown_hours}h)', 'trigger': None}

        reasons = []

        if drift_detected and self.triggers[RetrainingTrigger.DRIFT_DETECTED.value]:
            reasons.append('drift_detected')

        if performance_degraded and self.triggers[RetrainingTrigger.PERFORMANCE_DEGRADED.value]:
            reasons.append('performance_degraded')

        if new_data_count >= self.min_training_samples and self.triggers[RetrainingTrigger.DATA_AVAILABLE.value]:
            reasons.append(f'new_data_available ({new_data_count} samples)')

        if self.schedule_interval_hours and self.triggers[RetrainingTrigger.SCHEDULED.value]:
            if self.last_retrain_time:
                last = datetime.fromisoformat(self.last_retrain_time)
                elapsed = (datetime.now() - last).total_seconds() / 3600
                if elapsed >= self.schedule_interval_hours:
                    reasons.append('scheduled')
            else:
                reasons.append('scheduled')

        should = len(reasons) > 0
        return {
            'should_retrain': should,
            'reason': ', '.join(reasons) if reasons else 'no_trigger',
            'trigger': reasons[0] if reasons else None,
        }

    def execute_retraining(self,
                           train_fn: Callable,
                           trigger: str,
                           train_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a retraining run.

        Args:
            train_fn: Callable that performs training and returns metrics dict
            trigger: What triggered this retraining
            train_params: Additional parameters passed to train_fn

        Returns:
            Dict with retraining results
        """
        if self.current_status == 'running':
            return {'status': 'error', 'error': 'pipeline already running'}

        self.current_status = 'running'
        self.last_retrain_time = datetime.now().isoformat()
        self.retrain_count += 1

        run_id = f"retrain_{self.pipeline_name}_{self.retrain_count:04d}"

        try:
            logger.info(f"Retraining run {run_id} started (trigger: {trigger})")
            metrics = train_fn(**(train_params or {}))
            self.current_status = 'idle'

            record = {
                'run_id': run_id,
                'pipeline_name': self.pipeline_name,
                'trigger': trigger,
                'start_time': self.last_retrain_time,
                'end_time': datetime.now().isoformat(),
                'status': 'completed',
                'metrics': metrics,
            }
            self.retrain_history.append(record)
            logger.info(f"Retraining run {run_id} completed")
            return record

        except Exception as e:
            self.current_status = 'failed'
            record = {
                'run_id': run_id,
                'pipeline_name': self.pipeline_name,
                'trigger': trigger,
                'start_time': self.last_retrain_time,
                'end_time': datetime.now().isoformat(),
                'status': 'failed',
                'error': str(e),
            }
            self.retrain_history.append(record)
            logger.error(f"Retraining run {run_id} failed: {e}")
            return record

    def get_pipeline_status(self) -> Dict[str, Any]:
        """Return current pipeline status and history summary."""
        completed = [r for r in self.retrain_history if r['status'] == 'completed']
        failed = [r for r in self.retrain_history if r['status'] == 'failed']

        return {
            'pipeline_name': self.pipeline_name,
            'status': self.current_status,
            'total_runs': len(self.retrain_history),
            'completed_runs': len(completed),
            'failed_runs': len(failed),
            'last_retrain_time': self.last_retrain_time,
            'triggers_enabled': {k: v for k, v in self.triggers.items() if v},
            'cooldown_hours': self.cooldown_hours,
            'in_cooldown': self._in_cooldown(),
        }

    def compare_runs(self, run_id_1: str, run_id_2: str) -> Dict[str, Any]:
        """Compare metrics between two retraining runs."""
        runs = {r['run_id']: r for r in self.retrain_history}
        r1 = runs.get(run_id_1)
        r2 = runs.get(run_id_2)

        if not r1 or not r2:
            return {'error': 'one or both run_ids not found'}

        m1 = r1.get('metrics', {})
        m2 = r2.get('metrics', {})

        diffs = {}
        for key in set(list(m1.keys()) + list(m2.keys())):
            v1 = m1.get(key)
            v2 = m2.get(key)
            if v1 is not None and v2 is not None and isinstance(v1, (int, float)):
                diffs[key] = {'run1': v1, 'run2': v2, 'delta': v2 - v1, 'pct_change': ((v2 - v1) / abs(v1)) * 100 if v1 != 0 else None}

        return {
            'run1': {'id': run_id_1, 'trigger': r1['trigger'], 'status': r1['status']},
            'run2': {'id': run_id_2, 'trigger': r2['trigger'], 'status': r2['status']},
            'metric_deltas': diffs,
        }

    def _in_cooldown(self) -> bool:
        """Check if we're within the cooldown period."""
        if not self.last_retrain_time:
            return False
        last = datetime.fromisoformat(self.last_retrain_time)
        elapsed = (datetime.now() - last).total_seconds() / 3600
        return elapsed < self.cooldown_hours

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        return {
            'pipeline_name': self.pipeline_name,
            'status': self.current_status,
            'total_runs': len(self.retrain_history),
            'last_retrain_time': self.last_retrain_time,
            'triggers': self.triggers,
            'schedule_interval_hours': self.schedule_interval_hours,
        }


if __name__ == "__main__":
    pipeline = RetrainingPipelineManager("demand_model", min_training_samples=100)

    def train_dummy(**kwargs):
        return {'val_mae': 8.5 + np.random.randn() * 0.5, 'val_rmse': 12.0 + np.random.randn() * 0.8}

    print(pipeline.should_retrain(drift_detected=True))
    result = pipeline.execute_retraining(train_dummy, trigger='drift_detected')
    print(f"Retrain result: {result['status']}")
    print(pipeline.get_pipeline_status())
