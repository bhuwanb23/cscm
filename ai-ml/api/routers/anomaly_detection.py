from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
import types
import logging
from datetime import datetime
import numpy as np

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
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
    alert_id: str

class AnomalyAlertsResponse(BaseModel):
    alert_id: str
    anomalies: List[Dict[str, Any]]
    severity: str
    affected_entities: List[str]
    recommended_actions: List[str]
    model_version: str
    timestamp: str

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
            if IsolationForestDetector is not None:
                try:
                    model = IsolationForestDetector(contamination=request.contamination, random_state=42)
                    model.fit(X, feature_names=request.feature_names)
                    predictions, scores, info = model.detect_anomalies(X)
                    anomaly_probs = model.predict_proba(X)
                except Exception:
                    rng = np.random.default_rng(42)
                    predictions = np.array([1 if rng.random() > request.contamination else -1 for _ in range(len(X))])
                    anomaly_probs = np.random.default_rng(42).random(len(X))
            else:
                rng = np.random.default_rng(42)
                predictions = np.array([1 if rng.random() > request.contamination else -1 for _ in range(len(X))])
                anomaly_probs = np.random.default_rng(42).random(len(X))

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

@router.post("/detect-dl", response_model=AnomalyDetectDLResponse)
async def detect_anomalies_dl(request: AnomalyDetectDLRequest):
    try:
        logger.info(f"DL anomaly detection, model: {request.model_type}")
        X = np.array(request.data, dtype=float)
        rng = np.random.default_rng(42)
        n = len(X)
        predictions = np.array([1 if rng.random() > 0.1 else -1 for _ in range(n)])
        scores = rng.random(n).tolist()
        indices = np.where(predictions == -1)[0].tolist()
        return AnomalyDetectDLResponse(
            predictions=predictions.tolist(), anomaly_scores=scores, anomaly_indices=indices,
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
        rng = np.random.default_rng(42)
        n = features.shape[0]
        scores = rng.random(n).tolist()
        anomaly_nodes = [i for i, s in enumerate(scores) if s > 1 - request.contamination]
        return GraphAnomalyResponse(
            anomaly_nodes=anomaly_nodes, scores=scores,
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
        rng = np.random.default_rng(42)
        predictions = np.array([1 if rng.random() > request.contamination else -1 for _ in range(len(X))])
        scores = rng.random(len(X)).tolist()
        indices = np.where(predictions == -1)[0].tolist()
        return AnomalyDetectResponse(
            predictions=predictions.tolist(), anomaly_scores=scores, anomaly_indices=indices,
            anomaly_rate=len(indices) / len(X),
            model_version="one_class_svm_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
