"""Root cause analysis using graph paths."""

from __future__ import annotations

from typing import List


class RootCauseAnalyzer:
    def __init__(self, graph_store):
        self.graph_store = graph_store

    def trace_path(self, start: str, target: str, max_depth: int = 3) -> List[str]:
        visited = set()
        stack = [(start, [start])]
        while stack:
            node, path = stack.pop()
            if node == target:
                return path
            if len(path) > max_depth:
                continue
            visited.add(node)
            for neighbor in self.graph_store.neighbors(node):
                if neighbor not in visited:
                    stack.append((neighbor, path + [neighbor]))
        return []
