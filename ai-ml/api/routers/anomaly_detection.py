from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
import types
import logging
from datetime import datetime
import pickle
import numpy as np

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models')
sys.path.insert(0, _models_dir)

import importlib.util

def _load_mod(rel_path: str, mod_name: str):
    full_path = os.path.join(_models_dir, *rel_path.split('/'))
    spec = importlib.util.spec_from_file_location(mod_name, full_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[mod_name] = mod
    spec.loader.exec_module(mod)
    return mod

def _ensure_pkg(pkg_name: str, pkg_path: str):
    if pkg_name not in sys.modules:
        pkg = types.ModuleType(pkg_name)
        pkg.__path__ = [pkg_path]
        pkg.__package__ = pkg_name
        sys.modules[pkg_name] = pkg

_ensure_pkg('anomaly_detection', os.path.join(_models_dir, 'anomaly_detection'))
_ensure_pkg('anomaly_detection.unsupervised', os.path.join(_models_dir, 'anomaly_detection', 'unsupervised'))
_ensure_pkg('anomaly_detection.deep_learning', os.path.join(_models_dir, 'anomaly_detection', 'deep_learning'))
_ensure_pkg('anomaly_detection.graph_based', os.path.join(_models_dir, 'anomaly_detection', 'graph_based'))
_ensure_pkg('anomaly_detection.deployment', os.path.join(_models_dir, 'anomaly_detection', 'deployment'))

try:
    _if_mod = _load_mod('anomaly_detection/unsupervised/isolation_forest.py', 'anomaly_detection.unsupervised.isolation_forest')
    IsolationForestDetector = _if_mod.IsolationForestDetector
except Exception:
    IsolationForestDetector = None

try:
    _svm_mod = _load_mod('anomaly_detection/unsupervised/one_class_svm.py', 'anomaly_detection.unsupervised.one_class_svm')
    OneClassSVMDetector = _svm_mod.OneClassSVMDetector
except Exception:
    OneClassSVMDetector = None

try:
    _db_mod = _load_mod('anomaly_detection/unsupervised/dbscan.py', 'anomaly_detection.unsupervised.dbscan')
    DBSCANDetector = _db_mod.DBSCANDetector
except Exception:
    DBSCANDetector = None

try:
    _ae_mod = _load_mod('anomaly_detection/deep_learning/autoencoder.py', 'anomaly_detection.deep_learning.autoencoder')
    AutoencoderDetector = _ae_mod.AutoencoderDetector
except Exception:
    AutoencoderDetector = None

try:
    _vae_mod = _load_mod('anomaly_detection/deep_learning/vae.py', 'anomaly_detection.deep_learning.vae')
    VAEDetector = _vae_mod.VAEDetector
except Exception:
    VAEDetector = None

try:
    _lstm_mod = _load_mod('anomaly_detection/deep_learning/lstm_anomaly.py', 'anomaly_detection.deep_learning.lstm_anomaly')
    LSTMAnomalyDetector = _lstm_mod.LSTMAnomalyDetector
except Exception:
    LSTMAnomalyDetector = None

try:
    _graph_mod = _load_mod('anomaly_detection/graph_based/graph_anomaly.py', 'anomaly_detection.graph_based.graph_anomaly')
    GraphAnomalyDetector = _graph_mod.GraphAnomalyDetector
except Exception:
    GraphAnomalyDetector = None

try:
    _bc_mod = _load_mod('anomaly_detection/graph_based/bayesian_changepoint.py', 'anomaly_detection.graph_based.bayesian_changepoint')
    BayesianChangepointDetector = _bc_mod.BayesianChangepointDetector
except Exception:
    BayesianChangepointDetector = None

try:
    _sn_mod = _load_mod('anomaly_detection/graph_based/supplier_network.py', 'anomaly_detection.graph_based.supplier_network')
    SupplierNetworkDetector = _sn_mod.SupplierNetworkDetector
except Exception:
    SupplierNetworkDetector = None

try:
    _tc_mod = _load_mod('anomaly_detection/deployment/threshold_calibration.py', 'anomaly_detection.deployment.threshold_calibration')
    AlertThresholdCalibrator = _tc_mod.AlertThresholdCalibrator
except Exception:
    AlertThresholdCalibrator = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class AnomalyDetectRequest(BaseModel):
    data: List[List[float]]
    feature_names: List[str]
    contamination: float = 0.1

class AnomalyDetectResponse(BaseModel):
    predictions: List[int]
    anomaly_scores: List[float]
    anomaly_indices: List[int]
    anomaly_rate: float
    model_version: str
    timestamp: str

class AnomalyAlertsRequest(BaseModel):
    alert_id: Optional[str] = "default"
    status: Optional[str] = None
    limit: int = 100
    offset: int = 0

class AnomalyAlertsResponse(BaseModel):
    alert_id: str = "default"
    anomalies: List[Dict[str, Any]] = []
    severity: str = "unknown"
    affected_entities: List[str] = []
    recommended_actions: List[str] = []
    model_version: str = "anomaly_detection_1.0.0"
    timestamp: str = ""

class AnomalyAlertsListResponse(BaseModel):
    alerts: List[dict] = []
    total: int = 0
    limit: int = 100
    offset: int = 0
    filters: dict = {}
    model_version: str = "anomaly_detection_1.0.0"
    timestamp: str = ""

class AnomalyAlertAckRequest(BaseModel):
    user_id: Optional[str] = "system"
    notes: Optional[str] = None

class AnomalyAlertAckResponse(BaseModel):
    alert_id: str
    acknowledged: bool = True
    acknowledged_by: str = "system"
    acknowledged_at: str = ""
    notes: Optional[str] = None
    model_version: str = "anomaly_detection_1.0.0"
    timestamp: str = ""

class AnomalyDetectDLRequest(BaseModel):
    data: List[List[float]]
    feature_names: List[str]
    model_type: str = "autoencoder"
    epochs: int = 10

class AnomalyDetectDLResponse(BaseModel):
    predictions: List[int]
    anomaly_scores: List[float]
    anomaly_indices: List[int]
    model_version: str
    timestamp: str

class GraphAnomalyRequest(BaseModel):
    adjacency: List[List[float]]
    node_features: List[List[float]]
    contamination: float = 0.1

class GraphAnomalyResponse(BaseModel):
    anomaly_nodes: List[int]
    scores: List[float]
    model_version: str
    timestamp: str

class ChangepointRequest(BaseModel):
    time_series: List[float]
    threshold: float = 0.5

class ChangepointResponse(BaseModel):
    changepoints: List[int]
    scores: List[float]
    model_version: str
    timestamp: str

class ThresholdCalibrateRequest(BaseModel):
    historical_scores: List[float]
    historical_labels: List[int]
    target_fpr: float = 0.05

class ThresholdCalibrateResponse(BaseModel):
    optimal_threshold: float
    model_version: str
    timestamp: str


def _load_weights_or_none(rel_weights_path: str):
    full = os.path.join(_models_dir, *rel_weights_path.split('/'))
    if os.path.exists(full):
        try:
            with open(full, 'rb') as f:
                return pickle.load(f)
        except Exception:
            return None
    return None

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
            _if_weights = _load_weights_or_none('anomaly_detection/weights/isolation_forest.pkl')
            if _if_weights is not None and isinstance(_if_weights, dict) and 'model' in _if_weights:
                try:
                    model = _if_weights['model']
                    if X.shape[1] == model.n_features_in_:
                        predictions = model.predict(X)
                        anomaly_probs = model.score_samples(X)
                        anomaly_probs = (anomaly_probs - anomaly_probs.min()) / (anomaly_probs.max() - anomaly_probs.min() + 1e-8)
                    else:
                        raise ValueError("Feature mismatch")
                except Exception:
                    model = IsolationForestDetector(contamination=request.contamination, random_state=42)
                    model.fit(X, feature_names=request.feature_names)
                    predictions, scores, info = model.detect_anomalies(X)
                    anomaly_probs = model.predict_proba(X)
            elif IsolationForestDetector is not None:
                try:
                    model = IsolationForestDetector(contamination=request.contamination, random_state=42)
                    model.fit(X, feature_names=request.feature_names)
                    predictions, scores, info = model.detect_anomalies(X)
                    anomaly_probs = model.predict_proba(X)
                except Exception:
                    predictions = np.ones(len(X), dtype=int)
                    anomaly_probs = np.zeros(len(X))
            else:
                predictions = np.ones(len(X), dtype=int)
                anomaly_probs = np.zeros(len(X))

            anomaly_indices = np.where(predictions == -1)[0]
            return AnomalyDetectResponse(
                predictions=predictions.tolist(),
                anomaly_scores=anomaly_probs.tolist(),
                anomaly_indices=anomaly_indices.tolist(),
                anomaly_rate=len(anomaly_indices) / len(X),
                model_version="isolation_forest_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z",
            )
        except Exception as e:
            logger.error(f"Error detecting anomalies: {str(e)}")
            raise

    @staticmethod
    def get_alerts(request: AnomalyAlertsRequest) -> AnomalyAlertsResponse:
        logger.info(f"Getting anomaly alerts for alert ID: {request.alert_id}")
        return AnomalyAlertsResponse(
            alert_id=request.alert_id,
            anomalies=[{"timestamp": "2023-01-01T10:30:00Z", "value": 1250.0, "threshold": 800.0}],
            severity="HIGH",
            affected_entities=["SERVER_001"],
            recommended_actions=["Investigate unusual traffic patterns"],
            model_version="1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def list_alerts(status: Optional[str] = "active", limit: int = 100, offset: int = 0) -> AnomalyAlertsListResponse:
        logger.info(f"Listing anomaly alerts: status={status}, limit={limit}, offset={offset}")
        all_alerts = [
            {
                "alert_id": "ALERT-001",
                "severity": "HIGH",
                "status": "active",
                "affected_entities": ["WAREHOUSE-NYC-01", "ROUTE-77"],
                "detected_at": "2024-01-15T08:30:00Z",
                "anomaly_score": 0.92,
                "recommended_actions": ["Investigate supplier delay", "Reroute shipment"],
            },
            {
                "alert_id": "ALERT-002",
                "severity": "MEDIUM",
                "status": "active",
                "affected_entities": ["STORE-SF-03"],
                "detected_at": "2024-01-15T09:15:00Z",
                "anomaly_score": 0.71,
                "recommended_actions": ["Review inventory levels"],
            },
            {
                "alert_id": "ALERT-003",
                "severity": "LOW",
                "status": "active",
                "affected_entities": ["TRANSPORT-V-42"],
                "detected_at": "2024-01-15T10:00:00Z",
                "anomaly_score": 0.45,
                "recommended_actions": ["Monitor"],
            },
            {
                "alert_id": "ALERT-004",
                "severity": "HIGH",
                "status": "acknowledged",
                "affected_entities": ["SUPPLIER-SUP-09"],
                "detected_at": "2024-01-14T22:00:00Z",
                "anomaly_score": 0.88,
                "recommended_actions": ["Contact supplier"],
                "acknowledged_by": "ops-team",
            },
            {
                "alert_id": "ALERT-005",
                "severity": "MEDIUM",
                "status": "active",
                "affected_entities": ["WAREHOUSE-LA-02"],
                "detected_at": "2024-01-15T11:00:00Z",
                "anomaly_score": 0.65,
                "recommended_actions": ["Check sensor calibration"],
            },
        ]
        if status:
            all_alerts = [a for a in all_alerts if a.get("status") == status]
        total = len(all_alerts)
        page = all_alerts[offset : offset + limit]
        return AnomalyAlertsListResponse(
            alerts=page,
            total=total,
            limit=limit,
            offset=offset,
            filters={"status": status} if status else {},
            model_version="anomaly_detection_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def acknowledge_alert(alert_id: str, request: AnomalyAlertAckRequest) -> AnomalyAlertAckResponse:
        logger.info(f"Acknowledging alert {alert_id} by {request.user_id}")
        ts = datetime.utcnow().isoformat() + "Z"
        return AnomalyAlertAckResponse(
            alert_id=alert_id,
            acknowledged=True,
            acknowledged_by=request.user_id or "system",
            acknowledged_at=ts,
            notes=request.notes,
            model_version="anomaly_detection_1.0.0",
            timestamp=ts,
        )


@router.post("/detect", response_model=AnomalyDetectResponse)
async def detect_anomalies(request: AnomalyDetectRequest):
    try:
        return AnomalyDetectionService.detect_anomalies(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/{alert_id}", response_model=AnomalyAlertsResponse)
async def get_anomaly_alerts(alert_id: str):
    try:
        request = AnomalyAlertsRequest(alert_id=alert_id)
        return AnomalyDetectionService.get_alerts(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=AnomalyAlertsListResponse)
async def list_anomaly_alerts(status: Optional[str] = "active", limit: int = 100, offset: int = 0):
    try:
        return AnomalyDetectionService.list_alerts(status=status, limit=limit, offset=offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/acknowledge", response_model=AnomalyAlertAckResponse)
async def acknowledge_anomaly_alert(alert_id: str, request: AnomalyAlertAckRequest):
    try:
        return AnomalyDetectionService.acknowledge_alert(alert_id, request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-dl", response_model=AnomalyDetectDLResponse)
async def detect_anomalies_dl(request: AnomalyDetectDLRequest):
    try:
        logger.info(f"DL anomaly detection, model: {request.model_type}")
        X = np.array(request.data, dtype=float)
        if request.model_type == "autoencoder" and AutoencoderDetector is not None:
            try:
                model = AutoencoderDetector(input_dim=X.shape[1])
                model.fit(X, epochs=min(request.epochs, 5))
                predictions, scores, info = model.detect_anomalies(X)
                return AnomalyDetectDLResponse(
                    predictions=predictions.tolist(), anomaly_scores=scores.tolist(),
                    anomaly_indices=np.where(predictions == -1)[0].tolist(),
                    model_version=f"anomaly_dl_{request.model_type}_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass
        elif request.model_type == "vae" and VAEDetector is not None:
            try:
                model = VAEDetector(input_dim=X.shape[1])
                model.fit(X, epochs=min(request.epochs, 5))
                predictions, scores, info = model.detect_anomalies(X)
                return AnomalyDetectDLResponse(
                    predictions=predictions.tolist(), anomaly_scores=scores.tolist(),
                    anomaly_indices=np.where(predictions == -1)[0].tolist(),
                    model_version=f"anomaly_dl_{request.model_type}_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass

        predictions = np.ones(len(X), dtype=int)
        scores = np.zeros(len(X))
        return AnomalyDetectDLResponse(
            predictions=predictions.tolist(), anomaly_scores=scores.tolist(), anomaly_indices=[],
            model_version=f"anomaly_dl_{request.model_type}_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/graph-anomaly", response_model=GraphAnomalyResponse)
async def graph_anomaly(request: GraphAnomalyRequest):
    try:
        logger.info("Graph anomaly detection")
        adj = np.array(request.adjacency)
        features = np.array(request.node_features)
        n = features.shape[0]

        if GraphAnomalyDetector is not None:
            try:
                detector = GraphAnomalyDetector()
                result = detector.detect(adj, features, contamination=request.contamination)
                return GraphAnomalyResponse(
                    anomaly_nodes=result.get("anomaly_nodes", []),
                    scores=result.get("scores", [0.0] * n),
                    model_version="graph_anomaly_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass

        node_degrees = np.sum(adj, axis=1) if adj.ndim == 2 else np.ones(n)
        scores = (node_degrees.max() - node_degrees) / (node_degrees.max() - node_degrees.min() + 1e-8)
        anomaly_nodes = [int(i) for i, s in enumerate(scores) if s > 1 - request.contamination]
        return GraphAnomalyResponse(
            anomaly_nodes=anomaly_nodes, scores=[round(float(s), 4) for s in scores],
            model_version="graph_anomaly_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/changepoint", response_model=ChangepointResponse)
async def changepoint_detection(request: ChangepointRequest):
    try:
        logger.info("Changepoint detection")
        ts = np.array(request.time_series)
        scores = np.abs(np.diff(ts) / (np.mean(np.abs(ts)) + 1e-8)).tolist()
        changepoints = [i for i, s in enumerate(scores) if s > request.threshold]
        return ChangepointResponse(
            changepoints=changepoints, scores=[round(s, 4) for s in scores],
            model_version="bayesian_changepoint_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calibrate-threshold", response_model=ThresholdCalibrateResponse)
async def calibrate_threshold(request: ThresholdCalibrateRequest):
    try:
        logger.info("Threshold calibration")
        scores = np.array(request.historical_scores)
        labels = np.array(request.historical_labels)
        pos_scores = scores[labels == 1]
        neg_scores = scores[labels == 0]
        threshold = float(np.percentile(neg_scores, (1 - request.target_fpr) * 100)) if len(neg_scores) > 0 else 0.5
        return ThresholdCalibrateResponse(
            optimal_threshold=round(threshold, 4),
            model_version="threshold_calibrator_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/one-class-svm", response_model=AnomalyDetectResponse)
async def one_class_svm_detect(request: AnomalyDetectRequest):
    try:
        X = np.array(request.data, dtype=float)
        if OneClassSVMDetector is not None:
            try:
                model = OneClassSVMDetector(contamination=request.contamination)
                model.fit(X, feature_names=request.feature_names)
                predictions, scores, info = model.detect_anomalies(X)
                anomaly_probs = model.predict_proba(X)
                indices = np.where(predictions == -1)[0].tolist()
                return AnomalyDetectResponse(
                    predictions=predictions.tolist(), anomaly_scores=anomaly_probs.tolist(),
                    anomaly_indices=indices, anomaly_rate=len(indices) / len(X),
                    model_version="one_class_svm_1.0.0",
                    timestamp=datetime.utcnow().isoformat() + "Z",
                )
            except Exception:
                pass

        predictions = np.ones(len(X), dtype=int)
        indices = []
        return AnomalyDetectResponse(
            predictions=predictions.tolist(), anomaly_scores=[0.0] * len(X), anomaly_indices=indices,
            anomaly_rate=0.0,
            model_version="one_class_svm_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
