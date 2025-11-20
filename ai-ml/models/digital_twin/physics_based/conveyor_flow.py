"""
Conveyor flow simulation for digital twin.
"""

from __future__ import annotations

import json
from typing import List, Dict, Any
import numpy as np


class ConveyorSegment:
    def __init__(self, segment_id: str, length: float, speed: float):
        self.segment_id = segment_id
        self.length = length
        self.speed = speed  # meters per second

    @property
    def travel_time(self) -> float:
        return self.length / max(self.speed, 1e-3)


class ConveyorFlowSimulator:
    """Simple conveyor simulator that estimates travel time and throughput."""

    def __init__(self, segments: List[ConveyorSegment]):
        self.segments = segments

    @classmethod
    def from_config(cls, path: str) -> "ConveyorFlowSimulator":
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        segments = [ConveyorSegment(seg['id'], seg['length'], seg['speed']) for seg in data['segments']]
        return cls(segments)

    def simulate(self, num_containers: int, random_seed: int = 42) -> Dict[str, Any]:
        rng = np.random.default_rng(random_seed)
        base_time = sum(seg.travel_time for seg in self.segments)
        jitter = rng.normal(0, 0.05 * base_time, size=num_containers)
        travel_times = np.clip(base_time + jitter, 0, None)
        throughput = num_containers / max(travel_times.sum() / num_containers, 1e-3)
        return {
            'mean_travel_time_seconds': float(np.mean(travel_times)),
            'max_travel_time_seconds': float(np.max(travel_times)),
            'throughput_containers_per_second': throughput
        }
