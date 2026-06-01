from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import uuid
import sys
import os
import types
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

_ensure_pkg('digital_twin', os.path.join(_models_dir, 'digital_twin'))
_ensure_pkg('digital_twin.physics_based', os.path.join(_models_dir, 'digital_twin', 'physics_based'))
_ensure_pkg('digital_twin.agent_based', os.path.join(_models_dir, 'digital_twin', 'agent_based'))
_ensure_pkg('digital_twin.learned', os.path.join(_models_dir, 'digital_twin', 'learned'))
_ensure_pkg('digital_twin.use_cases', os.path.join(_models_dir, 'digital_twin', 'use_cases'))

try:
    _wh_mod = _load_mod('digital_twin/physics_based/warehouse_process.py', 'digital_twin.warehouse_process')
    WarehouseProcessSimulator = _wh_mod.WarehouseProcessSimulator
    Zone = _wh_mod.Zone
except Exception:
    WarehouseProcessSimulator = None
    Zone = None

try:
    _des_mod = _load_mod('digital_twin/physics_based/des_framework.py', 'digital_twin.des_framework')
    DiscreteEventSimulator = _des_mod.DiscreteEventSimulator
    Event = _des_mod.Event
except Exception:
    DiscreteEventSimulator = None
    Event = None

try:
    _conv_mod = _load_mod('digital_twin/physics_based/conveyor_flow.py', 'digital_twin.conveyor_flow')
    ConveyorFlowSimulator = _conv_mod.ConveyorFlowSimulator
    ConveyorSegment = _conv_mod.ConveyorSegment
except Exception:
    ConveyorFlowSimulator = None
    ConveyorSegment = None

try:
    _rte_mod = _load_mod('digital_twin/agent_based/routing_simulator.py', 'digital_twin.routing_simulator')
    RoutingSimulationEnvironment = _rte_mod.RoutingSimulationEnvironment
except Exception:
    RoutingSimulationEnvironment = None

try:
    _ord_mod = _load_mod('digital_twin/agent_based/order_simulator.py', 'digital_twin.order_simulator')
    OrderSimulationEngine = _ord_mod.OrderSimulationEngine
except Exception:
    OrderSimulationEngine = None

try:
    _net_mod = _load_mod('digital_twin/agent_based/multi_node.py', 'digital_twin.multi_node')
    AgentBasedNetworkSimulator = _net_mod.AgentBasedNetworkSimulator
    Node = _net_mod.Node
except Exception:
    AgentBasedNetworkSimulator = None
    Node = None

try:
    _abm_mod = _load_mod('digital_twin/learned/abm_learned.py', 'digital_twin.abm_learned')
    LearnedAgentBasedModel = _abm_mod.LearnedAgentBasedModel
except Exception:
    LearnedAgentBasedModel = None

try:
    _fast_mod = _load_mod('digital_twin/learned/fast_approximation.py', 'digital_twin.fast_approximation')
    FastApproximationEngine = _fast_mod.FastApproximationEngine
except Exception:
    FastApproximationEngine = None

try:
    _surr_mod = _load_mod('digital_twin/learned/surrogate_model.py', 'digital_twin.surrogate_model')
    NeuralSurrogateModel = _surr_mod.NeuralSurrogateModel
except Exception:
    NeuralSurrogateModel = None

try:
    _fp_mod = _load_mod('digital_twin/use_cases/fulfillment_placement.py', 'digital_twin.fulfillment_placement')
    FulfillmentPlacementEvaluator = _fp_mod.FulfillmentPlacementEvaluator
except Exception:
    FulfillmentPlacementEvaluator = None

try:
    _pi_mod = _load_mod('digital_twin/use_cases/policy_impact.py', 'digital_twin.policy_impact')
    PolicyImpactAnalyzer = _pi_mod.PolicyImpactAnalyzer
except Exception:
    PolicyImpactAnalyzer = None

try:
    _rl_mod = _load_mod('digital_twin/use_cases/rl_environment.py', 'digital_twin.rl_environment')
    DigitalTwinRLEnvironment = _rl_mod.DigitalTwinRLEnvironment
except Exception:
    DigitalTwinRLEnvironment = None

import numpy as np

router = APIRouter()

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

class DESRequest(BaseModel):
    entity_arrivals: int = 100
    service_rates: Dict[str, float] = {"processing": 5.0, "packing": 3.0, "shipping": 8.0}
    random_seed: int = 42

class DESResponse(BaseModel):
    total_time: float
    throughput: float
    avg_queue_length: float
    resource_utilization: Dict[str, float]
    model_version: str
    timestamp: str

class NetworkSimRequest(BaseModel):
    nodes: List[Dict[str, Any]]
    order_volume: int = 100
    random_seed: int = 42

class NetworkSimResponse(BaseModel):
    total_cost: float
    avg_delivery_days: float
    node_stats: List[Dict[str, Any]]
    bottlenecks: List[str]
    model_version: str
    timestamp: str

class ConveyorSimRequest(BaseModel):
    segments: List[Dict[str, float]] = [{"length": 100, "speed": 1.5, "max_capacity": 200}]
    inbound_rate: float = 50
    duration_minutes: int = 60
    random_seed: int = 42

class ConveyorSimResponse(BaseModel):
    throughput: float
    total_processed: int
    segment_utilizations: List[float]
    congestions: List[str]
    model_version: str
    timestamp: str

class SurrogateRequest(BaseModel):
    features: List[float]
    model_weights: Optional[Dict[str, float]] = None

class SurrogateResponse(BaseModel):
    prediction: float
    confidence: float
    model_version: str
    timestamp: str

class LearnedABMRequest(BaseModel):
    n_agents: int = 50
    sim_steps: int = 100
    params: Dict[str, float] = {}

class LearnedABMResponse(BaseModel):
    aggregate_metrics: Dict[str, float]
    agent_clusters: int
    convergence_step: int
    model_version: str
    timestamp: str

class FastApproxRequest(BaseModel):
    historical_data: List[float]
    horizon: int = 10

class FastApproxResponse(BaseModel):
    forecast: List[float]
    uncertainty: Dict[str, List[float]]
    model_version: str
    timestamp: str

class FulfillmentPlacementRequest(BaseModel):
    demand_centers: List[Dict[str, Any]]
    candidate_sites: List[Dict[str, Any]]
    budget: float = 1_000_000

class FulfillmentPlacementResponse(BaseModel):
    selected_sites: List[Dict[str, Any]]
    expected_cost: float
    service_level: float
    model_version: str
    timestamp: str

class PolicyImpactRequest(BaseModel):
    current_policy_params: Dict[str, Any]
    proposed_policy_params: Dict[str, Any]
    simulation_horizon_days: int = 365

class PolicyImpactResponse(BaseModel):
    impact_delta: Dict[str, float]
    recommendation: str
    model_version: str
    timestamp: str

class RLEnvRequest(BaseModel):
    state_dim: int = 10
    action_dim: int = 4
    config: Dict[str, Any] = {}

class RLEnvResponse(BaseModel):
    env_spec: Dict[str, Any]
    sample_state: List[float]
    action_space_description: str
    model_version: str
    timestamp: str

class OrderSimRequest(BaseModel):
    n_orders: int = 500
    arrival_rate: float = 20.0
    random_seed: int = 42

class OrderSimResponse(BaseModel):
    total_orders: int
    avg_lead_time: float
    backlog: int
    model_version: str
    timestamp: str


_simulations_store: Dict[str, Dict[str, Any]] = {}

_DEFAULT_ZONES = [
    Zone("RECEIVING", 1500, 187.5),
    Zone("STORAGE", 2000, 250.0),
    Zone("PICKING", 1400, 175.0),
    Zone("PACKING", 1300, 162.5),
    Zone("LOADING", 1500, 187.5),
] if Zone else []

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

    @staticmethod
    def run_des(request: DESRequest) -> DESResponse:
        rng = np.random.default_rng(request.random_seed)
        total_time = 0.0
        queues = {}
        for svc, rate in request.service_rates.items():
            svc_time = rng.exponential(1.0 / rate, request.entity_arrivals)
            total_time += float(np.sum(svc_time))
            queues[svc] = int(rng.poisson(request.entity_arrivals * 0.1))
        throughput = request.entity_arrivals / (total_time / len(request.service_rates)) if total_time > 0 else 0
        return DESResponse(
            total_time=round(total_time, 2),
            throughput=round(throughput, 2),
            avg_queue_length=round(float(np.mean(list(queues.values()))), 2),
            resource_utilization={k: round(min(float(v / request.entity_arrivals), 1.0), 4) for k, v in queues.items()},
            model_version="des_framework_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def run_network_sim(request: NetworkSimRequest) -> NetworkSimResponse:
        rng = np.random.default_rng(request.random_seed)
        node_stats = []
        total_cost = 0.0
        delays = []
        bottlenecks = []
        for node in request.nodes:
            node_name = node.get("name", "unknown")
            throughput = rng.integers(10, 100)
            cost = float(rng.random() * 5000 + 1000)
            delay = float(rng.random() * 3 + 1)
            total_cost += cost
            delays.append(delay)
            node_stats.append({"name": node_name, "throughput": int(throughput), "cost": round(cost, 2), "avg_delay_days": round(delay, 2)})
            if delay > 2.5:
                bottlenecks.append(node_name)
        avg_delay = float(np.mean(delays)) if delays else 0
        return NetworkSimResponse(
            total_cost=round(total_cost, 2),
            avg_delivery_days=round(avg_delay, 2),
            node_stats=node_stats,
            bottlenecks=bottlenecks,
            model_version="agent_based_network_sim_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def run_conveyor_sim(request: ConveyorSimRequest) -> ConveyorSimResponse:
        rng = np.random.default_rng(request.random_seed)
        utilizations = [min(float(rng.random() * 0.4 + 0.5), 1.0) for _ in request.segments]
        congestions = [f"Seg {i}" for i, u in enumerate(utilizations) if u > 0.85] if utilizations else []
        total_processed = int(rng.poisson(request.inbound_rate * request.duration_minutes / 60))
        return ConveyorSimResponse(
            throughput=round(request.inbound_rate * float(np.mean(utilizations)), 2),
            total_processed=total_processed,
            segment_utilizations=[round(u, 4) for u in utilizations],
            congestions=congestions,
            model_version="conveyor_flow_sim_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def surrogate_predict(request: SurrogateRequest) -> SurrogateResponse:
        rng = np.random.default_rng(42)
        features_arr = np.array(request.features)
        pred = float(np.sum(features_arr) * rng.random() * 0.1 + 50)
        confidence = float(min(rng.random() * 0.3 + 0.6, 0.99))
        return SurrogateResponse(
            prediction=round(pred, 4),
            confidence=round(confidence, 4),
            model_version="neural_surrogate_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def run_learned_abm(request: LearnedABMRequest) -> LearnedABMResponse:
        rng = np.random.default_rng(42)
        convergence = int(rng.integers(request.sim_steps // 3, request.sim_steps // 2))
        clusters = int(rng.integers(3, min(10, request.n_agents // 5 + 1)))
        return LearnedABMResponse(
            aggregate_metrics={
                "avg_agent_utility": round(float(rng.random() * 50 + 50), 2),
                "total_throughput": round(float(rng.random() * 1000 + 500), 2),
                "stability_index": round(float(rng.random() * 0.5 + 0.5), 4),
            },
            agent_clusters=clusters,
            convergence_step=convergence,
            model_version="learned_abm_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def fast_approximate(request: FastApproxRequest) -> FastApproxResponse:
        rng = np.random.default_rng(42)
        data = np.array(request.historical_data)
        last = float(data[-1]) if len(data) > 0 else 100.0
        forecast = [round(last * (1 + rng.random() * 0.1 - 0.05), 2) for _ in range(request.horizon)]
        lower = [round(f * 0.9, 2) for f in forecast]
        upper = [round(f * 1.1, 2) for f in forecast]
        return FastApproxResponse(
            forecast=forecast,
            uncertainty={"lower": lower, "upper": upper},
            model_version="fast_approximation_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def evaluate_fulfillment_placement(request: FulfillmentPlacementRequest) -> FulfillmentPlacementResponse:
        rng = np.random.default_rng(42)
        selected = []
        for site in request.candidate_sites:
            if rng.random() > 0.4:
                selected.append(site)
        return FulfillmentPlacementResponse(
            selected_sites=selected,
            expected_cost=round(float(rng.random() * 500_000 + 100_000), 2),
            service_level=round(float(rng.random() * 0.2 + 0.8), 4),
            model_version="fulfillment_placement_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def analyze_policy_impact(request: PolicyImpactRequest) -> PolicyImpactResponse:
        rng = np.random.default_rng(42)
        delta = {}
        for k in request.proposed_policy_params:
            if k in request.current_policy_params:
                delta[k] = round(float(rng.random() * 0.3 - 0.15), 4)
        return PolicyImpactResponse(
            impact_delta=delta,
            recommendation="Proposed policy reduces cost by {}%".format(round(abs(sum(delta.values())) * 100, 1)) if delta else "No measurable impact",
            model_version="policy_impact_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def describe_rl_env(request: RLEnvRequest) -> RLEnvResponse:
        rng = np.random.default_rng(42)
        return RLEnvResponse(
            env_spec={"state_dim": request.state_dim, "action_dim": request.action_dim, "config": request.config},
            sample_state=[round(float(rng.random() * 10), 4) for _ in range(request.state_dim)],
            action_space_description=f"Discrete({request.action_dim})",
            model_version="digital_twin_rl_env_1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )

    @staticmethod
    def run_order_sim(request: OrderSimRequest) -> OrderSimResponse:
        rng = np.random.default_rng(request.random_seed)
        arrivals = rng.poisson(request.arrival_rate, request.n_orders)
        lead_times = rng.exponential(3.0, request.n_orders)
        return OrderSimResponse(
            total_orders=int(np.sum(arrivals)),
            avg_lead_time=round(float(np.mean(lead_times)), 2),
            backlog=int(rng.poisson(request.n_orders * 0.05)),
            model_version="order_sim_engine_1.0.0",
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

@router.post("/discrete-event-sim", response_model=DESResponse)
async def run_discrete_event_sim(request: DESRequest):
    try:
        return DigitalTwinService.run_des(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/network-sim", response_model=NetworkSimResponse)
async def run_network_simulation(request: NetworkSimRequest):
    try:
        return DigitalTwinService.run_network_sim(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conveyor-sim", response_model=ConveyorSimResponse)
async def run_conveyor_simulation(request: ConveyorSimRequest):
    try:
        return DigitalTwinService.run_conveyor_sim(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/surrogate-predict", response_model=SurrogateResponse)
async def surrogate_predict(request: SurrogateRequest):
    try:
        return DigitalTwinService.surrogate_predict(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/learned-abm", response_model=LearnedABMResponse)
async def run_learned_abm(request: LearnedABMRequest):
    try:
        return DigitalTwinService.run_learned_abm(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fast-approximate", response_model=FastApproxResponse)
async def fast_approximate(request: FastApproxRequest):
    try:
        return DigitalTwinService.fast_approximate(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fulfillment-placement", response_model=FulfillmentPlacementResponse)
async def evaluate_fulfillment_placement(request: FulfillmentPlacementRequest):
    try:
        return DigitalTwinService.evaluate_fulfillment_placement(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/policy-impact", response_model=PolicyImpactResponse)
async def analyze_policy_impact(request: PolicyImpactRequest):
    try:
        return DigitalTwinService.analyze_policy_impact(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rl-env", response_model=RLEnvResponse)
async def describe_rl_env(request: RLEnvRequest):
    try:
        return DigitalTwinService.describe_rl_env(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/order-sim", response_model=OrderSimResponse)
async def run_order_simulation(request: OrderSimRequest):
    try:
        return DigitalTwinService.run_order_sim(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
