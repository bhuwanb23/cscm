"""
Train inventory optimization models and save weights.
"""
import sys, os, pickle
import pandas as pd
import numpy as np
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

from inventory_optimization.stochastic_models.newsvendor import EnhancedNewsvendorModel
from inventory_optimization.stochastic_models.ss_policy import SSPolicyModel
from inventory_optimization.stochastic_models.stochastic_optimizer import StochasticInventoryOptimizer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'inventory_optimization', 'weights')
os.makedirs(WEIGHTS_DIR, exist_ok=True)
os.makedirs(os.path.join(WEIGHTS_DIR, '..', '..', 'demand_forecasting', 'weights'), exist_ok=True)


def generate_demand_data(n=365):
    np.random.seed(42)
    base = 100
    trend = np.linspace(0, 10, n)
    seasonal = 30 * np.sin(2 * np.pi * np.arange(n) / 7)
    noise = np.random.normal(0, 15, n)
    return base + trend * 0.01 + seasonal * 0.3 + noise


def main():
    logger.info("=== Training Inventory Optimization Models ===")

    demand = generate_demand_data()
    logger.info(f"Generated {len(demand)} demand data points (mean={demand.mean():.1f}, std={demand.std():.1f})")

    # --- Enhanced Newsvendor Model ---
    nv_params = {"holding_cost": 5.0, "shortage_cost": 15.0, "distribution_type": "normal"}
    nv_model = EnhancedNewsvendorModel(**nv_params)
    nv_model.fit(historical_demand=demand, forecast=None)
    logger.info(f"Newsvendor fitted — optimal qty: {nv_model.optimal_order_quantity:.2f}")
    nv_path = os.path.join(WEIGHTS_DIR, "newsvendor_default.pkl")
    with open(nv_path, "wb") as f:
        pickle.dump({"model": nv_model, "params": nv_params, "demand_stats": {"mean": float(demand.mean()), "std": float(demand.std())}}, f)
    logger.info(f"Saved: {nv_path}")

    # --- SS Policy Model ---
    ss_defaults = []
    for holding_cost in [3.0, 5.0, 10.0]:
        for ordering_cost in [25.0, 50.0, 100.0]:
            shortage_cost = holding_cost * 3
            for service_level in [0.90, 0.95, 0.99]:
                ss = SSPolicyModel(holding_cost=holding_cost, ordering_cost=ordering_cost,
                                   shortage_cost=shortage_cost, lead_time=1, distribution_type="normal")
                ss.fit(historical_demand=demand)
                ss_defaults.append({
                    "holding_cost": holding_cost, "ordering_cost": ordering_cost,
                    "shortage_cost": shortage_cost, "service_level": service_level,
                    "s": float(ss.reorder_point), "S": float(ss.order_up_to_level),
                })
    ss_df = pd.DataFrame(ss_defaults)
    ss_path = os.path.join(WEIGHTS_DIR, "ss_policy_lookup.pkl")
    with open(ss_path, "wb") as f:
        pickle.dump({"ss_entries": ss_defaults, "demand_stats": {"mean": float(demand.mean()), "std": float(demand.std())}}, f)
    logger.info(f"Saved {len(ss_defaults)} SS policy entries: {ss_path}")

    # --- Stochastic Inventory Optimizer ---
    try:
        stoch = StochasticInventoryOptimizer(holding_cost=5.0, ordering_cost=50.0, shortage_cost=15.0)
        # Stochastic optimizer is an analytical model fitted per-request; save config only
        stoch_path = os.path.join(WEIGHTS_DIR, "stochastic_optimizer_default.pkl")
        with open(stoch_path, "wb") as f:
            pickle.dump({"demand_stats": {"mean": float(demand.mean()), "std": float(demand.std())}}, f)
        logger.info(f"Saved config: {stoch_path}")
    except Exception as e:
        logger.warning(f"Stochastic optimizer skipped: {e}")

    logger.info("=== Inventory model training complete ===")


if __name__ == "__main__":
    main()
