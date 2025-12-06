"""
Unit tests for model wrapper classes.
"""

import unittest
import numpy as np
import pandas as pd
from unittest.mock import Mock, patch
import sys
import os

# Add the api directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.model_wrappers import (
    DemandForecastingModel,
    InventoryOptimizationModel,
    RoutingOptimizationModel,
    SupplierRiskModel,
    AnomalyDetectionModel,
    MultiAgentCoordinationModel,
    DigitalTwinModel,
    ExplainabilityModel,
    NLPModel,
    KnowledgeGraphModel,
    CausalInferenceModel,
    ComputerVisionModel,
    CustomerDemandModel,
    ContinualLearningModel,
    UncertaintyQuantificationModel,
    ModelMonitoringModel
)


class TestDemandForecastingModel(unittest.TestCase):
    """Test cases for DemandForecastingModel."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = DemandForecastingModel()
    
    def test_init(self):
        """Test initialization."""
        self.assertIsInstance(self.model, DemandForecastingModel)
        self.assertFalse(self.model.is_trained)
    
    @patch('models.model_wrappers.DemandForecaster')
    def test_train(self, mock_forecaster):
        """Test training."""
        # Create mock data
        data = pd.DataFrame({
            'date': ['2023-01-01', '2023-01-02'],
            'sales': [100, 110]
        })
        
        # Call train method
        self.model.train(data)
        
        # Verify the model is trained
        self.assertTrue(self.model.is_trained)
    
    @patch('models.model_wrappers.DemandForecaster')
    def test_predict_without_training(self, mock_forecaster):
        """Test prediction without training."""
        # Create mock data
        data = pd.DataFrame({
            'date': ['2023-01-01', '2023-01-02'],
            'sales': [100, 110]
        })
        
        # Verify exception is raised
        with self.assertRaises(ValueError):
            self.model.predict(data)
    
    @patch('models.model_wrappers.DemandForecaster')
    def test_evaluate(self, mock_forecaster):
        """Test evaluation."""
        # Set up mock
        mock_instance = Mock()
        mock_instance.evaluate.return_value = {'mae': 5.0, 'rmse': 7.0}
        mock_instance.is_trained = True
        mock_instance.predict.return_value = np.array([100, 110])
        mock_forecaster.return_value = mock_instance
        
        # Create mock data
        data = pd.DataFrame({
            'date': ['2023-01-01', '2023-01-02'],
            'sales': [100, 110]
        })
        
        # Manually set the model instance
        self.model.model = mock_instance
        self.model.is_trained = True
        
        # Call evaluate method
        result = self.model.evaluate(data, np.array([100, 110]))
        
        # Verify result
        self.assertIn('mae', result)
        self.assertIn('rmse', result)


class TestInventoryOptimizationModel(unittest.TestCase):
    """Test cases for InventoryOptimizationModel."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = InventoryOptimizationModel(holding_cost=1.0, shortage_cost=2.0)
    
    def test_init(self):
        """Test initialization."""
        self.assertIsInstance(self.model, InventoryOptimizationModel)
    
    def test_fit(self):
        """Test fitting."""
        # Create mock data
        historical_demand = np.array([100, 110, 90, 105])
        
        # Call fit method
        self.model.fit(historical_demand)
        
        # Verify the model is fitted
        self.assertTrue(self.model.model.is_fitted)
    
    def test_optimize_without_fitting(self):
        """Test optimization without fitting."""
        # Verify exception is raised
        with self.assertRaises(ValueError):
            self.model.optimize()


class TestAnomalyDetectionModel(unittest.TestCase):
    """Test cases for AnomalyDetectionModel."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.model = AnomalyDetectionModel(contamination=0.1)
    
    def test_init(self):
        """Test initialization."""
        self.assertIsInstance(self.model, AnomalyDetectionModel)
        self.assertFalse(self.model.is_fitted)
    
    def test_fit(self):
        """Test fitting."""
        # Create mock data
        X = np.array([[1, 2], [3, 4], [5, 6]])
        
        # Call fit method
        self.model.fit(X)
        
        # Verify the model is fitted
        self.assertTrue(self.model.is_fitted)
    
    def test_detect_anomalies_without_fitting(self):
        """Test anomaly detection without fitting."""
        # Create mock data
        X = np.array([[1, 2], [3, 4], [5, 6]])
        
        # Verify exception is raised
        with self.assertRaises(ValueError):
            self.model.detect_anomalies(X)


class TestPlaceholderModels(unittest.TestCase):
    """Test cases for placeholder models."""
    
    def test_customer_demand_model(self):
        """Test CustomerDemandModel placeholder."""
        model = CustomerDemandModel()
        with self.assertRaises(NotImplementedError):
            model.analyze(None)
    
    def test_continual_learning_model(self):
        """Test ContinualLearningModel placeholder."""
        model = ContinualLearningModel()
        with self.assertRaises(NotImplementedError):
            model.update(None)
    
    def test_uncertainty_quantification_model(self):
        """Test UncertaintyQuantificationModel placeholder."""
        model = UncertaintyQuantificationModel()
        with self.assertRaises(NotImplementedError):
            model.quantify(None)
    
    def test_model_monitoring_model(self):
        """Test ModelMonitoringModel placeholder."""
        model = ModelMonitoringModel()
        with self.assertRaises(NotImplementedError):
            model.monitor(None)


if __name__ == '__main__':
    unittest.main()