"""
Test suite for calendar feature integration
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the scripts directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from scripts.data_processing import process_sales_data, process_price_data, process_inventory_data

def test_calendar_features_in_sales_data():
    """Test that calendar features are added to sales data."""
    # Create sample sales data
    sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'hour': [10, 11, 12],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'sales_quantity': [5, 3, 7],
        'sales_amount': [50.0, 30.0, 70.0],
        'unit_price': [10.0, 10.0, 10.0]
    })
    
    # Process the data
    processed_data = process_sales_data(sales_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check that calendar features were added
    assert 'year' in processed_data.columns
    assert 'month' in processed_data.columns
    assert 'day' in processed_data.columns
    assert 'weekday' in processed_data.columns
    assert 'is_weekend' in processed_data.columns
    assert 'is_holiday' in processed_data.columns

def test_calendar_features_in_price_data():
    """Test that calendar features are added to price data."""
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
    
    # Check that calendar features were added
    assert 'year' in processed_data.columns
    assert 'month' in processed_data.columns
    assert 'day' in processed_data.columns
    assert 'weekday' in processed_data.columns
    assert 'is_weekend' in processed_data.columns
    assert 'is_holiday' in processed_data.columns

def test_calendar_features_in_inventory_data():
    """Test that calendar features are added to inventory data."""
    # Create sample inventory data
    inventory_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'sku_id': [1, 1, 2],
        'store_id': [1, 1, 2],
        'inventory_on_hand': [100, 95, 200],
        'stockout_flag': [False, False, False],
        'reorder_point': [20, 20, 30],
        'max_stock_level': [200, 200, 300]
    })
    
    # Process the data
    processed_data = process_inventory_data(inventory_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check that calendar features were added
    assert 'year' in processed_data.columns
    assert 'month' in processed_data.columns
    assert 'day' in processed_data.columns
    assert 'weekday' in processed_data.columns
    assert 'is_weekend' in processed_data.columns
    assert 'is_holiday' in processed_data.columns

if __name__ == "__main__":
    pytest.main([__file__])