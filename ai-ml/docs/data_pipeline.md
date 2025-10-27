# Data Pipeline Documentation

## Overview

This document describes the data pipeline implementation for the Cognitive Supply Chain Mesh (CSCM) AI/ML system. The pipeline handles ingestion, processing, and integration of various data sources required for demand forecasting and supply chain optimization.

## Pipeline Architecture

The data pipeline follows a modular architecture with the following components:

1. **Data Ingestion Layer** - Loads raw data from various sources
2. **Data Processing Layer** - Transforms and enriches data
3. **Feature Engineering Layer** - Creates derived features and calendar attributes
4. **Integration Layer** - Combines multiple data sources
5. **Storage Layer** - Saves processed data for model training

## Data Sources

### 1. Sales Data
- **Format**: CSV files with date, hour, SKU, store, and sales information
- **Granularity**: Hourly sales data at SKU-store level
- **Processing**: Addition of calendar features, data type validation

### 2. Price Data
- **Format**: CSV files with pricing, promotions, and markdown information
- **Features**: Regular price, actual price, promotion flags, markdown rates
- **Processing**: Discount calculation, data type validation

### 3. Store Attributes
- **Format**: CSV files with store characteristics
- **Attributes**: Store name, location, type, size, opening date
- **Processing**: Date conversion, data type validation

### 4. Product Attributes
- **Format**: CSV files with product characteristics
- **Attributes**: Product name, category, brand, supplier information
- **Processing**: Data type validation

### 5. Inventory Data
- **Format**: CSV files with stock levels and reorder information
- **Attributes**: On-hand inventory, reorder points, stockout flags
- **Processing**: Utilization metrics, data type validation

### 6. External Signals
- **Weather Data**: Temperature, humidity, precipitation
- **Event Data**: Promotions, holidays, special events
- **Macroeconomic Data**: GDP, unemployment, inflation rates

## Data Models

### SalesDataModel
Validates and transforms SKU-store-day/hour sales data with the following schema:
- `date` (datetime): Transaction date
- `hour` (int): Hour of transaction (0-23)
- `sku_id` (int): Product identifier
- `store_id` (int): Store identifier
- `sales_quantity` (int): Number of units sold
- `sales_amount` (float): Total sales value
- `unit_price` (float): Price per unit

### PriceDataModel
Validates price, promotions, and markdown data:
- `date` (datetime): Price effective date
- `sku_id` (int): Product identifier
- `store_id` (int): Store identifier
- `regular_price` (float): Standard product price
- `actual_price` (float): Actual selling price
- `promotion_flag` (bool): Whether product is on promotion
- `markdown_rate` (float): Discount percentage (0-1)

### StoreAttributeModel
Validates store characteristics:
- `store_id` (int): Store identifier
- `store_name` (str): Store name
- `location` (str): Store location
- `store_type` (str): Type of store
- `size_sqft` (int): Store size in square feet
- `opening_date` (datetime): Store opening date

### ProductAttributeModel
Validates product characteristics:
- `sku_id` (int): Product identifier
- `product_name` (str): Product name
- `category` (str): Product category
- `subcategory` (str): Product subcategory
- `brand` (str): Product brand
- `supplier_id` (int): Supplier identifier
- `lead_time_days` (int): Supplier lead time

### InventoryDataModel
Validates inventory data:
- `date` (datetime): Inventory date
- `sku_id` (int): Product identifier
- `store_id` (int): Store identifier
- `inventory_on_hand` (int): Current stock level
- `stockout_flag` (bool): Whether product is out of stock
- `reorder_point` (int): Minimum stock threshold
- `max_stock_level` (int): Maximum stock capacity

## Processing Pipeline

### 1. Data Ingestion
The pipeline loads data from the `data/raw` directory:
```python
raw_data = load_raw_data("../data/raw")
```

### 2. Data Processing
Each data type is processed with specific transformations:
```python
processed_sales = process_sales_data(raw_data["sales"])
processed_inventory = process_inventory_data(raw_data["inventory"])
```

### 3. Feature Engineering
Calendar features and derived metrics are added:
- Year, month, day, weekday
- Weekend and holiday flags
- Inventory utilization metrics
- Discount calculations

### 4. Data Integration
All processed data sources are combined into a unified dataset:
```python
integrated_data = integrate_all_data(processed_data)
```

### 5. Data Storage
Processed data is saved to the `data/processed` directory:
```python
save_processed_data(processed_data, "../data/processed")
```

## External Signal Integration

The pipeline integrates external signals to enhance forecasting accuracy:

### Weather Data
- Temperature, humidity, precipitation
- Weather condition categorization (sunny, rainy, snowy)

### Event Data
- Promotion events and their impact scores
- Holiday detection and classification
- Special event attendance predictions

### Macroeconomic Data
- GDP growth rates
- Unemployment statistics
- Inflation indices
- Consumer confidence metrics

## Testing

The pipeline includes comprehensive tests for all components:
- Data model validation
- Processing function tests
- Integration tests
- Edge case handling

Run tests with:
```bash
python -m pytest tests/phase1/
```

## Usage

To run the complete data processing pipeline:
```bash
python scripts/data_processing.py
```

## Configuration

The pipeline is configured through `config/project_config.yaml`:
```yaml
data:
  raw_data_path: "../data/raw"
  processed_data_path: "../data/processed"
```

## Future Enhancements

1. **Real-time Data Ingestion**: Stream processing for live data feeds
2. **Advanced Feature Engineering**: Machine learning-based feature creation
3. **Data Quality Monitoring**: Automated anomaly detection in data sources
4. **Scalability Improvements**: Distributed processing for large datasets