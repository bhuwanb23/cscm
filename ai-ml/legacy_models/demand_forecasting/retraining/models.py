"""
Retraining Pipeline for Demand Forecasting Models

This module implements the retraining pipeline for demand forecasting models,
including daily retraining for nowcasting models and weekly/biweekly retraining
for longer horizon models.
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List, Tuple
import logging
import os
from datetime import datetime, timedelta
import pickle
import json
import shutil

# Import existing models
from ..statistical.models import ETSModel, ARIMAModel
from ..gradient_boosted.models import XGBoostModel, LightGBMModel, CatBoostModel
from ..deep_learning.models import LSTMModel, GRUModel, Seq2SeqModel
from ..transformer_based.models import InformerModel, AutoformerModel
from ..hybrid.models import ARIMAMLHybridModel, ETSMLHybridModel
from ..probabilistic.models import MQRNNModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RetrainingPipeline:
    """Retraining pipeline for demand forecasting models."""
    
    # Define model categories for different retraining strategies
    LONG_HORIZON_MODELS = [
        'informer', 'autoformer', 'mqrnn', 'arima_ml', 'ets_ml'
    ]
    
    def __init__(self, model_type: str, retraining_frequency: str = 'daily', 
                 data_window_days: int = 30, model_save_path: str = './models',
                 performance_threshold: float = 0.05):
        """
        Initialize the retraining pipeline.
        
        Args:
            model_type: Type of model to retrain
            retraining_frequency: Frequency of retraining ('daily', 'weekly', 'biweekly')
            data_window_days: Number of days of historical data to use for training
            model_save_path: Path to save trained models
            performance_threshold: Threshold for performance degradation detection
        """
        self.model_type = model_type
        self.retraining_frequency = retraining_frequency
        self.data_window_days = data_window_days
        self.model_save_path = model_save_path
        self.performance_threshold = performance_threshold
        self.model = None
        self.last_training_time = None
        self.performance_metrics = {}
        self.model_history = []  # Track model versions for rollback
        
        # Validate retraining frequency
        if retraining_frequency not in ['daily', 'weekly', 'biweekly']:
            raise ValueError(f"Unsupported retraining frequency: {retraining_frequency}")
        
        # Create model save directory if it doesn't exist
        os.makedirs(model_save_path, exist_ok=True)
        
        # Adjust data window for longer horizon models
        if self.model_type in self.LONG_HORIZON_MODELS:
            # Use more historical data for longer horizon models
            self.data_window_days = max(data_window_days, 90)
        
    def _create_model(self, **kwargs) -> Any:
        """
        Create a model instance based on the model type.
        
        Args:
            **kwargs: Model-specific parameters
            
        Returns:
            Model instance
        """
        if self.model_type == 'ets':
            # Add default parameters for ETS model
            ets_kwargs = {'trend': 'add', 'seasonal': 'add', 'seasonal_periods': 7}
            ets_kwargs.update(kwargs)
            return ETSModel(**ets_kwargs)
        elif self.model_type == 'arima':
            return ARIMAModel(**kwargs)
        elif self.model_type == 'xgboost':
            return XGBoostModel(**kwargs)
        elif self.model_type == 'lightgbm':
            return LightGBMModel(**kwargs)
        elif self.model_type == 'catboost':
            return CatBoostModel(**kwargs)
        elif self.model_type == 'lstm':
            # Add default parameters for LSTM model
            lstm_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1}
            lstm_kwargs.update(kwargs)
            return LSTMModel(**lstm_kwargs)
        elif self.model_type == 'gru':
            # Add default parameters for GRU model
            gru_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1}
            gru_kwargs.update(kwargs)
            return GRUModel(**gru_kwargs)
        elif self.model_type == 'seq2seq':
            # Add default parameters for Seq2Seq model
            seq2seq_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1}
            seq2seq_kwargs.update(kwargs)
            return Seq2SeqModel(**seq2seq_kwargs)
        elif self.model_type == 'informer':
            # Add default parameters for Informer model
            informer_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1, 'sequence_length': 10}
            informer_kwargs.update(kwargs)
            return InformerModel(**informer_kwargs)
        elif self.model_type == 'autoformer':
            # Add default parameters for Autoformer model
            autoformer_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1, 'sequence_length': 10}
            autoformer_kwargs.update(kwargs)
            return AutoformerModel(**autoformer_kwargs)
        elif self.model_type == 'arima_ml':
            # Add default parameters for ARIMA-ML Hybrid model
            arima_ml_kwargs = {'arima_order': (1, 1, 1), 'ml_model_type': 'random_forest'}
            arima_ml_kwargs.update(kwargs)
            return ARIMAMLHybridModel(**arima_ml_kwargs)
        elif self.model_type == 'ets_ml':
            # Add default parameters for ETS-ML Hybrid model
            ets_ml_kwargs = {'ets_trend': 'add', 'ets_seasonal': 'add', 'seasonal_periods': 7, 'ml_model_type': 'random_forest'}
            ets_ml_kwargs.update(kwargs)
            return ETSMLHybridModel(**ets_ml_kwargs)
        elif self.model_type == 'mqrnn':
            # Add default parameters for MQRNN model
            mqrnn_kwargs = {'input_size': 5, 'hidden_size': 64, 'num_layers': 2, 'output_size': 1, 'sequence_length': 10, 'quantiles': [0.1, 0.5, 0.9]}
            mqrnn_kwargs.update(kwargs)
            return MQRNNModel(**mqrnn_kwargs)
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
            
    def _get_data_window(self, current_date: datetime) -> Tuple[datetime, datetime]:
        """
        Calculate the data window for training.
        
        Args:
            current_date: Current date
            
        Returns:
            Tuple of (start_date, end_date)
        """
        end_date = current_date
        start_date = end_date - timedelta(days=self.data_window_days)
        return start_date, end_date
        
    def _load_training_data(self, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """
        Load training data for the specified date range.
        
        Args:
            start_date: Start date for data
            end_date: End date for data
            
        Returns:
            Training data as DataFrame
        """
        # This is a placeholder implementation
        # In a real implementation, this would load data from a database or data warehouse
        logger.info(f"Loading training data from {start_date} to {end_date}")
        
        # For demonstration purposes, we'll create dummy data
        # In practice, this would load actual sales data
        date_range = pd.date_range(start=start_date, end=end_date, freq='D')
        data = pd.DataFrame({
            'date': date_range,
            'sales': np.random.normal(100, 20, len(date_range)),
            'price': np.random.normal(10, 2, len(date_range)),
            'promotion': np.random.binomial(1, 0.1, len(date_range)),
            'weekday': pd.Series(date_range).dt.dayofweek,
            'month': pd.Series(date_range).dt.month
        })
        
        return data
        
    def _prepare_features(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare features and target variables from raw data.
        
        Args:
            data: Raw data
            
        Returns:
            Tuple of (features, target)
        """
        # Select feature columns (excluding date and target)
        feature_columns = [col for col in data.columns if col not in ['date', 'sales']]
        features = pd.DataFrame(data[feature_columns])
        target = pd.Series(data['sales'])
        
        return features, target
        
    def _prepare_sequences(self, X: pd.DataFrame, y: pd.Series, sequence_length: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Prepare sequences for time series models.
        
        Args:
            X: Feature data
            y: Target data
            sequence_length: Length of sequences
            
        Returns:
            Tuple of (sequences, targets)
        """
        # Convert to numpy arrays
        X_values = X.values
        y_values = y.values
        
        # Create sequences
        X_seq = []
        y_seq = []
        
        for i in range(len(y_values) - sequence_length):
            X_seq.append(X_values[i:i+sequence_length])
            y_seq.append(y_values[i+sequence_length])
            
        return np.array(X_seq), np.array(y_seq)
        
    def _calculate_performance_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Calculate performance metrics for the model.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            Dictionary of performance metrics
        """
        # Calculate MAE
        mae = float(np.mean(np.abs(y_true - y_pred)))
        
        # Calculate RMSE
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        
        # Calculate MAPE
        mape = float(np.mean(np.abs((y_true - y_pred) / y_true)) * 100)
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
        
    def train_model(self, current_date: Optional[datetime] = None, 
                   validation_data: Optional[Tuple[pd.DataFrame, pd.Series]] = None) -> Dict[str, Any]:
        """
        Train the model with the latest data.
        
        Args:
            current_date: Current date (defaults to today)
            validation_data: Optional validation data for performance evaluation
            
        Returns:
            Dictionary with training results
        """
        if current_date is None:
            current_date = datetime.now()
            
        logger.info(f"Starting {self.retraining_frequency} retraining for {self.model_type} model")
        
        # Calculate data window
        start_date, end_date = self._get_data_window(current_date)
        
        # Load training data
        data = self._load_training_data(start_date, end_date)
        
        # Prepare features and target
        X, y = self._prepare_features(data)
        
        # Create model instance
        self.model = self._create_model()
        
        # Train model
        logger.info("Training model...")
        # Handle different model types differently
        if self.model_type in ['ets', 'arima']:
            # Statistical models expect only the target variable
            self.model.fit(y)
        elif self.model_type in ['xgboost', 'lightgbm', 'catboost']:
            # Gradient boosted models expect features and target
            self.model.fit(X, y)
        elif self.model_type in ['lstm', 'gru', 'seq2seq']:
            # Deep learning models expect sequences
            # For simplicity, we'll convert the time series to sequences
            sequence_length = 10
            X_seq, y_seq = self._prepare_sequences(X, y, sequence_length)
            self.model.fit(X_seq, y_seq)
        elif self.model_type in ['informer', 'autoformer']:
            # Transformer models expect sequences
            sequence_length = 10
            X_seq, y_seq = self._prepare_sequences(X, y, sequence_length)
            self.model.fit(X_seq, y_seq)
        elif self.model_type in ['arima_ml', 'ets_ml']:
            # Hybrid models expect features and target
            self.model.fit(X, y)
        elif self.model_type == 'mqrnn':
            # MQRNN models expect sequences
            sequence_length = 10
            X_seq, y_seq = self._prepare_sequences(X, y, sequence_length)
            self.model.fit(X_seq, y_seq)
        else:
            # Default: try to fit with features and target
            if hasattr(self.model, 'fit'):
                try:
                    self.model.fit(X, y)
                except TypeError:
                    # If that fails, try with just the target
                    self.model.fit(y)
                    
        # Evaluate model performance if validation data is provided
        performance_metrics = {}
        if validation_data is not None:
            X_val, y_val = validation_data
            if self.model_type in ['ets', 'arima']:
                y_pred = self.model.predict(len(y_val))
            elif self.model_type in ['xgboost', 'lightgbm', 'catboost']:
                y_pred = self.model.predict(X_val)
            elif self.model_type in ['lstm', 'gru', 'seq2seq', 'informer', 'autoformer', 'mqrnn']:
                sequence_length = 10
                X_seq, _ = self._prepare_sequences(X_val, y_val, sequence_length)
                y_pred = self.model.predict(X_seq)
            elif self.model_type in ['arima_ml', 'ets_ml']:
                y_pred = self.model.predict(X_val)
            else:
                y_pred = self.model.predict(X_val)
                
            performance_metrics = self._calculate_performance_metrics(
                np.array(y_val.values, dtype=float), 
                np.array(y_pred, dtype=float)
            )
            logger.info(f"Model performance metrics: {performance_metrics}")
            
        # Save model
        model_filename = f"{self.model_type}_{current_date.strftime('%Y%m%d_%H%M%S')}.pkl"
        model_path = os.path.join(self.model_save_path, model_filename)
        
        # Save model to disk
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)
            
        # Update last training time
        self.last_training_time = current_date
        
        # Record model in history for potential rollback
        model_record = {
            'model_path': model_path,
            'training_time': current_date.isoformat(),
            'performance_metrics': performance_metrics,
            'retraining_frequency': self.retraining_frequency
        }
        self.model_history.append(model_record)
        
        # Keep only the last 5 model versions
        if len(self.model_history) > 5:
            # Remove oldest model file if it exists
            oldest_model = self.model_history.pop(0)
            if os.path.exists(oldest_model['model_path']):
                os.remove(oldest_model['model_path'])
        
        # Update performance metrics
        self.performance_metrics = {
            'training_time': current_date.isoformat(),
            'data_points': len(data),
            'model_path': model_path,
            'metrics': performance_metrics
        }
        
        logger.info(f"Model training completed. Model saved to {model_path}")
        
        return {
            'model_path': model_path,
            'training_time': self.last_training_time,
            'performance_metrics': self.performance_metrics
        }
        
    def should_retrain(self, current_date: Optional[datetime] = None) -> bool:
        """
        Determine if the model should be retrained based on the schedule.
        
        Args:
            current_date: Current date (defaults to today)
            
        Returns:
            True if model should be retrained, False otherwise
        """
        if current_date is None:
            current_date = datetime.now()
            
        # If model has never been trained, retrain
        if self.last_training_time is None:
            return True
            
        # Calculate time since last training
        time_since_last_training = current_date - self.last_training_time
        
        if self.retraining_frequency == 'daily':
            return time_since_last_training >= timedelta(days=1)
        elif self.retraining_frequency == 'weekly':
            return time_since_last_training >= timedelta(weeks=1)
        elif self.retraining_frequency == 'biweekly':
            return time_since_last_training >= timedelta(weeks=2)
        else:
            # For unsupported frequencies, raise an error
            raise ValueError(f"Unsupported retraining frequency: {self.retraining_frequency}")
            
    def load_model(self, model_path: str) -> Any:
        """
        Load a previously trained model.
        
        Args:
            model_path: Path to the saved model
            
        Returns:
            Loaded model
        """
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
        
    def get_performance_history(self) -> Dict[str, Any]:
        """
        Get performance history for the model.
        
        Returns:
            Performance history
        """
        return self.performance_metrics
        
    def compare_model_performance(self, current_metrics: Dict[str, float], 
                                baseline_metrics: Dict[str, float]) -> bool:
        """
        Compare current model performance with baseline to detect degradation.
        
        Args:
            current_metrics: Current model performance metrics
            baseline_metrics: Baseline model performance metrics
            
        Returns:
            True if performance is acceptable, False if degraded
        """
        # Check if any metric has degraded beyond threshold
        for metric_name, current_value in current_metrics.items():
            if metric_name in baseline_metrics:
                baseline_value = baseline_metrics[metric_name]
                # For error metrics, lower is better
                if current_value > baseline_value * (1 + self.performance_threshold):
                    logger.warning(f"Performance degradation detected in {metric_name}: "
                                 f"current={current_value:.4f}, baseline={baseline_value:.4f}")
                    return False
        return True
        
    def rollback_to_previous_model(self) -> Optional[str]:
        """
        Rollback to the previous model version if current performance is degraded.
        
        Returns:
            Path to the rolled back model, or None if rollback failed
        """
        if len(self.model_history) < 2:
            logger.warning("Insufficient model history for rollback")
            return None
            
        # Get the previous model
        previous_model_record = self.model_history[-2]
        previous_model_path = previous_model_record['model_path']
        
        if not os.path.exists(previous_model_path):
            logger.error(f"Previous model file not found: {previous_model_path}")
            return None
            
        # Load the previous model
        try:
            previous_model = self.load_model(previous_model_path)
            self.model = previous_model
            self.last_training_time = datetime.fromisoformat(previous_model_record['training_time'])
            self.performance_metrics = previous_model_record
            
            logger.info(f"Successfully rolled back to model: {previous_model_path}")
            return previous_model_path
        except Exception as e:
            logger.error(f"Failed to rollback to previous model: {e}")
            return None
            
    def get_resource_requirements(self) -> Dict[str, Any]:
        """
        Get resource requirements for training this model type.
        
        Returns:
            Dictionary with resource requirements
        """
        # Base resource requirements
        resources = {
            'cpu_cores': 2,
            'memory_gb': 4,
            'storage_gb': 1
        }
        
        # Adjust for model complexity
        if self.model_type in self.LONG_HORIZON_MODELS:
            resources['cpu_cores'] = 4
            resources['memory_gb'] = 8
            resources['storage_gb'] = 2
            
        # Adjust for retraining frequency
        if self.retraining_frequency == 'daily':
            resources['cpu_cores'] = int(resources['cpu_cores'] * 1.5)
            resources['memory_gb'] = int(resources['memory_gb'] * 1.5)
            
        return resources

# Example usage
if __name__ == "__main__":
    # Create a daily retraining pipeline for an ETS model
    pipeline = RetrainingPipeline(
        model_type='ets',
        retraining_frequency='daily',
        data_window_days=30,
        model_save_path='./saved_models'
    )
    
    # Check if retraining is needed
    if pipeline.should_retrain():
        # Train the model
        results = pipeline.train_model()
        print(f"Model trained successfully: {results}")
    else:
        print("No retraining needed at this time")