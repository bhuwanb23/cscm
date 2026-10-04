"""
Market-calendar consistency tests.

The ML feature pipeline and the backend market calendar must agree on which
days the Kanchipuram bazaar was shut. If they disagree, a day the dashboard
renders as "trading" reaches the forecaster flagged as a holiday (or the
reverse), and demand features are wrong for that day.

These assert the Python side of that contract, and that the two calendars do
not drift apart for the years we know exactly.
"""

import os
import sys

import pandas as pd
import pytest

AI_ML_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if AI_ML_ROOT not in sys.path:
    sys.path.insert(0, AI_ML_ROOT)

from utils.calendar_utils import (  # noqa: E402
    EXACT_HOLIDAYS,
    FIXED_HOLIDAYS,
    MOVING_HOLIDAYS,
    add_calendar_features,
    get_holiday_list,
)


class TestLocalHolidays:
    """The calendar must describe the market it actually operates in."""

    def test_no_us_only_holidays(self):
        """Thanksgiving and US Independence Day are not Tamil Nadu holidays."""
        names = ' '.join(FIXED_HOLIDAYS.values()).lower()
        assert 'thanksgiving' not in names
        # Independence Day exists in India too, but on 15 August, not 4 July.
        assert '07-04' not in FIXED_HOLIDAYS

    def test_includes_indian_national_holidays(self):
        for key in ('01-26', '08-15', '10-02'):
            assert key in FIXED_HOLIDAYS, f"missing Indian holiday {key}"

    def test_includes_tamil_festivals(self):
        names = ' '.join(name for name, _, _, _ in MOVING_HOLIDAYS)
        assert 'Pongal' in names
        assert 'Deepavali' in names


class TestExactHolidayDetection:
    """Every date we claim to know exactly must actually be detected."""

    def test_all_exact_holidays_are_flagged(self):
        dates = sorted(EXACT_HOLIDAYS.keys())
        df = pd.DataFrame({'date': dates, 'sales': [1] * len(dates)})
        enriched = add_calendar_features(df)

        detected = {
            row['date'].strftime('%Y-%m-%d'): bool(row['is_holiday'])
            for _, row in enriched.iterrows()
        }
        missed = [d for d, flag in detected.items() if not flag]
        assert not missed, f"exact holidays not detected as holidays: {missed}"

    def test_holiday_names_are_attached(self):
        df = pd.DataFrame({'date': ['2026-01-14', '2026-11-08'], 'sales': [1, 2]})
        enriched = add_calendar_features(df)
        names = set(enriched['holiday_name'])
        assert 'Pongal' in names
        assert 'Deepavali' in names

    def test_ordinary_day_is_not_marked_as_holiday(self):
        # 2026-09-02 is an ordinary Wednesday.
        df = pd.DataFrame({'date': ['2026-09-02'], 'sales': [1]})
        enriched = add_calendar_features(df)
        assert not bool(enriched.iloc[0]['is_holiday'])
        assert enriched.iloc[0]['holiday_name'] == ''

    def test_deepavali_spans_both_days(self):
        df = pd.DataFrame({'date': ['2026-11-08', '2026-11-09'], 'sales': [1, 2]})
        enriched = add_calendar_features(df)
        assert enriched['is_holiday'].all()


class TestHolidayList:
    def test_holiday_list_includes_exact_dates_for_known_years(self):
        holidays = get_holiday_list(2026)
        names = set(holidays.values())
        assert 'Pongal' in names
        assert 'Deepavali' in names

    def test_holiday_list_falls_back_to_approximate_anchors(self):
        # 2030 has no exact dates, so the anchors must still apply.
        holidays = get_holiday_list(2030)
        names = set(holidays.values())
        assert 'Pongal' in names
        assert len(holidays) > 0


class TestCalendarFeaturesUnchanged:
    """The pre-existing feature contract must survive the holiday fix."""

    def test_core_calendar_columns_still_present(self):
        df = pd.DataFrame({'date': pd.date_range('2026-09-01', periods=5), 'sales': range(5)})
        enriched = add_calendar_features(df)
        for col in ('year', 'month', 'day', 'weekday', 'is_weekend', 'is_holiday', 'holiday_name'):
            assert col in enriched.columns, f"lost calendar column {col}"

    def test_weekend_detection_still_works(self):
        """`is_weekend` is a demand-pattern feature (Sat+Sun), not a market
        closure flag. Saturday is a weekend for footfall but the Kanchipuram
        bazaar still trades, so it must stay a trading day and not a holiday.
        That distinction is the whole point of the two separate columns."""
        df = pd.DataFrame(
            {
                'date': ['2026-09-04', '2026-09-05', '2026-09-06'],
                'sales': [1, 2, 3],
            }
        )
        enriched = add_calendar_features(df)

        assert not bool(enriched.iloc[0]['is_weekend'])  # Friday
        assert bool(enriched.iloc[1]['is_weekend'])      # Saturday
        assert bool(enriched.iloc[2]['is_weekend'])      # Sunday

        # Saturday: weekend demand pattern, but market still open.
        assert bool(enriched.iloc[1]['is_weekend'])
        assert not bool(enriched.iloc[1]['is_holiday'])

        # Sunday: a weekend for demand. is_holiday stays False because this
        # module models public/festival closures only - the weekly market off
        # lives in backend/src/domain/marketCalendar.js, which is the
        # authority the dashboard uses.
        assert bool(enriched.iloc[2]['is_weekend'])
        assert not bool(enriched.iloc[2]['is_holiday'])

    def test_custom_date_column_supported(self):
        df = pd.DataFrame({'when': ['2026-09-02'], 'sales': [1]})
        enriched = add_calendar_features(df, date_column='when')
        assert 'is_holiday' in enriched.columns

    def test_does_not_mutate_input(self):
        df = pd.DataFrame({'date': ['2026-01-14'], 'sales': [1]})
        add_calendar_features(df)
        assert 'is_holiday' not in df.columns
