"""
Unit tests for data processing pipeline.
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw')


class TestLoadConfig:
    """Tests for scripts.data_processing.load_config."""

    def test_load_config(self):
        from scripts.data_processing import load_config
        config = load_config()
        assert config is not None
        assert 'data' in config
        assert 'raw_data_path' in config['data']


class TestProcessSalesData:
    """Tests for scripts.data_processing.process_sales_data."""

    def test_processes_correctly(self):
        from scripts.data_processing import process_sales_data
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=10),
            'sku_id': [1, 2] * 5,
            'store_id': [1, 1, 2, 2, 1, 1, 2, 2, 1, 1],
            'sales_quantity': np.random.poisson(10, 10),
            'sales_amount': np.random.normal(100, 20, 10),
        })
        result = process_sales_data(df)
        assert result is not None
        assert len(result) == 10
        # Calendar features should be added
        assert 'is_weekend' in result.columns or 'weekday' in result.columns

    def test_empty_input(self):
        from scripts.data_processing import process_sales_data
        result = process_sales_data(pd.DataFrame())
        assert result is not None
        assert len(result) == 0

    def test_none_input(self):
        from scripts.data_processing import process_sales_data
        result = process_sales_data(None)
        assert result is not None
        assert len(result) == 0


class TestProcessPriceData:
    """Tests for scripts.data_processing.process_price_data."""

    def test_calculates_discount(self):
        from scripts.data_processing import process_price_data
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=5),
            'sku_id': [1, 2, 1, 2, 1],
            'store_id': [1, 1, 2, 2, 1],
            'regular_price': [10.0, 15.0, 10.0, 15.0, 10.0],
            'actual_price': [9.0, 15.0, 8.5, 13.5, 10.0],
            'promotion_flag': [True, False, True, True, False],
            'markdown_rate': [0.1, 0.0, 0.15, 0.1, 0.0],
        })
        result = process_price_data(df)
        assert 'discount_amount' in result.columns
        assert 'discount_percentage' in result.columns


class TestProcessInventoryData:
    """Tests for scripts.data_processing.process_inventory_data."""

    def test_adds_utilization(self):
        from scripts.data_processing import process_inventory_data
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=5),
            'sku_id': [1, 2, 1, 2, 1],
            'store_id': [1, 1, 2, 2, 1],
            'inventory_on_hand': [100, 50, 200, 0, 150],
            'reorder_point': [20, 20, 30, 30, 20],
            'max_stock_level': [200, 100, 300, 300, 200],
        })
        result = process_inventory_data(df)
        assert 'inventory_utilization' in result.columns
        assert 'below_reorder_point' in result.columns


class TestIntegrateAllData:
    """Tests for scripts.data_processing.integrate_all_data."""

    def test_merges_datasets(self):
        from scripts.data_processing import integrate_all_data
        sales = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 2, 1],
            'store_id': [1, 1, 2],
            'sales_quantity': [10, 15, 8],
        })
        inventory = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 2, 1],
            'store_id': [1, 1, 2],
            'inventory_on_hand': [100, 50, 200],
        })
        result = integrate_all_data({'sales': sales, 'inventory': inventory})
        assert len(result) == 3
        assert 'inventory_on_hand' in result.columns
