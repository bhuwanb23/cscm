"""
Model Registry — startup data loader and model cache for CSCM AI/ML API.

Loads CSV data from data/raw/ at startup, pre-trains models that require
historical data (DemandForecaster, GradientBoostRiskModel, etc.), and
provides a clean get_model() / get_data() API for all services.
"""
import os
import sys
import logging
from typing import Any, Dict, Optional
from datetime import datetime

import pandas as pd
import numpy as np

# Add project paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))

# Lazy imports for model classes (imported only when needed)
logger = logging.getLogger("CSCM.ModelRegistry")


class ModelRegistry:
    """Singleton registry that caches datasets and pre-trained models."""

    def __init__(self):
        self._data: Dict[str, pd.DataFrame] = {}
        self._models: Dict[str, Any] = {}
        self._initialized = False
        self._raw_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw')
        self._processed_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'processed')

    # ── Data loading ──────────────────────────────────────────

    def load_all_data(self):
        """Load all CSV data files from data/raw/ into memory."""
        if self._initialized:
            return
        logger.info("Loading raw data files...")

        csv_files = {
            "sales": "sales.csv",
            "inventory": "inventory.csv",
            "stores": "stores.csv",
            "products": "products.csv",
            "prices": "prices.csv",
            "weather": "weather.csv",
            "events": "events.csv",
            "macro": "macro_indices.csv",
        }

        for key, filename in csv_files.items():
            path = os.path.join(self._raw_path, filename)
            if os.path.exists(path):
                try:
                    df = pd.read_csv(path)
                    self._data[key] = df
                    logger.info(f"  Loaded {filename}: {len(df)} rows, {list(df.columns)}")
                except Exception as e:
                    logger.warning(f"  Failed to load {filename}: {e}")
            else:
                logger.warning(f"  File not found: {filename}")

        self._initialized = True
        logger.info(f"Data loading complete. {len(self._data)} tables loaded.")

    def get_data(self, name: str) -> Optional[pd.DataFrame]:
        """Return a cached dataframe by name."""
        return self._data.get(name)

    # ── Model pre-training ────────────────────────────────────

    def _ensure_initialized(self):
        if not self._initialized:
            self.load_all_data()

    def get_or_train_demand_forecaster(self, force_retrain: bool = False):
        from demand_forecasting.model import DemandForecaster

        cache_key = "demand_forecaster"
        if cache_key in self._models and not force_retrain:
            return self._models[cache_key]

        sales = self.get_data("sales")
        if sales is None or sales.empty:
            logger.warning("No sales data available; creating untrained DemandForecaster")
            model = DemandForecaster()
            self._models[cache_key] = model
            return model

        logger.info("Pre-training DemandForecaster from sales data...")
        model = DemandForecaster()
        try:
            # Sales CSV has: date, hour, sku_id, store_id, sales_quantity, sales_amount, unit_price
            df = sales.copy()
            # Aggregate hourly sales to daily for forecasting
            df['date'] = pd.to_datetime(df['date'])
            daily = df.groupby(['date', 'sku_id', 'store_id'], as_index=False)['sales_quantity'].sum()
            daily.rename(columns={'sales_quantity': 'sales'}, inplace=True)
            daily['product_id'] = daily['sku_id']

            model.train(daily, target_column='sales')
            logger.info("DemandForecaster pre-trained successfully")
        except Exception as e:
            logger.error(f"Failed to pre-train DemandForecaster: {e}")

        self._models[cache_key] = model
        return model

    def get_or_train_anomaly_detector(self, force_retrain: bool = False):
        from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector

        cache_key = "anomaly_detector"
        if cache_key in self._models and not force_retrain:
            return self._models[cache_key]

        logger.info("Pre-training baseline IsolationForestDetector...")
        model = IsolationForestDetector(contamination=0.1)
        try:
            inventory = self.get_data("inventory")
            if inventory is not None and len(inventory) > 5:
                numeric_cols = inventory.select_dtypes(include=[np.number]).columns.tolist()
                if 'stockout_flag' in numeric_cols:
                    numeric_cols.remove('stockout_flag')
                X = inventory[numeric_cols].dropna().values
                if len(X) > 5:
                    model.fit(X)
                    logger.info(f"Baseline anomaly detector trained on {len(X)} inventory samples")
        except Exception as e:
            logger.warning(f"Could not pre-train anomaly detector: {e}")

        self._models[cache_key] = model
        return model

    def get_or_train_supplier_risk_model(self, force_retrain: bool = False):
        from supplier_risk.gradient_boosted.risk_predictor import GradientBoostRiskModel

        cache_key = "supplier_risk"
        if cache_key in self._models and not force_retrain:
            return self._models[cache_key]

        model = GradientBoostRiskModel(target_col="event_flag")
        self._models[cache_key] = model
        logger.info("Supplier risk model initialized (requires per-request training data)")
        return model

    # ── Generic access ────────────────────────────────────────

    def get_model(self, key: str) -> Optional[Any]:
        return self._models.get(key)

    def register_model(self, key: str, model: Any):
        self._models[key] = model


# Module-level singleton
_registry: Optional[ModelRegistry] = None


def get_registry() -> ModelRegistry:
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry


def init_registry():
    reg = get_registry()
    reg.load_all_data()
    reg.get_or_train_demand_forecaster()
    reg.get_or_train_anomaly_detector()
    reg.get_or_train_supplier_risk_model()
    logger.info("ModelRegistry fully initialized")
    return reg
