import os
import sys
import importlib
from typing import Any, Dict, Optional
import pickle
import joblib

class ModelLoader:
    """
    Utility class for loading and managing AI/ML models
    """
    
    def __init__(self):
        self._loaded_models: Dict[str, Any] = {}
        self._model_paths: Dict[str, str] = {}
    
    def register_model_path(self, model_name: str, path: str) -> None:
        """
        Register a model path for later loading
        
        Args:
            model_name: Name of the model
            path: Path to the model file
        """
        self._model_paths[model_name] = path
    
    def load_model(self, model_name: str) -> Any:
        """
        Load a model by name, with caching
        
        Args:
            model_name: Name of the model to load
            
        Returns:
            Loaded model object
        """
        # Return cached model if already loaded
        if model_name in self._loaded_models:
            return self._loaded_models[model_name]
        
        # Check if model path is registered
        if model_name not in self._model_paths:
            raise ValueError(f"Model '{model_name}' not registered. Please register model path first.")
        
        model_path = self._model_paths[model_name]
        
        # Check if model file exists
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        # Load model based on file extension
        try:
            if model_path.endswith('.pkl') or model_path.endswith('.pickle'):
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            elif model_path.endswith('.joblib'):
                model = joblib.load(model_path)
            else:
                # Try to import as a Python module
                module_dir = os.path.dirname(model_path)
                module_name = os.path.basename(model_path).replace('.py', '')
                
                if module_dir not in sys.path:
                    sys.path.insert(0, module_dir)
                
                module = importlib.import_module(module_name)
                # Assume the model is accessible as 'model' attribute
                model = getattr(module, 'model', None)
                
                if model is None:
                    # Try to instantiate a class named after the module
                    model_class = getattr(module, module_name.capitalize(), None)
                    if model_class:
                        model = model_class()
            
            # Cache the loaded model
            self._loaded_models[model_name] = model
            return model
            
        except Exception as e:
            raise RuntimeError(f"Failed to load model '{model_name}' from {model_path}: {str(e)}")
    
    def unload_model(self, model_name: str) -> None:
        """
        Unload a model from cache
        
        Args:
            model_name: Name of the model to unload
        """
        if model_name in self._loaded_models:
            del self._loaded_models[model_name]
    
    def reload_model(self, model_name: str) -> Any:
        """
        Reload a model (useful when model file has been updated)
        
        Args:
            model_name: Name of the model to reload
            
        Returns:
            Reloaded model object
        """
        self.unload_model(model_name)
        return self.load_model(model_name)
    
    def list_loaded_models(self) -> list:
        """
        List all currently loaded models
        
        Returns:
            List of loaded model names
        """
        return list(self._loaded_models.keys())

# Global instance
model_loader = ModelLoader()