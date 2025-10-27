"""
Test suite for data processing pipeline
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
import tempfile
import yaml

# Add the parent directory to the path to import scripts
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

# Import the data processing module
from scripts.data_processing import (
    load_config, 
    load_raw_data, 
    process_sales_data, 
    process_inventory_data, 
    process_supplier_data,
    save_processed_data
)

def test_load_config():
    """Test configuration loading."""
    # Create a temporary config file for testing
    config_data = {
        'data': {
            'raw_data_path': '../data/raw',
            'processed_data_path': '../data/processed'
        }
    }
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        yaml.dump(config_data, f)
        config_path = f.name
    
    try:
        config = load_config(config_path)
        assert config is not None
        assert 'data' in config
        assert config['data']['raw_data_path'] == '../data/raw'
    finally:
        os.unlink(config_path)

def test_process_sales_data():
    """Test sales data processing."""
    # Create sample sales data
    sales_data = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=10),
        'product_id': range(10),
        'sales': np.random.randint(1, 100, 10)
    })
    
    processed = process_sales_data(sales_data)
    assert processed is not None
    # Add more specific assertions based on your processing logic

def test_process_inventory_data():
    """Test inventory data processing."""
    # Create sample inventory data
    inventory_data = pd.DataFrame({
        'product_id': range(10),
        'stock_level': np.random.randint(0, 1000, 10),
        'reorder_point': np.random.randint(10, 100, 10)
    })
    
    processed = process_inventory_data(inventory_data)
    assert processed is not None
    # Add more specific assertions based on your processing logic

def test_process_supplier_data():
    """Test supplier data processing."""
    # Create sample supplier data
    supplier_data = pd.DataFrame({
        'supplier_id': range(5),
        'lead_time': np.random.randint(1, 30, 5),
        'reliability_score': np.random.uniform(0.5, 1.0, 5)
    })
    
    processed = process_supplier_data(supplier_data)
    assert processed is not None
    # Add more specific assertions based on your processing logic

def test_save_processed_data():
    """Test saving processed data."""
    # Create sample processed data
    processed_data = {
        'sales': pd.DataFrame({'a': [1, 2, 3]}),
        'inventory': pd.DataFrame({'b': [4, 5, 6]}),
        'suppliers': pd.DataFrame({'c': [7, 8, 9]})
    }
    
    # Create a temporary directory for output
    with tempfile.TemporaryDirectory() as temp_dir:
        success = save_processed_data(processed_data, temp_dir)
        assert success == True
        
        # Check that files were created
        assert os.path.exists(os.path.join(temp_dir, 'processed_sales.csv'))
        assert os.path.exists(os.path.join(temp_dir, 'processed_inventory.csv'))
        assert os.path.exists(os.path.join(temp_dir, 'processed_suppliers.csv'))

if __name__ == "__main__":
    pytest.main([__file__])