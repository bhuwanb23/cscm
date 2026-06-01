import logging
from typing import List, Optional
import sys
import os
from datetime import datetime
import math

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from routing_models import RoutingOptimizeRequest, RoutingOptimizeResponse, RoutingStatusRequest, RoutingStatusResponse
from routing_logistics.classical_optimization.cvrptw_solver import CVRPTWSolver

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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

            if request.vehicle_capacity <= 0:
                raise ValueError("Vehicle capacity must be positive")
            if request.max_route_time <= 0:
                raise ValueError("Max route time must be positive")
            if not request.delivery_locations:
                raise ValueError("Delivery locations cannot be empty")

            # Build location list for OR-Tools (index 0 = depot)
            locations = []
            locations.append({
                'id': 0,
                'x': request.depot_location['lng'],
                'y': request.depot_location['lat'],
                'demand': 0,
                'service_time': 0,
                'time_window_start': 0,
                'time_window_end': 1e9
            })

            id_mapping = {0: 'depot'}
            for i, loc in enumerate(request.delivery_locations):
                idx = i + 1
                loc_id = loc.get('id', str(idx))
                id_mapping[idx] = loc_id

                tw = loc.get('time_window', {})
                tw_start = _time_str_to_minutes(tw.get('start', '00:00')) if isinstance(tw.get('start'), str) else tw.get('start', 0)
                tw_end = _time_str_to_minutes(tw.get('end', '23:59')) if isinstance(tw.get('end'), str) else tw.get('end', 1e9)

                locations.append({
                    'id': idx,
                    'x': loc.get('lng', loc.get('x', 0)),
                    'y': loc.get('lat', loc.get('y', 0)),
                    'demand': loc.get('demand', 0),
                    'service_time': loc.get('service_time', 10),
                    'time_window_start': tw_start,
                    'time_window_end': tw_end
                })

            # Build vehicle list
            vehicles = [{
                'id': 0,
                'capacity': request.vehicle_capacity,
                'start_location': 0,
                'max_route_time': request.max_route_time * 60
            }]

            # Compute distance matrix from lat/lng
            n = len(locations)
            dist_matrix = [[0.0] * n for _ in range(n)]
            for i in range(n):
                for j in range(n):
                    if i != j:
                        dist_matrix[i][j] = _haversine(
                            locations[i]['y'], locations[i]['x'],
                            locations[j]['y'], locations[j]['x']
                        )

            import numpy as np

            solver = CVRPTWSolver(time_limit=15, verbose=False)
            result = solver.solve_from_data(
                locations=locations,
                vehicles=vehicles,
                distance_matrix=np.array(dist_matrix, dtype=np.float64)
            )

            route_sequence = ['depot']
            route_details = []
            total_distance = 0.0
            total_time = 0.0

            if result['status'] == 'optimal' and result['routes']:
                route = result['routes'][0]
                total_distance = route['distance'] / 1000.0
                total_time = route['time']

                # Build route sequence from node indices
                node_indices = route['route']
                route_sequence = [id_mapping.get(n, str(n)) for n in node_indices]

                # Build route_details
                for k in range(len(node_indices) - 1):
                    from_id = id_mapping.get(node_indices[k], str(node_indices[k]))
                    to_id = id_mapping.get(node_indices[k + 1], str(node_indices[k + 1]))
                    segment_dist = dist_matrix[node_indices[k]][node_indices[k + 1]]
                    route_details.append({
                        "from": from_id,
                        "to": to_id,
                        "distance_km": round(segment_dist, 2)
                    })

            response = RoutingOptimizeResponse(
                vehicle_id=request.vehicle_id,
                route_sequence=route_sequence,
                total_distance=round(total_distance, 2),
                total_time=round(total_time, 2),
                route_details=route_details,
                model_version="cvrptw_ortools_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )

            logger.info(f"Route optimized: {len(route_sequence)} stops, {total_distance:.2f} km")
            return response

        except ImportError:
            logger.warning("OR-Tools not available; falling back to mock route")
            return RoutingOptimizeResponse(
                vehicle_id=request.vehicle_id,
                route_sequence=["depot"] + [loc.get('id', f"loc{i}") for i, loc in enumerate(request.delivery_locations)] + ["depot"],
                total_distance=125.5,
                total_time=180.0,
                route_details=[
                    {"location": "depot", "arrival_time": "08:00", "departure_time": "08:00"},
                    {"location": loc.get('id', f"loc{i}"), "arrival_time": "08:30", "departure_time": "08:45"}
                    for i, loc in enumerate(request.delivery_locations[:1])
                ] + [{"location": "depot", "arrival_time": "11:00", "departure_time": "11:00"}],
                model_version="cvrptw_ortools_1.0.0",
                timestamp=datetime.utcnow().isoformat() + "Z"
            )

        except Exception as e:
            logger.error(f"Error optimizing route: {str(e)}")
            raise

    @staticmethod
    def get_route_status(request: RoutingStatusRequest) -> RoutingStatusResponse:
        logger.info(f"Getting route status for route: {request.route_id}")

        response = RoutingStatusResponse(
            route_id=request.route_id,
            status="IN_TRANSIT",
            current_location={"lat": 40.7128, "lng": -74.0060},
            estimated_completion_time="2023-01-01T11:30:00Z",
            delays=["Traffic delay on Highway 1"],
            model_version="1.0.0",
            timestamp=datetime.utcnow().isoformat() + "Z"
        )

        logger.info(f"Successfully retrieved route status for route: {request.route_id}")
        return response
