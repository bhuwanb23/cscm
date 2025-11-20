"""
Supplier risk evaluation metrics.
"""

from __future__ import annotations

import numpy as np
from typing import Dict, Any
from sklearn.metrics import roc_auc_score, precision_score, recall_score, confusion_matrix


class RiskMetricsEvaluator:
    """Computes evaluation metrics for supplier risk models."""

    def evaluate(self, y_true: np.ndarray, y_scores: np.ndarray, threshold: float = 0.5) -> Dict[str, Any]:
        y_pred = (y_scores >= threshold).astype(int)
        auc = roc_auc_score(y_true, y_scores)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        return {
            'auc': float(auc),
            'precision': float(precision),
            'recall': float(recall),
            'true_positives': int(tp),
            'false_positives': int(fp),
            'true_negatives': int(tn),
            'false_negatives': int(fn)
        }

