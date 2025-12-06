import os
import sys
import importlib
from typing import Any, Dict, Optional, Union
import pickle
import joblib
from datetime import datetime

class ModelLoader:
    """
    Utility class for loading and managing AI/ML models with versioning support
    """
    
    def __init__(self):
        self._loaded_models: Dict[str, Dict[str, Any]] = {}
        self._model_paths: Dict[str, str] = {}
        self._model_versions: Dict[str, str] = {}
        self._model_load_times: Dict[str, datetime] = {}
    
    def register_model_path(self, model_name: str, path: str) -> None:
        """
        Register a model path for later loading
        
        Args:
            model_name: Name of the model
            path: Path to the model file
        """
        self._model_paths[model_name] = path
    
    def load_model(self, model_name: str, version: Optional[str] = None) -> Any:
        """
        Load a model by name, with caching and versioning support
        
        Args:
            model_name: Name of the model to load
            version: Specific version of the model to load (optional)
            
        Returns:
            Loaded model object
        """
        # Create a key that includes version information
        model_key = f"{model_name}:{version}" if version else model_name
        
        # Return cached model if already loaded
        if model_key in self._loaded_models:
            return self._loaded_models[model_key]['model']
        
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
            
            # Cache the loaded model with metadata
            self._loaded_models[model_key] = {
                'model': model,
                'version': version or 'latest',
                'load_time': datetime.now()
            }
            self._model_versions[model_name] = version or 'latest'
            self._model_load_times[model_key] = datetime.now()
            
            return model
            
        except Exception as e:
            raise RuntimeError(f"Failed to load model '{model_name}' from {model_path}: {str(e)}")
    
    def unload_model(self, model_name: str, version: Optional[str] = None) -> None:
        """
        Unload a model from cache
        
        Args:
            model_name: Name of the model to unload
            version: Specific version to unload (optional)
        """
        model_key = f"{model_name}:{version}" if version else model_name
        if model_key in self._loaded_models:
            del self._loaded_models[model_key]
        
        # Also remove from version tracking if unloading base model
        if not version and model_name in self._model_versions:
            del self._model_versions[model_name]
    
    def reload_model(self, model_name: str, version: Optional[str] = None) -> Any:
        """
        Reload a model (useful when model file has been updated)
        
        Args:
            model_name: Name of the model to reload
            version: Specific version to reload (optional)
            
        Returns:
            Reloaded model object
        """
        self.unload_model(model_name, version)
        return self.load_model(model_name, version)
    
    def list_loaded_models(self) -> Dict[str, Dict[str, Union[str, datetime]]]:
        """
        List all currently loaded models with metadata
        
        Returns:
            Dictionary of loaded models with version and load time
        """
        return {
            name: {
                'version': info['version'],
                'load_time': info['load_time']
            }
            for name, info in self._loaded_models.items()
        }

# Global instance
model_loader = ModelLoader()


def get_model_info() -> Dict[str, Any]:
    """
    Get information about all registered models
    
    Returns:
        Dictionary with model information
    """
    return {
        'registered_models': list(model_loader._model_paths.keys()),
        'loaded_models': model_loader.list_loaded_models(),
        'model_versions': model_loader._model_versions
    }