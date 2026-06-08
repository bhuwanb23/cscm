"""
Sliding Window Training Framework for Demand Forecasting Models

This module implements a sliding window training framework that supports:
- Incremental learning capabilities
- Concept drift detection
- Model evaluation and performance monitoring
- Adaptive window sizing
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List, Tuple
import logging
import os
from datetime import datetime, timedelta
import pickle
import json
from collections import deque

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

class SlidingWindowTrainer:
    """Sliding window training framework for demand forecasting models."""
    
    def __init__(self, model_type: str, window_size: int = 30, 
                 step_size: int = 7, min_window_size: int = 14,
                 max_window_size: int = 90, drift_threshold: float = 0.1):
        """
        Initialize the sliding window trainer.
        
        Args:
            model_type: Type of model to train
            window_size: Initial window size in days
            step_size: Step size for sliding window in days
            min_window_size: Minimum window size
            max_window_size: Maximum window size
            drift_threshold: Threshold for concept drift detection
        """
        self.model_type = model_type
        self.window_size = window_size
        self.step_size = step_size
        self.min_window_size = min_window_size
        self.max_window_size = max_window_size
        self.drift_threshold = drift_threshold
        self.model = None
        self.window_history = deque(maxlen=10)  # Keep last 10 windows
        self.performance_history = []
        self.drift_detected = False
        
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
        # Avoid division by zero
        non_zero_indices = y_true != 0
        if np.sum(non_zero_indices) > 0:
            mape = float(np.mean(np.abs((y_true[non_zero_indices] - y_pred[non_zero_indices]) / y_true[non_zero_indices])) * 100)
        else:
            mape = 0.0
        
        return {
            'mae': mae,
            'rmse': rmse,
            'mape': mape
        }
        
    def _detect_concept_drift(self, current_metrics: Dict[str, float], 
                            historical_metrics: List[Dict[str, float]]) -> bool:
        """
        Detect concept drift by comparing current performance with historical performance.
        
        Args:
            current_metrics: Current model performance metrics
            historical_metrics: Historical model performance metrics
            
        Returns:
            True if concept drift is detected, False otherwise
        """
        if len(historical_metrics) < 3:
            return False
            
        # Calculate average historical metrics
        avg_metrics = {}
        metric_names = list(historical_metrics[0].keys())
        for metric_name in metric_names:
            values = [metrics[metric_name] for metrics in historical_metrics]
            avg_metrics[metric_name] = np.mean(values)
            
        # Check if current metrics are significantly worse than historical average
        for metric_name, current_value in current_metrics.items():
            if metric_name in avg_metrics:
                historical_avg = avg_metrics[metric_name]
                # For error metrics, higher values indicate worse performance
                if current_value > historical_avg * (1 + self.drift_threshold):
                    logger.warning(f"Concept drift detected in {metric_name}: "
                                 f"current={current_value:.4f}, historical_avg={historical_avg:.4f}")
                    return True
                    
        return False
        
    def _adapt_window_size(self, drift_detected: bool) -> int:
        """
        Adapt window size based on concept drift detection.
        
        Args:
            drift_detected: Whether concept drift was detected
            
        Returns:
            New window size
        """
        if drift_detected:
            # If drift detected, reduce window size to focus on recent data
            new_window_size = max(self.min_window_size, int(self.window_size * 0.8))
            logger.info(f"Concept drift detected. Reducing window size from {self.window_size} to {new_window_size}")
        else:
            # If no drift, gradually increase window size to include more data
            new_window_size = min(self.max_window_size, int(self.window_size * 1.1))
            logger.info(f"No concept drift detected. Increasing window size from {self.window_size} to {new_window_size}")
            
        return new_window_size
        
    def train_sliding_window(self, data: pd.DataFrame, 
                           validation_data: Optional[Tuple[pd.DataFrame, pd.Series]] = None) -> Dict[str, Any]:
        """
        Train model using sliding window approach.
        
        Args:
            data: Training data with date column
            validation_data: Optional validation data for performance evaluation
            
        Returns:
            Dictionary with training results
        """
        logger.info(f"Starting sliding window training for {self.model_type} model")
        logger.info(f"Window size: {self.window_size} days, Step size: {self.step_size} days")
        
        # Sort data by date
        data = data.sort_values('date').reset_index(drop=True)
        
        # Ensure we have enough data
        if len(data) < self.window_size:
            raise ValueError(f"Insufficient data for window size {self.window_size}. "
                           f"Available data points: {len(data)}")
                           
        # Create sliding windows
        windows = []
        start_idx = 0
        while start_idx + self.window_size <= len(data):
            end_idx = start_idx + self.window_size
            window_data = data.iloc[start_idx:end_idx].copy()
            windows.append({
                'start_idx': start_idx,
                'end_idx': end_idx,
                'data': window_data,
                'start_date': window_data['date'].iloc[0],
                'end_date': window_data['date'].iloc[-1]
            })
            start_idx += self.step_size
            
        logger.info(f"Created {len(windows)} sliding windows")
        
        # Train model on each window and track performance
        window_results = []
        for i, window in enumerate(windows):
            logger.info(f"Training on window {i+1}/{len(windows)} "
                       f"({window['start_date'].date()} to {window['end_date'].date()})")
            
            # Prepare data
            X, y = self._prepare_features(window['data'])
            
            # Create and train model
            self.model = self._create_model()
            
            # Train model
            if self.model_type in ['ets', 'arima']:
                # Statistical models expect only the target variable
                self.model.fit(y)
            elif self.model_type in ['xgboost', 'lightgbm', 'catboost']:
                # Gradient boosted models expect features and target
                self.model.fit(X, y)
            elif self.model_type in ['lstm', 'gru', 'seq2seq']:
                # Deep learning models expect sequences
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
                logger.info(f"Window {i+1} performance metrics: {performance_metrics}")
                
            # Store window results
            window_result = {
                'window_index': i,
                'start_date': window['start_date'],
                'end_date': window['end_date'],
                'performance_metrics': performance_metrics,
                'data_points': len(window['data'])
            }
            window_results.append(window_result)
            self.window_history.append(window_result)
            
        # Detect concept drift
        if len(window_results) > 1 and validation_data is not None:
            latest_metrics = window_results[-1]['performance_metrics']
            historical_metrics = [result['performance_metrics'] for result in window_results[:-1]]
            self.drift_detected = self._detect_concept_drift(latest_metrics, historical_metrics)
            
            # Adapt window size based on drift detection
            if len(self.performance_history) > 0:
                self.window_size = self._adapt_window_size(self.drift_detected)
                
        # Store performance history
        if validation_data is not None:
            self.performance_history.extend([result['performance_metrics'] for result in window_results])
            
        logger.info(f"Sliding window training completed. Drift detected: {self.drift_detected}")
        
        return {
            'window_results': window_results,
            'drift_detected': self.drift_detected,
            'final_window_size': self.window_size,
            'performance_history': self.performance_history
        }
        
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Make predictions using the trained model.
        
        Args:
            X: Feature data for prediction
            
        Returns:
            Predictions
        """
        if self.model is None:
            raise ValueError("Model has not been trained yet")
            
        if self.model_type in ['ets', 'arima']:
            # For statistical models, we need the number of periods to forecast
            return self.model.predict(len(X))
        elif self.model_type in ['xgboost', 'lightgbm', 'catboost']:
            return self.model.predict(X)
        elif self.model_type in ['lstm', 'gru', 'seq2seq', 'informer', 'autoformer', 'mqrnn']:
            sequence_length = 10
            X_seq, _ = self._prepare_sequences(X, pd.Series([0]*len(X)), sequence_length)
            return self.model.predict(X_seq)
        elif self.model_type in ['arima_ml', 'ets_ml']:
            return self.model.predict(X)
        else:
            return self.model.predict(X)
            
    def get_drift_status(self) -> bool:
        """
        Get concept drift detection status.
        
        Returns:
            True if concept drift was detected, False otherwise
        """
        return self.drift_detected
        
    def get_window_size(self) -> int:
        """
        Get current window size.
        
        Returns:
            Current window size
        """
        return self.window_size

# Example usage
if __name__ == "__main__":
    # Create sample data
    dates = pd.date_range(start='2023-01-01', end='2023-12-31', freq='D')
    data = pd.DataFrame({
        'date': dates,
        'sales': np.random.normal(100, 20, len(dates)),
        'price': np.random.normal(10, 2, len(dates)),
        'promotion': np.random.binomial(1, 0.1, len(dates)),
        'weekday': pd.Series(dates).dt.dayofweek,
        'month': pd.Series(dates).dt.month
    })
    
    # Create sliding window trainer
    trainer = SlidingWindowTrainer(
        model_type='ets',
        window_size=30,
        step_size=7
    )
    
    # Train using sliding window approach
    results = trainer.train_sliding_window(data)
    print(f"Training completed. Drift detected: {results['drift_detected']}")