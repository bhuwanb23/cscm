import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.model_monitoring import DriftDetectionRequest, DriftDetectionResponse, ModelPerformanceRequest, ModelPerformanceResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelMonitoringService:
    """
    Service class for model monitoring operations
    """
    
    @staticmethod
    def detect_drift(request: DriftDetectionRequest) -> DriftDetectionResponse:
        """
        Detect data drift for a model
        
        Args:
            request: DriftDetectionRequest with reference and current data
            
        Returns:
            DriftDetectionResponse with drift detection results
        """
        try:
            logger.info(f"Detecting drift for model: {request.model_id}")
            
            # Validate input parameters
            if not request.model_id:
                raise ValueError("Model ID is required")
            if not request.reference_data:
                raise ValueError("Reference data is required")
            if not request.current_data:
                raise ValueError("Current data is required")
            if request.drift_threshold <= 0:
                raise ValueError("Drift threshold must be positive")
            
            # This would integrate with the actual drift detection system
            # For now, returning mock data
            response = DriftDetectionResponse(
                model_id=request.model_id,
                drift_detected=False,
                drift_score=0.03,
                drifted_features=None,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully detected drift for model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error detecting drift: {str(e)}")
            raise
    
    @staticmethod
    def get_model_performance(request: ModelPerformanceRequest) -> ModelPerformanceResponse:
        """
        Get model performance metrics
        
        Args:
            request: ModelPerformanceRequest with model ID and date range
            
        Returns:
            ModelPerformanceResponse with performance metrics
        """
        try:
            logger.info(f"Getting performance metrics for model: {request.model_id}")
            
            # Validate input parameters
            if not request.model_id:
                raise ValueError("Model ID is required")
            if not request.period_start:
                raise ValueError("Period start is required")
            if not request.period_end:
                raise ValueError("Period end is required")
            if not request.metrics:
                raise ValueError("Metrics list is required")
            
            # This would integrate with the actual model monitoring system
            # For now, returning mock data
            response = ModelPerformanceResponse(
                model_id=request.model_id,
                performance_metrics={
                    "accuracy": 0.89,
                    "precision": 0.87,
                    "recall": 0.91,
                    "f1_score": 0.89,
                    "latency_p95": 0.042
                },
                alerts=["Low precision for high-value customers"],
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully retrieved performance metrics for model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error getting model performance: {str(e)}")
            raise