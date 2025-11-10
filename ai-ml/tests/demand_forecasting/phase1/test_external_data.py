"""
Test suite for external data ingestion
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the utils directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from utils.external_data import ExternalDataIngestor

def test_external_data_ingestor_initialization():
    """Test initialization of ExternalDataIngestor."""
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Check that it was initialized correctly
    assert ingestor is not None
    assert hasattr(ingestor, 'data_path')

def test_process_weather_data():
    """Test processing of weather data."""
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Create sample weather data
    weather_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'temperature': [32, 30, 28],
        'humidity': [65, 70, 75],
        'precipitation': [0.0, 0.2, 0.5],
        'wind_speed': [5, 8, 12],
        'condition': ['Sunny', 'Cloudy', 'Rainy']
    })
    
    # Process the data
    processed_data = ingestor.process_weather_data(weather_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(processed_data['date'])
    assert pd.api.types.is_numeric_dtype(processed_data['temperature'])
    assert pd.api.types.is_numeric_dtype(processed_data['humidity'])
    assert pd.api.types.is_numeric_dtype(processed_data['precipitation'])
    assert pd.api.types.is_numeric_dtype(processed_data['wind_speed'])
    
    # Check derived columns
    assert 'is_sunny' in processed_data.columns
    assert 'is_rainy' in processed_data.columns
    assert 'is_snowy' in processed_data.columns

def test_process_event_data():
    """Test processing of event data."""
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Create sample event data
    event_data = pd.DataFrame({
        'event_name': ['New Year Sale', 'Football Championship'],
        'event_type': ['Promotion', 'Sports'],
        'start_date': ['2023-01-01', '2023-01-02'],
        'end_date': ['2023-01-03', '2023-01-02'],
        'location': ['All Stores', 'Stadium Area'],
        'expected_attendance': [5000, 20000],
        'impact_score': [8.5, 9.0]
    })
    
    # Process the data
    processed_data = ingestor.process_event_data(event_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 2
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(processed_data['start_date'])
    assert pd.api.types.is_datetime64_any_dtype(processed_data['end_date'])
    assert pd.api.types.is_numeric_dtype(processed_data['expected_attendance'])
    assert pd.api.types.is_numeric_dtype(processed_data['impact_score'])
    assert pd.api.types.is_string_dtype(processed_data['event_name'])
    assert pd.api.types.is_string_dtype(processed_data['event_type'])

def test_process_macro_data():
    """Test processing of macroeconomic data."""
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Create sample macro data
    macro_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'gdp_growth': [2.1, 2.1, 2.2],
        'unemployment_rate': [3.5, 3.5, 3.4],
        'inflation_rate': [2.8, 2.8, 2.7],
        'consumer_confidence': [75.2, 75.2, 76.1]
    })
    
    # Process the data
    processed_data = ingestor.process_macro_data(macro_data)
    
    # Check that processing was successful
    assert processed_data is not None
    assert not processed_data.empty
    assert len(processed_data) == 3
    
    # Check data types
    assert pd.api.types.is_datetime64_any_dtype(processed_data['date'])
    assert pd.api.types.is_numeric_dtype(processed_data['gdp_growth'])
    assert pd.api.types.is_numeric_dtype(processed_data['unemployment_rate'])
    assert pd.api.types.is_numeric_dtype(processed_data['inflation_rate'])
    assert pd.api.types.is_numeric_dtype(processed_data['consumer_confidence'])

def test_integrate_external_signals():
    """Test integration of external signals with base data."""
    # Create ingestor
    ingestor = ExternalDataIngestor()
    
    # Create sample base data
    base_data = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=3),
        'sales': [100, 150, 200]
    })
    
    # Integrate external signals
    integrated_data = ingestor.integrate_external_signals(base_data)
    
    # Check that integration was successful
    assert integrated_data is not None
    assert not integrated_data.empty
    assert len(integrated_data) == 3
    
    # Check that base data columns are preserved
    assert 'sales' in integrated_data.columns

if __name__ == "__main__":
    pytest.main([__file__])