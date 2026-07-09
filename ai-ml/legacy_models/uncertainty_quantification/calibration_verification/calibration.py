"""
Probability Calibration for Uncertainty Quantification

This module implements probability calibration techniques including
Platt scaling, isotonic regression, and temperature scaling to ensure
well-calibrated uncertainty estimates from predictive models.
"""

import numpy as np
import logging
from typing import Optional, Dict, Any, List, Tuple
from scipy import optimize, interpolate, special

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProbabilityCalibration:
    """
    Calibrates probability estimates from predictive models using
    Platt scaling, isotonic regression, and temperature scaling methods.
    """

    def __init__(self,
                 method: str = 'platt',
                 n_bins: int = 10,
                 random_state: int = 42):
        """
        Initialize the probability calibrator.

        Args:
            method: Calibration method ('platt', 'isotonic', 'temperature')
            n_bins: Number of bins for reliability diagrams
            random_state: Random seed for reproducibility
        """
        self.method = method
        self.n_bins = n_bins
        self.random_state = random_state
        self.rng = np.random.RandomState(random_state)

        self.platt_a = 0.0
        self.platt_b = 0.0
        self.isotonic_mapping = None
        self.temperature = 1.0
        self.is_fitted = False
        self.calibration_score = 0.0

    def _platt_transform(self, logits: np.ndarray) -> np.ndarray:
        """Apply Platt scaling: P(y=1) = 1 / (1 + exp(a * logits + b))."""
        return 1.0 / (1.0 + np.exp(self.platt_a * logits + self.platt_b))

    def _platt_loss(self, params: np.ndarray, logits: np.ndarray, y: np.ndarray) -> float:
        """Negative log-likelihood loss for Platt scaling."""
        a, b = params
        p = 1.0 / (1.0 + np.exp(a * logits + b))
        p = np.clip(p, 1e-15, 1 - 1e-15)
        return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

    def _fit_platt(self, logits: np.ndarray, y: np.ndarray):
        """Fit Platt scaling parameters using L-BFGS."""
        result = optimize.minimize(
            self._platt_loss,
            x0=[1.0, 0.0],
            args=(logits, y),
            method='L-BFGS-B',
            bounds=optimize.Bounds(-10, 10)
        )
        self.platt_a, self.platt_b = result.x
        logger.info(f"Platt scaling fitted: a={self.platt_a:.4f}, b={self.platt_b:.4f}")

    def _fit_isotonic(self, logits: np.ndarray, y: np.ndarray):
        """Fit isotonic regression mapping from logits to calibrated probabilities."""
        sorted_idx = np.argsort(logits)
        sorted_logits = logits[sorted_idx]
        sorted_y = y[sorted_idx]

        unique_logits, unique_indices = np.unique(sorted_logits, return_index=True)
        pooled_y = np.array([
            np.mean(sorted_y[max(0, i - 10):min(len(sorted_y), i + 10)])
            for i in range(len(unique_logits))
        ])

        self.isotonic_mapping = interpolate.PchipInterpolator(
            unique_logits, pooled_y, extrapolate=True
        )
        logger.info(f"Isotonic regression fitted with {len(unique_logits)} points")

    def _temperature_loss(self, T: float, logits: np.ndarray, y: np.ndarray) -> float:
        """Negative log-likelihood loss for temperature scaling."""
        scaled = logits / T
        p = special.softmax(np.column_stack([-scaled, scaled]), axis=1)[:, 1]
        p = np.clip(p, 1e-15, 1 - 1e-15)
        return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))

    def _fit_temperature(self, logits: np.ndarray, y: np.ndarray):
        """Fit temperature scaling parameter."""
        result = optimize.minimize_scalar(
            self._temperature_loss,
            args=(logits, y),
            bounds=(0.1, 10.0),
            method='bounded'
        )
        self.temperature = result.x
        logger.info(f"Temperature scaling fitted: T={self.temperature:.4f}")

    def fit(self, logits: np.ndarray, y_true: np.ndarray) -> Dict[str, Any]:
        """
        Fit the calibration model.

        Args:
            logits: Raw model outputs (log-odds)
            y_true: Binary ground truth labels (0 or 1)

        Returns:
            Dictionary with calibration metrics
        """
        logits = np.asarray(logits, dtype=np.float64).flatten()
        y_true = np.asarray(y_true, dtype=np.float64).flatten()

        if self.method == 'platt':
            self._fit_platt(logits, y_true)
            cal_probs = self._platt_transform(logits)
        elif self.method == 'isotonic':
            self._fit_isotonic(logits, y_true)
            cal_probs = self.isotonic_mapping(logits)
            cal_probs = np.clip(cal_probs, 0, 1)
        elif self.method == 'temperature':
            self._fit_temperature(logits, y_true)
            scaled = logits / self.temperature
            cal_probs = special.softmax(
                np.column_stack([-scaled, scaled]), axis=1
            )[:, 1]
        else:
            raise ValueError(f"Unknown calibration method: {self.method}")

        self.is_fitted = True
        self.calibration_score = self._compute_ece(y_true, cal_probs)

        return {
            'method': self.method,
            'ece': float(self.calibration_score),
            'n_samples': len(y_true),
        }

    def calibrate(self, logits: np.ndarray) -> np.ndarray:
        """
        Calibrate probability estimates.

        Args:
            logits: Raw model outputs to calibrate

        Returns:
            Calibrated probability estimates
        """
        if not self.is_fitted:
            logger.warning("Calibration model not fitted, returning raw probabilities")
            return special.expit(logits)

        logits = np.asarray(logits, dtype=np.float64).flatten()

        if self.method == 'platt':
            return self._platt_transform(logits)
        elif self.method == 'isotonic':
            probs = self.isotonic_mapping(logits)
            return np.clip(probs, 0, 1)
        elif self.method == 'temperature':
            scaled = logits / self.temperature
            return special.softmax(
                np.column_stack([-scaled, scaled]), axis=1
            )[:, 1]
        return special.expit(logits)

    def _compute_ece(self, y_true: np.ndarray, y_prob: np.ndarray) -> float:
        """Compute Expected Calibration Error."""
        bin_boundaries = np.linspace(0, 1, self.n_bins + 1)
        ece = 0.0

        for i in range(self.n_bins):
            in_bin = (y_prob >= bin_boundaries[i]) & (y_prob < bin_boundaries[i + 1])
            if i == self.n_bins - 1:
                in_bin = (y_prob >= bin_boundaries[i]) & (y_prob <= bin_boundaries[i + 1])

            if np.sum(in_bin) > 0:
                bin_acc = np.mean(y_true[in_bin])
                bin_conf = np.mean(y_prob[in_bin])
                ece += np.sum(in_bin) * abs(bin_acc - bin_conf)

        ece /= len(y_true)
        return ece

    def reliability_diagram(self, logits: np.ndarray, y_true: np.ndarray) -> Dict[str, Any]:
        """
        Generate reliability diagram data for visualization.

        Args:
            logits: Raw model outputs
            y_true: Ground truth labels

        Returns:
            Dictionary with reliability diagram data
        """
        y_prob = self.calibrate(logits) if self.is_fitted else special.expit(logits)

        bin_boundaries = np.linspace(0, 1, self.n_bins + 1)
        bin_accuracies = []
        bin_confidences = []
        bin_counts = []

        for i in range(self.n_bins):
            in_bin = (y_prob >= bin_boundaries[i]) & (y_prob < bin_boundaries[i + 1])
            if i == self.n_bins - 1:
                in_bin = (y_prob >= bin_boundaries[i]) & (y_prob <= bin_boundaries[i + 1])

            count = np.sum(in_bin)
            bin_counts.append(int(count))
            if count > 0:
                bin_accuracies.append(float(np.mean(y_true[in_bin])))
                bin_confidences.append(float(np.mean(y_prob[in_bin])))
            else:
                bin_accuracies.append(0.0)
                bin_confidences.append(0.0)

        return {
            'bin_boundaries': bin_boundaries.tolist(),
            'bin_accuracies': bin_accuracies,
            'bin_confidences': bin_confidences,
            'bin_counts': bin_counts,
            'ece': self._compute_ece(y_true, y_prob),
        }

    def get_calibration_summary(self) -> Dict[str, Any]:
        """
        Get summary of calibration model.

        Returns:
            Dictionary with calibration summary
        """
        summary = {
            'method': self.method,
            'is_fitted': self.is_fitted,
            'calibration_score': float(self.calibration_score),
            'n_bins': self.n_bins,
        }

        if self.method == 'platt':
            summary['platt_a'] = float(self.platt_a)
            summary['platt_b'] = float(self.platt_b)
        elif self.method == 'temperature':
            summary['temperature'] = float(self.temperature)

        return summary


if __name__ == "__main__":
    np.random.seed(42)
    n = 1000
    logits = np.random.randn(n)
    true_probs = special.expit(logits * 0.7 + 0.2)
    y_true = (np.random.rand(n) < true_probs).astype(float)

    calibrator = ProbabilityCalibration(method='platt', n_bins=10)
    result = calibrator.fit(logits, y_true)
    print(f"Platt calibration ECE: {result['ece']:.4f}")

    cal_probs = calibrator.calibrate(logits)
    raw_probs = special.expit(logits)
    raw_ece = calibrator._compute_ece(y_true, raw_probs)
    print(f"Raw ECE: {raw_ece:.4f}, Calibrated ECE: {result['ece']:.4f}")

    reliability = calibrator.reliability_diagram(logits, y_true)
    print(f"Reliability bins: {reliability['bin_counts'][:5]}")

    summary = calibrator.get_calibration_summary()
    print(f"Calibrator: {summary['method']}, fitted={summary['is_fitted']}")
