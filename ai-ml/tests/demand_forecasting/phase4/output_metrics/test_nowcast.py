"""
Test suite for nowcast capabilities
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.output_metrics.nowcast import NowcastEngine


def test_nowcast_engine_initialization():
    """Test initialization of NowcastEngine."""
    engine = NowcastEngine(update_frequency_minutes=15, lookback_hours=24)
    assert engine.update_frequency_minutes == 15
    assert engine.lookback_hours == 24


def test_generate_nowcast():
    """Test generating nowcast."""
    engine = NowcastEngine(update_frequency_minutes=15, lookback_hours=24)
    
    # Create historical data
    dates = pd.date_range(start=datetime.now() - timedelta(days=30), 
                          end=datetime.now(), freq='h')
    historical_data = pd.DataFrame({
        'timestamp': dates,
        'sku_id': 1,
        'store_id': 1,
        'sales': np.random.normal(100, 10, len(dates))
    })
    
    # Create recent signals
    recent_dates = pd.date_range(start=datetime.now() - timedelta(hours=2),
                                end=datetime.now(), freq='15min')
    recent_signals = pd.DataFrame({
        'timestamp': recent_dates,
        'sku_id': 1,
        'store_id': 1,
        'sales': np.random.normal(100, 10, len(recent_dates))
    })
    
    nowcast = engine.generate_nowcast(
        historical_data, recent_signals,
        current_time=datetime.now(),
        sku_id=1, store_id=1
    )
    
    assert 'nowcast' in nowcast
    assert 'historical_baseline' in nowcast
    assert 'recent_aggregate' in nowcast
    assert 'adjustment_factor' in nowcast
    assert 'confidence' in nowcast
    assert 'sku_id' in nowcast
    assert 'store_id' in nowcast
    assert 0 <= nowcast['confidence'] <= 1


def test_batch_nowcast():
    """Test batch nowcast generation."""
    engine = NowcastEngine()
    
    # Create historical data for multiple SKUs
    dates = pd.date_range(start=datetime.now() - timedelta(days=7),
                         end=datetime.now(), freq='h')
    historical_data = pd.DataFrame({
        'timestamp': np.tile(dates, 2),
        'sku_id': [1] * len(dates) + [2] * len(dates),
        'store_id': [1] * len(dates) * 2,
        'sales': np.random.normal(100, 10, len(dates) * 2)
    })
    
    # Create recent signals
    recent_dates = pd.date_range(start=datetime.now() - timedelta(hours=1),
                                end=datetime.now(), freq='15min')
    recent_signals = pd.DataFrame({
        'timestamp': np.tile(recent_dates, 2),
        'sku_id': [1] * len(recent_dates) + [2] * len(recent_dates),
        'store_id': [1] * len(recent_dates) * 2,
        'sales': np.random.normal(100, 10, len(recent_dates) * 2)
    })
    
    sku_store_pairs = [(1, 1), (2, 1)]
    
    results = engine.batch_nowcast(
        historical_data, recent_signals, sku_store_pairs
    )
    
    assert isinstance(results, pd.DataFrame)
    assert len(results) == 2
    assert 'nowcast' in results.columns
    assert 'confidence' in results.columns


if __name__ == "__main__":
    pytest.main([__file__])

