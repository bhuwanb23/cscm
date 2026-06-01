import logging
from typing import List, Optional
import sys
import os
from datetime import datetime
import numpy as np

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
sys.path.insert(0, _models_dir)

from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
from inventory_models import InventoryOptimizeRequest, InventoryOptimizeResponse, InventoryRecommendationRequest, InventoryRecommendationResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _load_sales_demand() -> np.ndarray:
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))
        from model_registry import get_registry
        reg = get_registry()
        reg.load_all_data()
        sales = reg.get_data("sales")
        if sales is not None and len(sales) > 0:
            qty = sales['sales_quantity'].values
            if len(qty) > 0:
                return qty.astype(float)
    except Exception as e:
        logger.warning(f"Could not load sales data: {e}")
    return np.array([100.0, 120.0, 90.0, 110.0, 130.0, 95.0, 105.0])


class InventoryOptimizationService:
    @staticmethod
    def optimize_inventory(request: InventoryOptimizeRequest) -> InventoryOptimizeResponse:
        try:
            logger.info(f"Optimizing inventory for SKU: {request.sku_id}, Store: {request.store_id}")

            if request.current_stock < 0:
                raise ValueError("Current stock cannot be negative")
            if request.lead_time_days < 0:
                raise ValueError("Lead time must be non-negative")
            if request.service_level <= 0 or request.service_level > 1:
                raise ValueError("Service level must be between 0 and 1")
            if request.holding_cost < 0:
                raise ValueError("Holding cost cannot be negative")
            if request.ordering_cost < 0:
                raise ValueError("Ordering cost cannot be negative")

            shortage_cost = request.holding_cost * 3.0
            model = EnhancedNewsvendorModel(
                holding_cost=request.holding_cost,
                shortage_cost=shortage_cost,
                distribution_type='normal',
            )

            forecast = np.array(request.demand_forecast, dtype=float) if request.demand_forecast else None

            if forecast is not None and len(forecast) > 0:
                historical_demand = forecast
            else:
                historical_demand = _load_sales_demand()

            model.fit(historical_demand=historical_demand, forecast=forecast)
            order_qty = model.predict_optimal_quantity()
            expected_cost = model.calculate_expected_cost(order_qty)

            demand_mean = float(np.mean(historical_demand))
            demand_std = request.demand_std_dev if request.demand_std_dev > 0 else float(np.std(historical_demand))

            import scipy.stats as stats
            z_score = stats.norm.ppf(request.service_level)
            safety_stock = z_score * demand_std * np.sqrt(float(request.lead_time_days))
            reorder_point = demand_mean * request.lead_time_days + safety_stock

            response = InventoryOptimizeResponse(
                sku_id=request.sku_id,
                store_id=request.store_id,
                reorder_point=round(reorder_point, 2),
                order_quantity=round(order_qty, 2),
                safety_stock=round(safety_stock, 2),
                total_cost=round(expected_cost, 2),
                model_version="newsvendor_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z",
            )

            logger.info(f"Optimized: reorder_point={response.reorder_point}, order_qty={response.order_quantity}, safety={response.safety_stock}")
            return response

        except Exception as e:
            logger.error(f"Error optimizing inventory: {str(e)}")
            raise

    @staticmethod
    def get_recommendation(request: InventoryRecommendationRequest) -> InventoryRecommendationResponse:
        try:
            logger.info(f"Generating recommendation for SKU: {request.sku_id}, Store: {request.store_id}")

            if request.current_stock < 0:
                raise ValueError("Current stock cannot be negative")
            if request.days_to_review <= 0:
                raise ValueError("Days to review must be positive")

            model = EnhancedNewsvendorModel(holding_cost=5.0, shortage_cost=15.0)
            demand_data = _load_sales_demand()
            model.fit(historical_demand=demand_data)

            avg_daily_demand = float(np.mean(demand_data))
            demand_std = float(np.std(demand_data))
            lead_time_days = 7

            import scipy.stats as stats
            z_score = stats.norm.ppf(0.95)
            safety_stock = z_score * demand_std * np.sqrt(lead_time_days)
            reorder_point = avg_daily_demand * lead_time_days + safety_stock

            projected_consumption = avg_daily_demand * request.days_to_review
            projected_stock = request.current_stock - projected_consumption
            projected_stock_days = int(request.current_stock / avg_daily_demand) if avg_daily_demand > 0 else 0

            if request.current_stock <= reorder_point:
                recommended_action = "ORDER"
                order_qty = int(model.predict_optimal_quantity())
            else:
                recommended_action = "HOLD"
                order_qty = None

            stockout_risk = round(stats.norm.cdf((reorder_point - request.current_stock) / (demand_std * np.sqrt(lead_time_days))), 4)
            surplus_risk = round(1.0 - stockout_risk, 4)

            response = InventoryRecommendationResponse(
                sku_id=request.sku_id,
                store_id=request.store_id,
                recommended_action=recommended_action,
                order_quantity=order_qty,
                expected_stockout_risk=stockout_risk,
                expected_surplus_risk=surplus_risk,
                projected_stock_days=projected_stock_days,
                model_version="newsvendor_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z",
            )

            logger.info(f"Recommendation: {recommended_action} (stock={request.current_stock}, reorder_point={reorder_point:.0f})")
            return response

        except Exception as e:
            logger.error(f"Error generating recommendation: {str(e)}")
            raise
