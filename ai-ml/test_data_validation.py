"""
Test script for data validation functionality
"""

import pandas as pd
import sys
import os

# Add paths to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'models'))

from api.utils.data_validator import DataValidator

def test_sales_data_validation():
    """Test sales data validation with valid data"""
    print("Testing sales data validation with valid data...")
    
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
    is_valid, error_msg = DataValidator.validate_sales_data(valid_sales_data)
    print(f"Validation result: {is_valid}, Error: '{error_msg}'")
    
    if is_valid:
        # Preprocess
        try:
            processed_data = DataValidator.preprocess_sales_data(valid_sales_data)
            print("Preprocessing successful!")
            print("Processed data shape:", processed_data.shape)
            print("Processed data columns:", list(processed_data.columns))
            print("First few rows:")
            print(processed_data.head())
        except Exception as e:
            print(f"Error during preprocessing: {e}")
    else:
        print("Skipping preprocessing due to validation failure")

def test_sales_data_validation_invalid():
    """Test sales data validation with invalid data"""
    print("\nTesting sales data validation with invalid data...")
    
    # Create invalid sales data (negative sales quantity)
    invalid_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'hour': [10, 11, 12],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'sales_quantity': [-5, 3, 7],  # Negative quantity - invalid
        'sales_amount': [50.0, 30.0, 70.0],
        'unit_price': [10.0, 10.0, 10.0]
    })
    
    # Validate
    is_valid, error_msg = DataValidator.validate_sales_data(invalid_sales_data)
    print(f"Validation result: {is_valid}, Error: '{error_msg}'")
    
    if not is_valid:
        print("Correctly identified invalid data!")

def test_price_data_validation():
    """Test price data validation"""
    print("\nTesting price data validation...")
    
    # Create valid price data
    valid_price_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'regular_price': [10.0, 15.0, 12.0],
        'actual_price': [9.0, 15.0, 10.0],
        'promotion_flag': [True, False, True],
        'markdown_rate': [0.1, 0.0, 0.15]
    })
    
    # Validate
    is_valid, error_msg = DataValidator.validate_price_data(valid_price_data)
    print(f"Validation result: {is_valid}, Error: '{error_msg}'")

def test_inventory_data_validation():
    """Test inventory data validation"""
    print("\nTesting inventory data validation...")
    
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
    is_valid, error_msg = DataValidator.validate_inventory_data(valid_inventory_data)
    print(f"Validation result: {is_valid}, Error: '{error_msg}'")

if __name__ == "__main__":
    print("Running data validation tests...\n")
    
    test_sales_data_validation()
    test_sales_data_validation_invalid()
    test_price_data_validation()
    test_inventory_data_validation()
    
    print("\nAll tests completed!")