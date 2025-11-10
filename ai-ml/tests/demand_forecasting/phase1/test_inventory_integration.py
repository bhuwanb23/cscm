"""
Test suite for inventory data integration
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the scripts directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from scripts.data_processing import process_inventory_data, integrate_all_data

def test_process_inventory_data():
    """Test processing of inventory data."""
    # Create sample inventory data
    inventory_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'sku_id': [1, 1, 2],
        'store_id': [1, 1, 2],
        'inventory_on_hand': [100, 95, 200],
        'reorder_point': [20, 20, 30],
        'max_stock_level': [200, 200, 300],
        'stockout_flag': [False, False, False]
    })
    
    # Process the data
    processed_data = process_inventory_data(inventory_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(processed_data['date'])
    assert pd.api.types.is_numeric_dtype(processed_data['sku_id'])
    assert pd.api.types.is_numeric_dtype(processed_data['store_id'])
    assert pd.api.types.is_numeric_dtype(processed_data['inventory_on_hand'])
    assert pd.api.types.is_numeric_dtype(processed_data['reorder_point'])
    assert pd.api.types.is_numeric_dtype(processed_data['max_stock_level'])
    assert pd.api.types.is_bool_dtype(processed_data['stockout_flag'])
    
    # Check derived features
    assert 'inventory_utilization' in processed_data.columns
    assert 'below_reorder_point' in processed_data.columns
    assert 'year' in processed_data.columns  # Calendar features
    assert 'is_weekend' in processed_data.columns  # Calendar features

def test_integrate_all_data():
    """Test integration of all data sources."""
    # Create sample processed data
    processed_data = {
        "sales": pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 1, 2],
            'store_id': [1, 1, 2],
            'sales_quantity': [5, 3, 7]
        }),
        "inventory": pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 1, 2],
            'store_id': [1, 1, 2],
            'inventory_on_hand': [100, 95, 200]
        }),
        "prices": pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 1, 2],
            'store_id': [1, 1, 2],
            'actual_price': [9.0, 9.0, 13.5]
        })
    }
    
    # Integrate all data
    integrated_data = integrate_all_data(processed_data)
    
    # Check that integration was successful
    assert integrated_data is not None
    assert not integrated_data.empty
    assert len(integrated_data) == 3
    
    # Check that data from all sources is present
    assert 'sales_quantity' in integrated_data.columns
    assert 'inventory_on_hand' in integrated_data.columns
    assert 'actual_price' in integrated_data.columns

def test_process_inventory_data_empty():
    """Test processing of empty inventory data."""
    # Process empty data
    processed_data = process_inventory_data(pd.DataFrame())
    
    # Check that processing handles empty data
    assert processed_data is not None
    assert processed_data.empty

def test_process_inventory_data_derived_features():
    """Test derived features in inventory data processing."""
    # Create sample inventory data
    inventory_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02'],
        'sku_id': [1, 1],
        'store_id': [1, 1],
        'inventory_on_hand': [10, 5],
        'reorder_point': [20, 20],
        'max_stock_level': [100, 100]
    })
    
    # Process the data
    processed_data = process_inventory_data(inventory_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    
    # Check derived features
    assert processed_data.iloc[0]['inventory_utilization'] == 0.1  # 10/100
    assert processed_data.iloc[1]['inventory_utilization'] == 0.05  # 5/100
    assert processed_data.iloc[0]['below_reorder_point'] == True   # 10 < 20
    assert processed_data.iloc[1]['below_reorder_point'] == True   # 5 < 20

if __name__ == "__main__":
    pytest.main([__file__])