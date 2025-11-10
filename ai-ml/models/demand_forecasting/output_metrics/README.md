# Phase 4: Output & Metrics Implementation

## Overview

This module implements Phase 4 of the Demand Forecasting & Demand Sensing module, providing comprehensive output generation and metrics calculation capabilities.

## Features

### 1. Point Forecast with Prediction Intervals (80%/95%)

The `PredictionIntervalGenerator` class provides methods to generate point forecasts with prediction intervals at different confidence levels (80% and 95%).

**Methods:**
- `generate_intervals_from_samples()`: Generate intervals from probabilistic forecast samples
- `generate_intervals_analytical()`: Generate intervals using analytical method (assumes normal distribution)
- `generate_intervals_bootstrap()`: Generate intervals using bootstrap method
- `generate()`: Unified interface for generating intervals
- `format_output()`: Format intervals as a DataFrame

**Example:**
```python
from models.demand_forecasting.output_metrics import PredictionIntervalGenerator

generator = PredictionIntervalGenerator()
intervals = generator.generate_intervals_from_samples(samples, confidence_levels=[0.8, 0.95])
df = generator.format_output(intervals, sku_id=1, store_id=1)
```

### 2. Nowcast (Near Real-Time Demand Signal)

The `NowcastEngine` class provides capabilities for generating near real-time demand signals (nowcasts).

**Features:**
- Configurable update frequency
- Historical baseline calculation
- Recent signal aggregation
- Confidence scoring
- Batch processing for multiple SKU-store pairs

**Example:**
```python
from models.demand_forecasting.output_metrics import NowcastEngine

engine = NowcastEngine(update_frequency_minutes=15, lookback_hours=24)
nowcast = engine.generate_nowcast(
    historical_data, recent_signals,
    sku_id=1, store_id=1
)
```

### 3. Error Metrics (MAPE, sMAPE, MAE, RMSE)

The `ErrorMetricsCalculator` class provides comprehensive error metric calculations.

**Metrics:**
- **MAE**: Mean Absolute Error
- **RMSE**: Root Mean Squared Error
- **MAPE**: Mean Absolute Percentage Error
- **sMAPE**: Symmetric Mean Absolute Percentage Error
- **MASE**: Mean Absolute Scaled Error

**Example:**
```python
from models.demand_forecasting.output_metrics import ErrorMetricsCalculator

calculator = ErrorMetricsCalculator()
metrics = calculator.calculate_all_metrics(y_true, y_pred, y_train)
```

### 4. SKU Confidence Metrics

The `SKUConfidenceMetrics` class calculates demand error and confidence metrics per SKU.

**Features:**
- Per-SKU error metrics
- Confidence scoring
- Error distribution statistics
- SKU ranking by confidence

**Example:**
```python
from models.demand_forecasting.output_metrics import SKUConfidenceMetrics

sku_metrics = SKUConfidenceMetrics()
metrics = sku_metrics.calculate_sku_metrics(forecasts, actuals, sku_id=1)
all_metrics = sku_metrics.calculate_all_sku_metrics(forecasts, actuals)
```

### 5. Probabilistic Metrics (CRPS, Pinball Loss)

The `ProbabilisticMetricsCalculator` class provides metrics for probabilistic forecasts.

**Metrics:**
- **CRPS**: Continuous Ranked Probability Score
- **Pinball Loss**: For quantile regression
- **Coverage**: Percentage of true values within prediction intervals
- **Interval Width**: Average width of prediction intervals

**Example:**
```python
from models.demand_forecasting.output_metrics import ProbabilisticMetricsCalculator

calculator = ProbabilisticMetricsCalculator()
metrics = calculator.calculate_all_probabilistic_metrics(
    y_true, y_pred_samples, y_pred_quantiles, quantile_levels
)
```

### 6. Service-Level Impact Metrics

The `ServiceLevelMetricsCalculator` class calculates service-level impact metrics.

**Metrics:**
- **Stockouts Prevented**: Number of stockouts prevented by accurate forecasting
- **Fill-Rate Improvement**: Improvement in fill rate from forecasting
- **Overall Service Level**: Comprehensive service level score

**Example:**
```python
from models.demand_forecasting.output_metrics import ServiceLevelMetricsCalculator

calculator = ServiceLevelMetricsCalculator(target_service_level=0.95)
metrics = calculator.calculate_service_level_metrics(
    forecasts, actuals, inventory_levels, orders
)
```

### 7. Unified Interface

The `DemandForecastOutputMetrics` class provides a unified interface for all Phase 4 capabilities.

**Example:**
```python
from models.demand_forecasting.output_metrics import DemandForecastOutputMetrics

interface = DemandForecastOutputMetrics()

# Generate forecast with intervals
df = interface.generate_forecast_with_intervals(
    model=model, samples=samples, sku_id=1, store_id=1
)

# Generate nowcast
nowcast = interface.generate_nowcast(
    historical_data, recent_signals, sku_id=1, store_id=1
)

# Calculate error metrics
metrics = interface.calculate_error_metrics(y_true, y_pred)

# Generate comprehensive report
report = interface.generate_comprehensive_report(
    forecasts, actuals, inventory_levels, orders
)
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
pytest tests/phase4/output_metrics/ -v
```

## File Structure

```
output_metrics/
├── __init__.py
├── README.md
├── prediction_intervals.py    # Prediction interval generation
├── nowcast.py                  # Nowcast capabilities
├── error_metrics.py            # Error metrics (MAPE, sMAPE, MAE, RMSE)
├── probabilistic_metrics.py    # Probabilistic metrics (CRPS, pinball loss)
├── service_level_metrics.py   # Service-level impact metrics
└── unified_interface.py       # Unified interface for all capabilities
```

## Dependencies

- pandas
- numpy
- scipy
- datetime

## Usage Examples

See the test files in `tests/phase4/output_metrics/` for comprehensive usage examples.

