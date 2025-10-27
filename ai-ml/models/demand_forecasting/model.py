"""
Demand Forecasting Model for CSCM AI/ML System

This module implements demand forecasting models for the Cognitive Supply Chain Mesh.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemandForecaster:
    """Base class for demand forecasting models."""
    
    def __init__(self, model_type="random_forest"):
        """
        Initialize the demand forecaster.
        
        Args:
            model_type (str): Type of model to use for forecasting
        """
        self.model_type = model_type
        self.model = None
        self.is_trained = False
        
    def _prepare_features(self, data):
        """
        Prepare features for modeling.
        
        Args:
            data (pd.DataFrame): Input data
            
        Returns:
            pd.DataFrame: Processed features
        """
        # Create time-based features
        data = data.copy()
        data['date'] = pd.to_datetime(data['date'])
        data['year'] = data['date'].dt.year
        data['month'] = data['date'].dt.month
        data['day'] = data['date'].dt.day
        data['dayofweek'] = data['date'].dt.dayofweek
        data['dayofyear'] = data['date'].dt.dayofyear
        
        # Add lag features
        for lag in [1, 7, 14, 30]:
            data[f'sales_lag_{lag}'] = data['sales'].shift(lag)
            
        return data
    
    def train(self, train_data, target_column='sales'):
        """
        Train the demand forecasting model.
        
        Args:
            train_data (pd.DataFrame): Training data
            target_column (str): Name of the target column
        """
        logger.info(f"Training {self.model_type} demand forecasting model")
        
        # Prepare features
        train_data = self._prepare_features(train_data)
        
        # Remove rows with NaN values (due to lag features)
        train_data = train_data.dropna()
        
        # Separate features and target
        feature_columns = [col for col in train_data.columns if col != target_column]
        X = train_data[feature_columns]
        y = train_data[target_column]
        
        # Initialize model
        if self.model_type == "random_forest":
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")
        
        # Train model
        self.model.fit(X, y)
        self.is_trained = True
        
        logger.info("Model training completed")
    
    def predict(self, test_data):
        """
        Make predictions using the trained model.
        
        Args:
            test_data (pd.DataFrame): Data to make predictions on
            
        Returns:
            np.array: Predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
            
        logger.info("Making demand forecasts")
        
        # Prepare features
        test_data = self._prepare_features(test_data)
        
        # Remove rows with NaN values (due to lag features)
        test_data = test_data.dropna()
        
        # Separate features
        feature_columns = [col for col in test_data.columns if 'sales' in col and col != 'sales']
        feature_columns.extend(['year', 'month', 'day', 'dayofweek', 'dayofyear'])
        X = test_data[feature_columns]
        
        # Make predictions
        predictions = self.model.predict(X)
        
        return predictions
    
    def evaluate(self, test_data, true_values):
        """
        Evaluate the model performance.
        
        Args:
            test_data (pd.DataFrame): Test data
            true_values (np.array): True values
            
        Returns:
            dict: Evaluation metrics
        """
        predictions = self.predict(test_data)
        
        mae = mean_absolute_error(true_values, predictions)
        rmse = np.sqrt(mean_squared_error(true_values, predictions))
        
        metrics = {
            'mae': mae,
            'rmse': rmse
        }
        
        logger.info(f"Evaluation metrics - MAE: {mae:.2f}, RMSE: {rmse:.2f}")
        
        return metrics

# Example usage
if __name__ == "__main__":
    # Create sample data
    dates = pd.date_range('2023-01-01', periods=100)
    sales = np.random.randint(50, 200, 100)
    
    data = pd.DataFrame({
        'date': dates,
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
    
    # Evaluate
    true_values = test_data['sales'].values
    metrics = forecaster.evaluate(test_data, true_values)
    
    print(f"Predictions: {predictions}")
    print(f"Metrics: {metrics}")