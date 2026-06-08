"""
Inventory Risk Estimation for Supply Chain Risk Assessment

This module provides safety stock computation, inventory risk scoring,
and stockout probability estimation under demand and lead time uncertainty
for supply chain inventory management.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SafetyStockComputer:
    """
    Computes optimal safety stock levels given demand uncertainty,
    lead time variability, and target service levels.
    """

    def __init__(self,
                 lead_time_mean: float = 7.0,
                 lead_time_std: float = 2.0,
                 target_service_level: float = 0.95,
                 review_period: float = 1.0):
        self.lead_time_mean = lead_time_mean
        self.lead_time_std = lead_time_std
        self.target_service_level = target_service_level
        self.review_period = review_period
        self.z_score = self._compute_z(service_level=target_service_level)

    def _compute_z(self, service_level: Optional[float] = None) -> float:
        from scipy import stats
        sl = service_level if service_level is not None else self.target_service_level
        return float(stats.norm.ppf(sl))

    def compute(self, demand_mean: float, demand_std: float,
                lead_time: Optional[float] = None,
                lead_time_std: Optional[float] = None,
                service_level: Optional[float] = None) -> Dict[str, Any]:
        lt = lead_time if lead_time is not None else self.lead_time_mean
        lt_std = lead_time_std if lead_time_std is not None else self.lead_time_std
        z = self._compute_z(service_level) if service_level is not None else self.z_score

        lead_time_demand = demand_mean * lt
        demand_during_lead_time_std = np.sqrt(
            lt * demand_std ** 2 + demand_mean ** 2 * lt_std ** 2
        )
        safety_stock = z * demand_during_lead_time_std
        reorder_point = lead_time_demand + safety_stock

        return {
            'safety_stock': float(safety_stock),
            'reorder_point': float(reorder_point),
            'lead_time_demand': float(lead_time_demand),
            'demand_during_lt_std': float(demand_during_lead_time_std),
            'z_score': float(z),
            'service_level': service_level or self.target_service_level,
        }

    def stockout_probability(self, current_stock: float,
                             demand_mean: float, demand_std: float,
                             lead_time: float) -> float:
        from scipy import stats
        lt_demand = demand_mean * lead_time
        lt_std = np.sqrt(lead_time * demand_std ** 2)
        z = (current_stock - lt_demand) / max(lt_std, 1e-10)
        prob = float(stats.norm.cdf(-z))
        return prob

    def update_service_level(self, new_service_level: float):
        self.target_service_level = new_service_level
        self.z_score = self._compute_z()
        logger.info(f"Safety stock service level updated to {new_service_level:.2f}")


class InventoryRiskEstimator:
    """
    Estimates inventory risk by combining demand uncertainty, lead time
    variability, and cost structure to compute risk-adjusted metrics.
    """

    def __init__(self,
                 sku: str,
                 unit_cost: float = 100.0,
                 holding_cost_pct: float = 0.15,
                 stockout_cost: float = 200.0):
        self.sku = sku
        self.unit_cost = unit_cost
        self.holding_cost_pct = holding_cost_pct
        self.stockout_cost = stockout_cost
        self.risk_history: List[Dict[str, Any]] = []
        self.safety_stock_computer = SafetyStockComputer()

    def estimate_risk(self, current_stock: float, demand_mean: float,
                      demand_std: float, lead_time: float) -> Dict[str, Any]:
        ss_result = self.safety_stock_computer.compute(demand_mean, demand_std, lead_time)
        stockout_prob = self.safety_stock_computer.stockout_probability(
            current_stock, demand_mean, demand_std, lead_time
        )

        expected_shortage = stockout_prob * demand_mean * lead_time
        expected_stockout_cost = expected_shortage * self.stockout_cost

        avg_inventory = (current_stock + max(0, current_stock - demand_mean * lead_time)) / 2
        holding_cost = avg_inventory * self.unit_cost * self.holding_cost_pct

        total_risk_cost = expected_stockout_cost + holding_cost
        risk_score = min(1.0, stockout_prob * 2.0)

        safety_deficit = max(0, ss_result['safety_stock'] - current_stock)
        risk_level = 'low' if risk_score < 0.3 else 'medium' if risk_score < 0.6 else 'high'

        result = {
            'sku': self.sku,
            'risk_score': risk_score,
            'risk_level': risk_level,
            'stockout_probability': stockout_prob,
            'safety_stock_required': ss_result['safety_stock'],
            'safety_stock_deficit': safety_deficit,
            'expected_stockout_cost': expected_stockout_cost,
            'holding_cost': holding_cost,
            'total_risk_cost': total_risk_cost,
        }
        self.risk_history.append(result)
        return result

    def get_risk_trend(self) -> Dict[str, Any]:
        if len(self.risk_history) < 2:
            return {'trend': 'insufficient_data', 'avg_risk': 0.0}
        recent = np.mean([r['risk_score'] for r in self.risk_history[-10:]])
        earlier = np.mean([r['risk_score'] for r in self.risk_history[:-10]]) if len(self.risk_history) > 10 else 0.0
        trend = 'increasing' if recent > earlier + 0.05 else 'decreasing' if recent < earlier - 0.05 else 'stable'
        return {'trend': trend, 'avg_risk': float(recent), 'samples': len(self.risk_history)}

    def get_state(self) -> Dict[str, Any]:
        return {
            'sku': self.sku,
            'unit_cost': self.unit_cost,
            'holding_cost_pct': self.holding_cost_pct,
            'stockout_cost': self.stockout_cost,
            'assessments': len(self.risk_history),
            'last_risk': self.risk_history[-1] if self.risk_history else None,
        }


if __name__ == "__main__":
    np.random.seed(42)
    ss = SafetyStockComputer(lead_time_mean=7, lead_time_std=2, target_service_level=0.95)
    result = ss.compute(demand_mean=100, demand_std=20)
    print(f"Safety stock: {result['safety_stock']:.1f}, Reorder point: {result['reorder_point']:.1f}")
    prob = ss.stockout_probability(current_stock=500, demand_mean=100, demand_std=20, lead_time=7)
    print(f"Stockout probability: {prob:.4f}")

    estimator = InventoryRiskEstimator(sku="SKU-001")
    for _ in range(15):
        risk = estimator.estimate_risk(
            current_stock=np.random.randint(300, 800),
            demand_mean=100, demand_std=20 + np.random.rand() * 10,
            lead_time=7 + np.random.randn(),
        )
    print(f"Risk level: {risk['risk_level']}, Score: {risk['risk_score']:.3f}")
    print(f"Trend: {estimator.get_risk_trend()}")
