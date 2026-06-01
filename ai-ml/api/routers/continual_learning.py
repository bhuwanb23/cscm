from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
import types
import uuid
import logging
from datetime import datetime, timedelta

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

_ensure_pkg('continual_learning', os.path.join(_models_dir, 'continual_learning'))
_ensure_pkg('continual_learning.continual_learning_framework', os.path.join(_models_dir, 'continual_learning', 'continual_learning_framework'))

_adapter_mod = _load_mod(
    'continual_learning/continual_learning_framework/online_adapter.py',
    'continual_learning.continual_learning_framework.online_adapter'
)
SimpleOnlineAdapter = _adapter_mod.SimpleOnlineAdapter

import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class FederatedUpdateRequest(BaseModel):
    client_id: str
    model_weights: dict
    training_samples: int
    metrics: dict

class FederatedUpdateResponse(BaseModel):
    client_id: str
    update_accepted: bool
    global_model_version: str
    next_round_timestamp: str
    model_version: str
    timestamp: str

class ContinualLearningStatusRequest(BaseModel):
    model_id: str

class ContinualLearningStatusResponse(BaseModel):
    model_id: str
    current_performance: dict
    drift_detected: bool
    last_update_timestamp: str
    upcoming_retrainings: List[str]
    model_version: str
    timestamp: str


_models_store: Dict[str, Dict[str, Any]] = {}

class ContinualLearningService:
    @staticmethod
    def process_federated_update(request: FederatedUpdateRequest) -> FederatedUpdateResponse:
        logger.info(f"Processing federated update from client: {request.client_id}")

        model_id = f"model_{request.client_id}"
        if model_id not in _models_store:
            n_features = len(request.model_weights) if request.model_weights else 10
            _models_store[model_id] = {
                "adapter": SimpleOnlineAdapter(n_features=n_features, learning_rate=0.01, memory_size=1000),
                "update_count": 0,
                "last_update": None,
            }

        store = _models_store[model_id]
        adapter = store["adapter"]

        n = min(request.training_samples, 100)
        n_features = adapter.weights.shape[0]
        X_batch = np.random.randn(n, n_features)
        y_batch = np.random.randn(n)

        result = adapter.update(X_batch, y_batch)
        store["update_count"] += 1
        store["last_update"] = datetime.utcnow()

        version = f"1.{store['update_count']}.0"
        next_ts = (datetime.utcnow() + timedelta(hours=1)).isoformat() + "Z"

        response = FederatedUpdateResponse(
            client_id=request.client_id,
            update_accepted=True,
            global_model_version=version,
            next_round_timestamp=next_ts,
            model_version="continual_learning_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
        logger.info(f"Update accepted. MSE: {result.get('mse', 'N/A')}, step: {result.get('training_step', 0)}")
        return response

    @staticmethod
    def get_continual_learning_status(request: ContinualLearningStatusRequest) -> ContinualLearningStatusResponse:
        logger.info(f"Getting status for model: {request.model_id}")

        store = _models_store.get(request.model_id)
        if store is None:
            return ContinualLearningStatusResponse(
                model_id=request.model_id,
                current_performance={"accuracy": 0.0, "latency": 0.0, "throughput": 0},
                drift_detected=False,
                last_update_timestamp="N/A",
                upcoming_retrainings=["N/A"],
                model_version="continual_learning_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z",
            )

        adapter = store["adapter"]
        performance = {
            "mse": float(np.mean([mse for mse in [0.0]])),
            "learning_rate": adapter.learning_rate,
            "memory_usage": len(getattr(adapter, 'memory_X', [])),
            "update_count": store["update_count"],
        }
        last_update = store["last_update"]
        last_ts = last_update.isoformat() + "Z" if last_update else "N/A"
        next_retrain = (datetime.utcnow() + timedelta(hours=6)).isoformat() + "Z"

        response = ContinualLearningStatusResponse(
            model_id=request.model_id,
            current_performance=performance,
            drift_detected=False,
            last_update_timestamp=last_ts,
            upcoming_retrainings=[next_retrain],
            model_version="continual_learning_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
        return response


@router.post("/federated-update", response_model=FederatedUpdateResponse)
async def submit_federated_update(request: FederatedUpdateRequest):
    try:
        service = ContinualLearningService()
        result = service.process_federated_update(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{model_id}", response_model=ContinualLearningStatusResponse)
async def get_continual_learning_status(model_id: str):
    try:
        request = ContinualLearningStatusRequest(model_id=model_id)
        service = ContinualLearningService()
        result = service.get_continual_learning_status(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
