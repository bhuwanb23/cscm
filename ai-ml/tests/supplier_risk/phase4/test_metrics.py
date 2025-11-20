"""
Phase 4 metrics & evaluation tests.
"""

import pytest
import numpy as np
import pandas as pd
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA_PATH = os.path.join(ROOT_DIR, 'data', 'test', 'supplier_risk_data.csv')
sys.path.insert(0, os.path.join(ROOT_DIR, 'models'))
sys.modules.pop('supplier_risk', None)

from supplier_risk.metrics_evaluation import (
    RiskMetricsEvaluator,
    ProbabilityCalibrator,
    BackupSupplierRecommender
)


def test_risk_metrics():
    evaluator = RiskMetricsEvaluator()
    y_true = np.array([0, 1, 0, 1, 1])
    y_scores = np.array([0.1, 0.8, 0.3, 0.7, 0.6])
    metrics = evaluator.evaluate(y_true, y_scores)
    assert 'auc' in metrics


def test_probability_calibration():
    calibrator = ProbabilityCalibrator()
    y_true = np.array([0, 1, 0, 1, 1, 0, 1])
    y_scores = np.array([0.2, 0.9, 0.3, 0.8, 0.7, 0.4, 0.85])
    calibrator.fit(y_scores, y_true)
    calibrated = calibrator.transform(y_scores)
    assert calibrated.shape == y_scores.shape


def test_backup_recommendations():
    suppliers = pd.read_csv(DATA_PATH)
    recommender = BackupSupplierRecommender(min_reliability=0.85, min_on_time_rate=0.85)
    recs = recommender.recommend(suppliers, exclude_supplier=2, top_k=2)
    assert len(recs) <= 2

