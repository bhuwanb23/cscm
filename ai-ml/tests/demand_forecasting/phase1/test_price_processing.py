"""
Test suite for price data processing
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
import tempfile

# Add the scripts directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from scripts.data_processing import process_price_data

def test_process_price_data():
    """Test processing of price data."""
    # Create sample price data
    price_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'sku_id': [1, 1, 2],
        'store_id': [1, 1, 2],
        'regular_price': [10.0, 10.0, 15.0],
        'actual_price': [9.0, 10.0, 13.5],
        'promotion_flag': [True, False, True],
        'markdown_rate': [0.1, 0.0, 0.1]
    })
    
    # Process the data
    processed_data = process_price_data(price_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(processed_data['date'])
    assert pd.api.types.is_numeric_dtype(processed_data['sku_id'])
    assert pd.api.types.is_numeric_dtype(processed_data['store_id'])
    assert pd.api.types.is_numeric_dtype(processed_data['regular_price'])
    assert pd.api.types.is_numeric_dtype(processed_data['actual_price'])
    assert pd.api.types.is_bool_dtype(processed_data['promotion_flag'])
    assert pd.api.types.is_numeric_dtype(processed_data['markdown_rate'])
    
    # Check calculated features
    assert 'discount_amount' in processed_data.columns
    assert 'discount_percentage' in processed_data.columns
    
    # Check discount calculations
    assert processed_data.iloc[0]['discount_amount'] == 1.0  # 10.0 - 9.0
    assert processed_data.iloc[0]['discount_percentage'] == 10.0  # (1.0 / 10.0) * 100

def test_process_price_data_empty():
    """Test processing of empty price data."""
    # Process empty data
    processed_data = process_price_data(pd.DataFrame())
    
    # Check that processing handles empty data
    assert processed_data is not None
    assert processed_data.empty

def test_process_price_data_none():
    """Test processing of None price data."""
    # Process None data
    processed_data = process_price_data(None)
    
    # Check that processing handles None data
    assert processed_data is not None
    assert processed_data.empty

def test_process_price_data_missing_columns():
    """Test processing of price data with missing columns."""
    # Create price data with missing columns
    price_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02'],
        'sku_id': [1, 1],
        'store_id': [1, 1]
        # Missing other columns
    })
    
    # Process the data
    processed_data = process_price_data(price_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 2

if __name__ == "__main__":
    pytest.main([__file__])