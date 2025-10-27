"""
Test suite for utility functions
"""

import pytest
import os
import sys
import tempfile
from datetime import datetime

# Add the utils directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from utils.helpers import setup_logging, create_output_directory, get_current_timestamp, validate_data_schema
import pandas as pd

def test_setup_logging():
    """Test logging setup."""
    # This test just verifies the function can be called without error
    setup_logging()
    assert True

def test_create_output_directory():
    """Test creation of output directory."""
    with tempfile.TemporaryDirectory() as temp_dir:
        subdir = "test_subdir"
        full_path = create_output_directory(temp_dir, subdir)
        
        assert os.path.exists(full_path)
        assert full_path == os.path.join(temp_dir, subdir)

def test_get_current_timestamp():
    """Test timestamp generation."""
    timestamp = get_current_timestamp()
    
    # Check that it's a string
    assert isinstance(timestamp, str)
    
    # Check that it has the expected format (YYYYMMDD_HHMMSS)
    assert len(timestamp) == 15
    assert timestamp[8] == '_'

def test_validate_data_schema():
    """Test data schema validation."""
    # Create sample data with required columns
    data = pd.DataFrame({
        'col1': [1, 2, 3],
        'col2': ['a', 'b', 'c'],
        'col3': [1.1, 2.2, 3.3]
    })
    
    required_columns = ['col1', 'col2']
    
    # Should pass validation
    result = validate_data_schema(data, required_columns)
    assert result == True
    
    # Should fail validation with missing columns
    with pytest.raises(ValueError):
        validate_data_schema(data, ['col1', 'col4'])

if __name__ == "__main__":
    pytest.main([__file__])