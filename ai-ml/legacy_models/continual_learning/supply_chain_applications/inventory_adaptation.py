"""
Inventory Policy Adaptation for Supply Chain Applications

This module implements dynamic safety stock adjustment, replenishment
strategy evolution, multi-echelon coordination, and cost structure
adaptation using continual learning for supply chain inventory management.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SafetyStockOptimizer:
    """
    Dynamically adjusts safety stock levels based on demand volatility,
    service level targets, and supply variability using continual learning.
    """

    def __init__(self,
                 sku: str,
                 target_service_level: float = 0.95,
                 lead_time_days: int = 7,
                 window_size: int = 90,
                 min_safety_stock: int = 0):
        self.sku = sku
        self.target_service_level = target_service_level
        self.lead_time_days = lead_time_days
        self.window_size = window_size
        self.min_safety_stock = min_safety_stock

        self.demand_history = deque(maxlen=window_size)
        self.lead_time_history = deque(maxlen=window_size)
        self.service_level_history: List[float] = []
        self.safety_stock_level = 0
        self.z_score = self._compute_z_score(target_service_level)

    def _compute_z_score(self, service_level: float) -> float:
        from scipy import stats
        return float(stats.norm.ppf(service_level))

    def update(self, demand: float, lead_time: float) -> Dict[str, Any]:
        self.demand_history.append(demand)
        self.lead_time_history.append(lead_time)

        if len(self.demand_history) < 14:
            return {'status': 'insufficient_data', 'observations': len(self.demand_history)}

        demand_arr = np.array(self.demand_history)
        lead_arr = np.array(self.lead_time_history)

        demand_mean = np.mean(demand_arr)
        demand_std = np.std(demand_arr)
        avg_lead_time = np.mean(lead_arr)

        lead_demand = demand_mean * avg_lead_time
        lead_demand_std = demand_std * np.sqrt(avg_lead_time)

        self.safety_stock_level = max(self.min_safety_stock, int(self.z_score * lead_demand_std))

        actual_service = self._compute_actual_service_level(demand_arr)
        self.service_level_history.append(actual_service)

        service_gap = self.target_service_level - actual_service
        if abs(service_gap) > 0.02:
            self.z_score = self._compute_z_score(self.target_service_level + service_gap * 0.1)

        return {
            'sku': self.sku,
            'safety_stock': self.safety_stock_level,
            'demand_mean': float(demand_mean),
            'demand_std': float(demand_std),
            'avg_lead_time': float(avg_lead_time),
            'service_level': float(actual_service),
            'service_gap': float(service_gap),
            'observations': len(self.demand_history),
        }

    def _compute_actual_service_level(self, demand: np.ndarray) -> float:
        if len(demand) < 30:
            return 0.95
        forecast = np.mean(demand[-self.lead_time_days:])
        stockout = np.sum(demand[-self.lead_time_days:] > (forecast + self.safety_stock_level))
        return 1.0 - stockout / min(len(demand), self.lead_time_days)

    def get_state(self) -> Dict[str, Any]:
        return {
            'sku': self.sku,
            'safety_stock': self.safety_stock_level,
            'target_service_level': self.target_service_level,
            'z_score': float(self.z_score),
            'lead_time_days': self.lead_time_days,
        }


class ReplenishmentStrategy:
    """
    Evolves replenishment strategies based on demand patterns,
    supplier reliability, and cost structures using reinforcement
    learning concepts.
    """

    def __init__(self,
                 sku: str,
                 reorder_point: int = 100,
                 order_quantity: int = 500,
                 holding_cost: float = 0.15,
                 ordering_cost: float = 50.0):
        self.sku = sku
        self.reorder_point = reorder_point
        self.order_quantity = order_quantity
        self.holding_cost = holding_cost
        self.ordering_cost = ordering_cost

        self.inventory_level = reorder_point + order_quantity
        self.total_holding_cost = 0.0
        self.total_ordering_cost = 0.0
        self.total_stockouts = 0
        self.order_history: List[Dict[str, Any]] = []
        self.strategy_iteration = 0

    def evaluate_action(self, demand: float, current_stock: float) -> Dict[str, Any]:
        self.inventory_level = current_stock
        stockout = max(0, demand - self.inventory_level)

        if stockout > 0:
            self.total_stockouts += 1
            self.inventory_level = 0
        else:
            self.inventory_level -= demand

        holding = self.inventory_level * self.holding_cost
        self.total_holding_cost += holding

        should_reorder = self.inventory_level <= self.reorder_point

        result = {
            'sku': self.sku,
            'inventory_after': self.inventory_level,
            'stockout': stockout > 0,
            'stockout_units': float(stockout),
            'holding_cost': float(holding),
            'should_reorder': should_reorder,
            'reorder_point': self.reorder_point,
        }

        if should_reorder:
            order_result = self._place_order()
            result['order'] = order_result
            self.inventory_level += self.order_quantity

        self.order_history.append(result)
        return result

    def _place_order(self) -> Dict[str, Any]:
        cost = self.ordering_cost
        self.total_ordering_cost += cost
        self.strategy_iteration += 1
        return {
            'order_number': self.strategy_iteration,
            'quantity': self.order_quantity,
            'cost': cost,
        }

    def adapt_strategy(self, demand_volatility: float, avg_demand: float):
        if demand_volatility > 0.3:
            self.reorder_point = int(self.reorder_point * 1.1)
            self.order_quantity = int(self.order_quantity * 1.05)
        elif demand_volatility < 0.1:
            self.reorder_point = max(10, int(self.reorder_point * 0.95))
            self.order_quantity = max(50, int(self.order_quantity * 0.95))

        if avg_demand > 0:
            target_coverage = 14
            self.reorder_point = max(10, int(avg_demand * 7))
            self.order_quantity = max(50, int(avg_demand * target_coverage))

        logger.info(f"Strategy adapted: reorder_point={self.reorder_point}, "
                    f"order_qty={self.order_quantity}")

    def get_state(self) -> Dict[str, Any]:
        total_cost = self.total_holding_cost + self.total_ordering_cost
        return {
            'sku': self.sku,
            'reorder_point': self.reorder_point,
            'order_quantity': self.order_quantity,
            'total_cost': float(total_cost),
            'stockouts': self.total_stockouts,
            'orders_placed': self.strategy_iteration,
        }


class InventoryAdaptationManager:
    """
    Integrated manager combining safety stock optimization and
    replenishment strategy evolution for adaptive inventory management.
    """

    def __init__(self, sku: str, target_service_level: float = 0.95):
        self.safety_stock = SafetyStockOptimizer(sku, target_service_level)
        self.replenishment = ReplenishmentStrategy(sku)
        self.sku = sku
        self.adaptation_history: List[Dict[str, Any]] = []

    def update(self, demand: float, lead_time: float, current_stock: float) -> Dict[str, Any]:
        ss_result = self.safety_stock.update(demand, lead_time)

        repl_result = self.replenishment.evaluate_action(demand, current_stock)

        if ss_result.get('status') != 'insufficient_data':
            demand_arr = np.array(self.safety_stock.demand_history)
            volatility = float(np.std(demand_arr) / (np.mean(demand_arr) + 1e-10))
            avg_demand = float(np.mean(demand_arr))
            self.replenishment.adapt_strategy(volatility, avg_demand)

        combined = {
            'sku': self.sku,
            'safety_stock_update': ss_result,
            'replenishment_update': repl_result,
        }
        self.adaptation_history.append(combined)
        return combined

    def get_state(self) -> Dict[str, Any]:
        return {
            'safety_stock': self.safety_stock.get_state(),
            'replenishment': self.replenishment.get_state(),
            'total_updates': len(self.adaptation_history),
        }


if __name__ == "__main__":
    np.random.seed(42)
    manager = InventoryAdaptationManager(sku="SKU-001", target_service_level=0.95)

    for day in range(60):
        base_demand = 100 + 10 * np.sin(2 * np.pi * day / 7)
        demand = max(0, base_demand + np.random.randn() * 20)
        lead_time = 7 + np.random.randn() * 2
        stock = max(0, 600 - np.random.randint(0, 50))

        result = manager.update(demand, max(1, lead_time), stock)

        if (day + 1) % 20 == 0:
            state = manager.get_state()
            print(f"Day {day+1}: SS={state['safety_stock']['safety_stock']}, "
                  f"RP={state['replenishment']['reorder_point']}, "
                  f"OQ={state['replenishment']['order_quantity']}")
