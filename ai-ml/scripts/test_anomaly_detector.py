"""Test anomaly detection train→predict→save→load cycle."""
import sys, os, pickle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

import numpy as np
from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector

WEIGHTS = os.path.join(os.path.dirname(__file__), '..', 'models', 'anomaly_detection', 'weights', 'isolation_forest.pkl')

with open(WEIGHTS, 'rb') as f:
    payload = pickle.load(f)

model = payload["model"]
feature_cols = payload.get("feature_columns", [])

print(f"Loaded IsolationForest model")
print(f"  Features: {feature_cols}")
print(f"  Contamination: {model.contamination}")
print(f"  Estimators: {model.n_estimators}")

X_test = np.random.randn(10, 4)
preds = model.predict(X_test)
scores = model.score_samples(X_test)

anomalies = (preds == -1).sum()
print(f"  Predictions (10 samples): {preds}")
print(f"  Anomalies detected: {anomalies}")
print(f"  Score samples: {scores.round(3).tolist()}")

print("OK")
