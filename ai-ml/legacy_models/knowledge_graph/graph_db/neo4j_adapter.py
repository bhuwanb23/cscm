"""Neo4j adapter stub."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Neo4jConfig:
    uri: str
    user: str
    password: str


class Neo4jAdapter:
    def __init__(self, config: Neo4jConfig):
        self.config = config
        self.connected = False

    def connect(self):
        # In real deployment we'd instantiate GraphDatabase.driver
        self.connected = True

    def ingest(self, cypher: str):
        if not self.connected:
            raise RuntimeError("Call connect() first")
        return f"Executed: {cypher[:40]}..."
