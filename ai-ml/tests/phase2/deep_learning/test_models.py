"""
Test suite for deep learning demand forecasting models
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.deep_learning.models import LSTMModel, GRUModel, Seq2SeqModel, DeepLearningForecaster

def test_lstm_model_initialization():
    """Test initialization of LSTMModel."""
    model = LSTMModel(input_size=5, hidden_size=32, num_layers=2, output_size=1)
    assert model.input_size == 5
    assert model.hidden_size == 32
    assert model.num_layers == 2
    assert model.output_size == 1

def test_gru_model_initialization():
    """Test initialization of GRUModel."""
    model = GRUModel(input_size=5, hidden_size=32, num_layers=2, output_size=1)
    assert model.input_size == 5
    assert model.hidden_size == 32
    assert model.num_layers == 2
    assert model.output_size == 1

def test_seq2seq_model_initialization():
    """Test initialization of Seq2SeqModel."""
    model = Seq2SeqModel(input_size=5, hidden_size=32, num_layers=2, output_size=1, sequence_length=10)
    assert model.input_size == 5
    assert model.hidden_size == 32
    assert model.num_layers == 2
    assert model.output_size == 1
    assert model.sequence_length == 10

def test_lstm_model_forward():
    """Test forward pass of LSTMModel."""
    # Create sample data
    batch_size = 32
    sequence_length = 10
    input_size = 5
    X = np.random.randn(batch_size, sequence_length, input_size)
    
    # Create model
    model = LSTMModel(input_size=input_size, hidden_size=32, num_layers=2, output_size=1)
    
    # Convert to tensor
    import torch
    X_tensor = torch.FloatTensor(X)
    
    # Forward pass
    output = model(X_tensor)
    assert output.shape == (batch_size, 1)

def test_gru_model_forward():
    """Test forward pass of GRUModel."""
    # Create sample data
    batch_size = 32
    sequence_length = 10
    input_size = 5
    X = np.random.randn(batch_size, sequence_length, input_size)
    
    # Create model
    model = GRUModel(input_size=input_size, hidden_size=32, num_layers=2, output_size=1)
    
    # Convert to tensor
    import torch
    X_tensor = torch.FloatTensor(X)
    
    # Forward pass
    output = model(X_tensor)
    assert output.shape == (batch_size, 1)

def test_seq2seq_model_forward():
    """Test forward pass of Seq2SeqModel."""
    # Create sample data
    batch_size = 32
    sequence_length = 10
    input_size = 5
    X = np.random.randn(batch_size, sequence_length, input_size)
    
    # Create model
    model = Seq2SeqModel(input_size=input_size, hidden_size=32, num_layers=2, output_size=1, sequence_length=sequence_length)
    
    # Convert to tensor
    import torch
    X_tensor = torch.FloatTensor(X)
    
    # Forward pass
    output = model(X_tensor)
    assert output.shape == (batch_size, 1)

def test_deep_learning_forecaster_initialization():
    """Test initialization of DeepLearningForecaster."""
    # Test LSTM forecaster
    lstm_forecaster = DeepLearningForecaster(model_type='lstm', input_size=5, hidden_size=32)
    assert lstm_forecaster.model_type == 'lstm'
    assert isinstance(lstm_forecaster.model, LSTMModel)
    assert lstm_forecaster.is_fitted == False
    
    # Test GRU forecaster
    gru_forecaster = DeepLearningForecaster(model_type='gru', input_size=5, hidden_size=32)
    assert gru_forecaster.model_type == 'gru'
    assert isinstance(gru_forecaster.model, GRUModel)
    assert gru_forecaster.is_fitted == False
    
    # Test Seq2Seq forecaster
    seq2seq_forecaster = DeepLearningForecaster(model_type='seq2seq', input_size=5, hidden_size=32, sequence_length=10)
    assert seq2seq_forecaster.model_type == 'seq2seq'
    assert isinstance(seq2seq_forecaster.model, Seq2SeqModel)
    assert seq2seq_forecaster.is_fitted == False

def test_deep_learning_forecaster_fit_predict():
    """Test fitting and prediction of DeepLearningForecaster."""
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
    
    # Split data
    train_size = int(0.8 * len(sequences))
    X_train, X_test = sequences[:train_size], sequences[train_size:]
    y_train, y_test = targets[:train_size], targets[train_size:]
    
    # Reshape data to be 3D: (batch_size, sequence_length, input_size)
    # For univariate time series, input_size = 1
    X_train = X_train.reshape(X_train.shape[0], X_train.shape[1], 1)
    X_test = X_test.reshape(X_test.shape[0], X_test.shape[1], 1)
    
    # Test LSTM forecaster
    lstm_forecaster = DeepLearningForecaster(model_type='lstm', input_size=1, hidden_size=16, num_layers=1)
    lstm_forecaster.fit(X_train, y_train, epochs=10, batch_size=16)
    lstm_predictions = lstm_forecaster.predict(X_test)
    assert len(lstm_predictions) == len(X_test)
    assert lstm_forecaster.is_fitted == True
    
    # Test GRU forecaster
    gru_forecaster = DeepLearningForecaster(model_type='gru', input_size=1, hidden_size=16, num_layers=1)
    gru_forecaster.fit(X_train, y_train, epochs=10, batch_size=16)
    gru_predictions = gru_forecaster.predict(X_test)
    assert len(gru_predictions) == len(X_test)
    assert gru_forecaster.is_fitted == True

def test_deep_learning_forecaster_predict_before_fit():
    """Test that predict raises error if model is not fitted."""
    # Create sample data
    np.random.seed(42)
    X = np.random.randn(10, 5)
    
    # Create forecaster (without fitting)
    forecaster = DeepLearningForecaster(model_type='lstm', input_size=5)
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(X)

if __name__ == "__main__":
    pytest.main([__file__])