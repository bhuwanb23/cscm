"""
Shadow Deployment Manager for Model Lifecycle Management

This module implements shadow mode testing where new model versions run
alongside production without serving live traffic, enabling safe evaluation.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ShadowDeploymentManager:
    """
    Manages shadow deployments where candidate models run in parallel with
    the production model. Shadow predictions are logged and compared but
    never served to end users.
    """

    def __init__(self,
                 deployment_name: str = "default_shadow",
                 evaluation_window: int = 500,
                 promotion_threshold: float = 0.05,
                 sample_rate: float = 1.0):
        """
        Args:
            deployment_name: Name of this shadow deployment
            evaluation_window: Number of samples before evaluation
            promotion_threshold: Minimum improvement to consider promotion
            sample_rate: Fraction of production traffic to shadow (0-1)
        """
        self.deployment_name = deployment_name
        self.evaluation_window = evaluation_window
        self.promotion_threshold = promotion_threshold
        self.sample_rate = min(1.0, max(0.0, sample_rate))

        self.shadow_model_id: Optional[str] = None
        self.production_model_id: Optional[str] = None
        self.shadow_predictions: List[float] = []
        self.production_predictions: List[float] = []
        self.actuals: List[float] = []
        self.timestamps: List[str] = []
        self.metadata: List[Dict[str, Any]] = []
        self.started_at: Optional[str] = None
        self.evaluations: List[Dict[str, Any]] = []
        self.is_running = False

    def start_shadow(self, shadow_model_id: str, production_model_id: str) -> Dict[str, Any]:
        """
        Start shadow deployment.

        Args:
            shadow_model_id: ID of the candidate model
            production_model_id: ID of the current production model

        Returns:
            Dict with deployment start info
        """
        self.shadow_model_id = shadow_model_id
        self.production_model_id = production_model_id
        self.is_running = True
        self.started_at = datetime.now().isoformat()
        self.shadow_predictions = []
        self.production_predictions = []
        self.actuals = []
        self.timestamps = []
        self.metadata = []

        logger.info(f"Shadow deployment started: {shadow_model_id} shadowing {production_model_id}")
        return {
            'deployment_name': self.deployment_name,
            'shadow_model': shadow_model_id,
            'production_model': production_model_id,
            'started_at': self.started_at,
        }

    def record_prediction(self,
                          shadow_pred: float,
                          production_pred: float,
                          actual: Optional[float] = None,
                          meta: Optional[Dict[str, Any]] = None) -> None:
        """Record a prediction pair from shadow and production models."""
        self.shadow_predictions.append(shadow_pred)
        self.production_predictions.append(production_pred)
        if actual is not None:
            self.actuals.append(actual)
        self.timestamps.append(datetime.now().isoformat())
        self.metadata.append(meta or {})

    def evaluate(self, force: bool = False) -> Dict[str, Any]:
        """
        Evaluate shadow model performance vs production.

        Args:
            force: Force evaluation even without enough samples

        Returns:
            Dict with comparison metrics and promotion recommendation
        """
        if len(self.actuals) < self.evaluation_window and not force:
            return {
                'evaluated': False,
                'reason': f'insufficient_actuals ({len(self.actuals)} < {self.evaluation_window})',
                'shadow_model': self.shadow_model_id,
                'production_model': self.production_model_id,
            }

        n = min(len(self.actuals), len(self.shadow_predictions), len(self.production_predictions))
        if n < 10:
            return {'evaluated': False, 'reason': 'too_few_samples'}

        shadow_errors = np.abs(np.array(self.shadow_predictions[-n:]) - np.array(self.actuals[-n:]))
        prod_errors = np.abs(np.array(self.production_predictions[-n:]) - np.array(self.actuals[-n:]))

        shadow_mae = float(np.mean(shadow_errors))
        prod_mae = float(np.mean(prod_errors))
        shadow_rmse = float(np.sqrt(np.mean(shadow_errors ** 2)))
        prod_rmse = float(np.sqrt(np.mean(prod_errors ** 2)))

        improvement = (prod_mae - shadow_mae) / max(prod_mae, 1e-10)
        better = shadow_mae < prod_mae * (1 - self.promotion_threshold)

        result = {
            'evaluated': True,
            'timestamp': datetime.now().isoformat(),
            'shadow_model': self.shadow_model_id,
            'production_model': self.production_model_id,
            'shadow_mae': shadow_mae,
            'prod_mae': prod_mae,
            'shadow_rmse': shadow_rmse,
            'prod_rmse': prod_rmse,
            'improvement': float(improvement),
            'recommend_promotion': better and improvement > self.promotion_threshold,
            'n_samples': n,
        }
        self.evaluations.append(result)
        return result

    def compare_segments(self, segment_key: str) -> Dict[str, Any]:
        """Compare performance across different segments."""
        segments: Dict[str, Dict[str, List[float]]] = {}
        for i, meta in enumerate(self.metadata):
            seg_val = meta.get(segment_key, 'unknown')
            if seg_val not in segments:
                segments[seg_val] = {'shadow': [], 'prod': [], 'actual': []}
            if i < len(self.shadow_predictions) and i < len(self.actuals):
                segments[seg_val]['shadow'].append(self.shadow_predictions[i])
                segments[seg_val]['prod'].append(self.production_predictions[i])
                segments[seg_val]['actual'].append(self.actuals[i])

        results = {}
        for seg, data in segments.items():
            if len(data['actual']) < 5:
                continue
            s_err = np.abs(np.array(data['shadow']) - np.array(data['actual']))
            p_err = np.abs(np.array(data['prod']) - np.array(data['actual']))
            results[seg] = {
                'shadow_mae': float(np.mean(s_err)),
                'prod_mae': float(np.mean(p_err)),
                'n': len(data['actual']),
            }
        return {'segment_key': segment_key, 'segments': results}

    def stop_shadow(self) -> Dict[str, Any]:
        """Stop shadow deployment and return summary."""
        self.is_running = False
        summary = {
            'deployment_name': self.deployment_name,
            'shadow_model': self.shadow_model_id,
            'production_model': self.production_model_id,
            'started_at': self.started_at,
            'stopped_at': datetime.now().isoformat(),
            'total_predictions': len(self.shadow_predictions),
            'total_actuals': len(self.actuals),
            'evaluations': len(self.evaluations),
            'latest_evaluation': self.evaluations[-1] if self.evaluations else None,
        }
        logger.info(f"Shadow deployment {self.deployment_name} stopped")
        return summary

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        return {
            'deployment_name': self.deployment_name,
            'shadow_model': self.shadow_model_id,
            'production_model': self.production_model_id,
            'is_running': self.is_running,
            'total_predictions': len(self.shadow_predictions),
            'total_actuals': len(self.actuals),
            'n_evaluations': len(self.evaluations),
        }


if __name__ == "__main__":
    shadow = ShadowDeploymentManager("demand_v3_test", evaluation_window=50)
    shadow.start_shadow("demand_v3", "demand_v1")

    for i in range(200):
        ground_truth = 100 + np.random.randn() * 5
        shadow.record_prediction(
            shadow_pred=ground_truth + np.random.randn() * 2,
            production_pred=ground_truth + np.random.randn() * 4,
            actual=ground_truth,
            meta={"store_id": f"store_{i % 5}"},
        )

    eval_result = shadow.evaluate()
    print(f"Promotion recommended: {eval_result['recommend_promotion']}")
    print(f"Segment comparison: {shadow.compare_segments('store_id')}")
    print(shadow.stop_shadow())
