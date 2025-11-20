"""
Warehouse process simulator for physics-based digital twin.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import List, Dict, Any
import numpy as np


@dataclass
class Zone:
    name: str
    capacity: int
    process_rate: float  # units per hour


class WarehouseProcessSimulator:
    """Simulate flow through warehouse zones using simple queueing approximation."""

    def __init__(self, zones: List[Zone], arrival_rate_per_hour: float, shift_hours: float = 8.0):
        self.zones = zones
        self.arrival_rate = arrival_rate_per_hour
        self.shift_hours = shift_hours

    @classmethod
    def from_layout(cls, layout_path: str) -> "WarehouseProcessSimulator":
        with open(layout_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        zones = [Zone(**z) for z in data['zones']]
        return cls(zones, data['arrival_rate_per_hour'], data.get('shift_hours', 8))

    def simulate(self, random_seed: int = 42) -> Dict[str, Any]:
        rng = np.random.default_rng(random_seed)
        results = []
        current_arrivals = self.arrival_rate * self.shift_hours
        total_processed = current_arrivals
        bottleneck = None
        for zone in self.zones:
            capacity = zone.capacity
            effective_rate = min(zone.process_rate * self.shift_hours, capacity)
            processed = min(current_arrivals, effective_rate)
            wait_time = max(0, current_arrivals - effective_rate) / max(zone.process_rate, 1e-3)
            zone_result = {
                'zone': zone.name,
                'capacity': capacity,
                'processed': processed,
                'wait_time_hours': wait_time,
            }
            results.append(zone_result)
            total_processed = min(total_processed, processed)
            if bottleneck is None or processed < bottleneck['processed']:
                bottleneck = zone_result
            current_arrivals = processed + rng.normal(0, 0.05 * processed)
        throughput = total_processed / self.shift_hours
        return {
            'zone_results': results,
            'bottleneck': bottleneck,
            'throughput_units_per_hour': throughput,
        }
