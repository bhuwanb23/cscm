"""
Test suite for the retraining pipeline
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta
import tempfile
import shutil

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.demand_forecasting.retraining.models import RetrainingPipeline

def test_retraining_pipeline_initialization():
    """Test initialization of RetrainingPipeline."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        assert pipeline.model_type == 'ets'
        assert pipeline.retraining_frequency == 'daily'
        assert pipeline.data_window_days == 30
        assert pipeline.model_save_path == temp_dir
        assert pipeline.last_training_time is None

def test_retraining_pipeline_should_retrain():
    """Test should_retrain method of RetrainingPipeline."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Should retrain when never trained before
        assert pipeline.should_retrain() == True
        
        # Set last training time to today
        pipeline.last_training_time = datetime.now()
        assert pipeline.should_retrain() == False
        
        # Set last training time to yesterday
        pipeline.last_training_time = datetime.now() - timedelta(days=1)
        assert pipeline.should_retrain() == True

def test_retraining_pipeline_weekly_schedule():
    """Test weekly retraining schedule."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='weekly',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Should retrain when never trained before
        assert pipeline.should_retrain() == True
        
        # Set last training time to today
        pipeline.last_training_time = datetime.now()
        assert pipeline.should_retrain() == False
        
        # Set last training time to 6 days ago
        pipeline.last_training_time = datetime.now() - timedelta(days=6)
        assert pipeline.should_retrain() == False
        
        # Set last training time to 7 days ago
        pipeline.last_training_time = datetime.now() - timedelta(days=7)
        assert pipeline.should_retrain() == True

def test_retraining_pipeline_biweekly_schedule():
    """Test biweekly retraining schedule."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='biweekly',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Should retrain when never trained before
        assert pipeline.should_retrain() == True
        
        # Set last training time to today
        pipeline.last_training_time = datetime.now()
        assert pipeline.should_retrain() == False
        
        # Set last training time to 13 days ago
        pipeline.last_training_time = datetime.now() - timedelta(days=13)
        assert pipeline.should_retrain() == False
        
        # Set last training time to 14 days ago
        pipeline.last_training_time = datetime.now() - timedelta(days=14)
        assert pipeline.should_retrain() == True

def test_retraining_pipeline_invalid_frequency():
    """Test invalid retraining frequency."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Should raise ValueError for invalid frequency during initialization
        with pytest.raises(ValueError):
            pipeline = RetrainingPipeline(
                model_type='ets',
                retraining_frequency='monthly',  # This is an invalid frequency
                data_window_days=30,
                model_save_path=temp_dir
            )

def test_retraining_pipeline_train_model():
    """Test training a model with the retraining pipeline."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Train the model
        results = pipeline.train_model()
        
        # Check that results contain expected keys
        assert 'model_path' in results
        assert 'training_time' in results
        assert 'performance_metrics' in results
        
        # Check that model was saved
        assert os.path.exists(results['model_path'])
        
        # Check that last training time was updated
        assert pipeline.last_training_time is not None
        
        # Check that performance metrics were recorded
        assert len(pipeline.get_performance_history()) > 0

def test_retraining_pipeline_load_model():
    """Test loading a previously trained model."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Train the model
        results = pipeline.train_model()
        
        # Load the model
        loaded_model = pipeline.load_model(results['model_path'])
        
        # Check that loaded model is not None
        assert loaded_model is not None

def test_retraining_pipeline_different_model_types():
    """Test retraining pipeline with different model types."""
    model_types = ['ets', 'arima', 'xgboost', 'lightgbm', 'catboost']
    
    with tempfile.TemporaryDirectory() as temp_dir:
        for model_type in model_types:
            pipeline = RetrainingPipeline(
                model_type=model_type,
                retraining_frequency='daily',
                data_window_days=30,
                model_save_path=temp_dir
            )
            
            # Train the model
            results = pipeline.train_model()
            
            # Check that results contain expected keys
            assert 'model_path' in results
            assert 'training_time' in results
            assert 'performance_metrics' in results
            
            # Check that model was saved
            assert os.path.exists(results['model_path'])

def test_long_horizon_model_data_window():
    """Test that long horizon models use extended data windows."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Test with a long horizon model
        pipeline = RetrainingPipeline(
            model_type='informer',
            retraining_frequency='weekly',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Long horizon models should use at least 90 days of data
        assert pipeline.data_window_days >= 90

def test_resource_requirements():
    """Test resource requirements calculation."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Test base model resource requirements
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        resources = pipeline.get_resource_requirements()
        assert 'cpu_cores' in resources
        assert 'memory_gb' in resources
        assert 'storage_gb' in resources
        
        # Test long horizon model resource requirements
        long_horizon_pipeline = RetrainingPipeline(
            model_type='informer',
            retraining_frequency='weekly',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        long_resources = long_horizon_pipeline.get_resource_requirements()
        assert long_resources['cpu_cores'] >= resources['cpu_cores']
        assert long_resources['memory_gb'] >= resources['memory_gb']

def test_model_history_tracking():
    """Test model history tracking for rollback capability."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Train multiple models
        results1 = pipeline.train_model()
        results2 = pipeline.train_model()
        
        # Check that model history is tracked
        assert len(pipeline.model_history) >= 2
        assert pipeline.model_history[-1]['model_path'] == results2['model_path']
        assert pipeline.model_history[-2]['model_path'] == results1['model_path']

def test_performance_comparison():
    """Test performance comparison functionality."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir,
            performance_threshold=0.1  # 10% threshold
        )
        
        # Test with acceptable performance (within threshold)
        current_metrics = {'mae': 9.5, 'rmse': 14.5}
        baseline_metrics = {'mae': 9.0, 'rmse': 14.0}
        assert pipeline.compare_model_performance(current_metrics, baseline_metrics) == True
        
        # Test with degraded performance (beyond threshold)
        degraded_metrics = {'mae': 20.0, 'rmse': 25.0}
        assert pipeline.compare_model_performance(degraded_metrics, baseline_metrics) == False

def test_rollback_mechanism():
    """Test model rollback functionality."""
    with tempfile.TemporaryDirectory() as temp_dir:
        pipeline = RetrainingPipeline(
            model_type='ets',
            retraining_frequency='daily',
            data_window_days=30,
            model_save_path=temp_dir
        )
        
        # Train first model
        results1 = pipeline.train_model()
        first_model_path = results1['model_path']
        
        # Train second model
        results2 = pipeline.train_model()
        second_model_path = results2['model_path']
        
        # Verify both models exist
        assert os.path.exists(first_model_path)
        assert os.path.exists(second_model_path)
        
        # Test rollback when sufficient history exists
        rollback_path = pipeline.rollback_to_previous_model()
        assert rollback_path == first_model_path

if __name__ == "__main__":
    pytest.main([__file__])