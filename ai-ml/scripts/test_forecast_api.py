"""Test the demand forecast router's model loading and prediction."""
import sys, os, importlib.util

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api', 'models'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'api'))

router_path = os.path.normpath(os.path.join(
    os.path.dirname(__file__), '..', 'api', 'routers', 'demand_forecasting.py'))
spec = importlib.util.spec_from_file_location("demand_forecasting", router_path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

class R:
    sku_id = "1"
    store_id = "1"
    forecast_horizon = 7
    include_confidence_intervals = True

resp = mod.DemandForecastingService.get_forecast(R())
print(f"Forecast values: {resp.forecast_values}")
print(f"Model version: {resp.model_version}")
print(f"CI: {resp.confidence_intervals}")
print("All types JSON-safe:", all(isinstance(v, (int, float)) for v in resp.forecast_values))
