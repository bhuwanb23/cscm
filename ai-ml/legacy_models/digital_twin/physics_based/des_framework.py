"""
Discrete-event simulation framework components.
"""

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Callable, List, Tuple, Dict, Any


@dataclass(order=True)
class Event:
    timestamp: float
    priority: int
    action: Callable[[float], None] = field(compare=False)


class DiscreteEventSimulator:
    """Lightweight DES core supporting custom event scheduling."""

    def __init__(self):
        self.current_time = 0.0
        self.event_queue: List[Event] = []
        self.history: List[Tuple[float, str]] = []

    def schedule(self, timestamp: float, action: Callable[[float], None], priority: int = 0):
        heapq.heappush(self.event_queue, Event(timestamp, priority, action))

    def run(self, until: float = float('inf')):
        while self.event_queue and self.event_queue[0].timestamp <= until:
            event = heapq.heappop(self.event_queue)
            self.current_time = event.timestamp
            event.action(self.current_time)

    def record(self, message: str):
        self.history.append((self.current_time, message))

