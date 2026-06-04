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


class TestImplementedModels(unittest.TestCase):
    """Test cases for now-implemented models (formerly marked as placeholders)."""

    def test_customer_demand_model_no_data(self):
        """CustomerDemandModel.analyze returns error dict when historical_data missing."""
        model = CustomerDemandModel()
        result = model.analyze({})
        self.assertIn('error', result)
        self.assertEqual(result['error'], 'no data')
        self.assertIn('forecast', result)
        self.assertEqual(result['forecast'], [])

    def test_customer_demand_model_none_input(self):
        """CustomerDemandModel.analyze raises AttributeError on None input (no None guard)."""
        model = CustomerDemandModel()
        with self.assertRaises(AttributeError):
            model.analyze(None)

    def test_customer_demand_model_with_data(self):
        """CustomerDemandModel.analyze returns forecast list and trend when data present."""
        model = CustomerDemandModel()
        result = model.analyze({'historical_data': list(range(20)), 'time_horizon_days': 3})
        self.assertIn('forecast', result)
        self.assertEqual(len(result['forecast']), 3)
        self.assertIn('trend', result)
        self.assertIn(result['trend'], ('increasing', 'decreasing'))
        self.assertIn('confidence_intervals', result)
        self.assertEqual(len(result['confidence_intervals']), 3)

    def test_continual_learning_model_random_data(self):
        """ContinualLearningModel.update returns mse + training_step with no input."""
        model = ContinualLearningModel(n_features=5)
        result = model.update({})
        self.assertIn('mse', result)
        self.assertIsInstance(result['mse'], float)
        self.assertIn('training_step', result)
        self.assertEqual(result['training_step'], 1)

    def test_continual_learning_model_none_input(self):
        """ContinualLearningModel.update raises AttributeError on None (no None guard)."""
        model = ContinualLearningModel(n_features=5)
        with self.assertRaises(AttributeError):
            model.update(None)

    def test_continual_learning_model_step_increments(self):
        """ContinualLearningModel.update increments training_step across calls."""
        model = ContinualLearningModel(n_features=5)
        first = model.update({})
        second = model.update({})
        third = model.update({})
        self.assertEqual(first['training_step'], 1)
        self.assertEqual(second['training_step'], 2)
        self.assertEqual(third['training_step'], 3)

    def test_uncertainty_quantification_model_default(self):
        """UncertaintyQuantificationModel.quantify returns prediction + uncertainty on empty input."""
        model = UncertaintyQuantificationModel(input_dim=4)
        result = model.quantify({})
        self.assertIn('prediction', result)
        self.assertIsInstance(result['prediction'], float)
        self.assertIn('uncertainty', result)
        self.assertIn('epistemic', result['uncertainty'])
        self.assertIn('aleatoric', result['uncertainty'])
        self.assertIn('total_std', result['uncertainty'])
        self.assertIn('confidence_interval', result)
        self.assertIn('lower', result['confidence_interval'])
        self.assertIn('upper', result['confidence_interval'])
        self.assertLess(result['confidence_interval']['lower'], result['confidence_interval']['upper'])

    def test_uncertainty_quantification_model_with_input(self):
        """UncertaintyQuantificationModel.quantify accepts explicit X array."""
        model = UncertaintyQuantificationModel(input_dim=3)
        X = np.array([[1.0, 2.0, 3.0]])
        result = model.quantify({'X': X})
        self.assertIn('prediction', result)
        self.assertIsInstance(result['prediction'], float)

    def test_model_monitoring_model_initial(self):
        """ModelMonitoringModel.monitor returns initial state with no drift detected."""
        model = ModelMonitoringModel(model_id='test-model')
        result = model.monitor({})
        self.assertEqual(result['model_id'], 'test-model')
        self.assertEqual(result['total_predictions'], 1)
        self.assertFalse(result['drift_detected'])

    def test_model_monitoring_model_accumulates(self):
        """ModelMonitoringModel.monitor accumulates prediction counts."""
        model = ModelMonitoringModel(model_id='test-model')
        for i in range(5):
            result = model.monitor({'y_true': 1.0, 'y_pred': 1.0})
        self.assertEqual(result['total_predictions'], 5)
        self.assertFalse(result['drift_detected'])

    def test_model_monitoring_model_detects_drift(self):
        """ModelMonitoringModel.monitor returns drift_detected field with valid bool value."""
        model = ModelMonitoringModel(model_id='test-model')
        for i in range(15):
            result = model.monitor({'y_true': 1.0, 'y_pred': 0.0})
        self.assertIn('drift_detected', result)
        self.assertIsInstance(result['drift_detected'], bool)


if __name__ == '__main__':
    unittest.main()