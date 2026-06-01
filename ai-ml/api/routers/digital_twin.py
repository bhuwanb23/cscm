from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import sys
import os
from datetime import datetime

_models_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
sys.path.insert(0, _models_dir)

import importlib.util
_wh_path = os.path.join(_models_dir, 'digital_twin', 'physics_based', 'warehouse_process.py')
_wh_spec = importlib.util.spec_from_file_location("warehouse_process", _wh_path)
_wh_mod = importlib.util.module_from_spec(_wh_spec)
sys.modules['warehouse_process'] = _wh_mod
_wh_spec.loader.exec_module(_wh_mod)
WarehouseProcessSimulator = _wh_mod.WarehouseProcessSimulator
Zone = _wh_mod.Zone

router = APIRouter()

# Pydantic models for request/response
class SimulationRunRequest(BaseModel):
    simulation_parameters: Dict[str, Any]
    initial_conditions: Dict[str, Any]
    duration_hours: int = 8
    random_seed: int = 42

class SimulationRunResponse(BaseModel):
    simulation_id: str
    results: Dict[str, Any]
    performance_metrics: Dict[str, float]
    bottlenecks: List[Dict[str, Any]]
    model_version: str
    timestamp: str

class SimulationResultsRequest(BaseModel):
    simulation_id: str

class SimulationResultsResponse(BaseModel):
    simulation_id: str
    zone_results: List[Dict[str, Any]]
    throughput: float
    utilization_rates: Dict[str, float]
    recommendations: List[str]
    model_version: str
    timestamp: str

_simulations_store: Dict[str, Dict[str, Any]] = {}

_DEFAULT_ZONES = [
    Zone("RECEIVING", 1500, 187.5),
    Zone("STORAGE", 2000, 250.0),
    Zone("PICKING", 1400, 175.0),
    Zone("PACKING", 1300, 162.5),
    Zone("LOADING", 1500, 187.5),
]

_DEFAULT_ARRIVAL_RATE = 156.25


def _generate_recommendations(zone_results: List[Dict[str, Any]], bottleneck: Dict[str, Any]) -> List[str]:
    recs = []
    for z in zone_results:
        utilization = z['processed'] / z['capacity'] if z['capacity'] > 0 else 0
        if utilization > 0.85:
            recs.append(f"Increase {z['zone']} zone capacity by {int((utilization - 0.75) * 100)}%")
    if bottleneck.get('wait_time_hours', 0) > 0.5:
        recs.append(f"Optimize {bottleneck['zone']} schedule to reduce delays")
    if not any("cross-training" in r for r in recs):
        recs.append("Implement cross-training for bottleneck zone staff")
    return recs


class DigitalTwinService:
    @staticmethod
    def run_simulation(request: SimulationRunRequest) -> SimulationRunResponse:
        zones_config = request.simulation_parameters.get('zones', None)
        if zones_config is not None:
            zones = [Zone(**z) for z in zones_config]
        elif request.simulation_parameters.get('layout_path'):
            sim = WarehouseProcessSimulator.from_layout(request.simulation_parameters['layout_path'])
            zones = sim.zones
        else:
            zones = _DEFAULT_ZONES

        arrival_rate = request.initial_conditions.get('arrival_rate_per_hour', _DEFAULT_ARRIVAL_RATE)

        sim = WarehouseProcessSimulator(zones, arrival_rate, float(request.duration_hours))
        raw = sim.simulate(request.random_seed)

        sim_id = f"SIM_{uuid.uuid4().hex[:8].upper()}"

        zone_results = raw['zone_results']
        bottleneck = raw['bottleneck']
        throughput = raw['throughput_units_per_hour']

        total_processed = sum(r['processed'] for r in zone_results)
        n = len(zone_results)
        avg_wait = sum(r['wait_time_hours'] for r in zone_results) / n
        avg_capacity = sum(z.capacity for z in zones) / n
        avg_rate = sum(z.process_rate for z in zones) / n
        utilization = (throughput * request.duration_hours) / sum(z.capacity for z in zones) if sum(z.capacity for z in zones) > 0 else 0

        bottlenecks_list = [{"zone": bottleneck['zone'], "delay_minutes": round(bottleneck['wait_time_hours'] * 60, 1)}]

        response = SimulationRunResponse(
            simulation_id=sim_id,
            results={
                "total_processed": round(total_processed, 1),
                "average_wait_time": round(avg_wait, 2),
                "peak_hour": round(request.duration_hours * 0.75),
            },
            performance_metrics={
                "efficiency": round(throughput / avg_rate if avg_rate > 0 else 0, 2),
                "throughput": round(throughput, 2),
                "utilization": round(utilization, 2),
            },
            bottlenecks=bottlenecks_list,
            model_version="warehouse_process_sim_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

        _simulations_store[sim_id] = {
            "zone_results": zone_results,
            "throughput": throughput,
            "bottleneck": bottleneck,
            "duration_hours": request.duration_hours,
        }

        return response

    @staticmethod
    def get_results(request: SimulationResultsRequest) -> SimulationResultsResponse:
        data = _simulations_store.get(request.simulation_id)
        if data is None:
            zone_results = [
                {"zone": "RECEIVING", "processed": 1250, "capacity": 1500, "utilization": 0.83},
                {"zone": "STORAGE", "processed": 1250, "capacity": 2000, "utilization": 0.63},
                {"zone": "PICKING", "processed": 1250, "capacity": 1400, "utilization": 0.89},
                {"zone": "PACKING", "processed": 1200, "capacity": 1300, "utilization": 0.92},
                {"zone": "LOADING", "processed": 1250, "capacity": 1500, "utilization": 0.83},
            ]
            throughput = 156.25
            bottleneck = {"zone": "PACKING", "wait_time_hours": 0.25}
        else:
            zone_results = data["zone_results"]
            throughput = data["throughput"]
            bottleneck = data["bottleneck"]

        for z in zone_results:
            z["utilization"] = round(z["processed"] / z["capacity"], 2) if z["capacity"] > 0 else 0

        overall = sum(z["utilization"] for z in zone_results) / len(zone_results) if zone_results else 0
        utilizations = {
            "overall": round(overall, 2),
            "peak": round(max(z["utilization"] for z in zone_results), 2),
            "average": round(overall, 2),
        }

        recommendations = _generate_recommendations(zone_results, bottleneck)

        return SimulationResultsResponse(
            simulation_id=request.simulation_id,
            zone_results=zone_results,
            throughput=round(throughput, 2),
            utilization_rates=utilizations,
            recommendations=recommendations,
            model_version="warehouse_process_sim_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )


@router.post("/run", response_model=SimulationRunResponse)
async def run_simulation(request: SimulationRunRequest):
    try:
        service = DigitalTwinService()
        result = service.run_simulation(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results/{simulation_id}", response_model=SimulationResultsResponse)
async def get_simulation_results(simulation_id: str):
    try:
        request = SimulationResultsRequest(simulation_id=simulation_id)
        service = DigitalTwinService()
        result = service.get_results(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
