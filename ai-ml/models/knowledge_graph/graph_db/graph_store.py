"""In-memory graph database store."""

from __future__ import annotations

from typing import Dict, List

try:
    import networkx as nx
    HAS_NX = True
except ImportError:  # pragma: no cover
    HAS_NX = False
    nx = None

from .schema import Entity, Relationship


class GraphStore:
    def __init__(self):
        if HAS_NX:
            self.graph = nx.MultiDiGraph()
        else:
            self.graph = {'nodes': {}, 'edges': []}

    def add_entity(self, entity: Entity):
        if HAS_NX:
            self.graph.add_node(entity.id, **{'type': entity.type, **entity.attributes})
        else:
            self.graph['nodes'][entity.id] = {'type': entity.type, **entity.attributes}

    def add_relationship(self, rel: Relationship):
        if HAS_NX:
            self.graph.add_edge(rel.source, rel.target, key=rel.type, **rel.attributes)
        else:
            self.graph['edges'].append({'source': rel.source, 'target': rel.target, 'type': rel.type, **rel.attributes})

    def neighbors(self, node_id: str) -> List[str]:
        if HAS_NX:
            return list(self.graph.neighbors(node_id))
        return [edge['target'] for edge in self.graph['edges'] if edge['source'] == node_id]

    def get_entity(self, node_id: str) -> Dict:
        if HAS_NX:
            return self.graph.nodes[node_id]
        return self.graph['nodes'][node_id]
