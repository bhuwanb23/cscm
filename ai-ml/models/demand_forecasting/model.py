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
        self.feature_columns = None
        
    def _prepare_features(self, data, is_training=False):
        """
        Prepare features for modeling.
        
        Args:
            data (pd.DataFrame): Input data
            is_training (bool): Whether this is training data
            
        Returns:
            pd.DataFrame: Processed features
        """
        # Create a copy to avoid modifying original data
        data = data.copy()
        
        # Convert date column to datetime
        data['date'] = pd.to_datetime(data['date'])
        
        # Create time-based features
        data['year'] = data['date'].dt.year
        data['month'] = data['date'].dt.month
        data['day'] = data['date'].dt.day
        data['dayofweek'] = data['date'].dt.dayofweek
        data['dayofyear'] = data['date'].dt.dayofyear
        
        # Add simple lag feature
        data['sales_lag_1'] = data['sales'].shift(1)
            
        # Drop the original date column as it's not numeric
        if 'date' in data.columns:
            data = data.drop(columns=['date'])
            
        # If training, store feature columns
        if is_training:
            self.feature_columns = [col for col in data.columns if col != 'sales']
            
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
        train_data = self._prepare_features(train_data, is_training=True)
        
        # Remove rows with NaN values (due to lag features)
        train_data = train_data.dropna()
        
        # Check if we have enough data
        if len(train_data) == 0:
            raise ValueError("Not enough data to train model after removing NaN values")
        
        # Separate features and target
        X = train_data[self.feature_columns]
        y = train_data[target_column]
        
        # Initialize model
        if self.model_type == "random_forest":
            self.model = RandomForestRegressor(n_estimators=10, random_state=42, max_depth=5)
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
        test_data = self._prepare_features(test_data, is_training=False)
        
        # Remove rows with NaN values (due to lag features)
        test_data = test_data.dropna()
        
        # Check if we have data to predict
        if len(test_data) == 0:
            raise ValueError("Not enough data to make predictions after removing NaN values")
        
        # Use the same feature columns as training
        X = test_data[self.feature_columns]
        
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
        
        mae = mean_absolute_error(true_values[-len(predictions):], predictions)
        rmse = np.sqrt(mean_squared_error(true_values[-len(predictions):], predictions))
        
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
    
    # Evaluate
    true_values = test_data['sales'].values
    metrics = forecaster.evaluate(test_data, true_values)
    
    print(f"Predictions: {predictions}")
    print(f"Metrics: {metrics}")