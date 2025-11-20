"""
Agent-based network simulator for multi-node supply chains.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import List, Dict, Any
import numpy as np


@dataclass
class Node:
    node_id: str
    node_type: str
    inventory: float = 0.0


class AgentBasedNetworkSimulator:
    def __init__(self, nodes: List[Node], edges: List[Dict[str, Any]]):
        self.nodes = {n.node_id: n for n in nodes}
        self.edges = edges

    @classmethod
    def from_network(cls, path: str) -> "AgentBasedNetworkSimulator":
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        nodes = [Node(node['id'], node['type']) for node in data['nodes']]
        return cls(nodes, data['edges'])

    def replenish(self, origin: str, destination: str, units: float):
        self.nodes[origin].inventory -= units
        self.nodes[destination].inventory += units

    def simulate_step(self, demand_variance: float = 5.0, rng: np.random.Generator | None = None):
        if rng is None:
            rng = np.random.default_rng()
        for node in self.nodes.values():
            if node.node_type == 'store':
                demand = max(0, rng.normal(20, demand_variance))
                node.inventory = max(0, node.inventory - demand)
        for edge in self.edges:
            if self.nodes[edge['from']].inventory > edge['capacity'] * 0.5:
                transfer = min(edge['capacity'], self.nodes[edge['from']].inventory)
                self.replenish(edge['from'], edge['to'], transfer)

    def snapshot(self) -> Dict[str, float]:
        return {node_id: node.inventory for node_id, node in self.nodes.items()}

