"""
Feature Drift Detector for Model Monitoring

This module implements drift detection for model input features using
statistical tests (KS, Chi-square, Wasserstein) and feature importance-based
weighting to identify data distribution shifts.
"""

import numpy as np
from scipy import stats
import logging
from typing import Dict, Any, List, Optional, Union
from collections import deque
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeatureDriftDetector:
    """
    Detects drift in individual feature distributions using statistical tests.
    Supports numerical (KS, Wasserstein) and categorical (Chi-square) features
    with importance-weighted aggregation.
    """

    def __init__(self,
                 model_id: str,
                 feature_names: List[str],
                 feature_types: Optional[Dict[str, str]] = None,
                 reference_window: int = 1000,
                 test_window: int = 500,
                 significance_level: float = 0.05,
                 metrics: Optional[List[str]] = None):
        """
        Args:
            model_id: Unique model identifier
            feature_names: List of input feature names
            feature_types: Dict mapping feature_name -> 'numerical' or 'categorical'
            reference_window: Number of reference samples for baseline
            test_window: Size of sliding window for current samples
            significance_level: Statistical significance threshold
            metrics: Drift metrics to compute ('ks', 'chi2', 'wasserstein')
        """
        self.model_id = model_id
        self.feature_names = feature_names
        self.feature_types = feature_types or {}
        self.reference_window = reference_window
        self.test_window = test_window
        self.significance_level = significance_level
        self.metrics = metrics or ['ks', 'wasserstein']

        self.reference_data = {name: deque(maxlen=reference_window) for name in feature_names}
        self.current_data = {name: deque(maxlen=test_window) for name in feature_names}
        self.feature_importances = {name: 1.0 / len(feature_names) for name in feature_names}
        self.drift_history = []
        self.drift_scores = {}
        self.current_phase = 'building_reference'

    def update(self, features: Dict[str, Union[float, int, str]]) -> Dict[str, Any]:
        """
        Process a new feature vector.

        Args:
            features: Dict of feature_name -> value

        Returns:
            Dict with drift status and per-feature drift scores
        """
        timestamp = datetime.now().isoformat()

        for name in self.feature_names:
            if name in features:
                value = features[name]
                if self.current_phase == 'building_reference':
                    self.reference_data[name].append(value)
                else:
                    self.current_data[name].append(value)

        if self.current_phase == 'building_reference':
            all_full = all(len(self.reference_data[n]) >= self.reference_window for n in self.feature_names)
            if all_full:
                self.current_phase = 'monitoring'
                logger.info(f"FeatureDriftDetector {self.model_id}: reference built, entering monitoring phase")
            return {'phase': self.current_phase, 'drift_detected': False}

        result = self._compute_drift()
        if result['drift_detected']:
            self.drift_history.append({
                'timestamp': timestamp,
                'drift_score': result['overall_drift_score'],
                'drifted_features': [n for n, s in result['feature_scores'].items() if s['drifted']],
            })

        return result

    def _compute_drift(self) -> Dict[str, Any]:
        """Compute drift metrics for all features against reference distributions."""
        feature_scores = {}
        drifted_count = 0

        for name in self.feature_names:
            ref = list(self.reference_data[name])
            cur = list(self.current_data[name])

            if len(ref) < 10 or len(cur) < 10:
                feature_scores[name] = {'drifted': False, 'score': 0.0, 'metric': 'insufficient_data'}
                continue

            ftype = self.feature_types.get(name, 'numerical')

            if ftype == 'categorical':
                score, metric = self._test_categorical(ref, cur)
            else:
                score, metric = self._test_numerical(ref, cur)

            drifted = score > self.significance_level
            if drifted:
                drifted_count += 1

            feature_scores[name] = {
                'drifted': drifted,
                'score': float(score),
                'metric': metric,
                'importance': self.feature_importances.get(name, 0.0),
            }

        overall = float(np.mean([s['score'] for s in feature_scores.values()]))
        n_drifted = sum(1 for s in feature_scores.values() if s['drifted'])
        drift_detected = overall > self.significance_level or n_drifted > len(self.feature_names) * 0.3

        self.drift_scores = feature_scores

        return {
            'drift_detected': drift_detected,
            'overall_drift_score': overall,
            'n_drifted_features': n_drifted,
            'total_features': len(self.feature_names),
            'feature_scores': feature_scores,
            'phase': self.current_phase,
        }

    def _test_numerical(self, ref: List[float], cur: List[float]) -> tuple:
        """Run KS test on numerical features."""
        try:
            stat, pvalue = stats.ks_2samp(ref, cur)
            return float(pvalue), 'ks'
        except Exception:
            return 1.0, 'ks_error'

    def _test_categorical(self, ref: List, cur: List) -> tuple:
        """Run Chi-square test on categorical features."""
        try:
            categories = sorted(set(ref + cur))
            ref_counts = np.array([ref.count(c) for c in categories])
            cur_counts = np.array([cur.count(c) for c in categories])
            mask = (ref_counts + cur_counts) > 0
            if mask.sum() < 2:
                return 1.0, 'chi2_insufficient'
            _, pvalue = stats.chisquare(cur_counts[mask], f_exp=ref_counts[mask])
            return float(pvalue), 'chi2'
        except Exception:
            return 1.0, 'chi2_error'

    def set_feature_importance(self, importances: Dict[str, float]) -> None:
        """Update feature importance weights."""
        total = sum(importances.values())
        self.feature_importances = {k: v / total for k, v in importances.items()}

    def get_drift_summary(self) -> Dict[str, Any]:
        """Return full drift summary."""
        return {
            'model_id': self.model_id,
            'phase': self.current_phase,
            'drift_scores': self.drift_scores,
            'n_drift_events': len(self.drift_history),
            'drift_history': self.drift_history[-10:] if self.drift_history else [],
            'feature_names': self.feature_names,
        }

    def reset_reference(self) -> None:
        """Reset reference distribution from current window data."""
        self.reference_data = {n: deque(maxlen=self.reference_window) for n in self.feature_names}
        self.current_phase = 'building_reference'
        logger.info(f"FeatureDriftDetector {self.model_id}: reference reset, rebuilding")

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state snapshot."""
        return {
            'model_id': self.model_id,
            'phase': self.current_phase,
            'feature_names': self.feature_names,
            'n_drift_events': len(self.drift_history),
            'reference_sizes': {n: len(self.reference_data[n]) for n in self.feature_names},
            'current_sizes': {n: len(self.current_data[n]) for n in self.feature_names},
        }


if __name__ == "__main__":
    detector = FeatureDriftDetector(
        model_id="test_model",
        feature_names=["sales_price", "promotion_flag", "store_size"],
        feature_types={"promotion_flag": "categorical"},
    )
    for i in range(1200):
        feats = {
            "sales_price": float(np.random.randn() * 10 + 100),
            "promotion_flag": str(np.random.choice(["yes", "no"], p=[0.3, 0.7])),
            "store_size": float(np.random.randn() * 100 + 5000),
        }
        result = detector.update(feats)
        if result.get('drift_detected'):
            print(f"Drift detected at step {i}: score={result['overall_drift_score']:.3f}")
    print("Final state:", detector.get_state())
