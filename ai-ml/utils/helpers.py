"""
Helper utilities for CSCM AI/ML System
"""

import logging
import os
from datetime import datetime

def setup_logging(log_level=logging.INFO):
    """
    Set up logging configuration.
    
    Args:
        log_level: Logging level (default: INFO)
    """
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('cscm_ai_ml.log'),
            logging.StreamHandler()
        ]
    )

def create_output_directory(base_path, subdirectory):
    """
    Create an output directory if it doesn't exist.
    
    Args:
        base_path (str): Base path for output
        subdirectory (str): Subdirectory to create
        
    Returns:
        str: Full path to the created directory
    """
    output_path = os.path.join(base_path, subdirectory)
    os.makedirs(output_path, exist_ok=True)
    return output_path

def get_current_timestamp():
    """
    Get current timestamp in a standardized format.
    
    Returns:
        str: Current timestamp
    """
    return datetime.now().strftime("%Y%m%d_%H%M%S")

def validate_data_schema(data, required_columns):
    """
    Validate that data contains required columns.
    
    Args:
        data (pd.DataFrame): Data to validate
        required_columns (list): List of required column names
        
    Returns:
        bool: True if all required columns are present
    """
    missing_columns = set(required_columns) - set(data.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    return True

# Example usage
if __name__ == "__main__":
    setup_logging()
    logger = logging.getLogger(__name__)
    logger.info("Helper utilities loaded")