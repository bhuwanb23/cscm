"""
Ensemble Methods for Uncertainty Quantification

This module implements ensemble-based uncertainty estimation using
bagging, boosting, and random subspace methods to quantify prediction
uncertainty through model disagreement.
"""

import numpy as np
import logging
from typing import Optional, Dict, Any, List, Tuple
from copy import deepcopy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EnsembleUncertainty:
    """
    Implements ensemble-based uncertainty quantification using multiple
    base estimators to capture epistemic uncertainty through model disagreement.
    """

    def __init__(self,
                 n_estimators: int = 50,
                 subsample_ratio: float = 0.8,
                 feature_ratio: float = 0.8,
                 learning_rate: float = 0.01,
                 random_state: int = 42):
        """
        Initialize the ensemble uncertainty estimator.

        Args:
            n_estimators: Number of base estimators in the ensemble
            subsample_ratio: Fraction of samples to use per estimator
            feature_ratio: Fraction of features to use per estimator
            learning_rate: Learning rate for base estimator training
            random_state: Random seed for reproducibility
        """
        self.n_estimators = n_estimators
        self.subsample_ratio = subsample_ratio
        self.feature_ratio = feature_ratio
        self.learning_rate = learning_rate
        self.random_state = random_state

        self.estimators = []
        self.feature_indices = []
        self.n_features_total = 0
        self.is_fitted = False

    def _make_estimator(self) -> Dict[str, Any]:
        """Create a simple linear estimator with random initialization."""
        rng = np.random.RandomState(
            self.random_state + len(self.estimators)
        )
        return {
            'weights': rng.randn(1) * 0.01,
            'bias': 0.0,
        }

    def fit(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """
        Fit the ensemble on training data.

        Args:
            X: Training features
            y: Training targets

        Returns:
            Dictionary with training metrics
        """
        self.n_features_total = X.shape[1]
        n_samples = X.shape[0]
        n_subsample = max(int(n_samples * self.subsample_ratio), 10)
        n_features_sub = max(int(self.n_features_total * self.feature_ratio), 1)

        rng = np.random.RandomState(self.random_state)

        for i in range(self.n_estimators):
            sample_idx = rng.choice(n_samples, size=n_subsample, replace=True)
            feat_idx = rng.choice(self.n_features_total, size=n_features_sub, replace=False)
            self.feature_indices.append(feat_idx)

            X_sub = X[sample_idx][:, feat_idx]
            y_sub = y[sample_idx]

            est = self._make_estimator()
            w = est['weights']
            b = est['bias']

            w_full = np.zeros(n_features_sub)
            for _ in range(100):
                y_pred = np.dot(X_sub, w_full) + b
                dw = (2 / X_sub.shape[0]) * np.dot(X_sub.T, (y_pred - y_sub))
                db = (2 / X_sub.shape[0]) * np.sum(y_pred - y_sub)
                w_full -= self.learning_rate * dw
                b -= self.learning_rate * db

            est['weights'] = w_full
            est['bias'] = b
            self.estimators.append(est)

        self.is_fitted = True

        preds = self.predict(X)
        train_mse = np.mean((preds['mean'] - y) ** 2)

        logger.info(f"Ensemble trained: {len(self.estimators)} estimators, "
                   f"MSE={train_mse:.4f}")

        return {
            'n_estimators': len(self.estimators),
            'n_samples': n_samples,
            'train_mse': float(train_mse),
        }

    def predict(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Make predictions with uncertainty estimates.

        Args:
            X: Input features

        Returns:
            Dictionary with 'mean', 'std', 'lower', 'upper' arrays
        """
        individual_preds = np.zeros((X.shape[0], len(self.estimators)))

        for i, est in enumerate(self.estimators):
            feat_idx = self.feature_indices[i]
            X_sub = X[:, feat_idx] if feat_idx.shape[0] > 0 else X
            pred = np.dot(X_sub, est['weights']) + est['bias']
            individual_preds[:, i] = pred

        mean_pred = np.mean(individual_preds, axis=1)
        std_pred = np.std(individual_preds, axis=1)

        return {
            'mean': mean_pred,
            'std': std_pred,
            'lower': mean_pred - 1.96 * std_pred,
            'upper': mean_pred + 1.96 * std_pred,
            'individual_predictions': individual_preds,
        }

    def get_uncertainty_decomposition(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Decompose uncertainty into aleatoric and epistemic components.

        Args:
            X: Input features

        Returns:
            Dictionary with aleatoric and epistemic uncertainty
        """
        result = self.predict(X)
        individual = result['individual_predictions']

        epistemic = np.var(individual, axis=1)
        total_var = result['std'] ** 2
        aleatoric = np.maximum(total_var - epistemic, 0)

        return {
            'aleatoric_uncertainty': np.sqrt(aleatoric),
            'epistemic_uncertainty': np.sqrt(epistemic),
            'total_uncertainty': result['std'],
        }

    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores from the ensemble.

        Returns:
            Dictionary mapping feature index to importance
        """
        if not self.is_fitted:
            return {}

        importance = np.zeros(self.n_features_total)
        count = np.zeros(self.n_features_total)

        for i, feat_idx in enumerate(self.feature_indices):
            weights = self.estimators[i]['weights']
            for j, fidx in enumerate(feat_idx):
                importance[fidx] += abs(weights[j])
                count[fidx] += 1

        importance = np.divide(importance, count, where=count > 0)
        importance = importance / (np.sum(importance) + 1e-10)

        return {
            f'feature_{i}': float(imp)
            for i, imp in enumerate(importance)
        }


if __name__ == "__main__":
    np.random.seed(42)
    n = 500
    X = np.random.randn(n, 10)
    y = np.sum(X[:, :3], axis=1) + np.random.randn(n) * 0.2

    ensemble = EnsembleUncertainty(n_estimators=30, subsample_ratio=0.7)
    ensemble.fit(X, y)

    X_test = np.random.randn(20, 10)
    result = ensemble.predict(X_test)
    decomp = ensemble.get_uncertainty_decomposition(X_test)

    for i in range(5):
        print(f"Sample {i+1}: Pred={result['mean'][i]:.3f} ± {result['std'][i]:.3f}, "
              f"Epistemic={decomp['epistemic_uncertainty'][i]:.3f}")

    imp = ensemble.get_feature_importance()
    top_features = sorted(imp.items(), key=lambda x: -x[1])[:3]
    print(f"Top features: {top_features}")
