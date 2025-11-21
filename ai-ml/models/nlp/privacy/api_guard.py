"""API guard ensures no public endpoints for sensitive data."""

from __future__ import annotations

from typing import List


class APIGuard:
    def __init__(self, allowed_domains: List[str]):
        self.allowed_domains = allowed_domains

    def validate(self, url: str) -> bool:
        return any(url.startswith(domain) for domain in self.allowed_domains)
