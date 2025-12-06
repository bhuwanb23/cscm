from pydantic import BaseModel
from typing import List, Optional

class RoutingOptimizeRequest(BaseModel):
    vehicle_id: str
    depot_location: dict  # {lat: float, lng: float}
    delivery_locations: List[dict]  # [{id: str, lat: float, lng: float, demand: float, time_window: dict}]
    vehicle_capacity: float
    max_route_time: float

class RoutingOptimizeResponse(BaseModel):
    vehicle_id: str
    route_sequence: List[str]
    total_distance: float
    total_time: float
    route_details: List[dict]
    model_version: str
    timestamp: str

class RoutingStatusRequest(BaseModel):
    route_id: str

class RoutingStatusResponse(BaseModel):
    route_id: str
    status: str
    current_location: Optional[dict]  # {lat: float, lng: float}
    estimated_completion_time: Optional[str]
    delays: Optional[List[str]]
    model_version: str
    timestamp: str