"""
Unit tests for external data ingestion.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'test')


class TestExternalDataIngestor:
    """Tests for utils.external_data.ExternalDataIngestor."""

    def test_init(self):
        from utils.external_data import ExternalDataIngestor
        ingestor = ExternalDataIngestor()
        assert ingestor is not None

    def test_integrate_external_signals(self):
        from utils.external_data import ExternalDataIngestor
        ingestor = ExternalDataIngestor()
        base = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=5),
            'sales': [10, 20, 15, 25, 30],
        })
        result = ingestor.integrate_external_signals(base, date_column='date')
        assert len(result) == 5
        assert 'sales' in result.columns
