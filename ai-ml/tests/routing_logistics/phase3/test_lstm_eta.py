"""
Tests for LSTM ETA Model
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
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

pytestmark = pytest.mark.skipif(not HAS_TORCH, reason="PyTorch not available")

from legacy_models.routing_logistics.predictive_models.lstm_eta import LSTMETAPredictor


class TestLSTMETAPredictor:
    """Test cases for LSTMETAPredictor."""
    
    def test_initialization(self):
        """Test predictor initialization."""
        predictor = LSTMETAPredictor(input_dim=5)
        
        assert predictor.input_dim == 5
        assert predictor.is_trained == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

