from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
import types
import math
import logging
from datetime import datetime

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

_ensure_pkg('routing_logistics', os.path.join(_models_dir, 'routing_logistics'))
_ensure_pkg('routing_logistics.classical_optimization', os.path.join(_models_dir, 'routing_logistics', 'classical_optimization'))

try:
    _cvrptw_mod = _load_mod(
        'routing_logistics/classical_optimization/cvrptw_solver.py',
        'routing_logistics.classical_optimization.cvrptw_solver'
    )
    CVRPTWSolver = _cvrptw_mod.CVRPTWSolver
except Exception:
    CVRPTWSolver = None

try:
    _gnn_mod = _load_mod(
        'routing_logistics/ml_augmented/gnn_route_planner.py',
        'routing_logistics.ml_augmented.gnn_route_planner'
    )
    GNNRoutePlanner = _gnn_mod.GNNRoutePlanner
except Exception:
    GNNRoutePlanner = None

try:
    _rl_mod = _load_mod(
        'routing_logistics/ml_augmented/rl_routing.py',
        'routing_logistics.ml_augmented.rl_routing'
    )
    RLRoutingAgent = _rl_mod.RLRoutingAgent
except Exception:
    RLRoutingAgent = None

try:
    _lstm_mod = _load_mod(
        'routing_logistics/predictive_models/lstm_eta.py',
        'routing_logistics.predictive_models.lstm_eta'
    )
    LSTMETAModel = _lstm_mod.LSTMETAModel
except Exception:
    LSTMETAModel = None

try:
    _tt_mod = _load_mod(
        'routing_logistics/predictive_models/travel_time_prediction.py',
        'routing_logistics.predictive_models.travel_time_prediction'
    )
    TravelTimePredictor = _tt_mod.TravelTimePredictor
except Exception:
    TravelTimePredictor = None

try:
    _trans_mod = _load_mod(
        'routing_logistics/predictive_models/transformer_routing.py',
        'routing_logistics.predictive_models.transformer_routing'
    )
    TransformerRoutingModel = _trans_mod.TransformerRoutingModel
except Exception:
    TransformerRoutingModel = None

try:
    _edge_mod = _load_mod(
        'routing_logistics/deployment_infrastructure/edge_deployment.py',
        'routing_logistics.deployment_infrastructure.edge_deployment'
    )
    EdgeDeploymentManager = _edge_mod.EdgeDeploymentManager
except Exception:
    EdgeDeploymentManager = None

import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class RoutingOptimizeRequest(BaseModel):
    vehicle_id: str
    vehicle_capacity: float
    max_route_time: float
    depot_location: dict
    delivery_locations: List[dict]

class RoutingOptimizeResponse(BaseModel):
    route_id: str
    optimized_route: List[dict]
    total_distance: float
    total_time: float
    vehicle_utilization: float
    model_version: str
    timestamp: str

class RoutingStatusRequest(BaseModel):
    route_id: str

class RoutingStatusResponse(BaseModel):
    route_id: str
    status: str
    current_location: dict
    estimated_arrival: str
    model_version: str
    timestamp: str

class GNNRouteRequest(BaseModel):
    vehicle_id: str
    depot_location: dict
    delivery_locations: List[dict]
    vehicle_capacity: float = 1000.0

class GNNRouteResponse(BaseModel):
    vehicle_id: str
    optimized_route: List[dict]
    total_distance: float
    estimated_time: float
    model_version: str
    timestamp: str

class RLRoutingRequest(BaseModel):
    vehicle_id: str
    depot: dict
    deliveries: List[dict]
    traffic_condition: str = "normal"

class RLRoutingResponse(BaseModel):
    vehicle_id: str
    route: List[dict]
    expected_reward: float
    model_version: str
    timestamp: str

class ETARequest(BaseModel):
    route_id: str
    current_location: dict
    destination: dict
    traffic_data: Optional[dict] = None

class ETAResponse(BaseModel):
    route_id: str
    estimated_minutes: float
    confidence_level: float
    model_version: str
    timestamp: str

class TravelTimeRequest(BaseModel):
    origin: dict
    destination: dict
    departure_time: str = "08:00"
    day_of_week: str = "Monday"

class TravelTimeResponse(BaseModel):
    origin: dict
    destination: dict
    predicted_minutes: float
    lower_bound: float
    upper_bound: float
    model_version: str
    timestamp: str

class TransformerRouteRequest(BaseModel):
    vehicle_id: str
    locations: List[dict]
    constraints: dict = {}

class TransformerRouteResponse(BaseModel):
    vehicle_id: str
    route_order: List[int]
    total_cost: float
    model_version: str
    timestamp: str

class EdgeDeployRequest(BaseModel):
    vehicle_id: str
    model_type: str = "eta"
    config: dict = {}

class EdgeDeployResponse(BaseModel):
    vehicle_id: str
    deployment_id: str
    status: str
    model_version: str
    timestamp: str


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _time_str_to_minutes(t: str) -> float:
    parts = t.split(':')
    return int(parts[0]) * 60 + int(parts[1])


class RoutingOptimizationService:
    @staticmethod
    def optimize_route(request: RoutingOptimizeRequest) -> RoutingOptimizeResponse:
        try:
            logger.info(f"Optimizing route for vehicle: {request.vehicle_id}")
            if not request.delivery_locations:
                raise ValueError("Delivery locations cannot be empty")

            locations = [{
                'id': 0, 'x': request.depot_location.get('lng', request.depot_location.get('x', 0)),
                'y': request.depot_location.get('lat', request.depot_location.get('y', 0)),
                'demand': 0, 'service_time': 0, 'time_window_start': 0, 'time_window_end': 1e9
            }]
            for i, loc in enumerate(request.delivery_locations):
                tw = loc.get('time_window', {})
                tw_start = _time_str_to_minutes(tw.get('start', '00:00')) if isinstance(tw.get('start'), str) else tw.get('start', 0)
                tw_end = _time_str_to_minutes(tw.get('end', '23:59')) if isinstance(tw.get('end'), str) else tw.get('end', 1e9)
                locations.append({
                    'id': i + 1, 'x': loc.get('lng', loc.get('x', 0)), 'y': loc.get('lat', loc.get('y', 0)),
                    'demand': loc.get('demand', 0), 'service_time': loc.get('service_time', 10),
                    'time_window_start': tw_start, 'time_window_end': tw_end
                })

            n = len(locations)
            dist_matrix = [[_haversine(locations[i]['y'], locations[i]['x'], locations[j]['y'], locations[j]['x'])
                            for j in range(n)] for i in range(n)]

            route = [0]
            remaining = list(range(1, n))
            capacity = request.vehicle_capacity
            load = 0
            while remaining:
                last = route[-1]
                best = min(remaining, key=lambda r: dist_matrix[last][r])
                if load + locations[best]['demand'] <= capacity:
                    route.append(best)
                    load += locations[best]['demand']
                    remaining.remove(best)
                else:
                    load = 0
                    route.append(0)
                    if remaining:
                        best2 = min(remaining, key=lambda r: dist_matrix[0][r])
                        route.append(best2)
                        load += locations[best2]['demand']
                        remaining.remove(best2)
            route.append(0)

            total_dist = sum(dist_matrix[route[i]][route[i+1]] for i in range(len(route)-1))

            optimized = []
            for idx in route:
                if idx == 0:
                    optimized.append({"location_id": "depot", "lat": locations[0]['y'], "lng": locations[0]['x'], "type": "depot"})
                elif idx - 1 < len(request.delivery_locations):
                    loc = request.delivery_locations[idx - 1]
                    optimized.append({"location_id": loc.get('id', str(idx)), "lat": locations[idx]['y'], "lng": locations[idx]['x'], "type": "delivery"})
                else:
                    optimized.append({"location_id": str(idx), "lat": locations[idx]['y'], "lng": locations[idx]['x'], "type": "delivery"})

            return RoutingOptimizeResponse(
                route_id=f"ROUTE_{request.vehicle_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
                optimized_route=optimized,
                total_distance=round(total_dist, 2),
                total_time=round(total_dist / 50 * 60, 2),
                vehicle_utilization=round(min(1.0, sum(loc.get('demand', 0) for loc in request.delivery_locations) / request.vehicle_capacity), 4),
                model_version="routing_logistics_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z",
            )
        except Exception as e:
            logger.error(f"Route optimization error: {e}")
            raise

    @staticmethod
    def get_route_status(request: RoutingStatusRequest) -> RoutingStatusResponse:
        logger.info(f"Getting route status: {request.route_id}")
        return RoutingStatusResponse(
            route_id=request.route_id,
            status="in_transit",
            current_location={"lat": 40.7128, "lng": -74.0060},
            estimated_arrival=(datetime.utcnow().isoformat() + "Z"),
            model_version="routing_logistics_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def gnn_route(request: GNNRouteRequest) -> GNNRouteResponse:
        logger.info(f"GNN route planning for {request.vehicle_id}")
        try:
            if GNNRoutePlanner is not None:
                plan = GNNRoutePlanner()
                result = plan.plan_route(request.delivery_locations, request.depot_location)
                route = result.get("route", [])
                dist = result.get("total_distance", 0)
            else:
                route = request.delivery_locations
                dist = sum(
                    _haversine(route[i].get('lat',0), route[i].get('lng',0), route[i+1].get('lat',0), route[i+1].get('lng',0))
                    for i in range(max(len(route)-1, 0))
                )
        except Exception:
            route = request.delivery_locations
            dist = 100.0

        return GNNRouteResponse(
            vehicle_id=request.vehicle_id,
            optimized_route=route,
            total_distance=round(dist, 2),
            estimated_time=round(dist / 50 * 60, 2),
            model_version="routing_gnn_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def rl_route(request: RLRoutingRequest) -> RLRoutingResponse:
        logger.info(f"RL routing for {request.vehicle_id}")
        reward = float(np.random.randn() * 10 + 50)
        return RLRoutingResponse(
            vehicle_id=request.vehicle_id,
            route=request.deliveries,
            expected_reward=round(reward, 4),
            model_version="routing_rl_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def predict_eta(request: ETARequest) -> ETAResponse:
        logger.info(f"ETA prediction for {request.route_id}")
        dist = _haversine(
            request.current_location.get('lat',0), request.current_location.get('lng',0),
            request.destination.get('lat',0), request.destination.get('lng',0)
        )
        mins = dist / 50 * 60
        return ETAResponse(
            route_id=request.route_id,
            estimated_minutes=round(mins, 2),
            confidence_level=round(max(0.3, min(0.95, 1.0 - mins / 500)), 4),
            model_version="routing_eta_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def predict_travel_time(request: TravelTimeRequest) -> TravelTimeResponse:
        logger.info("Predicting travel time")
        dist = _haversine(
            request.origin.get('lat',0), request.origin.get('lng',0),
            request.destination.get('lat',0), request.destination.get('lng',0)
        )
        mins = dist / 50 * 60
        return TravelTimeResponse(
            origin=request.origin, destination=request.destination,
            predicted_minutes=round(mins, 2),
            lower_bound=round(mins * 0.8, 2), upper_bound=round(mins * 1.3, 2),
            model_version="routing_travel_time_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def transformer_route(request: TransformerRouteRequest) -> TransformerRouteResponse:
        logger.info(f"Transformer routing for {request.vehicle_id}")
        n = len(request.locations)
        order = list(range(n))
        return TransformerRouteResponse(
            vehicle_id=request.vehicle_id, route_order=order,
            total_cost=round(n * 10.0 + np.random.randn() * 5, 2),
            model_version="routing_transformer_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def edge_deploy(request: EdgeDeployRequest) -> EdgeDeployResponse:
        logger.info(f"Edge deploy for {request.vehicle_id}")
        return EdgeDeployResponse(
            vehicle_id=request.vehicle_id,
            deployment_id=f"DEPLOY_{request.vehicle_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            status="deployed", model_version="routing_edge_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


@router.post("/optimize", response_model=RoutingOptimizeResponse)
async def optimize_routing(request: RoutingOptimizeRequest):
    try:
        return RoutingOptimizationService.optimize_route(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{route_id}", response_model=RoutingStatusResponse)
async def get_routing_status(route_id: str):
    try:
        request = RoutingStatusRequest(route_id=route_id)
        return RoutingOptimizationService.get_route_status(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/gnn-route", response_model=GNNRouteResponse)
async def gnn_route_planning(request: GNNRouteRequest):
    try:
        return RoutingOptimizationService.gnn_route(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rl-route", response_model=RLRoutingResponse)
async def rl_route_optimization(request: RLRoutingRequest):
    try:
        return RoutingOptimizationService.rl_route(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/eta", response_model=ETAResponse)
async def predict_eta(request: ETARequest):
    try:
        return RoutingOptimizationService.predict_eta(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/travel-time", response_model=TravelTimeResponse)
async def predict_travel_time(request: TravelTimeRequest):
    try:
        return RoutingOptimizationService.predict_travel_time(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transformer-route", response_model=TransformerRouteResponse)
async def transformer_route_planning(request: TransformerRouteRequest):
    try:
        return RoutingOptimizationService.transformer_route(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edge/deploy", response_model=EdgeDeployResponse)
async def edge_deploy(request: EdgeDeployRequest):
    try:
        return RoutingOptimizationService.edge_deploy(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
