"""
Calendar utilities for CSCM AI/ML System

This module provides functions for generating calendar features such as weekdays, holidays, etc.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Sample holiday data (in a real system, this would come from a comprehensive holiday database)
HOLIDAYS = {
    '01-01': 'New Year',
    '12-25': 'Christmas',
    '11-24': 'Thanksgiving',
    '07-04': 'Independence Day'
}

def add_calendar_features(df, date_column='date'):
    """
    Add calendar features to a dataframe.
    
    Args:
        df (pd.DataFrame): Input dataframe
        date_column (str): Name of the date column
        
    Returns:
        pd.DataFrame: Dataframe with added calendar features
    """
    try:
        # Make a copy to avoid modifying original data
        result_df = df.copy()
        
        # Ensure date column is datetime
        result_df[date_column] = pd.to_datetime(result_df[date_column])
        
        # Extract basic calendar features
        result_df['year'] = result_df[date_column].dt.year
        result_df['month'] = result_df[date_column].dt.month
        result_df['day'] = result_df[date_column].dt.day
        result_df['weekday'] = result_df[date_column].dt.weekday
        result_df['dayofyear'] = result_df[date_column].dt.dayofyear
        result_df['weekofyear'] = result_df[date_column].dt.isocalendar().week
        result_df['quarter'] = result_df[date_column].dt.quarter
        
        # Add derived features
        result_df['is_weekend'] = result_df['weekday'].isin([5, 6])  # Saturday, Sunday
        result_df['is_month_start'] = result_df['day'] <= 7
        result_df['is_month_end'] = result_df['day'] >= 25
        result_df['is_quarter_start'] = result_df['dayofyear'].isin([1, 91, 182, 274])
        
        # Add holiday features
        result_df['is_holiday'] = False
        result_df['holiday_name'] = ''
        
        for index, row in result_df.iterrows():
            date = row[date_column]
            month_day = date.strftime('%m-%d')
            if month_day in HOLIDAYS:
                result_df.at[index, 'is_holiday'] = True
                result_df.at[index, 'holiday_name'] = HOLIDAYS[month_day]
        
        logger.info(f"Added calendar features to {len(result_df)} records")
        return result_df
        
    except Exception as e:
        logger.error(f"Error adding calendar features: {e}")
        return df

def get_holiday_list(year=None):
    """
    Get list of holidays for a given year.
    
    Args:
        year (int): Year to get holidays for (default: current year)
        
    Returns:
        dict: Dictionary of holidays with dates as keys and names as values
    """
    if year is None:
        year = datetime.now().year
        
    holiday_dates = {}
    for month_day, name in HOLIDAYS.items():
        try:
            date = datetime.strptime(f"{year}-{month_day}", "%Y-%m-%d")
            holiday_dates[date] = name
        except ValueError:
            # Skip invalid dates
            pass
            
    return holiday_dates

# Example usage
if __name__ == "__main__":
    # Create sample data
    sample_data = pd.DataFrame({
        'date': pd.date_range('2023-01-01', periods=10),
        'sales': np.random.randint(10, 100, 10)
    })
    
    # Add calendar features
    enriched_data = add_calendar_features(sample_data)
    print("Data with calendar features:")
    print(enriched_data.head())
    
    # Get holiday list
    holidays = get_holiday_list(2023)
    print("\nHolidays in 2023:")
    for date, name in holidays.items():
        print(f"  {date.strftime('%Y-%m-%d')}: {name}")