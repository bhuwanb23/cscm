"""
Root conftest for CSCM AI/ML test suite.
Provides shared fixtures and path configuration.
"""
import pytest
import sys
import os
import numpy as np
import pandas as pd

# Ensure ai-ml/ and ai-ml/models/ are on sys.path
AI_ML_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AI_ML_ROOT)
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'models'))
sys.path.insert(0, os.path.join(AI_ML_ROOT, 'api'))


# ---------------------------------------------------------------------------
# Path fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def ai_ml_root():
    return AI_ML_ROOT


@pytest.fixture
def raw_data_path():
    return os.path.join(AI_ML_ROOT, 'data', 'raw')


@pytest.fixture
def processed_data_path():
    return os.path.join(AI_ML_ROOT, 'data', 'processed')


@pytest.fixture
def test_data_path():
    return os.path.join(AI_ML_ROOT, 'data', 'test')


# ---------------------------------------------------------------------------
# Synthetic data fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def synthetic_sales_df():
    """365 days of daily sales for 3 SKUs across 2 stores."""
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=365, freq='D')
    n = len(dates)
    return pd.DataFrame({
        'date': dates,
        'sku_id': np.random.choice([1, 2, 3], n),
        'store_id': np.random.choice([1, 2], n),
        'sales_quantity': np.random.poisson(20, n),
        'sales_amount': np.random.normal(200, 50, n).round(2),
        'unit_price': np.random.uniform(5, 25, n).round(2),
    })


@pytest.fixture
def synthetic_inventory_df():
    """Daily inventory snapshot for 3 SKUs across 2 stores."""
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=30, freq='D')
    rows = []
    for d in dates:
        for sku in [1, 2, 3]:
            for store in [1, 2]:
                inv = max(0, np.random.randint(0, 200))
                rows.append({
                    'date': d,
                    'sku_id': sku,
                    'store_id': store,
                    'inventory_on_hand': inv,
                    'reorder_point': 20,
                    'max_stock_level': 200,
                    'stockout_flag': inv == 0,
                })
    return pd.DataFrame(rows)


@pytest.fixture
def synthetic_prices_df():
    """30 days of pricing data."""
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=30, freq='D')
    rows = []
    for d in dates:
        for sku in [1, 2, 3]:
            for store in [1, 2]:
                regular = round(np.random.uniform(8, 20), 2)
                promo = np.random.random() > 0.7
                actual = round(regular * (0.85 if promo else 1.0), 2)
                rows.append({
                    'date': d,
                    'sku_id': sku,
                    'store_id': store,
                    'regular_price': regular,
                    'actual_price': actual,
                    'promotion_flag': promo,
                    'markdown_rate': round((regular - actual) / regular, 2) if regular > 0 else 0,
                })
    return pd.DataFrame(rows)


@pytest.fixture
def synthetic_demand_series():
    """100-point demand time series with trend + seasonality + noise."""
    np.random.seed(42)
    t = np.arange(100)
    trend = 0.5 * t
    seasonal = 10 * np.sin(2 * np.pi * t / 7)
    noise = np.random.normal(0, 3, 100)
    return np.maximum(0, trend + seasonal + noise + 50)


@pytest.fixture
def synthetic_anomaly_data():
    """500 normal + 20 anomaly samples with 5 features."""
    np.random.seed(42)
    normal = np.random.normal(0, 1, (500, 5))
    anomaly = np.random.uniform(-5, 5, (20, 5))
    X = np.vstack([normal, anomaly])
    labels = np.array([0] * 500 + [1] * 20)
    return X, labels
