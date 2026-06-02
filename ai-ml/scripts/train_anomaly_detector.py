"""
Train Isolation Forest anomaly detector on synthetic data and save weights.
"""
import sys, os, pickle
import numpy as np
import pandas as pd
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

from anomaly_detection.unsupervised import IsolationForestDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'anomaly_detection', 'weights')
os.makedirs(WEIGHTS_DIR, exist_ok=True)


def generate_data():
    np.random.seed(42)
    n_normal = 500
    n_anomaly = 20
    columns = ['sales_quantity', 'inventory_on_hand', 'price', 'temperature']

    normal = pd.DataFrame({
        'sales_quantity': np.random.normal(200, 40, n_normal),
        'inventory_on_hand': np.random.normal(500, 100, n_normal),
        'price': np.random.normal(15, 3, n_normal),
        'temperature': np.random.normal(25, 8, n_normal),
    })

    anomalies = pd.DataFrame({
        'sales_quantity': np.random.uniform(0, 10, n_anomaly),
        'inventory_on_hand': np.random.uniform(5000, 10000, n_anomaly),
        'price': np.random.uniform(100, 500, n_anomaly),
        'temperature': np.random.uniform(-20, 60, n_anomaly),
    })

    df = pd.concat([normal, anomalies], ignore_index=True)
    return df, columns


def main():
    logger.info("=== Anomaly Detection Training ===")
    df, feature_cols = generate_data()
    logger.info(f"Generated {len(df)} rows ({len(df) - 20} normal, 20 anomalies)")

    X = df[feature_cols].values

    detector = IsolationForestDetector(
        contamination=0.05,
        n_estimators=100,
        random_state=42,
    )
    detector.fit(X, feature_names=feature_cols)

    preds, scores, info = detector.detect_anomalies(X)
    n_found = int((preds == -1).sum())
    logger.info(f"Detected {n_found} anomalies in training data")

    model_path = os.path.join(WEIGHTS_DIR, "isolation_forest.pkl")
    detector.save(model_path)

    with open(model_path, 'rb') as f:
        saved = pickle.load(f)
    logger.info(f"Verified: {len(saved['feature_names'])} features, contamination={saved['contamination']}")
    logger.info(f"Model saved to {model_path}")

    return model_path


if __name__ == "__main__":
    main()
