"""
Test suite for store and product data processing
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the scripts directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from scripts.data_processing import process_store_data, process_product_data

def test_process_store_data():
    """Test processing of store data."""
    # Create sample store data
    store_data = pd.DataFrame({
        'store_id': [1, 2, 3],
        'store_name': ['Store A', 'Store B', 'Store C'],
        'location': ['Location A', 'Location B', 'Location C'],
        'store_type': ['Type A', 'Type B', 'Type A'],
        'region': ['Region 1', 'Region 2', 'Region 1'],
        'size_sqft': [5000, 8000, 3000],
        'opening_date': ['2020-01-15', '2021-03-10', '2022-07-01'],
        'number_of_employees': [25, 35, 15],
        'manager': ['John Smith', 'Jane Doe', 'Robert Johnson']
    })
    
    # Process the data
    processed_data = process_store_data(store_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check data types
    assert pd.api.types.is_numeric_dtype(processed_data['store_id'])
    assert pd.api.types.is_string_dtype(processed_data['store_name'])
    assert pd.api.types.is_string_dtype(processed_data['location'])
    assert pd.api.types.is_string_dtype(processed_data['store_type'])
    assert pd.api.types.is_datetime64_any_dtype(processed_data['opening_date'])
    assert pd.api.types.is_numeric_dtype(processed_data['size_sqft'])
    assert pd.api.types.is_numeric_dtype(processed_data['number_of_employees'])

def test_process_store_data_empty():
    """Test processing of empty store data."""
    # Process empty data
    processed_data = process_store_data(pd.DataFrame())
    
    # Check that processing handles empty data
    assert processed_data is not None
    assert processed_data.empty

def test_process_product_data():
    """Test processing of product data."""
    # Create sample product data
    product_data = pd.DataFrame({
        'sku_id': [1, 2, 3, 4],
        'product_name': ['Whole Milk', 'White Bread', 'Fresh Eggs', 'Ground Beef'],
        'category': ['Dairy', 'Bakery', 'Dairy', 'Meat'],
        'subcategory': ['Fresh Milk', 'Sliced Bread', 'Eggs', 'Beef'],
        'brand': ['Organic Farms', 'Golden Grain', 'Countryside Farms', 'Prime Cuts'],
        'supplier_id': [101, 102, 103, 104],
        'lead_time_days': [2, 1, 3, 2],
        'weight': [1.0, 0.5, 0.7, 1.0],
        'volume': [1.5, 1.0, 0.8, 1.2],
        'unit_of_measure': ['L', 'loaf', 'dozen', 'lb']
    })
    
    # Process the data
    processed_data = process_product_data(product_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 4
    
    # Check data types
    assert pd.api.types.is_numeric_dtype(processed_data['sku_id'])
    assert pd.api.types.is_string_dtype(processed_data['product_name'])
    assert pd.api.types.is_string_dtype(processed_data['category'])
    assert pd.api.types.is_string_dtype(processed_data['subcategory'])
    assert pd.api.types.is_string_dtype(processed_data['brand'])
    assert pd.api.types.is_numeric_dtype(processed_data['supplier_id'])
    assert pd.api.types.is_numeric_dtype(processed_data['lead_time_days'])
    assert pd.api.types.is_numeric_dtype(processed_data['weight'])
    assert pd.api.types.is_numeric_dtype(processed_data['volume'])
    assert pd.api.types.is_string_dtype(processed_data['unit_of_measure'])

def test_process_product_data_empty():
    """Test processing of empty product data."""
    # Process empty data
    processed_data = process_product_data(pd.DataFrame())
    
    # Check that processing handles empty data
    assert processed_data is not None
    assert processed_data.empty

if __name__ == "__main__":
    pytest.main([__file__])