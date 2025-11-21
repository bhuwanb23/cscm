"""Graph schema dataclasses."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Entity:
    id: str
    type: str
    attributes: dict


@dataclass
class Relationship:
    source: str
    target: str
    type: str
    attributes: dict
