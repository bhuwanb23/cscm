"""
Data Processing Script for CSCM AI/ML System

This script handles the initial data processing pipeline for the Cognitive Supply Chain Mesh.
"""

import pandas as pd
import numpy as np
import yaml
import os
from datetime import datetime, timedelta
import logging

# Import utilities with relative imports
try:
    from utils.calendar_utils import add_calendar_features
    from utils.external_data import ExternalDataIngestor
except ImportError:
    # Fallback for direct execution
    import sys
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
    from utils.calendar_utils import add_calendar_features
    from utils.external_data import ExternalDataIngestor

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_config(config_path=None):
    """Load project configuration."""
    # Default to config in the same directory
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'project_config.yaml')
    
    try:
        with open(config_path, 'r') as file:
            config = yaml.safe_load(file)
        logger.info("Configuration loaded successfully")
        return config
    except Exception as e:
        logger.error(f"Error loading configuration: {e}")
        return None

def load_raw_data(data_path):
    """Load raw data from the specified path."""
    try:
        logger.info(f"Loading raw data from {data_path}")
        
        # Load CSV files if they exist
        sales_file = os.path.join(data_path, "sales.csv")
        inventory_file = os.path.join(data_path, "inventory.csv")
        suppliers_file = os.path.join(data_path, "suppliers.csv")
        
        sales_data = pd.read_csv(sales_file) if os.path.exists(sales_file) else pd.DataFrame()
        inventory_data = pd.read_csv(inventory_file) if os.path.exists(inventory_file) else pd.DataFrame()
        supplier_data = pd.read_csv(suppliers_file) if os.path.exists(suppliers_file) else pd.DataFrame()
        
        logger.info(f"Loaded raw data - Sales: {len(sales_data)}, Inventory: {len(inventory_data)}, Suppliers: {len(supplier_data)}")
        
        return {
            "sales": sales_data,
            "inventory": inventory_data,
            "suppliers": supplier_data
        }
    except Exception as e:
        logger.error(f"Error loading raw data: {e}")
        return None

def load_price_data(data_path):
    """Load price, promotions, and markdown data."""
    try:
        logger.info(f"Loading price data from {data_path}")
        
        # Load price data if file exists
        price_file = os.path.join(data_path, "prices.csv")
        if os.path.exists(price_file):
            price_data = pd.read_csv(price_file)
            logger.info(f"Loaded price data with {len(price_data)} records")
            return price_data
        else:
            logger.warning(f"Price data file not found: {price_file}")
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error loading price data: {e}")
        return None

def load_store_data(data_path):
    """Load store attribute data."""
    try:
        logger.info(f"Loading store data from {data_path}")
        
        # Load store data if file exists
        store_file = os.path.join(data_path, "stores.csv")
        if os.path.exists(store_file):
            store_data = pd.read_csv(store_file)
            logger.info(f"Loaded store data with {len(store_data)} records")
            return store_data
        else:
            logger.warning(f"Store data file not found: {store_file}")
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error loading store data: {e}")
        return None

def load_product_data(data_path):
    """Load product attribute data."""
    try:
        logger.info(f"Loading product data from {data_path}")
        
        # Load product data if file exists
        product_file = os.path.join(data_path, "products.csv")
        if os.path.exists(product_file):
            product_data = pd.read_csv(product_file)
            logger.info(f"Loaded product data with {len(product_data)} records")
            return product_data
        else:
            logger.warning(f"Product data file not found: {product_file}")
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error loading product data: {e}")
        return None

def load_inventory_data(data_path):
    """Load inventory data (on hand & stockouts)."""
    try:
        logger.info(f"Loading inventory data from {data_path}")
        
        # Load inventory data if file exists
        inventory_file = os.path.join(data_path, "inventory.csv")
        if os.path.exists(inventory_file):
            inventory_data = pd.read_csv(inventory_file)
            logger.info(f"Loaded inventory data with {len(inventory_data)} records")
            return inventory_data
        else:
            logger.warning(f"Inventory data file not found: {inventory_file}")
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error loading inventory data: {e}")
        return None

def process_sales_data(sales_data):
    """Process sales data for modeling."""
    try:
        logger.info("Processing sales data")
        if sales_data is None or sales_data.empty:
            logger.warning("No sales data to process")
            return pd.DataFrame()
        
        # Convert date column
        sales_data['date'] = pd.to_datetime(sales_data['date'])
        
        # Add calendar features
        sales_data = add_calendar_features(sales_data, date_column='date')
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['hour', 'sku_id', 'store_id', 'sales_quantity', 'sales_amount', 'unit_price']
        for col in numeric_columns:
            if col in sales_data.columns:
                sales_data[col] = pd.to_numeric(sales_data[col], errors='coerce')
        
        logger.info(f"Processed sales data with {len(sales_data)} records")
        return sales_data
    except Exception as e:
        logger.error(f"Error processing sales data: {e}")
        return None

def process_price_data(price_data):
    """Process price, promotions, and markdown data."""
    try:
        logger.info("Processing price data")
        if price_data is None or price_data.empty:
            logger.warning("No price data to process")
            return pd.DataFrame()
        
        # Convert date column
        price_data['date'] = pd.to_datetime(price_data['date'])
        
        # Add calendar features
        price_data = add_calendar_features(price_data, date_column='date')
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['sku_id', 'store_id', 'regular_price', 'actual_price', 'markdown_rate']
        for col in numeric_columns:
            if col in price_data.columns:
                price_data[col] = pd.to_numeric(price_data[col], errors='coerce')
        
        # Ensure boolean column is properly typed
        if 'promotion_flag' in price_data.columns:
            price_data['promotion_flag'] = price_data['promotion_flag'].astype(bool)
        
        # Calculate additional features
        if 'regular_price' in price_data.columns and 'actual_price' in price_data.columns:
            price_data['discount_amount'] = price_data['regular_price'] - price_data['actual_price']
            price_data['discount_percentage'] = np.where(
                price_data['regular_price'] > 0,
                (price_data['discount_amount'] / price_data['regular_price']) * 100,
                0
            )
        
        logger.info(f"Processed price data with {len(price_data)} records")
        return price_data
    except Exception as e:
        logger.error(f"Error processing price data: {e}")
        return None

def process_store_data(store_data):
    """Process store attribute data."""
    try:
        logger.info("Processing store data")
        if store_data is None or store_data.empty:
            logger.warning("No store data to process")
            return pd.DataFrame()
        
        # Convert date columns
        if 'opening_date' in store_data.columns:
            store_data['opening_date'] = pd.to_datetime(store_data['opening_date'])
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['store_id', 'size_sqft', 'number_of_employees']
        for col in numeric_columns:
            if col in store_data.columns:
                store_data[col] = pd.to_numeric(store_data[col], errors='coerce')
        
        # Ensure string columns are properly typed
        string_columns = ['store_name', 'location', 'store_type', 'region', 'manager']
        for col in string_columns:
            if col in store_data.columns:
                store_data[col] = store_data[col].astype(str)
        
        logger.info(f"Processed store data with {len(store_data)} records")
        return store_data
    except Exception as e:
        logger.error(f"Error processing store data: {e}")
        return None

def process_product_data(product_data):
    """Process product attribute data."""
    try:
        logger.info("Processing product data")
        if product_data is None or product_data.empty:
            logger.warning("No product data to process")
            return pd.DataFrame()
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['sku_id', 'supplier_id', 'lead_time_days', 'weight', 'volume']
        for col in numeric_columns:
            if col in product_data.columns:
                product_data[col] = pd.to_numeric(product_data[col], errors='coerce')
        
        # Ensure string columns are properly typed
        string_columns = ['product_name', 'category', 'subcategory', 'brand', 'unit_of_measure']
        for col in string_columns:
            if col in product_data.columns:
                product_data[col] = product_data[col].astype(str)
        
        logger.info(f"Processed product data with {len(product_data)} records")
        return product_data
    except Exception as e:
        logger.error(f"Error processing product data: {e}")
        return None

def process_inventory_data(inventory_data):
    """Process inventory data for modeling."""
    try:
        logger.info("Processing inventory data")
        if inventory_data is None or inventory_data.empty:
            logger.warning("No inventory data to process")
            return pd.DataFrame()
        
        # Convert date column
        inventory_data['date'] = pd.to_datetime(inventory_data['date'])
        
        # Add calendar features
        inventory_data = add_calendar_features(inventory_data, date_column='date')
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['sku_id', 'store_id', 'inventory_on_hand', 'reorder_point', 'max_stock_level']
        for col in numeric_columns:
            if col in inventory_data.columns:
                inventory_data[col] = pd.to_numeric(inventory_data[col], errors='coerce')
        
        # Ensure boolean column is properly typed
        if 'stockout_flag' in inventory_data.columns:
            inventory_data['stockout_flag'] = inventory_data['stockout_flag'].astype(bool)
        
        # Add derived inventory metrics
        if 'inventory_on_hand' in inventory_data.columns and 'max_stock_level' in inventory_data.columns:
            inventory_data['inventory_utilization'] = np.where(
                inventory_data['max_stock_level'] > 0,
                inventory_data['inventory_on_hand'] / inventory_data['max_stock_level'],
                0
            )
        
        if 'inventory_on_hand' in inventory_data.columns and 'reorder_point' in inventory_data.columns:
            inventory_data['below_reorder_point'] = inventory_data['inventory_on_hand'] < inventory_data['reorder_point']
        
        logger.info(f"Processed inventory data with {len(inventory_data)} records")
        return inventory_data
    except Exception as e:
        logger.error(f"Error processing inventory data: {e}")
        return None

def process_supplier_data(supplier_data):
    """Process supplier data for modeling."""
    try:
        logger.info("Processing supplier data")
        if supplier_data is None or supplier_data.empty:
            logger.warning("No supplier data to process")
            return pd.DataFrame()
        
        # Ensure numeric columns are properly typed
        numeric_columns = ['supplier_id', 'lead_time_avg_days', 'reliability_score']
        for col in numeric_columns:
            if col in supplier_data.columns:
                supplier_data[col] = pd.to_numeric(supplier_data[col], errors='coerce')
        
        # Ensure string columns are properly typed
        string_columns = ['supplier_name', 'contact_person', 'region']
        for col in string_columns:
            if col in supplier_data.columns:
                supplier_data[col] = supplier_data[col].astype(str)
        
        logger.info(f"Processed supplier data with {len(supplier_data)} records")
        return supplier_data
    except Exception as e:
        logger.error(f"Error processing supplier data: {e}")
        return None

def integrate_all_data(processed_data):
    """
    Integrate all processed data sources into a unified dataset.
    
    Args:
        processed_data (dict): Dictionary of processed dataframes
        
    Returns:
        pd.DataFrame: Integrated dataset
    """
    try:
        logger.info("Integrating all data sources")
        
        # Start with sales data as the base
        if "sales" in processed_data and not processed_data["sales"].empty:
            integrated_data = processed_data["sales"].copy()
        else:
            logger.warning("No sales data available for integration")
            return pd.DataFrame()
        
        # Integrate inventory data
        if "inventory" in processed_data and not processed_data["inventory"].empty:
            # Merge on date, sku_id, and store_id
            merge_columns = ['date', 'sku_id', 'store_id']
            available_columns = [col for col in merge_columns if col in integrated_data.columns and col in processed_data["inventory"].columns]
            if available_columns:
                integrated_data = pd.merge(
                    integrated_data, 
                    processed_data["inventory"], 
                    on=available_columns, 
                    how='left',
                    suffixes=('', '_inventory')
                )
        
        # Integrate price data
        if "prices" in processed_data and not processed_data["prices"].empty:
            # Merge on date, sku_id, and store_id
            merge_columns = ['date', 'sku_id', 'store_id']
            available_columns = [col for col in merge_columns if col in integrated_data.columns and col in processed_data["prices"].columns]
            if available_columns:
                integrated_data = pd.merge(
                    integrated_data, 
                    processed_data["prices"], 
                    on=available_columns, 
                    how='left',
                    suffixes=('', '_price')
                )
        
        # Integrate external signals
        external_ingestor = ExternalDataIngestor()
        integrated_data = external_ingestor.integrate_external_signals(integrated_data, date_column='date')
        
        logger.info(f"Integrated dataset with {len(integrated_data)} records")
        return integrated_data
    except Exception as e:
        logger.error(f"Error integrating data: {e}")
        return pd.DataFrame()

def save_processed_data(processed_data, output_path):
    """Save processed data to the specified path."""
    try:
        logger.info(f"Saving processed data to {output_path}")
        # Create output directory if it doesn't exist
        os.makedirs(output_path, exist_ok=True)
        
        # Save each data type
        if "sales" in processed_data and not processed_data["sales"].empty:
            processed_data["sales"].to_csv(os.path.join(output_path, "processed_sales.csv"), index=False)
        
        if "inventory" in processed_data and not processed_data["inventory"].empty:
            processed_data["inventory"].to_csv(os.path.join(output_path, "processed_inventory.csv"), index=False)
        
        if "suppliers" in processed_data and not processed_data["suppliers"].empty:
            processed_data["suppliers"].to_csv(os.path.join(output_path, "processed_suppliers.csv"), index=False)
            
        if "prices" in processed_data and not processed_data["prices"].empty:
            processed_data["prices"].to_csv(os.path.join(output_path, "processed_prices.csv"), index=False)
            
        if "stores" in processed_data and not processed_data["stores"].empty:
            processed_data["stores"].to_csv(os.path.join(output_path, "processed_stores.csv"), index=False)
            
        if "products" in processed_data and not processed_data["products"].empty:
            processed_data["products"].to_csv(os.path.join(output_path, "processed_products.csv"), index=False)
            
        # Save integrated dataset
        if "integrated" in processed_data and not processed_data["integrated"].empty:
            processed_data["integrated"].to_csv(os.path.join(output_path, "integrated_dataset.csv"), index=False)
            
        logger.info("Processed data saved successfully")
        return True
    except Exception as e:
        logger.error(f"Error saving processed data: {e}")
        return False

def main():
    """Main data processing pipeline."""
    logger.info("Starting data processing pipeline")
    
    # Load configuration
    config = load_config()
    if not config:
        logger.error("Failed to load configuration. Exiting.")
        return
    
    # Load raw data
    raw_data = load_raw_data(config['data']['raw_data_path'])
    if not raw_data:
        logger.error("Failed to load raw data. Exiting.")
        return
    
    # Load specific data types
    price_data = load_price_data(config['data']['raw_data_path'])
    store_data = load_store_data(config['data']['raw_data_path'])
    product_data = load_product_data(config['data']['raw_data_path'])
    inventory_data = load_inventory_data(config['data']['raw_data_path'])
    
    # Process each data type
    processed_data = {}
    
    processed_data["sales"] = process_sales_data(raw_data["sales"])
    processed_data["inventory"] = process_inventory_data(inventory_data)
    processed_data["suppliers"] = process_supplier_data(raw_data["suppliers"])
    processed_data["prices"] = process_price_data(price_data)
    processed_data["stores"] = process_store_data(store_data)
    processed_data["products"] = process_product_data(product_data)
    
    # Integrate all data
    processed_data["integrated"] = integrate_all_data(processed_data)
    
    # Save processed data
    success = save_processed_data(processed_data, config['data']['processed_data_path'])
    
    if success:
        logger.info("Data processing pipeline completed successfully")
    else:
        logger.error("Data processing pipeline failed")

if __name__ == "__main__":
    main()