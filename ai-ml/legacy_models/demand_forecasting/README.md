# Demand Forecasting Model

## Overview

The demand forecasting model is a core component of the Cognitive Supply Chain Mesh (CSCM) AI/ML system. It predicts SKU-level demand across stores/regions to drive replenishment, allocation, and production planning.

## Model Architecture

The current implementation uses a Random Forest Regressor as the base model, with the following features:

1. **Time-based features**:
   - Year, month, day
   - Day of week, day of year

2. **Lag features**:
   - Sales lagged by 1, 7, 14, and 30 days

## Usage

```python
from models.demand_forecasting import DemandForecaster

# Initialize the forecaster
forecaster = DemandForecaster(model_type="random_forest")

# Train the model
forecaster.train(train_data)

# Make predictions
predictions = forecaster.predict(test_data)

# Evaluate the model
metrics = forecaster.evaluate(test_data, true_values)
```

## Data Requirements

The model expects input data with the following columns:
- `date`: Date of the observation
- `sales`: Sales volume (target variable)
- `product_id`: Identifier for the product

## Model Evaluation

The model is evaluated using the following metrics:
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)

## Future Improvements

1. Implementation of advanced time-series models (LSTM, TFT)
2. Integration of external signals (weather, events, promotions)
3. Probabilistic forecasting capabilities
4. Federated learning for cross-store model improvement

## API Reference

### DemandForecaster

#### `__init__(self, model_type="random_forest")`
Initialize the demand forecaster.

**Parameters:**
- `model_type` (str): Type of model to use for forecasting

#### `train(self, train_data, target_column='sales')`
Train the demand forecasting model.

**Parameters:**
- `train_data` (pd.DataFrame): Training data
- `target_column` (str): Name of the target column

#### `predict(self, test_data)`
Make predictions using the trained model.

**Parameters:**
- `test_data` (pd.DataFrame): Data to make predictions on

**Returns:**
- `np.array`: Predictions

#### `evaluate(self, test_data, true_values)`
Evaluate the model performance.

**Parameters:**
- `test_data` (pd.DataFrame): Test data
- `true_values` (np.array): True values

**Returns:**
- `dict`: Evaluation metrics