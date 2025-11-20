"""
Phase 2 agent-based tests.
"""

import os
import sys
import json
import pandas as pd

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DATA = os.path.join(ROOT, 'data', 'test')
sys.path.insert(0, os.path.join(ROOT, 'models'))

from digital_twin.agent_based import multi_node, order_simulator, routing_simulator


def test_multi_node_simulation():
    sim = multi_node.AgentBasedNetworkSimulator.from_network(os.path.join(DATA, 'agent_network.json'))
    sim.nodes['DC1'].inventory = 200
    sim.simulate_step()
    snapshot = sim.snapshot()
    assert 'Store1' in snapshot


def test_order_engine():
    engine = order_simulator.OrderSimulationEngine.from_csv(os.path.join(DATA, 'order_stream.csv'))
    batch = engine.next_batch()
    assert not batch.empty


def test_routing_env():
    nodes = {'A': (0, 0), 'B': (3, 4), 'C': (6, 8)}
    env = routing_simulator.RoutingSimulationEnvironment.from_nodes(nodes)
    dist = env.route_distance(('A', 'B', 'C'))
    assert dist > 0
