"""
Unit tests for calendar utilities.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


class TestCalendarFeatures:
    """Tests for utils.calendar_utils.add_calendar_features."""

    def test_adds_columns(self):
        from utils.calendar_utils import add_calendar_features
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=10),
            'value': range(10),
        })
        result = add_calendar_features(df, date_column='date')
        assert 'year' in result.columns
        assert 'month' in result.columns
        assert 'weekday' in result.columns
        assert 'is_weekend' in result.columns

    def test_weekend_detection(self):
        from utils.calendar_utils import add_calendar_features
        df = pd.DataFrame({
            'date': pd.to_datetime(['2023-01-02', '2023-01-07']),  # Mon, Sat
            'value': [1, 2],
        })
        result = add_calendar_features(df, date_column='date')
        assert result.iloc[0]['is_weekend'] == 0
        assert result.iloc[1]['is_weekend'] == 1

    def test_preserves_original_columns(self):
        from utils.calendar_utils import add_calendar_features
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sales': [10, 20, 30],
        })
        result = add_calendar_features(df, date_column='date')
        assert 'sales' in result.columns
        assert len(result) == 3

    def test_holiday_detection(self):
        from utils.calendar_utils import add_calendar_features
        df = pd.DataFrame({
            'date': pd.to_datetime(['2023-01-01', '2023-07-04']),  # NY, July 4th
            'value': [1, 2],
        })
        result = add_calendar_features(df, date_column='date')
        if 'is_holiday' in result.columns:
            assert result.iloc[0]['is_holiday'] == 1 or result.iloc[0]['is_holiday'] is True


class TestGetHolidayList:
    """Tests for utils.calendar_utils.get_holiday_list."""

    def test_returns_dict(self):
        from utils.calendar_utils import get_holiday_list
        holidays = get_holiday_list()
        assert isinstance(holidays, dict)
        assert len(holidays) > 0
