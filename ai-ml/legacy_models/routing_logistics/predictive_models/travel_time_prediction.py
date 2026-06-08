"""
Gradient-Boosted Models for Travel-Time Prediction

This module implements gradient-boosted models (XGBoost, LightGBM, CatBoost) for travel time prediction.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging

try:
    import xgboost as xgb
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    xgb = None

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False
    lgb = None

try:
    import catboost as cb
    HAS_CATBOOST = True
except ImportError:
    HAS_CATBOOST = False
    cb = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TravelTimePredictor:
    """
    Gradient-boosted models for travel time prediction.
    
    Supports XGBoost, LightGBM, and CatBoost.
    """
    
    def __init__(
        self,
        model_type: str = 'xgboost',  # 'xgboost', 'lightgbm', 'catboost'
        **kwargs
    ):
        """
        Initialize travel time predictor.
        
        Args:
            model_type: Type of gradient-boosted model
            **kwargs: Additional model parameters
        """
        self.model_type = model_type
        self.model = None
        self.feature_columns = None
        self.is_trained = False
        
        if model_type == 'xgboost':
            if not HAS_XGBOOST:
                raise ImportError("xgboost is required for XGBoost model")
            self.model = xgb.XGBRegressor(**kwargs)
        elif model_type == 'lightgbm':
            if not HAS_LIGHTGBM:
                raise ImportError("lightgbm is required for LightGBM model")
            self.model = lgb.LGBMRegressor(**kwargs)
        elif model_type == 'catboost':
            if not HAS_CATBOOST:
                raise ImportError("catboost is required for CatBoost model")
            self.model = cb.CatBoostRegressor(**kwargs, verbose=False)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    def _extract_features(
        self,
        data: pd.DataFrame,
        include_time_features: bool = True
    ) -> pd.DataFrame:
        """
        Extract features from data.
        
        Args:
            data: Input data with location and route information
            include_time_features: Whether to include time-based features
        
        Returns:
            Feature DataFrame
        """
        features = pd.DataFrame()
        
        # Distance features
        if 'distance' in data.columns:
            features['distance'] = data['distance']
        if 'start_x' in data.columns and 'start_y' in data.columns:
            if 'end_x' in data.columns and 'end_y' in data.columns:
                features['euclidean_distance'] = np.sqrt(
                    (data['start_x'] - data['end_x'])**2 +
                    (data['start_y'] - data['end_y'])**2
                )
        
        # Time features
        if include_time_features:
            if 'hour' in data.columns:
                features['hour'] = data['hour']
                features['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24)
                features['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24)
            
            if 'day_of_week' in data.columns:
                features['day_of_week'] = data['day_of_week']
                features['is_weekend'] = (data['day_of_week'] >= 5).astype(int)
        
        # Weather features
        if 'temperature' in data.columns:
            features['temperature'] = data['temperature']
        if 'precipitation' in data.columns:
            features['precipitation'] = data['precipitation']
        if 'wind_speed' in data.columns:
            features['wind_speed'] = data['wind_speed']
        
        # Route features
        if 'route_length' in data.columns:
            features['route_length'] = data['route_length']
        if 'num_stops' in data.columns:
            features['num_stops'] = data['num_stops']
        
        # Vehicle features
        if 'vehicle_type' in data.columns:
            features['vehicle_type'] = data['vehicle_type']
        if 'vehicle_capacity' in data.columns:
            features['vehicle_capacity'] = data['vehicle_capacity']
        
        return features
    
    def train(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        validation_data: Optional[Tuple[pd.DataFrame, pd.Series]] = None
    ):
        """
        Train the model.
        
        Args:
            X: Feature DataFrame
            y: Target travel times
            validation_data: Optional validation data
        """
        logger.info(f"Training {self.model_type} model on {len(X)} samples")
        
        # Extract features if needed
        if self.feature_columns is None:
            self.feature_columns = X.columns.tolist()
        
        # Train model
        if validation_data is not None:
            X_val, y_val = validation_data
            if self.model_type == 'xgboost':
                self.model.fit(
                    X, y,
                    eval_set=[(X_val, y_val)],
                    verbose=False
                )
            elif self.model_type == 'lightgbm':
                self.model.fit(
                    X, y,
                    eval_set=[(X_val, y_val)],
                    verbose=False
                )
            elif self.model_type == 'catboost':
                self.model.fit(
                    X, y,
                    eval_set=(X_val, y_val),
                    verbose=False
                )
        else:
            self.model.fit(X, y)
        
        self.is_trained = True
        logger.info("Training completed")
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Predict travel times.
        
        Args:
            X: Feature DataFrame
        
        Returns:
            Predicted travel times
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Ensure feature columns match
        if self.feature_columns is not None:
            X = X[self.feature_columns]
        
        predictions = self.model.predict(X)
        return predictions
    
    def predict_with_uncertainty(
        self,
        X: pd.DataFrame,
        n_samples: int = 100
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict travel times with uncertainty estimation.
        
        Args:
            X: Feature DataFrame
            n_samples: Number of samples for uncertainty estimation
        
        Returns:
            Tuple of (mean predictions, std predictions)
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # For tree-based models, we can use leaf predictions for uncertainty
        # This is a simplified version
        predictions = self.predict(X)
        
        # Estimate uncertainty (simplified - would need proper implementation)
        # For now, use a fixed percentage of prediction as uncertainty
        uncertainty = predictions * 0.1  # 10% uncertainty
        
        return predictions, uncertainty
    
    def get_feature_importance(self) -> pd.DataFrame:
        """
        Get feature importance.
        
        Returns:
            DataFrame with feature importance
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before getting feature importance")
        
        if self.feature_columns is None:
            return pd.DataFrame()
        
        if self.model_type == 'xgboost':
            importance = self.model.feature_importances_
        elif self.model_type == 'lightgbm':
            importance = self.model.feature_importances_
        elif self.model_type == 'catboost':
            importance = self.model.feature_importances_
        
        importance_df = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        return importance_df
    
    def save(self, filepath: str):
        """Save model."""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        import pickle
        with open(filepath, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'model_type': self.model_type,
                'feature_columns': self.feature_columns
            }, f)
    
    def load(self, filepath: str):
        """Load model."""
        import pickle
        with open(filepath, 'rb') as f:
            data = pickle.load(f)
            self.model = data['model']
            self.model_type = data['model_type']
            self.feature_columns = data['feature_columns']
            self.is_trained = True

