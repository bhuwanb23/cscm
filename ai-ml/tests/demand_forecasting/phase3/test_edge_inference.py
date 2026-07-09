"""
Test suite for the edge inference system
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta
import tempfile
import shutil
import pickle

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.edge_inference.models import EdgeModelOptimizer, EdgeInferenceEngine, EdgeInferenceAPI
from legacy_models.demand_forecasting.statistical.models import ETSModel

def test_edge_model_optimizer():
    """Test edge model optimizer functionality."""
    # Create a simple model for testing
    model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
    
    # Create optimizer
    optimizer = EdgeModelOptimizer('ets')
    
    # Test optimization
    optimized_model = optimizer.optimize_model(model)
    assert optimized_model is not None
    
    # Test model size estimation
    size = optimizer.get_model_size()
    assert size > 0

def test_edge_inference_engine_initialization():
    """Test edge inference engine initialization."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'test_model.pkl')
        
        model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        # Fit the model with some dummy data
        dummy_data = pd.Series(np.random.normal(100, 20, 30))
        model.fit(dummy_data)
        
        # Save model to temporary file
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Create engine
        engine = EdgeInferenceEngine('ets', model_path)
        
        # Check that model is loaded
        assert engine.model is not None
        assert engine.model_type == 'ets'

def test_edge_inference_engine_initialization_offline():
    """Test edge inference engine initialization in offline mode."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'nonexistent_model.pkl')
        
        # Create engine with offline mode enabled but without a valid model file
        engine = EdgeInferenceEngine('ets', model_path, enable_offline=True)
        
        # Check that model is not loaded but engine is created
        assert engine.model is None
        assert engine.model_type == 'ets'

def test_edge_inference_engine_prediction():
    """Test edge inference engine prediction functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'test_model.pkl')
        
        model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        # Fit the model with some dummy data
        dummy_data = pd.Series(np.random.normal(100, 20, 30))
        model.fit(dummy_data)
        
        # Save model to temporary file
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Create engine
        engine = EdgeInferenceEngine('ets', model_path)
        
        # Create test data
        test_data = pd.DataFrame({
            'price': [10, 11, 12],
            'promotion': [0, 1, 0],
            'weekday': [1, 2, 3],
        })
        
        # Make prediction
        result = engine.predict(test_data)
        
        # Check result structure
        assert 'predictions' in result
        assert 'model_type' in result
        assert 'timestamp' in result
        assert 'latency_ms' in result
        assert len(result['predictions']) > 0

def test_edge_inference_engine_caching():
    """Test edge inference engine caching functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'test_model.pkl')
        
        model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        # Fit the model with some dummy data
        dummy_data = pd.Series(np.random.normal(100, 20, 30))
        model.fit(dummy_data)
        
        # Save model to temporary file
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Create engine
        engine = EdgeInferenceEngine('ets', model_path, cache_size=5)
        
        # Create test data
        test_data = pd.DataFrame({
            'price': [10, 11, 12],
            'promotion': [0, 1, 0],
            'weekday': [1, 2, 3],
        })
        
        # Make prediction with request ID
        request_id = "test_request_1"
        result1 = engine.predict(test_data, request_id)
        
        # Make the same prediction again (should hit cache)
        result2 = engine.predict(test_data, request_id)
        
        # Results should be the same
        assert result1['predictions'] == result2['predictions']
        
        # Check cache size
        status = engine.get_status()
        assert status['cache_size'] > 0

def test_edge_inference_engine_status():
    """Test edge inference engine status functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'test_model.pkl')
        
        model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        # Fit the model with some dummy data
        dummy_data = pd.Series(np.random.normal(100, 20, 30))
        model.fit(dummy_data)
        
        # Save model to temporary file
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Create engine
        engine = EdgeInferenceEngine('ets', model_path)
        
        # Get status
        status = engine.get_status()
        
        # Check status fields
        assert 'model_type' in status
        assert 'model_loaded' in status
        assert 'cache_size' in status
        assert 'is_connected' in status
        assert 'offline_buffer_size' in status

def test_edge_inference_api():
    """Test edge inference API functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'test_model.pkl')
        
        model = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        # Fit the model with some dummy data
        dummy_data = pd.Series(np.random.normal(100, 20, 30))
        model.fit(dummy_data)
        
        # Save model to temporary file
        with open(model_path, 'wb') as f:
            pickle.dump(model, f)
        
        # Create API
        api = EdgeInferenceAPI('ets', model_path)
        
        # Make prediction
        features = {
            'price': 10,
            'promotion': 0,
            'weekday': 1,
        }
        
        result = api.predict(features)
        
        # Check result structure
        assert 'predictions' in result
        assert len(result['predictions']) > 0
        
        # Get status
        status = api.get_status()
        assert 'model_type' in status
        assert status['model_loaded'] == True

def test_edge_inference_engine_offline_mode():
    """Test edge inference engine offline mode functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path = os.path.join(temp_dir, 'nonexistent_model.pkl')
        
        # Create engine with offline mode enabled but without a valid model file
        engine = EdgeInferenceEngine('ets', model_path, enable_offline=True)
        
        # Create test data
        test_data = pd.DataFrame({
            'price': [10, 11, 12],
            'promotion': [0, 1, 0],
            'weekday': [1, 2, 3],
        })
        
        # Make prediction (should fall back to offline mode)
        result = engine.predict(test_data)
        
        # Check that offline mode was used
        assert result.get('offline_mode', False) == True

def test_edge_inference_engine_model_update():
    """Test edge inference engine model update functionality."""
    # Create a temporary directory for model files
    with tempfile.TemporaryDirectory() as temp_dir:
        model_path1 = os.path.join(temp_dir, 'test_model1.pkl')
        model_path2 = os.path.join(temp_dir, 'test_model2.pkl')
        
        # Create first model
        model1 = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        dummy_data1 = pd.Series(np.random.normal(100, 20, 30))
        model1.fit(dummy_data1)
        
        # Create second model
        model2 = ETSModel(trend='add', seasonal='add', seasonal_periods=7)
        dummy_data2 = pd.Series(np.random.normal(120, 25, 30))
        model2.fit(dummy_data2)
        
        # Save models to temporary files
        with open(model_path1, 'wb') as f:
            pickle.dump(model1, f)
        with open(model_path2, 'wb') as f:
            pickle.dump(model2, f)
        
        # Create engine with first model
        engine = EdgeInferenceEngine('ets', model_path1)
        
        # Check initial model
        assert engine.model_path == model_path1
        
        # Update model
        engine.update_model(model_path2)
        
        # Check that model was updated
        assert engine.model_path == model_path2

if __name__ == "__main__":
    pytest.main([__file__])