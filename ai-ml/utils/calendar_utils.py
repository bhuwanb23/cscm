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

# Holiday data for the Kanchipuram silk trade.
#
# This was a US-centric sample (Thanksgiving, Independence Day) applied to a
# Tamil Nadu handloom business: it closed the market on 4 July, which is not a
# holiday here, while missing Pongal and Deepavali, which genuinely shut the
# bazaar. Fixed-date national holidays are keyed by MM-DD; drifting Tamil
# festivals are resolved per-year below and marked approximate, because their
# Gregorian dates shift annually.
FIXED_HOLIDAYS = {
    '01-01': 'New Year',
    '01-26': 'Republic Day',
    '05-01': 'Labour Day',
    '08-15': 'Independence Day',
    '10-02': 'Gandhi Jayanti',
    '12-25': 'Christmas',
}

# Kept as the public name for backwards compatibility with existing callers.
HOLIDAYS = FIXED_HOLIDAYS

# Drifting Tamil-calendar festivals: (name, month, day, span_in_days).
# These are approximate anchors - the Gregorian dates shift year to year.
MOVING_HOLIDAYS = [
    ('Pongal', 1, 15, 2),
    ('Tamil New Year (Puthandu)', 4, 14, 1),
    ('Deepavali', 10, 30, 2),
    ('Karthigai Deepam', 11, 24, 1),
]

# Exact dates for years we know, keyed 'YYYY-MM-DD'. Must stay in step with
# backend/src/domain/marketCalendar.js OVERRIDES: if the two disagree, a day
# the dashboard calls "trading" is fed to the forecaster as a holiday (or the
# reverse), and demand features are wrong for that day.
EXACT_HOLIDAYS = {
    '2026-01-14': 'Pongal',
    '2026-01-15': 'Pongal',
    '2026-04-14': 'Tamil New Year (Puthandu)',
    '2026-11-08': 'Deepavali',
    '2026-11-09': 'Deepavali',
    '2026-11-24': 'Karthigai Deepam',
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
        
        # Add holiday features. Vectorised on the day column: the previous
        # iterrows() loop cost a full Python round-trip per row, which made
        # feature generation scale with rows rather than with columns.
        result_df['is_holiday'] = False
        result_df['holiday_name'] = ''

        month_days = result_df[date_column].dt.strftime('%m-%d')
        for month_day, name in FIXED_HOLIDAYS.items():
            hit = month_days == month_day
            result_df.loc[hit, 'is_holiday'] = True
            result_df.loc[hit, 'holiday_name'] = name

        # Drifting festivals. Exact known dates win over the approximate
        # anchors, otherwise the two calendars would disagree about 2026.
        day_keys = result_df[date_column].dt.strftime('%Y-%m-%d')
        for key, name in EXACT_HOLIDAYS.items():
            hit = day_keys == key
            result_df.loc[hit, 'is_holiday'] = True
            result_df.loc[hit, 'holiday_name'] = name

        # Approximate anchors only for years with no exact dates at all.
        exact_years = {key[:4] for key in EXACT_HOLIDAYS}
        for year in result_df[date_column].dt.year.unique():
            if str(year) in exact_years:
                continue
            for name, month, day, span in MOVING_HOLIDAYS:
                start = pd.Timestamp(year=year, month=month, day=day)
                for offset in range(span):
                    target = start + pd.Timedelta(days=offset)
                    hit = day_keys == target.strftime('%Y-%m-%d')
                    result_df.loc[hit, 'is_holiday'] = True
                    result_df.loc[hit, 'holiday_name'] = name

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
    for month_day, name in FIXED_HOLIDAYS.items():
        try:
            date = datetime.strptime(f"{year}-{month_day}", "%Y-%m-%d")
            holiday_dates[date] = name
        except ValueError:
            # Skip invalid dates
            pass

    # Exact known dates for this year take precedence over the anchors.
    exact = {k: v for k, v in EXACT_HOLIDAYS.items() if k.startswith(f"{year}-")}
    if not exact:
        for name, month, day, span in MOVING_HOLIDAYS:
            try:
                start = datetime(year, month, day)
            except ValueError:
                continue
            for offset in range(span):
                holiday_dates[start + timedelta(days=offset)] = name

    for key, name in exact.items():
        try:
            holiday_dates[datetime.strptime(key, "%Y-%m-%d")] = name
        except ValueError:
            continue

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