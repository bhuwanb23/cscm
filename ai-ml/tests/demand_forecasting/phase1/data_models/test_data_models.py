"""
Test suite for data models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.data_models import (
    SalesDataModel, 
    PriceDataModel, 
    StoreAttributeModel, 
    ProductAttributeModel, 
    InventoryDataModel
)

def test_sales_data_model_validation():
    """Test validation of sales data model."""
    # Create valid sales data
    valid_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'hour': [10, 11, 12],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'sales_quantity': [5, 3, 7],
        'sales_amount': [50.0, 30.0, 70.0],
        'unit_price': [10.0, 10.0, 10.0]
    })
    
    # Validate
    sales_model = SalesDataModel()
    is_valid = sales_model.validate(valid_sales_data)
    assert is_valid == True

def test_sales_data_model_validation_missing_columns():
    """Test validation of sales data model with missing columns."""
    # Create invalid sales data (missing columns)
    invalid_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01'],
        'hour': [10, 11],
        'sku_id': [1, 2]
        # Missing required columns
    })
    
    # Validate
    sales_model = SalesDataModel()
    is_valid = sales_model.validate(invalid_sales_data)
    assert is_valid == False

def test_sales_data_model_validation_invalid_hour():
    """Test validation of sales data model with invalid hour."""
    # Create invalid sales data (hour out of range)
    invalid_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01'],
        'hour': [25, -1],  # Invalid hours
        'sku_id': [1, 2],
        'store_id': [1, 1],
        'sales_quantity': [5, 3],
        'sales_amount': [50.0, 30.0],
        'unit_price': [10.0, 10.0]
    })
    
    # Validate
    sales_model = SalesDataModel()
    is_valid = sales_model.validate(invalid_sales_data)
    assert is_valid == False

def test_sales_data_model_transform():
    """Test transformation of sales data model."""
    # Create raw sales data
    raw_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-01'],
        'hour': ['10', '12', '11'],  # String format
        'sku_id': ['1', '1', '2'],   # String format
        'store_id': ['1', '2', '1'], # String format
        'sales_quantity': ['5', '7', '3'], # String format
        'sales_amount': ['50.0', '70.0', '30.0'], # String format
        'unit_price': ['10.0', '10.0', '10.0'] # String format
    })
    
    # Transform
    sales_model = SalesDataModel()
    transformed_data = sales_model.transform(raw_sales_data)
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(transformed_data['date'])
    assert pd.api.types.is_numeric_dtype(transformed_data['hour'])
    assert pd.api.types.is_numeric_dtype(transformed_data['sku_id'])
    assert pd.api.types.is_numeric_dtype(transformed_data['store_id'])
    assert pd.api.types.is_numeric_dtype(transformed_data['sales_quantity'])
    assert pd.api.types.is_numeric_dtype(transformed_data['sales_amount'])
    assert pd.api.types.is_numeric_dtype(transformed_data['unit_price'])
    
    # Check sorting
    assert transformed_data.iloc[0]['date'] <= transformed_data.iloc[1]['date']
    assert transformed_data.iloc[1]['date'] <= transformed_data.iloc[2]['date']

def test_price_data_model_validation():
    """Test validation of price data model."""
    # Create valid price data
    valid_price_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'regular_price': [10.0, 15.0, 10.0],
        'actual_price': [9.0, 15.0, 8.0],
        'promotion_flag': [True, False, True],
        'markdown_rate': [0.1, 0.0, 0.2]
    })
    
    # Validate
    price_model = PriceDataModel()
    is_valid = price_model.validate(valid_price_data)
    assert is_valid == True

def test_store_attribute_model_validation():
    """Test validation of store attribute model."""
    # Create valid store attribute data
    valid_store_data = pd.DataFrame({
        'store_id': [1, 2, 3],
        'store_name': ['Store A', 'Store B', 'Store C'],
        'location': ['Location A', 'Location B', 'Location C'],
        'store_type': ['Type A', 'Type B', 'Type A'],
        'size_sqft': [1000, 1500, 1200],
        'opening_date': ['2020-01-01', '2021-01-01', '2020-06-01']
    })
    
    # Validate
    store_model = StoreAttributeModel()
    is_valid = store_model.validate(valid_store_data)
    assert is_valid == True

def test_product_attribute_model_validation():
    """Test validation of product attribute model."""
    # Create valid product attribute data
    valid_product_data = pd.DataFrame({
        'sku_id': [1, 2, 3],
        'product_name': ['Product A', 'Product B', 'Product C'],
        'category': ['Category A', 'Category B', 'Category A'],
        'subcategory': ['Sub A1', 'Sub B1', 'Sub A2'],
        'brand': ['Brand A', 'Brand B', 'Brand A'],
        'supplier_id': [101, 102, 101],
        'lead_time_days': [5, 7, 5]
    })
    
    # Validate
    product_model = ProductAttributeModel()
    is_valid = product_model.validate(valid_product_data)
    assert is_valid == True

def test_inventory_data_model_validation():
    """Test validation of inventory data model."""
    # Create valid inventory data
    valid_inventory_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'inventory_on_hand': [100, 50, 75],
        'stockout_flag': [False, False, True],
        'reorder_point': [20, 10, 15],
        'max_stock_level': [200, 100, 150]
    })
    
    # Validate
    inventory_model = InventoryDataModel()
    is_valid = inventory_model.validate(valid_inventory_data)
    assert is_valid == True

if __name__ == "__main__":
    pytest.main([__file__])