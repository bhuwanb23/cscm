"""
Unit tests for data models (schema validation).
"""
import pytest
import numpy as np
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestSalesDataModel:
    """Tests for models.data_models.SalesDataModel."""

    def _full_df(self):
        return pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=5),
            'hour': [10, 11, 12, 10, 11],
            'sku_id': [1, 2, 1, 2, 1],
            'store_id': [1, 1, 2, 2, 1],
            'sales_quantity': [10, 15, 8, 12, 20],
            'sales_amount': [100.0, 150.0, 80.0, 120.0, 200.0],
            'unit_price': [10.0, 10.0, 10.0, 10.0, 10.0],
        })

    def test_valid_data(self):
        from data_models import SalesDataModel
        model = SalesDataModel()
        result = model.validate(self._full_df())
        assert result is True

    def test_missing_columns_returns_false(self):
        from data_models import SalesDataModel
        df = pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 2, 3],
        })
        model = SalesDataModel()
        result = model.validate(df)
        assert result is False


class TestPriceDataModel:
    """Tests for models.data_models.PriceDataModel."""

    def _full_df(self):
        return pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 2, 3],
            'store_id': [1, 1, 2],
            'regular_price': [10.0, 15.0, 8.0],
            'actual_price': [9.0, 15.0, 7.5],
            'promotion_flag': [True, False, True],
            'markdown_rate': [0.1, 0.0, 0.06],
        })

    def test_valid_data(self):
        from data_models import PriceDataModel
        model = PriceDataModel()
        result = model.validate(self._full_df())
        assert result is True


class TestStoreAttributeModel:
    """Tests for models.data_models.StoreAttributeModel."""

    def _full_df(self):
        return pd.DataFrame({
            'store_id': [1, 2, 3],
            'store_name': ['A', 'B', 'C'],
            'location': ['NYC', 'CHI', 'BOS'],
            'store_type': ['Downtown', 'Mall', 'Airport'],
            'region': ['NE', 'MW', 'NE'],
            'size_sqft': [5000, 8000, 3000],
            'opening_date': pd.to_datetime(['2020-01-01', '2021-06-01', '2022-03-01']),
        })

    def test_valid_data(self):
        from data_models import StoreAttributeModel
        model = StoreAttributeModel()
        result = model.validate(self._full_df())
        assert result is True


class TestProductAttributeModel:
    """Tests for models.data_models.ProductAttributeModel."""

    def _full_df(self):
        return pd.DataFrame({
            'sku_id': [1, 2, 3],
            'product_name': ['Milk', 'Bread', 'Eggs'],
            'category': ['Dairy', 'Bakery', 'Dairy'],
            'subcategory': ['Fresh', 'Sliced', 'Regular'],
            'brand': ['Organic', 'Golden', 'Country'],
            'supplier_id': [101, 102, 103],
            'lead_time_days': [2, 1, 3],
        })

    def test_valid_data(self):
        from data_models import ProductAttributeModel
        model = ProductAttributeModel()
        result = model.validate(self._full_df())
        assert result is True


class TestInventoryDataModel:
    """Tests for models.data_models.InventoryDataModel."""

    def _full_df(self):
        return pd.DataFrame({
            'date': pd.date_range('2023-01-01', periods=3),
            'sku_id': [1, 2, 3],
            'store_id': [1, 1, 2],
            'inventory_on_hand': [100, 50, 200],
            'reorder_point': [20, 10, 30],
            'max_stock_level': [200, 100, 300],
            'stockout_flag': [False, True, False],
        })

    def test_valid_data(self):
        from data_models import InventoryDataModel
        model = InventoryDataModel()
        result = model.validate(self._full_df())
        assert result is True
