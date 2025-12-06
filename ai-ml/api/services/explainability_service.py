import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.explainability import ExplanationRequest, ExplanationResponse, FeaturesRequest, FeaturesResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExplainabilityService:
    """
    Service class for explainability operations
    """
    
    @staticmethod
    def explain_prediction(request: ExplanationRequest) -> ExplanationResponse:
        """
        Explain a model prediction
        
        Args:
            request: ExplanationRequest with model and instance data
            
        Returns:
            ExplanationResponse with feature importance
        """
        try:
            logger.info(f"Explaining prediction for model: {request.model_id}")
            
            # Validate input parameters
            if not request.model_id:
                raise ValueError("Model ID is required")
            if not request.instance:
                raise ValueError("Instance is required")
            if not request.feature_names:
                raise ValueError("Feature names are required")
            if request.num_samples <= 0:
                raise ValueError("Number of samples must be positive")
            
            # This would integrate with the actual explainability model
            # For now, returning mock data
            feature_importance = {}
            for i, name in enumerate(request.feature_names):
                # Create mock importance values
                importance = 0.1 + (0.8 * (i / len(request.feature_names))) if i < len(request.feature_names) else 0.1
                feature_importance[name] = round(importance, 3)
            
            response = ExplanationResponse(
                model_id=request.model_id,
                instance=request.instance,
                feature_importance=feature_importance,
                base_value=0.5,
                prediction=0.72,
                explanation_method=request.method,
                confidence=0.88,
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully explained prediction for model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error explaining prediction: {str(e)}")
            raise
    
    @staticmethod
    def get_features(request: FeaturesRequest) -> FeaturesResponse:
        """
        Get feature importance and interactions for a model
        
        Args:
            request: FeaturesRequest with model ID
            
        Returns:
            FeaturesResponse with feature analysis
        """
        try:
            logger.info(f"Getting feature analysis for model: {request.model_id}")
            
            # This would integrate with the actual feature analysis system
            # For now, returning mock data
            response = FeaturesResponse(
                model_id=request.model_id,
                most_important_features=[
                    {"feature": "price", "importance": 0.25, "impact": "negative"},
                    {"feature": "promotion", "importance": 0.22, "impact": "positive"},
                    {"feature": "seasonality", "importance": 0.18, "impact": "positive"},
                    {"feature": "competitor_price", "importance": 0.15, "impact": "negative"}
                ],
                feature_interactions=[
                    {"features": ["price", "promotion"], "interaction_strength": 0.35},
                    {"features": ["seasonality", "promotion"], "interaction_strength": 0.28}
                ],
                sensitivity_analysis={
                    "price_elasticity": -1.2,
                    "promotion_sensitivity": 0.8,
                    "seasonal_factor": 1.15
                },
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully retrieved feature analysis for model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error getting feature analysis: {str(e)}")
            raise