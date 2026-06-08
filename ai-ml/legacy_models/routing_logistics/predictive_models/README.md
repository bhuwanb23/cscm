# Predictive Models for Routing & Logistics

## Overview

This module implements predictive models for routing and logistics, including travel time prediction, ETA estimation, and routing predictions.

## Phase 3: Predictive Models ✅

### Components

1. **Gradient-Boosted Models for Travel-Time Prediction** (`travel_time_prediction.py`)
   - XGBoost, LightGBM, and CatBoost support
   - Feature extraction from routing data
   - Travel time prediction with uncertainty estimation
   - Feature importance analysis

2. **LSTM-based ETA Models** (`lstm_eta.py`)
   - LSTM architecture for sequence-based ETA prediction
   - Sequence preparation and training
   - ETA prediction from historical sequences
   - Time-series modeling for arrival times

3. **Small Transformers for Routing Predictions** (`transformer_routing.py`)
   - Transformer encoder architecture
   - Positional encoding for sequences
   - Multi-head attention for routing decisions
   - Small model size for edge deployment

## Usage Examples

### Travel Time Prediction

```python
from models.routing_logistics.predictive_models import TravelTimePredictor
import pandas as pd

# Create predictor
predictor = TravelTimePredictor(model_type='xgboost', n_estimators=100)

# Prepare data
data = pd.DataFrame({
    'distance': [10.0, 20.0, 30.0],
    'hour': [8, 9, 10],
    'temperature': [25.0, 26.0, 27.0],
    'precipitation': [0.0, 0.1, 0.2]
})

target = pd.Series([0.2, 0.4, 0.6])

# Train
predictor.train(data, target)

# Predict
predictions = predictor.predict(data)
print(f"Predictions: {predictions}")
```

### LSTM ETA Model

```python
from models.routing_logistics.predictive_models import LSTMETAPredictor
import pandas as pd

# Create predictor
predictor = LSTMETAPredictor(input_dim=5, hidden_dim=64)

# Prepare data with sequences
data = pd.DataFrame({
    'feature1': range(100),
    'feature2': range(100, 200),
    'feature3': range(200, 300),
    'feature4': range(300, 400),
    'feature5': range(400, 500),
    'eta': range(0, 100)
})

# Train
predictor.train(data, sequence_length=10, target_column='eta', epochs=50)

# Predict
sequence = data.iloc[:10, :-1].values
eta = predictor.predict(sequence)
print(f"Predicted ETA: {eta}")
```

### Transformer Routing Predictor

```python
from models.routing_logistics.predictive_models import TransformerRoutingPredictor
import numpy as np

# Create predictor
predictor = TransformerRoutingPredictor(input_dim=5, d_model=64)

# Prepare sequences
sequences = np.random.randn(100, 10, 5)  # [num_samples, seq_length, features]
targets = np.random.randn(100)

# Train
predictor.train(sequences, targets, epochs=50)

# Predict
sequence = sequences[0]
prediction = predictor.predict(sequence)
print(f"Prediction: {prediction}")
```

## Dependencies

- xgboost, lightgbm, or catboost (for gradient-boosted models)
- torch (for LSTM and Transformer models)
- numpy
- pandas

## Notes

- Gradient-boosted models are fast and interpretable
- LSTM models capture temporal dependencies
- Transformer models use attention mechanisms
- All models support save/load for deployment
- Tests will skip if required libraries are not available

