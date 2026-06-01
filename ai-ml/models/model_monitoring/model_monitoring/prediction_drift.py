"""
Prediction Drift Detector for Model Monitoring

This module implements drift detection for model predictions using
statistical tests and distributional comparison methods to identify
when model behavior shifts from expected patterns.
"""

import numpy as np
from scipy import stats
import logging
from typing import Dict, Any, List, Optional, Tuple, Union
from collections import deque
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PredictionDriftDetector:
    """
    Detects drift in model predictions and feature distributions using
    statistical tests including Kolmogorov-Smirnov, Population Stability Index,
    and distributional distance metrics.
    """

    def __init__(self,
                 model_id: str,
                 window_size: int = 500,
                 reference_size: int = 1000,
                 significance_level: float = 0.05,
                 metrics: Optional[List[str]] = None):
        """
        Initialize the prediction drift detector.

        Args:
            model_id: Unique model identifier
            window_size: Size of sliding window for current predictions
            reference_size: Number of reference samples for baseline
            significance_level: Statistical significance for tests
            metrics: Drift metrics to compute ('ks', 'psi', 'wasserstein', 'jensen_shannon')
        """
        self.model_id = model_id
        self.window_size = window_size
        self.reference_size = reference_size
        self.significance_level = significance_level
        self.metrics = metrics or ['ks', 'psi', 'wasserstein']

        self.reference_predictions = deque(maxlen=reference_size)
        self.current_window = deque(maxlen=window_size)
        self.reference_timestamps = deque(maxlen=reference_size)
        self.current_timestamps = deque(maxlen=window_size)
        self.drift_history = []

        self.drift_detected = False
        self.drift_score = 0.0
        self.drift_metrics = {}
        self.current_phase = 'monitoring'

    def update(self, prediction: Union[float, np.ndarray]) -> Dict[str, Any]:
        """
        Update drift detector with a new prediction.

        Args:
            prediction: New model prediction

        Returns:
            Dictionary with drift detection status
        """
        if isinstance(prediction, np.ndarray):
            prediction = prediction.flatten()
            for p in prediction:
                self._update_single(float(p))
        else:
            self._update_single(float(prediction))

        result = {
            'model_id': self.model_id,
            'drift_detected': self.drift_detected,
            'drift_score': float(self.drift_score),
            'drift_metrics': self.drift_metrics,
            'phase': self.current_phase,
            'reference_samples': len(self.reference_predictions),
            'window_samples': len(self.current_window),
        }

        if self.drift_detected:
            result['timestamp'] = datetime.now().isoformat()
            self.drift_history.append(result.copy())

        return result

    def _update_single(self, prediction: float):
        """Process a single prediction value."""
        if len(self.reference_predictions) < self.reference_size:
            self.reference_predictions.append(prediction)
            self.reference_timestamps.append(datetime.now())
            self.current_phase = 'building_reference'
            return

        self.current_window.append(prediction)
        self.current_timestamps.append(datetime.now())

        if len(self.current_window) >= min(50, self.window_size):
            self._compute_drift()

    def _compute_drift(self):
        """Compute drift metrics between reference and current distributions."""
        ref = np.array(self.reference_predictions)
        curr = np.array(self.current_window)

        if len(ref) < 10 or len(curr) < 10:
            return

        metrics = {}
        drift_scores = []

        if 'ks' in self.metrics:
            ks_stat, ks_pval = stats.ks_2samp(ref, curr)
            metrics['ks_statistic'] = float(ks_stat)
            metrics['ks_p_value'] = float(ks_pval)
            drift_scores.append(1.0 - ks_pval if ks_pval < self.significance_level else 0.0)

        if 'psi' in self.metrics:
            psi = self._compute_psi(ref, curr)
            metrics['psi'] = float(psi)
            drift_scores.append(min(psi / 0.25, 1.0))

        if 'wasserstein' in self.metrics:
            wass_dist = stats.wasserstein_distance(ref, curr)
            metrics['wasserstein_distance'] = float(wass_dist)
            ref_std = float(np.std(ref)) if np.std(ref) > 0 else 1.0
            drift_scores.append(min(wass_dist / (0.5 * ref_std), 1.0))

        if 'jensen_shannon' in self.metrics:
            js_div = self._compute_js_divergence(ref, curr)
            metrics['jensen_shannon'] = float(js_div)
            drift_scores.append(min(js_div / 0.5, 1.0))

        self.drift_metrics = metrics
        self.drift_score = float(np.mean(drift_scores)) if drift_scores else 0.0
        self.drift_detected = self.drift_score > 0.5

        if self.drift_detected:
            self.current_phase = 'drift_detected'
            logger.warning(f"Drift detected for {self.model_id}: score={self.drift_score:.3f}")
        else:
            self.current_phase = 'monitoring'

    def _compute_psi(self, reference: np.ndarray, current: np.ndarray, n_bins: int = 10) -> float:
        """Compute Population Stability Index."""
        all_vals = np.concatenate([reference, current])
        bin_edges = np.percentile(all_vals, np.linspace(0, 100, n_bins + 1))
        bin_edges = np.unique(bin_edges)

        ref_counts, _ = np.histogram(reference, bins=bin_edges)
        curr_counts, _ = np.histogram(current, bins=bin_edges)

        ref_pct = ref_counts / len(reference)
        curr_pct = curr_counts / len(current)

        psi = 0.0
        for r, c in zip(ref_pct, curr_pct):
            if r > 0 and c > 0:
                psi += (c - r) * np.log(c / r)

        return psi

    def _compute_js_divergence(self, p: np.ndarray, q: np.ndarray, n_bins: int = 20) -> float:
        """Compute Jensen-Shannon divergence between two distributions."""
        all_vals = np.concatenate([p, q])
        bin_edges = np.linspace(min(all_vals), max(all_vals), n_bins + 1)
        bin_edges = np.unique(bin_edges)

        p_hist, _ = np.histogram(p, bins=bin_edges, density=True)
        q_hist, _ = np.histogram(q, bins=bin_edges, density=True)

        p_hist = p_hist / (np.sum(p_hist) + 1e-10)
        q_hist = q_hist / (np.sum(q_hist) + 1e-10)
        m = 0.5 * (p_hist + q_hist)

        kl_pm = np.sum(p_hist * np.log(p_hist / (m + 1e-10) + 1e-10))
        kl_qm = np.sum(q_hist * np.log(q_hist / (m + 1e-10) + 1e-10))

        return float(0.5 * (kl_pm + kl_qm))

    def set_reference(self, predictions: Union[List[float], np.ndarray]):
        """
        Explicitly set a reference distribution.

        Args:
            predictions: Reference predictions to use as baseline
        """
        self.reference_predictions.clear()
        for p in predictions:
            self.reference_predictions.append(float(p))
        logger.info(f"Reference distribution set with {len(predictions)} samples for {self.model_id}")

    def get_drift_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive drift detection summary.

        Returns:
            Dictionary with drift summary
        """
        return {
            'model_id': self.model_id,
            'drift_detected': self.drift_detected,
            'drift_score': float(self.drift_score),
            'drift_metrics': self.drift_metrics,
            'phase': self.current_phase,
            'reference_size': len(self.reference_predictions),
            'window_size': len(self.current_window),
            'drift_events': len(self.drift_history),
            'significance_level': self.significance_level,
            'last_drift_event': self.drift_history[-1] if self.drift_history else None,
        }

    def reset_window(self):
        """Reset the current window while preserving reference."""
        self.current_window.clear()
        self.current_timestamps.clear()
        self.drift_detected = False
        self.drift_score = 0.0
        self.drift_metrics = {}
        self.current_phase = 'monitoring'
        logger.info(f"Drift detector window reset for {self.model_id}")


if __name__ == "__main__":
    np.random.seed(42)
    detector = PredictionDriftDetector(
        model_id="demand_forecaster_v2",
        window_size=200,
        reference_size=500,
    )

    for i in range(600):
        if i < 500:
            pred = np.random.normal(100, 15)
        elif i < 550:
            pred = np.random.normal(100, 15)
        else:
            pred = np.random.normal(120, 20)
        result = detector.update(pred)
        if (i + 1) % 100 == 0:
            print(f"Step {i+1}: Drift={result['drift_detected']}, "
                  f"Score={result['drift_score']:.3f}, "
                  f"Phase={result['phase']}")

    summary = detector.get_drift_summary()
    print(f"Final: Drift={summary['drift_detected']}, "
          f"Events={summary['drift_events']}")
