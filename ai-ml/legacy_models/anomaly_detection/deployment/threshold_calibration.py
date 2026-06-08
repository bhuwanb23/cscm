"""
Alert Threshold Calibration

Implements threshold calibration to reduce false positives.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
from sklearn.metrics import precision_recall_curve, roc_curve
import pickle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AlertThresholdCalibrator:
    """
    Alert threshold calibrator.
    
    Calibrates thresholds to optimize precision/recall trade-off.
    """
    
    def __init__(
        self,
        target_precision: float = 0.9,
        target_recall: float = 0.8,
        min_precision: float = 0.7,
        min_recall: float = 0.5
    ):
        """
        Initialize threshold calibrator.
        
        Args:
            target_precision: Target precision
            target_recall: Target recall
            min_precision: Minimum acceptable precision
            min_recall: Minimum acceptable recall
        """
        self.target_precision = target_precision
        self.target_recall = target_recall
        self.min_precision = min_precision
        self.min_recall = min_recall
        
        self.optimal_threshold: Optional[float] = None
        self.calibration_history: List[Dict[str, Any]] = []
        self.is_calibrated = False
    
    def calibrate(
        self,
        scores: np.ndarray,
        labels: np.ndarray,
        method: str = 'f1'  # 'f1', 'precision', 'recall', 'balanced'
    ) -> Dict[str, Any]:
        """
        Calibrate threshold based on scores and labels.
        
        Args:
            scores: Anomaly scores (higher = more anomalous)
            labels: True labels (1 for anomaly, 0 for normal)
            method: Calibration method
        
        Returns:
            Calibration results
        """
        logger.info(f"Calibrating threshold with {len(scores)} samples")
        
        # Convert labels to binary
        y_true = (labels == -1).astype(int) if np.any(labels == -1) else labels.astype(int)
        
        # Compute precision-recall curve
        precision, recall, thresholds = precision_recall_curve(y_true, scores)
        
        # Find optimal threshold
        if method == 'f1':
            f1_scores = 2 * (precision * recall) / (precision + recall + 1e-8)
            optimal_idx = np.argmax(f1_scores)
        elif method == 'precision':
            # Find threshold that meets target precision
            optimal_idx = np.where(precision >= self.target_precision)[0]
            if len(optimal_idx) > 0:
                optimal_idx = optimal_idx[np.argmax(recall[optimal_idx])]
            else:
                optimal_idx = np.argmax(precision)
        elif method == 'recall':
            # Find threshold that meets target recall
            optimal_idx = np.where(recall >= self.target_recall)[0]
            if len(optimal_idx) > 0:
                optimal_idx = optimal_idx[np.argmax(precision[optimal_idx])]
            else:
                optimal_idx = np.argmax(recall)
        elif method == 'balanced':
            # Balance precision and recall
            scores_balanced = (precision - self.target_precision) ** 2 + (recall - self.target_recall) ** 2
            optimal_idx = np.argmin(scores_balanced)
        else:
            optimal_idx = np.argmax(f1_scores)
        
        # Get optimal threshold
        if optimal_idx < len(thresholds):
            self.optimal_threshold = thresholds[optimal_idx]
        else:
            self.optimal_threshold = np.percentile(scores, 95)
        
        # Compute metrics at optimal threshold
        y_pred = (scores >= self.optimal_threshold).astype(int)
        
        from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix
        
        precision_at_threshold = precision_score(y_true, y_pred, zero_division=0)
        recall_at_threshold = recall_score(y_true, y_pred, zero_division=0)
        f1_at_threshold = f1_score(y_true, y_pred, zero_division=0)
        
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        false_positive_rate = fp / (fp + tn + 1e-8)
        
        results = {
            'optimal_threshold': float(self.optimal_threshold),
            'precision': float(precision_at_threshold),
            'recall': float(recall_at_threshold),
            'f1_score': float(f1_at_threshold),
            'false_positive_rate': float(false_positive_rate),
            'true_positives': int(tp),
            'false_positives': int(fp),
            'true_negatives': int(tn),
            'false_negatives': int(fn)
        }
        
        # Check if meets minimum requirements
        meets_requirements = (
            precision_at_threshold >= self.min_precision and
            recall_at_threshold >= self.min_recall
        )
        results['meets_requirements'] = meets_requirements
        
        self.calibration_history.append({
            'timestamp': pd.Timestamp.now().isoformat(),
            'method': method,
            **results
        })
        
        self.is_calibrated = True
        
        logger.info(f"Threshold calibrated: {self.optimal_threshold:.4f}")
        logger.info(f"Precision: {precision_at_threshold:.4f}, Recall: {recall_at_threshold:.4f}")
        
        return results
    
    def apply_threshold(self, scores: np.ndarray) -> np.ndarray:
        """
        Apply calibrated threshold to scores.
        
        Args:
            scores: Anomaly scores
        
        Returns:
            Binary predictions (1 for normal, -1 for anomaly)
        """
        if not self.is_calibrated:
            raise ValueError("Threshold must be calibrated before application")
        
        predictions = np.where(scores >= self.optimal_threshold, -1, 1)
        
        return predictions
    
    def get_threshold_analysis(
        self,
        scores: np.ndarray,
        labels: np.ndarray
    ) -> Dict[str, Any]:
        """
        Get detailed threshold analysis.
        
        Args:
            scores: Anomaly scores
            labels: True labels
        
        Returns:
            Analysis dictionary
        """
        # Convert labels
        y_true = (labels == -1).astype(int) if np.any(labels == -1) else labels.astype(int)
        
        # Compute curves
        precision, recall, thresholds = precision_recall_curve(y_true, scores)
        fpr, tpr, roc_thresholds = roc_curve(y_true, scores)
        
        # Compute F1 scores
        f1_scores = 2 * (precision * recall) / (precision + recall + 1e-8)
        
        analysis = {
            'thresholds': thresholds.tolist(),
            'precision': precision.tolist(),
            'recall': recall.tolist(),
            'f1_scores': f1_scores.tolist(),
            'fpr': fpr.tolist(),
            'tpr': tpr.tolist(),
            'optimal_threshold': float(self.optimal_threshold) if self.is_calibrated else None,
            'max_f1': float(np.max(f1_scores)),
            'max_f1_threshold': float(thresholds[np.argmax(f1_scores)]) if len(thresholds) > 0 else None
        }
        
        return analysis
    
    def save(self, filepath: str):
        """Save calibrator to file."""
        model_data = {
            'optimal_threshold': self.optimal_threshold,
            'target_precision': self.target_precision,
            'target_recall': self.target_recall,
            'min_precision': self.min_precision,
            'min_recall': self.min_recall,
            'calibration_history': self.calibration_history,
            'is_calibrated': self.is_calibrated
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        logger.info(f"Calibrator saved to {filepath}")
    
    def load(self, filepath: str):
        """Load calibrator from file."""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.optimal_threshold = model_data['optimal_threshold']
        self.target_precision = model_data['target_precision']
        self.target_recall = model_data['target_recall']
        self.min_precision = model_data['min_precision']
        self.min_recall = model_data['min_recall']
        self.calibration_history = model_data['calibration_history']
        self.is_calibrated = model_data['is_calibrated']
        
        logger.info(f"Calibrator loaded from {filepath}")

