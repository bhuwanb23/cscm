"""
Test suite for calendar utilities
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the utils directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from utils.calendar_utils import add_calendar_features, get_holiday_list

def test_add_calendar_features():
    """Test adding calendar features to a dataframe."""
    # Create sample data
    sample_data = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=10),
        'sales': np.random.randint(10, 100, 10)
    })
    
    # Add calendar features
    enriched_data = add_calendar_features(sample_data)
    
    # Check that features were added
    assert enriched_data is not None
    assert len(enriched_data) == 10
    assert 'year' in enriched_data.columns
    assert 'month' in enriched_data.columns
    assert 'day' in enriched_data.columns
    assert 'weekday' in enriched_data.columns
    assert 'dayofyear' in enriched_data.columns
    assert 'weekofyear' in enriched_data.columns
    assert 'quarter' in enriched_data.columns
    assert 'is_weekend' in enriched_data.columns
    assert 'is_month_start' in enriched_data.columns
    assert 'is_month_end' in enriched_data.columns
    assert 'is_quarter_start' in enriched_data.columns
    assert 'is_holiday' in enriched_data.columns
    assert 'holiday_name' in enriched_data.columns

def test_add_calendar_features_with_holiday():
    """Test adding calendar features including holiday detection."""
    # Create sample data with a known holiday (New Year)
    sample_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-12-25'],  # New Year, regular day, Christmas
        'sales': [50, 60, 70]
    })
    
    # Add calendar features
    enriched_data = add_calendar_features(sample_data)
    
    # Check holiday detection
    assert enriched_data.iloc[0]['is_holiday'] == True  # New Year
    assert enriched_data.iloc[0]['holiday_name'] == 'New Year'
    assert enriched_data.iloc[2]['is_holiday'] == True  # Christmas
    assert enriched_data.iloc[2]['holiday_name'] == 'Christmas'
    assert enriched_data.iloc[1]['is_holiday'] == False  # Regular day
    assert enriched_data.iloc[1]['holiday_name'] == ''

def test_get_holiday_list():
    """Test getting holiday list."""
    # Get holidays for 2023
    holidays = get_holiday_list(2023)
    
    # Check that we got some holidays
    assert isinstance(holidays, dict)
    assert len(holidays) > 0
    
    # Check for New Year
    new_year_found = False
    for date, name in holidays.items():
        if name == 'New Year':
            new_year_found = True
            break
    
    assert new_year_found == True

def test_add_calendar_features_custom_date_column():
    """Test adding calendar features with custom date column name."""
    # Create sample data with custom date column name
    sample_data = pd.DataFrame({
        'transaction_date': pd.date_range('2023-01-01', periods=5),
        'amount': [100, 200, 150, 300, 250]
    })
    
    # Add calendar features with custom date column
    enriched_data = add_calendar_features(sample_data, date_column='transaction_date')
    
    # Check that features were added
    assert enriched_data is not None
    assert len(enriched_data) == 5
    assert 'year' in enriched_data.columns
    assert 'month' in enriched_data.columns

if __name__ == "__main__":
    pytest.main([__file__])