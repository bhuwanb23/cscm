"""
Calibration Validation Metrics for Uncertainty Quantification

This module provides quantitative metrics for evaluating the quality
of uncertainty estimates including Expected Calibration Error (ECE),
reliability diagrams, sharpness, and proper scoring rules.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ReliabilityDiagram:
    """
    Computes reliability diagrams for probability calibration assessment,
    binning predictions and measuring observed vs expected frequencies.
    """

    def __init__(self, n_bins: int = 10):
        self.n_bins = n_bins

    def compute(self, probabilities: np.ndarray,
                outcomes: np.ndarray) -> Dict[str, Any]:
        bin_edges = np.linspace(0, 1, self.n_bins + 1)
        bin_indices = np.digitize(probabilities, bin_edges, right=True) - 1
        bin_indices = np.clip(bin_indices, 0, self.n_bins - 1)

        bin_accuracies = np.zeros(self.n_bins)
        bin_confidences = np.zeros(self.n_bins)
        bin_counts = np.zeros(self.n_bins)

        for i in range(self.n_bins):
            mask = bin_indices == i
            bin_counts[i] = np.sum(mask)
            if bin_counts[i] > 0:
                bin_accuracies[i] = float(np.mean(outcomes[mask]))
                bin_confidences[i] = float(np.mean(probabilities[mask]))

        return {
            'bin_counts': bin_counts.tolist(),
            'bin_accuracies': bin_accuracies.tolist(),
            'bin_confidences': bin_confidences.tolist(),
            'bin_edges': bin_edges.tolist(),
            'n_bins': self.n_bins,
            'n_samples': len(probabilities),
        }


class CalibrationValidator:
    """
    Validates probability calibration using multiple metrics including
    ECE, MCE, Brier score, and log-loss for uncertainty estimates.
    """

    def __init__(self, n_bins: int = 10):
        self.n_bins = n_bins
        self.reliability = ReliabilityDiagram(n_bins=n_bins)
        self.validation_history: List[Dict[str, Any]] = []

    def compute_ece(self, probabilities: np.ndarray,
                    outcomes: np.ndarray) -> float:
        diagram = self.reliability.compute(probabilities, outcomes)
        acc = np.array(diagram['bin_accuracies'])
        conf = np.array(diagram['bin_confidences'])
        counts = np.array(diagram['bin_counts'])
        total = max(np.sum(counts), 1)
        ece = float(np.sum(counts * np.abs(acc - conf)) / total)
        return ece

    def compute_mce(self, probabilities: np.ndarray,
                    outcomes: np.ndarray) -> float:
        diagram = self.reliability.compute(probabilities, outcomes)
        acc = np.array(diagram['bin_accuracies'])
        conf = np.array(diagram['bin_confidences'])
        valid = np.array(diagram['bin_counts']) > 0
        if not np.any(valid):
            return 0.0
        mce = float(np.max(np.abs(acc[valid] - conf[valid])))
        return mce

    def brier_score(self, probabilities: np.ndarray,
                    outcomes: np.ndarray) -> float:
        return float(np.mean((probabilities - outcomes) ** 2))

    def log_loss(self, probabilities: np.ndarray,
                 outcomes: np.ndarray, eps: float = 1e-15) -> float:
        probs = np.clip(probabilities, eps, 1 - eps)
        loss = -np.mean(outcomes * np.log(probs) + (1 - outcomes) * np.log(1 - probs))
        return float(loss)

    def sharpness(self, probabilities: np.ndarray) -> float:
        return float(np.std(probabilities))

    def validate(self, probabilities: np.ndarray,
                 outcomes: np.ndarray) -> Dict[str, Any]:
        ece = self.compute_ece(probabilities, outcomes)
        mce = self.compute_mce(probabilities, outcomes)
        brier = self.brier_score(probabilities, outcomes)
        logloss = self.log_loss(probabilities, outcomes)
        sharp = self.sharpness(probabilities)
        diagram = self.reliability.compute(probabilities, outcomes)

        result = {
            'ece': ece,
            'mce': mce,
            'brier_score': brier,
            'log_loss': logloss,
            'sharpness': sharp,
            'n_samples': len(probabilities),
            'mean_prediction': float(np.mean(probabilities)),
            'mean_outcome': float(np.mean(outcomes)),
        }
        self.validation_history.append(result)
        return result

    def get_state(self) -> Dict[str, Any]:
        return {
            'n_bins': self.n_bins,
            'validations_completed': len(self.validation_history),
            'avg_ece': float(np.mean([v['ece'] for v in self.validation_history])) if self.validation_history else 0.0,
        }


if __name__ == "__main__":
    np.random.seed(42)
    validator = CalibrationValidator(n_bins=10)

    n = 1000
    probs = np.random.uniform(0, 1, n)
    outcomes = (np.random.random(n) < probs).astype(float)

    result = validator.validate(probs, outcomes)
    print(f"ECE: {result['ece']:.4f}, MCE: {result['mce']:.4f}")
    print(f"Brier: {result['brier_score']:.4f}, LogLoss: {result['log_loss']:.4f}")
    print(f"Sharpness: {result['sharpness']:.4f}")
