"""Private deployment configuration."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PrivateDeploymentConfig:
    model_path: str
    allowed_users: list[str]
    audit_logging: bool = True

    def is_allowed(self, user: str) -> bool:
        return user in self.allowed_users
