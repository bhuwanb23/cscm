"""
Debug script for model loader functionality.
"""

import sys
import os

# Add the api directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from utils.model_loader import model_loader, get_model_info


def test_model_loader():
    """Test model loader functionality."""
    print("Testing Model Loader...")
    
    # Register a model path
    model_loader.register_model_path("test_model", "path/to/model.pkl")
    print("Registered test_model with path 'path/to/model.pkl'")
    
    # Get model info
    info = get_model_info()
    print(f"Model info: {info}")
    
    # List loaded models (should be empty)
    loaded = model_loader.list_loaded_models()
    print(f"Loaded models: {loaded}")
    
    print("Model loader test completed.")


if __name__ == "__main__":
    test_model_loader()