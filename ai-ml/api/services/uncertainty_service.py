import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

# Add the models directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from ..routers.uncertainty_quantification import UncertaintyRequest, UncertaintyResponse, CalibrationRequest, CalibrationResponse

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UncertaintyQuantificationService:
    """
    Service class for uncertainty quantification operations
    """
    
    @staticmethod
    def quantify_uncertainty(request: UncertaintyRequest) -> UncertaintyResponse:
        """
        Quantify uncertainty for model predictions
        
        Args:
            request: UncertaintyRequest with model and input data
            
        Returns:
            UncertaintyResponse with uncertainty quantification
        """
        try:
            logger.info(f"Quantifying uncertainty for model: {request.model_id}")
            
            # Validate input parameters
            if not request.model_id:
                raise ValueError("Model ID is required")
            if not request.input_data:
                raise ValueError("Input data is required")
            if not request.uncertainty_method:
                raise ValueError("Uncertainty method is required")
            
            # This would integrate with the actual uncertainty quantification model
            # For now, returning mock data
            response = UncertaintyResponse(
                model_id=request.model_id,
                prediction=125.5,
                uncertainty={
                    "mean": 125.5,
                    "std": 12.3,
                    "confidence_interval": {"lower": 101.4, "upper": 149.6}
                },
                risk_metrics={
                    "value_at_risk": 145.2,
                    "expected_shortfall": 155.7,
                    "prediction_entropy": 0.75
                },
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully quantified uncertainty for model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error quantifying uncertainty: {str(e)}")
            raise
    
    @staticmethod
    def calibrate_model(request: CalibrationRequest) -> CalibrationResponse:
        """
        Calibrate model predictions for better uncertainty estimates
        
        Args:
            request: CalibrationRequest with calibration data
            
        Returns:
            CalibrationResponse with calibration results
        """
        try:
            logger.info(f"Calibrating model: {request.model_id}")
            
            # Validate input parameters
            if not request.model_id:
                raise ValueError("Model ID is required")
            if not request.calibration_data:
                raise ValueError("Calibration data is required")
            if not request.method:
                raise ValueError("Calibration method is required")
            
            # This would integrate with the actual calibration system
            # For now, returning mock data
            response = CalibrationResponse(
                model_id=request.model_id,
                calibration_applied=True,
                calibration_metrics={
                    "ece": 0.05,  # Expected Calibration Error
                    "mce": 0.12,  # Maximum Calibration Error
                    "nll": 0.23   # Negative Log-Likelihood
                },
                model_version="1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            logger.info(f"Successfully calibrated model: {request.model_id}")
            return response
        except Exception as e:
            logger.error(f"Error calibrating model: {str(e)}")
            raise