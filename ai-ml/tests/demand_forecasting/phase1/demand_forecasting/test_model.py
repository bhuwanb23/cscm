"""
Test suite for demand forecasting model
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.model import DemandForecaster

def test_demand_forecaster_initialization():
    """Test initialization of DemandForecaster."""
    forecaster = DemandForecaster()
    assert forecaster.model_type == "random_forest"
    assert forecaster.model is None
    assert forecaster.is_trained == False

def test_demand_forecaster_train():
    """Test training of DemandForecaster."""
    # Create sample data with string dates
    dates = pd.date_range('2023-01-01', periods=50)
    sales = np.random.randint(50, 200, 50)
    
    train_data = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),  # Convert to string format
        'sales': sales,
        'product_id': 1
    })
    
    # Create and train model
    forecaster = DemandForecaster()
    forecaster.train(train_data)
    
    assert forecaster.is_trained == True
    assert forecaster.model is not None

def test_demand_forecaster_predict():
    """Test prediction of DemandForecaster."""
    # Create sample data with string dates (larger dataset for lag features)
    dates = pd.date_range('2023-01-01', periods=100)
    sales = np.random.randint(50, 200, 100)
    
    data = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),  # Convert to string format
        'sales': sales,
        'product_id': 1
    })
    
    # Split data
    train_data = data.iloc[:80]
    test_data = data.iloc[80:]
    
    # Create and train model
    forecaster = DemandForecaster()
    forecaster.train(train_data)
    
    # Make predictions
    predictions = forecaster.predict(test_data)
    
    assert len(predictions) > 0
    assert isinstance(predictions, np.ndarray)

def test_demand_forecaster_evaluate():
    """Test evaluation of DemandForecaster."""
    # Create sample data with string dates (larger dataset for lag features)
    dates = pd.date_range('2023-01-01', periods=100)
    sales = np.random.randint(50, 200, 100)
    
    data = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),  # Convert to string format
        'sales': sales,
        'product_id': 1
    })
    
    # Split data
    train_data = data.iloc[:80]
    test_data = data.iloc[80:]
    
    # Create and train model
    forecaster = DemandForecaster()
    forecaster.train(train_data)
    
    # Evaluate model
    true_values = test_data['sales'].values
    metrics = forecaster.evaluate(test_data, true_values)
    
    assert 'mae' in metrics
    assert 'rmse' in metrics
    assert metrics['mae'] >= 0
    assert metrics['rmse'] >= 0

def test_demand_forecaster_predict_before_train():
    """Test that predict raises error if model is not trained."""
    # Create sample data with string dates
    dates = pd.date_range('2023-01-01', periods=10)
    sales = np.random.randint(50, 200, 10)
    
    test_data = pd.DataFrame({
        'date': dates.strftime('%Y-%m-%d'),  # Convert to string format
        'sales': sales,
        'product_id': 1
    })
    
    # Create model (without training)
    forecaster = DemandForecaster()
    
    # Try to predict (should raise error)
    with pytest.raises(ValueError):
        forecaster.predict(test_data)

if __name__ == "__main__":
    pytest.main([__file__])