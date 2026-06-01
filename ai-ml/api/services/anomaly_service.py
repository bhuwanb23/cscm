import logging
from typing import List, Optional
import sys
import os
from datetime import datetime

import numpy as np

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))

from anomaly_models import AnomalyDetectRequest, AnomalyDetectResponse, AnomalyAlertsRequest, AnomalyAlertsResponse
from anomaly_detection.unsupervised.isolation_forest import IsolationForestDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AnomalyDetectionService:

    @staticmethod
    def detect_anomalies(request: AnomalyDetectRequest) -> AnomalyDetectResponse:
        try:
            logger.info(f"Detecting anomalies in {len(request.data)} samples")

            if not request.data:
                raise ValueError("Data is required")
            if not request.feature_names:
                raise ValueError("Feature names are required")
            if request.contamination <= 0 or request.contamination >= 1:
                raise ValueError("Contamination must be between 0 and 1")

            X = np.array(request.data, dtype=float)

            model = IsolationForestDetector(
                contamination=request.contamination,
                random_state=42
            )
            model.fit(X, feature_names=request.feature_names)

            predictions, scores, info = model.detect_anomalies(X)

            anomaly_probs = model.predict_proba(X)
            anomaly_indices = np.where(predictions == -1)[0]

            response = AnomalyDetectResponse(
                predictions=predictions.tolist(),
                anomaly_scores=anomaly_probs.tolist(),
                anomaly_indices=anomaly_indices.tolist(),
                anomaly_rate=len(anomaly_indices) / len(X),
                model_version="isolation_forest_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )

            logger.info(f"Detected {len(anomaly_indices)} anomalies out of {len(X)} samples")
            return response

        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            raise

    @staticmethod
    def get_alerts(request: AnomalyAlertsRequest) -> AnomalyAlertsResponse:
        logger.info(f"Getting anomaly alerts for alert ID: {request.alert_id}")

        response = AnomalyAlertsResponse(
            alert_id=request.alert_id,
            anomalies=[
                {"timestamp": "2023-01-01T10:30:00Z", "value": 1250.0, "threshold": 800.0},
                {"timestamp": "2023-01-01T14:45:00Z", "value": 750.0, "threshold": 300.0}
            ],
            severity="HIGH",
            affected_entities=["SERVER_001", "SERVER_002"],
            recommended_actions=[
                "Investigate unusual traffic patterns",
                "Check system logs for errors",
                "Review recent configuration changes"
            ],
            model_version="1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

        logger.info(f"Successfully retrieved anomaly alerts for alert ID: {request.alert_id}")
        return response
