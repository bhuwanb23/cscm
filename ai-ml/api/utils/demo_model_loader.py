"""
Demo model loader for AI/ML service
Provides fallback demo models when trained models are not available
"""
import os
import pickle
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

class DemoModelLoader:
    """Loader for demo/placeholder models"""
    
    def __init__(self):
        self.models_dir = Path("/app/models")
        self.loaded_models: Dict[str, Any] = {}
    
    def load_demo_model(self, model_type: str) -> Optional[Dict[str, Any]]:
        """Load a demo model by type"""
        model_file = self._find_model_file(model_type)
        
        if not model_file or not model_file.exists():
            return None
        
        try:
            with open(model_file, 'rb') as f:
                model = pickle.load(f)
            return model
        except Exception as e:
            print(f"Failed to load demo model {model_type}: {e}")
            return None
    
    def _find_model_file(self, model_type: str) -> Optional[Path]:
        """Find model file for given type"""
        # Map model types to file paths
        model_paths = {
            "demand_forecast": self.models_dir / "demand_forecasting" / "demand_model.pkl",
            "inventory_opt": self.models_dir / "inventory_optimization" / "inventory_model.pkl",
            "routing": self.models_dir / "routing_logistics" / "routing_model.pkl",
            "customer_demand": self.models_dir / "customer_demand" / "customer_model.pkl",
            "supplier_risk": self.models_dir / "supplier_risk" / "supplier_model.pkl",
            "anomaly_detection": self.models_dir / "anomaly_detection" / "anomaly_model.pkl",
            "knowledge_graph": self.models_dir / "knowledge_graph" / "kg_model.pkl"
        }
        
        return model_paths.get(model_type)
    
    def generate_demo_forecast(self, sku_id: str, store_id: str, horizon: int) -> Dict[str, Any]:
        """Generate demo forecast data"""
        import random
        from datetime import datetime, timedelta
        
        forecast_dates = []
        forecast_values = []
        base_date = datetime.now()
        
        for i in range(horizon):
            forecast_date = base_date + timedelta(days=i+1)
            forecast_dates.append(forecast_date.strftime("%Y-%m-%d"))
            # Generate realistic-looking forecast with some randomness
            base_value = 100 + random.randint(-20, 30)
            forecast_values.append(base_value + random.randint(-10, 10))
        
        return {
            "sku_id": sku_id,
            "store_id": store_id,
            "forecast_dates": forecast_dates,
            "forecast_values": forecast_values,
            "confidence_intervals": [
                {"upper": v + 10, "lower": v - 10}
                for v in forecast_values
            ],
            "model_version": "demo-1.0.0",
            "timestamp": datetime.now().isoformat()
        }
    
    def generate_demo_metrics(self, sku_id: str, store_id: str) -> Dict[str, Any]:
        """Generate demo performance metrics"""
        return {
            "sku_id": sku_id,
            "store_id": store_id,
            "mape": 0.15 + np.random.random() * 0.05,
            "smape": 0.12 + np.random.random() * 0.04,
            "mae": 5.0 + np.random.random() * 2.0,
            "rmse": 7.0 + np.random.random() * 3.0,
            "crps": 0.08 + np.random.random() * 0.03,
            "timestamp": datetime.now().isoformat()
        }

# Global instance
demo_loader = DemoModelLoader()
