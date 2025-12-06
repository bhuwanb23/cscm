"""
Data Validation Utility for AI/ML Services

This module provides utility functions for validating and preprocessing data
using the existing data models from models/data_models.py
"""

import logging
import pandas as pd
from typing import Dict, Any, Optional
import sys
import os

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))

# Import data models for validation
try:
    from data_models import (
        SalesDataModel, 
        PriceDataModel, 
        StoreAttributeModel, 
        ProductAttributeModel, 
        InventoryDataModel
    )
    MODELS_AVAILABLE = True
except ImportError as e:
    logging.warning(f"Could not import data models: {e}")
    MODELS_AVAILABLE = False

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataValidator:
    """
    Utility class for data validation and preprocessing
    """
    
    @staticmethod
    def validate_sales_data(data: pd.DataFrame) -> tuple[bool, str]:
        """
        Validate sales data using SalesDataModel
        
        Args:
            data: Sales data as DataFrame
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not MODELS_AVAILABLE:
            return True, "Data models not available, skipping validation"
            
        try:
            model = SalesDataModel()
            is_valid = model.validate(data)
            return is_valid, "" if is_valid else "Sales data validation failed"
        except Exception as e:
            return False, f"Error during sales data validation: {str(e)}"
    
    @staticmethod
    def validate_price_data(data: pd.DataFrame) -> tuple[bool, str]:
        """
        Validate price data using PriceDataModel
        
        Args:
            data: Price data as DataFrame
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not MODELS_AVAILABLE:
            return True, "Data models not available, skipping validation"
            
        try:
            model = PriceDataModel()
            is_valid = model.validate(data)
            return is_valid, "" if is_valid else "Price data validation failed"
        except Exception as e:
            return False, f"Error during price data validation: {str(e)}"
    
    @staticmethod
    def validate_store_attributes(data: pd.DataFrame) -> tuple[bool, str]:
        """
        Validate store attribute data using StoreAttributeModel
        
        Args:
            data: Store attribute data as DataFrame
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not MODELS_AVAILABLE:
            return True, "Data models not available, skipping validation"
            
        try:
            model = StoreAttributeModel()
            is_valid = model.validate(data)
            return is_valid, "" if is_valid else "Store attribute data validation failed"
        except Exception as e:
            return False, f"Error during store attribute data validation: {str(e)}"
    
    @staticmethod
    def validate_product_attributes(data: pd.DataFrame) -> tuple[bool, str]:
        """
        Validate product attribute data using ProductAttributeModel
        
        Args:
            data: Product attribute data as DataFrame
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not MODELS_AVAILABLE:
            return True, "Data models not available, skipping validation"
            
        try:
            model = ProductAttributeModel()
            is_valid = model.validate(data)
            return is_valid, "" if is_valid else "Product attribute data validation failed"
        except Exception as e:
            return False, f"Error during product attribute data validation: {str(e)}"
    
    @staticmethod
    def validate_inventory_data(data: pd.DataFrame) -> tuple[bool, str]:
        """
        Validate inventory data using InventoryDataModel
        
        Args:
            data: Inventory data as DataFrame
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not MODELS_AVAILABLE:
            return True, "Data models not available, skipping validation"
            
        try:
            model = InventoryDataModel()
            is_valid = model.validate(data)
            return is_valid, "" if is_valid else "Inventory data validation failed"
        except Exception as e:
            return False, f"Error during inventory data validation: {str(e)}"
    
    @staticmethod
    def preprocess_sales_data(data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess sales data using SalesDataModel
        
        Args:
            data: Raw sales data as DataFrame
            
        Returns:
            pd.DataFrame: Validated and transformed sales data
        """
        if not MODELS_AVAILABLE:
            logger.warning("Data models not available, returning data as-is")
            return data
            
        try:
            model = SalesDataModel()
            # Validate first
            is_valid = model.validate(data)
            if not is_valid:
                raise ValueError("Sales data validation failed")
            # Transform
            return model.transform(data)
        except Exception as e:
            logger.error(f"Error preprocessing sales data: {str(e)}")
            raise
    
    @staticmethod
    def preprocess_price_data(data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess price data using PriceDataModel
        
        Args:
            data: Raw price data as DataFrame
            
        Returns:
            pd.DataFrame: Validated and transformed price data
        """
        if not MODELS_AVAILABLE:
            logger.warning("Data models not available, returning data as-is")
            return data
            
        try:
            model = PriceDataModel()
            # Validate first
            is_valid = model.validate(data)
            if not is_valid:
                raise ValueError("Price data validation failed")
            # Transform (currently no transform method, return as-is)
            return data
        except Exception as e:
            logger.error(f"Error preprocessing price data: {str(e)}")
            raise
    
    @staticmethod
    def preprocess_store_attributes(data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess store attribute data using StoreAttributeModel
        
        Args:
            data: Raw store attribute data as DataFrame
            
        Returns:
            pd.DataFrame: Validated store attribute data
        """
        if not MODELS_AVAILABLE:
            logger.warning("Data models not available, returning data as-is")
            return data
            
        try:
            model = StoreAttributeModel()
            # Validate first
            is_valid = model.validate(data)
            if not is_valid:
                raise ValueError("Store attribute data validation failed")
            # Transform (currently no transform method, return as-is)
            return data
        except Exception as e:
            logger.error(f"Error preprocessing store attribute data: {str(e)}")
            raise
    
    @staticmethod
    def preprocess_product_attributes(data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess product attribute data using ProductAttributeModel
        
        Args:
            data: Raw product attribute data as DataFrame
            
        Returns:
            pd.DataFrame: Validated product attribute data
        """
        if not MODELS_AVAILABLE:
            logger.warning("Data models not available, returning data as-is")
            return data
            
        try:
            model = ProductAttributeModel()
            # Validate first
            is_valid = model.validate(data)
            if not is_valid:
                raise ValueError("Product attribute data validation failed")
            # Transform (currently no transform method, return as-is)
            return data
        except Exception as e:
            logger.error(f"Error preprocessing product attribute data: {str(e)}")
            raise
    
    @staticmethod
    def preprocess_inventory_data(data: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess inventory data using InventoryDataModel
        
        Args:
            data: Raw inventory data as DataFrame
            
        Returns:
            pd.DataFrame: Validated inventory data
        """
        if not MODELS_AVAILABLE:
            logger.warning("Data models not available, returning data as-is")
            return data
            
        try:
            model = InventoryDataModel()
            # Validate first
            is_valid = model.validate(data)
            if not is_valid:
                raise ValueError("Inventory data validation failed")
            # Transform (currently no transform method, return as-is)
            return data
        except Exception as e:
            logger.error(f"Error preprocessing inventory data: {str(e)}")
            raise

# Example usage
if __name__ == "__main__":
    # Create sample sales data
    sample_sales_data = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-01', '2023-01-02'],
        'hour': [10, 11, 12],
        'sku_id': [1, 2, 1],
        'store_id': [1, 1, 2],
        'sales_quantity': [5, 3, 7],
        'sales_amount': [50.0, 30.0, 70.0],
        'unit_price': [10.0, 10.0, 10.0]
    })
    
    # Validate sales data
    validator = DataValidator()
    is_valid, error_msg = validator.validate_sales_data(sample_sales_data)
    print(f"Sales data validation: {is_valid}, Error: {error_msg}")
    
    # Preprocess sales data
    if is_valid:
        try:
            processed_data = validator.preprocess_sales_data(sample_sales_data)
            print("Processed data:")
            print(processed_data.head())
        except Exception as e:
            print(f"Error processing data: {e}")