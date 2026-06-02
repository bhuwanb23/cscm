"""
Train the DemandForecaster on processed data and save weights.
"""
import sys, os
import pandas as pd
import numpy as np
import logging
import pickle

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from demand_forecasting.model import DemandForecaster

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'demand_forecasting', 'weights')
os.makedirs(WEIGHTS_DIR, exist_ok=True)


def generate_synthetic_data(n_days=365, n_skus=3, n_stores=3, column_template=None):
    """Generate realistic daily sales data for training, matching column_template columns."""
    rows = []
    np.random.seed(42)
    base_date = pd.Timestamp("2023-01-01")

    has_stockout = column_template and "stockout_flag" in column_template
    has_promo = column_template and "promotion_flag" in column_template
    has_holiday = column_template and "is_holiday" in column_template
    has_price = column_template and "regular_price" in column_template
    has_inv = column_template and "inventory_on_hand" in column_template if column_template else True
    has_reorder = column_template and "reorder_point" in column_template if column_template else True
    has_maxstock = column_template and "max_stock_level" in column_template if column_template else True
    has_markdown = column_template and "markdown_rate" in column_template if column_template else True

    for sku in range(1, n_skus + 1):
        for store in range(1, n_stores + 1):
            base_demand = np.random.uniform(30, 120)
            trend = np.random.uniform(-0.02, 0.05)

            for i in range(n_days):
                date = base_date + pd.Timedelta(days=i)
                weekday = date.weekday()

                seasonal = 1.0 + 0.3 * np.sin(2 * np.pi * weekday / 7)
                noise = np.random.normal(0, 0.15)
                trend_factor = 1.0 + trend * i
                value = base_demand * seasonal * trend_factor * (1 + noise)
                value = max(value, 1)

                row = {
                    "date": date.strftime("%Y-%m-%d"),
                    "sku_id": sku,
                    "store_id": store,
                    "sales_quantity": round(value, 1),
                    "sales_amount": round(value * np.random.uniform(8, 15), 2),
                    "unit_price": round(np.random.uniform(8, 15), 2),
                }

                if has_inv:
                    row["inventory_on_hand"] = round(np.random.uniform(50, 500))
                if has_reorder:
                    row["reorder_point"] = round(np.random.uniform(20, 60))
                if has_maxstock:
                    row["max_stock_level"] = round(np.random.uniform(200, 800))
                if has_stockout:
                    row["stockout_flag"] = bool(np.random.random() < 0.05)
                if has_price:
                    row["regular_price"] = round(np.random.uniform(10, 18), 2)
                    row["actual_price"] = round(np.random.uniform(8, 16), 2)
                if has_promo:
                    row["promotion_flag"] = bool(np.random.random() < 0.15)
                if has_markdown:
                    row["markdown_rate"] = round(np.random.uniform(0, 0.3), 3)
                if has_holiday:
                    row["is_holiday"] = bool(date.strftime("%m-%d") in ("01-01", "12-25", "07-04"))

                if column_template:
                    for col in column_template:
                        if col not in row:
                            row[col] = 0

                rows.append(row)

    return pd.DataFrame(rows)


def main():
    logger.info("=== Demand Forecaster Training ===")

    integrated_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'integrated_dataset.csv')

    if os.path.exists(integrated_path):
        real_df = pd.read_csv(integrated_path)
        logger.info(f"Loaded real integrated data: {len(real_df)} rows")
    else:
        real_df = None
        logger.info("No integrated dataset found")

    synth_df = generate_synthetic_data()
    logger.info(f"Generated synthetic data: {len(synth_df)} rows")

    common_cols = list(set(synth_df.columns) & set(real_df.columns)) if real_df is not None else list(synth_df.columns)
    train_df = synth_df[list(synth_df.columns)]

    logger.info(f"Training dataset: {len(train_df)} rows, {len(train_df.columns)} cols")

    forecaster = DemandForecaster(model_type="random_forest")
    forecaster.train(train_df)

    model_path = os.path.join(WEIGHTS_DIR, "demand_forecaster_rf.pkl")

    numerical = train_df.select_dtypes(include=[np.number])
    feature_medians = {}
    for col in forecaster.feature_columns:
        if col in numerical.columns and col != forecaster.target_column:
            feature_medians[col] = float(numerical[col].median())
        else:
            feature_medians[col] = 0.0

    payload = {
        "model": forecaster.model,
        "feature_columns": forecaster.feature_columns,
        "target_column": forecaster.target_column,
        "model_type": forecaster.model_type,
        "feature_medians": feature_medians,
    }

    with open(model_path, "wb") as f:
        pickle.dump(payload, f)

    logger.info(f"Model saved to {model_path}")
    logger.info(f"Features ({len(forecaster.feature_columns)}): {forecaster.feature_columns}")
    logger.info(f"Target: {forecaster.target_column}")

    try:
        test_sample = train_df.drop(columns=[c for c in train_df.columns if c.endswith("_lag_30") or c.endswith("_roll_30_")], errors="ignore").tail(10)
        preds = forecaster.predict(test_sample)
        logger.info(f"Sample predictions: {preds[:5].tolist()}")
    except Exception as e:
        logger.warning(f"Sample predict skipped (expected with small data): {e}")

    return model_path


if __name__ == "__main__":
    main()
