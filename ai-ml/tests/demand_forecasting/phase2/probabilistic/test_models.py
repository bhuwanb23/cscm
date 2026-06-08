"""
Test suite for probabilistic demand forecasting models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.probabilistic.models import MQRNNModel, ProbabilisticForecaster

def test_mqrnn_model_initialization():
    """Test initialization of MQRNNModel."""
    model = MQRNNModel(input_size=5, hidden_size=32, num_layers=2, output_size=1, sequence_length=10, 
                      quantiles=[0.1, 0.5, 0.9])
    assert model.input_size == 5
    assert model.hidden_size == 32
    assert model.num_layers == 2
    assert model.output_size == 1
    assert model.sequence_length == 10
    assert model.quantiles == [0.1, 0.5, 0.9]

def test_mqrnn_model_forward():
    """Test forward pass of MQRNNModel."""
    # Create sample data
    batch_size = 32
    sequence_length = 10
    input_size = 5
    X = np.random.randn(batch_size, sequence_length, input_size)
    
    # Create model
    model = MQRNNModel(input_size=input_size, hidden_size=32, num_layers=2, output_size=1, 
                      sequence_length=sequence_length, quantiles=[0.1, 0.5, 0.9])
    
    # Convert to tensor
    import torch
    X_tensor = torch.FloatTensor(X)
    
    # Forward pass
    output = model(X_tensor)
    assert output.shape == (batch_size, 3, 1)  # 3 quantiles

def test_probabilistic_forecaster_initialization():
    """Test initialization of ProbabilisticForecaster."""
    # Test MQRNN forecaster
    mqrnn_forecaster = ProbabilisticForecaster(model_type='mqrnn', input_size=5, hidden_size=32, 
                                              quantiles=[0.1, 0.5, 0.9])
    assert mqrnn_forecaster.model_type == 'mqrnn'
    assert isinstance(mqrnn_forecaster.model, MQRNNModel)
    assert mqrnn_forecaster.is_fitted == False

def test_probabilistic_forecaster_fit_predict():
    """Test fitting and prediction of ProbabilisticForecaster."""
    # Create sample time series data
    np.random.seed(42)
    n_samples = 200
    # Create a time series with trend and seasonality
    time = np.arange(n_samples)
    trend = 0.02 * time
    seasonal = 10 * np.sin(2 * np.pi * time / 50)  # Seasonal component with period 50
    noise = np.random.normal(0, 1, n_samples)
    data = trend + seasonal + noise
    
    # Prepare data for training (univariate time series)
    sequence_length = 10
    sequences = []
    targets = []
    
    for i in range(len(data) - sequence_length):
        sequences.append(data[i:i+sequence_length])
        targets.append(data[i+sequence_length])
        
    sequences = np.array(sequences)
    targets = np.array(targets)
    
    # Reshape data to be 3D: (batch_size, sequence_length, input_size)
    # For univariate time series, input_size = 1
    sequences = sequences.reshape(sequences.shape[0], sequences.shape[1], 1)
    
    # Split data
    train_size = int(0.8 * len(sequences))
    X_train, X_test = sequences[:train_size], sequences[train_size:]
    y_train, y_test = targets[:train_size], targets[train_size:]
    
    # Test MQRNN forecaster
    mqrnn_forecaster = ProbabilisticForecaster(model_type='mqrnn', input_size=1, hidden_size=16, num_layers=1,
                                              quantiles=[0.1, 0.5, 0.9])
    mqrnn_forecaster.fit(X_train, y_train, epochs=10, batch_size=16)
    mqrnn_predictions = mqrnn_forecaster.predict(X_test)
    assert mqrnn_predictions.shape[0] == len(X_test)  # batch size
    assert mqrnn_predictions.shape[1] == 3  # 3 quantiles
    assert mqrnn_predictions.shape[2] == 1  # 1 output
    assert mqrnn_forecaster.is_fitted == True

def test_probabilistic_forecaster_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    # Create sample data
    np.random.seed(42)
    X = np.random.randn(10, 5)
    
    # Create forecaster (without fitting)
    forecaster = ProbabilisticForecaster(model_type='mqrnn', input_size=5)
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(X)

if __name__ == "__main__":
    pytest.main([__file__])