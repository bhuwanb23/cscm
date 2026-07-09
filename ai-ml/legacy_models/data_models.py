"""
Data Models for CSCM AI/ML System

This module defines the data models and schemas for the Cognitive Supply Chain Mesh.
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional, Dict, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SalesDataModel:
    """Data model for SKU-store-day/hour sales data."""
    
    def __init__(self):
        self.required_columns = [
            'date', 'hour', 'sku_id', 'store_id', 'sales_quantity', 
            'sales_amount', 'unit_price'
        ]
        self.optional_columns = [
            'promotion_flag', 'markdown_rate', 'is_weekend', 'is_holiday'
        ]
    
    def validate(self, data: pd.DataFrame) -> bool:
        """
        Validate sales data schema.
        
        Args:
            data (pd.DataFrame): Sales data to validate
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        # Check required columns
        missing_columns = set(self.required_columns) - set(data.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check data types
        try:
            # Date validation
            pd.to_datetime(data['date'])
            
            # Numeric validations
            pd.to_numeric(data['hour'])
            pd.to_numeric(data['sku_id'])
            pd.to_numeric(data['store_id'])
            pd.to_numeric(data['sales_quantity'])
            pd.to_numeric(data['sales_amount'])
            pd.to_numeric(data['unit_price'])
            
            # Hour range validation (0-23)
            if not data['hour'].between(0, 23).all():
                logger.error("Hour values must be between 0 and 23")
                return False
                
            # Positive values validation
            if (data['sales_quantity'] < 0).any():
                logger.error("Sales quantity cannot be negative")
                return False
                
            if (data['sales_amount'] < 0).any():
                logger.error("Sales amount cannot be negative")
                return False
                
            if (data['unit_price'] < 0).any():
                logger.error("Unit price cannot be negative")
                return False
                
        except Exception as e:
            logger.error(f"Data type validation failed: {e}")
            return False
            
        return True
    
    def transform(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Transform raw sales data into the required format.
        
        Args:
            data (pd.DataFrame): Raw sales data
            
        Returns:
            pd.DataFrame: Transformed sales data
        """
        # Make a copy to avoid modifying original data
        transformed_data = data.copy()
        
        # Convert date column
        transformed_data['date'] = pd.to_datetime(transformed_data['date'])
        
        # Convert numeric columns
        numeric_columns = ['hour', 'sku_id', 'store_id', 'sales_quantity', 
                          'sales_amount', 'unit_price']
        for col in numeric_columns:
            transformed_data[col] = pd.to_numeric(transformed_data[col])
        
        # Add optional columns if they don't exist
        for col in self.optional_columns:
            if col not in transformed_data.columns:
                transformed_data[col] = 0 if col != 'is_holiday' else False
        
        # Sort by date and hour
        transformed_data = transformed_data.sort_values(['date', 'hour'])
        
        return transformed_data

class PriceDataModel:
    """Data model for price, promotions, and markdown data."""
    
    def __init__(self):
        self.required_columns = [
            'date', 'sku_id', 'store_id', 'regular_price', 
            'actual_price', 'promotion_flag', 'markdown_rate'
        ]
    
    def validate(self, data: pd.DataFrame) -> bool:
        """
        Validate price data schema.
        
        Args:
            data (pd.DataFrame): Price data to validate
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        # Check required columns
        missing_columns = set(self.required_columns) - set(data.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check data types
        try:
            # Date validation
            pd.to_datetime(data['date'])
            
            # Numeric validations
            pd.to_numeric(data['sku_id'])
            pd.to_numeric(data['store_id'])
            pd.to_numeric(data['regular_price'])
            pd.to_numeric(data['actual_price'])
            pd.to_numeric(data['markdown_rate'])
            
            # Boolean validation
            data['promotion_flag'].astype(bool)
            
            # Price validation
            if (data['regular_price'] < 0).any():
                logger.error("Regular price cannot be negative")
                return False
                
            if (data['actual_price'] < 0).any():
                logger.error("Actual price cannot be negative")
                return False
                
            if (data['markdown_rate'] < 0).any() or (data['markdown_rate'] > 1).any():
                logger.error("Markdown rate must be between 0 and 1")
                return False
                
        except Exception as e:
            logger.error(f"Data type validation failed: {e}")
            return False
            
        return True

class StoreAttributeModel:
    """Data model for store attributes."""
    
    def __init__(self):
        self.required_columns = [
            'store_id', 'store_name', 'location', 'store_type', 
            'size_sqft', 'opening_date'
        ]
    
    def validate(self, data: pd.DataFrame) -> bool:
        """
        Validate store attribute data schema.
        
        Args:
            data (pd.DataFrame): Store attribute data to validate
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        # Check required columns
        missing_columns = set(self.required_columns) - set(data.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check data types
        try:
            # Numeric validations
            pd.to_numeric(data['store_id'])
            pd.to_numeric(data['size_sqft'])
            
            # Date validation
            pd.to_datetime(data['opening_date'])
            
            # String validations
            data['store_name'].astype(str)
            data['location'].astype(str)
            data['store_type'].astype(str)
            
        except Exception as e:
            logger.error(f"Data type validation failed: {e}")
            return False
            
        return True

class ProductAttributeModel:
    """Data model for product attributes."""
    
    def __init__(self):
        self.required_columns = [
            'sku_id', 'product_name', 'category', 'subcategory', 
            'brand', 'supplier_id', 'lead_time_days'
        ]
    
    def validate(self, data: pd.DataFrame) -> bool:
        """
        Validate product attribute data schema.
        
        Args:
            data (pd.DataFrame): Product attribute data to validate
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        # Check required columns
        missing_columns = set(self.required_columns) - set(data.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check data types
        try:
            # Numeric validations
            pd.to_numeric(data['sku_id'])
            pd.to_numeric(data['supplier_id'])
            pd.to_numeric(data['lead_time_days'])
            
            # String validations
            data['product_name'].astype(str)
            data['category'].astype(str)
            data['subcategory'].astype(str)
            data['brand'].astype(str)
            
        except Exception as e:
            logger.error(f"Data type validation failed: {e}")
            return False
            
        return True

class InventoryDataModel:
    """Data model for inventory data (on hand & stockouts)."""
    
    def __init__(self):
        self.required_columns = [
            'date', 'sku_id', 'store_id', 'inventory_on_hand', 
            'stockout_flag', 'reorder_point', 'max_stock_level'
        ]
    
    def validate(self, data: pd.DataFrame) -> bool:
        """
        Validate inventory data schema.
        
        Args:
            data (pd.DataFrame): Inventory data to validate
            
        Returns:
            bool: True if data is valid, False otherwise
        """
        # Check required columns
        missing_columns = set(self.required_columns) - set(data.columns)
        if missing_columns:
            logger.error(f"Missing required columns: {missing_columns}")
            return False
        
        # Check data types
        try:
            # Date validation
            pd.to_datetime(data['date'])
            
            # Numeric validations
            pd.to_numeric(data['sku_id'])
            pd.to_numeric(data['store_id'])
            pd.to_numeric(data['inventory_on_hand'])
            pd.to_numeric(data['reorder_point'])
            pd.to_numeric(data['max_stock_level'])
            
            # Boolean validation
            data['stockout_flag'].astype(bool)
            
            # Inventory validation
            if (data['inventory_on_hand'] < 0).any():
                logger.error("Inventory on hand cannot be negative")
                return False
                
            if (data['reorder_point'] < 0).any():
                logger.error("Reorder point cannot be negative")
                return False
                
            if (data['max_stock_level'] < 0).any():
                logger.error("Max stock level cannot be negative")
                return False
                
        except Exception as e:
            logger.error(f"Data type validation failed: {e}")
            return False
            
        return True

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
    sales_model = SalesDataModel()
    is_valid = sales_model.validate(sample_sales_data)
    print(f"Sales data validation: {is_valid}")
    
    # Transform sales data
    if is_valid:
        transformed_data = sales_model.transform(sample_sales_data)
        print("Transformed data:")
        print(transformed_data)