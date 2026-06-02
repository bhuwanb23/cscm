"""
Train gradient-boosted supplier risk model on synthetic data and save weights.
"""
import sys, os, pickle
import numpy as np
import pandas as pd
import logging

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

from supplier_risk.gradient_boosted import GradientBoostRiskModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'supplier_risk', 'weights')
os.makedirs(WEIGHTS_DIR, exist_ok=True)


def generate_data():
    np.random.seed(42)
    n = 500
    features = [
        'lead_time_days', 'reliability_score', 'price_volatility',
        'financial_health', 'geopolitical_risk', 'quality_defect_rate',
    ]

    df = pd.DataFrame({
        'lead_time_days': np.random.gamma(5, 2, n),
        'reliability_score': np.random.uniform(0.5, 1.0, n),
        'price_volatility': np.random.uniform(0, 0.4, n),
        'financial_health': np.random.uniform(0.3, 1.0, n),
        'geopolitical_risk': np.random.choice([0, 1, 2], n, p=[0.7, 0.2, 0.1]),
        'quality_defect_rate': np.random.exponential(0.02, n),
    })

    risk_score = (
        -0.3 * df['reliability_score']
        + 0.4 * df['price_volatility']
        - 0.3 * df['financial_health']
        + 0.3 * df['geopolitical_risk']
        + 2.0 * df['quality_defect_rate']
        + 0.02 * df['lead_time_days']
        + np.random.normal(0, 0.1, n)
    )
    df['event_flag'] = (risk_score > risk_score.median()).astype(int)

    return df, features


def main():
    logger.info("=== Supplier Risk Model Training ===")
    df, feature_cols = generate_data()
    logger.info(f"Generated {len(df)} supplier records")
    logger.info(f"Risk distribution: {(df['event_flag'] == 1).sum()} high, {(df['event_flag'] == 0).sum()} low")

    model = GradientBoostRiskModel(target_col='event_flag', random_state=42)
    model.fit(df, feature_cols=feature_cols)

    importances = model.feature_importance()
    logger.info(f"Feature importances: {importances}")

    model_path = os.path.join(WEIGHTS_DIR, "gradient_boost_risk.pkl")
    payload = {
        'model': model.model,
        'model_type': model.model_type,
        'scaler': model.scaler,
        'feature_cols': model.feature_cols,
        'categorical_cols': model.categorical_cols,
        'target_col': model.target_col,
        'random_state': model.random_state,
        'feature_importance': importances,
    }
    with open(model_path, 'wb') as f:
        pickle.dump(payload, f)
    logger.info(f"Model ({model.model_type}) saved to {model_path}")

    sample = df.sample(5, random_state=1)
    probs = model.predict_risk(sample)
    logger.info(f"Sample risk predictions: {probs.tolist()}")

    return model_path


if __name__ == "__main__":
    main()
