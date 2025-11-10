# Test Data Files

This directory contains test data files used for testing various AI/ML components.

## Files

### Inventory Optimization & Replenishment (Phase 1)

- **`inventory_demand_data.csv`**: Historical demand data with ML forecasts for testing inventory optimization models
  - Columns: date, sku_id, store_id, demand, forecast, holding_cost, shortage_cost, ordering_cost, lead_time
  - Contains 181 days of demand data for SKU 1, Store 1

- **`inventory_levels_data.csv`**: Inventory levels data for testing (s,S) policy models
  - Columns: date, sku_id, store_id, current_inventory, reorder_point, max_stock_level, order_quantity
  - Contains inventory levels over time with reorder points

- **`forecast_samples_data.csv`**: Probabilistic forecast samples for testing stochastic optimization
  - Columns: sample_id, forecast_1 through forecast_10
  - Contains 100 samples of 10-period forecasts

### Demand Forecasting & Output Metrics (Phase 4)

- **`forecast_actuals_data.csv`**: Forecast vs actual data for testing error metrics
  - Columns: date, sku_id, store_id, forecast, actual
  - Contains 90 days of forecast and actual demand data

## Usage

These test data files are used in the test suites located in:
- `tests/inventory_optimization/phase1/` - For inventory optimization tests
- `tests/phase4/output_metrics/` - For output metrics tests

## Data Generation

The test data files are generated with realistic patterns:
- Demand follows normal distribution with some variation
- Forecasts are slightly offset from actuals to simulate ML model behavior
- Inventory levels decrease over time and trigger reorders
- Forecast samples represent probabilistic forecasts from ML models

## Notes

- All dates are in YYYY-MM-DD format
- All numeric values are realistic for retail inventory scenarios
- Data is designed to test edge cases and normal operations

