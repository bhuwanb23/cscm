"""Graph ingestion from JSON."""

from __future__ import annotations

import json
from typing import Tuple

from .schema import Entity, Relationship
from .graph_store import GraphStore


def load_graph(path: str) -> GraphStore:
    store = GraphStore()
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for ent in data.get('entities', []):
        store.add_entity(Entity(ent['id'], ent['type'], {k: v for k, v in ent.items() if k not in {'id', 'type'}}))
    for rel in data.get('relationships', []):
        store.add_relationship(
            Relationship(
                rel['source'],
                rel['target'],
                rel['type'],
                {k: v for k, v in rel.items() if k not in {'source', 'target', 'type'}},
            )
        )
    return store
