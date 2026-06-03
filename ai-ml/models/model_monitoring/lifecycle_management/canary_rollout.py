"""
Canary Rollout Manager for Model Lifecycle Management

This module implements canary deployments for model rollout with traffic
splitting, metrics comparison, and automatic rollback on regression.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RolloutStatus(Enum):
    PENDING = "pending"
    CANARY = "canary"
    ROLLING_OUT = "rolling_out"
    FULL = "full"
    ROLLED_BACK = "rolled_back"
    FAILED = "failed"


class CanaryRolloutManager:
    """
    Manages staged canary deployments of new model versions with traffic
    splitting, metrics comparison, and automatic rollback.
    """

    def __init__(self,
                 rollout_name: str = "default_rollout",
                 canary_traffic_pct: float = 5.0,
                 step_increase_pct: float = 25.0,
                 evaluation_window: int = 100,
                 acceptance_threshold: float = 0.05):
        """
        Args:
            rollout_name: Name of this rollout
            canary_traffic_pct: Initial traffic percentage for canary (0-100)
            step_increase_pct: Traffic increase per step during rollout
            evaluation_window: Number of predictions to evaluate before promoting
            acceptance_threshold: Max allowed metric degradation before rollback
        """
        self.rollout_name = rollout_name
        self.canary_traffic_pct = canary_traffic_pct
        self.step_increase_pct = step_increase_pct
        self.evaluation_window = evaluation_window
        self.acceptance_threshold = acceptance_threshold

        self.status = RolloutStatus.PENDING
        self.current_traffic_pct = 0.0
        self.baseline_metrics: Dict[str, float] = {}
        self.canary_metrics: Dict[str, float] = {}
        self.canary_predictions: List[float] = []
        self.baseline_predictions: List[float] = []
        self.rollout_history: List[Dict[str, Any]] = []
        self.canary_model_id: Optional[str] = None
        self.baseline_model_id: Optional[str] = None
        self.started_at: Optional[str] = None
        self.completed_at: Optional[str] = None

    def start_rollout(self,
                      canary_model_id: str,
                      baseline_model_id: str,
                      initial_metrics: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """
        Start a canary rollout.

        Args:
            canary_model_id: ID of the new model version
            baseline_model_id: ID of the current production model
            initial_metrics: Baseline metrics for comparison

        Returns:
            Dict with rollout start info
        """
        self.canary_model_id = canary_model_id
        self.baseline_model_id = baseline_model_id
        self.baseline_metrics = initial_metrics or {}
        self.status = RolloutStatus.CANARY
        self.current_traffic_pct = self.canary_traffic_pct
        self.started_at = datetime.now().isoformat()

        record = {
            'timestamp': self.started_at,
            'action': 'start',
            'status': 'canary',
            'traffic_pct': self.current_traffic_pct,
            'canary_model': canary_model_id,
            'baseline_model': baseline_model_id,
        }
        self.rollout_history.append(record)
        logger.info(f"Rollout started: {canary_model_id} -> canary at {self.canary_traffic_pct}%")
        return record

    def record_canary_prediction(self, prediction: float, baseline_prediction: float) -> None:
        """Record a prediction from both canary and baseline models."""
        self.canary_predictions.append(prediction)
        self.baseline_predictions.append(baseline_prediction)

    def evaluate_canary(self, canary_actuals: List[float]) -> Dict[str, Any]:
        """
        Evaluate canary performance against baseline.

        Args:
            canary_actuals: Ground truth values for evaluation

        Returns:
            Dict with evaluation results and promotion decision
        """
        if len(canary_actuals) < self.evaluation_window:
            return {
                'status': self.status.value,
                'evaluated': False,
                'reason': f'insufficient_samples ({len(canary_actuals)} < {self.evaluation_window})',
            }

        n = min(len(canary_actuals), len(self.canary_predictions), len(self.baseline_predictions))
        if n < self.evaluation_window:
            return {'status': self.status.value, 'evaluated': False, 'reason': 'insufficient_predictions'}

        canary_error = np.abs(np.array(self.canary_predictions[-n:]) - np.array(canary_actuals[-n:]))
        baseline_error = np.abs(np.array(self.baseline_predictions[-n:]) - np.array(canary_actuals[-n:]))

        canary_mae = float(np.mean(canary_error))
        baseline_mae = float(np.mean(baseline_error))

        self.canary_metrics = {'mae': canary_mae}
        self.baseline_metrics['mae'] = baseline_mae

        degradation = (canary_mae - baseline_mae) / max(baseline_mae, 1e-10)

        if degradation > self.acceptance_threshold:
            self._rollback(f"Canary MAE ({canary_mae:.3f}) degraded {degradation*100:.1f}% vs baseline ({baseline_mae:.3f})")
            return {
                'status': self.status.value,
                'evaluated': True,
                'decision': 'rollback',
                'canary_mae': canary_mae,
                'baseline_mae': baseline_mae,
                'degradation': float(degradation),
                'reason': f'exceeded threshold {self.acceptance_threshold}',
            }

        return {
            'status': self.status.value,
            'evaluated': True,
            'decision': 'promote',
            'canary_mae': canary_mae,
            'baseline_mae': baseline_mae,
            'degradation': float(degradation),
            'improvement': float(-degradation),
        }

    def promote_step(self) -> Dict[str, Any]:
        """Increase traffic to canary by one step."""
        if self.status != RolloutStatus.CANARY and self.status != RolloutStatus.ROLLING_OUT:
            return {'status': self.status.value, 'error': 'not in canary or rolling_out phase'}

        self.status = RolloutStatus.ROLLING_OUT
        old_pct = self.current_traffic_pct
        self.current_traffic_pct = min(100.0, self.current_traffic_pct + self.step_increase_pct)

        record = {
            'timestamp': datetime.now().isoformat(),
            'action': 'promote_step',
            'status': 'rolling_out',
            'traffic_pct_from': old_pct,
            'traffic_pct_to': self.current_traffic_pct,
        }
        self.rollout_history.append(record)

        if self.current_traffic_pct >= 100.0:
            self.status = RolloutStatus.FULL
            self.completed_at = datetime.now().isoformat()
            logger.info(f"Rollout {self.canary_model_id} reached 100% traffic")
            record['status'] = 'full'

        logger.info(f"Promoted canary from {old_pct}% to {self.current_traffic_pct}%")
        return record

    def _rollback(self, reason: str) -> Dict[str, Any]:
        """Rollback the canary deployment."""
        self.status = RolloutStatus.ROLLED_BACK
        self.completed_at = datetime.now().isoformat()
        record = {
            'timestamp': self.completed_at,
            'action': 'rollback',
            'status': 'rolled_back',
            'reason': reason,
            'traffic_pct': 0.0,
        }
        self.rollout_history.append(record)
        self.current_traffic_pct = 0.0
        logger.warning(f"Rollback of {self.canary_model_id}: {reason}")
        return record

    def get_rollout_status(self) -> Dict[str, Any]:
        """Return current rollout status."""
        return {
            'rollout_name': self.rollout_name,
            'status': self.status.value,
            'canary_model': self.canary_model_id,
            'baseline_model': self.baseline_model_id,
            'current_traffic_pct': self.current_traffic_pct,
            'canary_metrics': self.canary_metrics,
            'baseline_metrics': self.baseline_metrics,
            'started_at': self.started_at,
            'completed_at': self.completed_at,
            'history_length': len(self.rollout_history),
            'canary_samples': len(self.canary_predictions),
        }

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        return {
            'rollout_name': self.rollout_name,
            'status': self.status.value,
            'current_traffic_pct': self.current_traffic_pct,
            'canary_model': self.canary_model_id,
            'canary_metrics': self.canary_metrics,
            'baseline_metrics': self.baseline_metrics,
        }


if __name__ == "__main__":
    rollout = CanaryRolloutManager("demand_v2_test", canary_traffic_pct=10.0)
    rollout.start_rollout("demand_v2", "demand_v1", initial_metrics={'mae': 10.0})

    for _ in range(120):
        rollout.record_canary_prediction(
            float(np.random.randn() * 5 + 100 + np.random.randn() * 0.5),
            float(np.random.randn() * 5 + 100),
        )

    actuals = [float(np.random.randn() * 5 + 100) for _ in range(120)]
    eval_result = rollout.evaluate_canary(actuals)
    print(f"Evaluation: {eval_result['decision']}")

    if eval_result['decision'] == 'promote':
        rollout.promote_step()
        rollout.promote_step()

    print(rollout.get_rollout_status())
