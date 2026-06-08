"""
Tests for Travel Time Prediction
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

pytestmark = pytest.mark.skipif(not HAS_XGBOOST, reason="xgboost not available")

from legacy_models.routing_logistics.predictive_models.travel_time_prediction import TravelTimePredictor


class TestTravelTimePredictor:
    """Test cases for TravelTimePredictor."""
    
    def test_initialization(self):
        """Test predictor initialization."""
        predictor = TravelTimePredictor(model_type='xgboost')
        
        assert predictor.model_type == 'xgboost'
        assert predictor.is_trained == False
    
    def test_train_and_predict(self):
        """Test training and prediction."""
        predictor = TravelTimePredictor(model_type='xgboost', n_estimators=10)
        
        # Create sample data
        data = pd.DataFrame({
            'distance': [10.0, 20.0, 30.0, 40.0, 50.0],
            'hour': [8, 9, 10, 11, 12],
            'temperature': [25.0, 26.0, 27.0, 28.0, 29.0],
            'precipitation': [0.0, 0.1, 0.2, 0.0, 0.1]
        })
        
        target = pd.Series([0.2, 0.4, 0.6, 0.8, 1.0])
        
        # Train
        predictor.train(data, target)
        
        assert predictor.is_trained == True
        
        # Predict
        predictions = predictor.predict(data)
        
        assert len(predictions) == len(data)
        assert all(p >= 0 for p in predictions)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

