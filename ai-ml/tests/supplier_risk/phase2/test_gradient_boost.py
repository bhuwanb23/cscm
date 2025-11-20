"""
Tests for Phase 2 gradient-boosted models.
"""

import pytest
import pandas as pd
import sys
import os

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA_PATH = os.path.join(ROOT_DIR, 'data', 'test', 'supplier_risk_data.csv')
sys.path.insert(0, os.path.join(ROOT_DIR, 'models'))
sys.modules.pop('supplier_risk', None)

from supplier_risk.gradient_boosted import GradientBoostRiskModel, LeadTimeFeatureEngineer, FinancialFeatureIntegrator

# rest same

def load_data():
    return pd.read_csv(DATA_PATH)


def test_feature_engineering():
    df = load_data()
    engineer = LeadTimeFeatureEngineer()
    new_df = engineer.transform(df)
    assert 'lead_time_cv' in new_df.columns


def test_financial_features():
    df = load_data()
    integrator = FinancialFeatureIntegrator()
    new_df = integrator.transform(df)
    assert 'resilience_index' in new_df.columns


def test_gradient_boost_model():
    df = load_data()
    model = GradientBoostRiskModel()
    model.fit(df)
    preds = model.predict_risk(df.head(4))
    assert len(preds) == 4

