"""
Phase 1 survival analysis tests.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA_PATH = os.path.join(ROOT_DIR, 'data', 'test', 'supplier_risk_data.csv')
sys.path.insert(0, os.path.join(ROOT_DIR, 'models'))
sys.modules.pop('supplier_risk', None)

data = pd.read_csv(DATA_PATH)

from supplier_risk.survival_analysis import CoxRiskModel, KaplanMeierEstimator, TimeToEventDataset


def test_cox_model_fit_predict():
    dataset = TimeToEventDataset()
    df = dataset.from_dataframe(data)
    model = CoxRiskModel()
    model.fit(df)
    hazard = model.predict_partial_hazard(df.head(5))
    assert hazard.shape[0] == 5


def test_kaplan_meier():
    km = KaplanMeierEstimator()
    km.fit(data['tenure_days'].values, data['event_flag'].values)
    survival = km.predict(np.array([100, 200, 300]))
    assert np.all(survival <= 1)
    assert np.all(survival >= 0)


def test_time_to_event_summary():
    dataset = TimeToEventDataset()
    df = dataset.from_dataframe(data)
    summary = dataset.summary(df)
    assert summary['count'] == len(df)
    assert 'events' in summary

