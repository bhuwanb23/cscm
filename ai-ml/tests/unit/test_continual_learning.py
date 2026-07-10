"""
Unit tests for continual learning components.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestOnlineAdapter:
    """Tests for continual_learning.continual_learning_framework.online_adapter."""

    def test_init(self):
        from continual_learning.continual_learning_framework.online_adapter import SimpleOnlineAdapter
        a = SimpleOnlineAdapter(n_features=10)
        assert a is not None


class TestIncrementalUpdater:
    """Tests for continual_learning.continual_learning_framework.incremental_updater."""

    def test_init(self):
        from continual_learning.continual_learning_framework.incremental_updater import IncrementalModelUpdater
        u = IncrementalModelUpdater()
        assert u is not None


class TestFedAvgCoordinator:
    """Tests for continual_learning.federated_system.fedavg_coordinator."""

    def test_init(self):
        from continual_learning.federated_system.fedavg_coordinator import FederatedAveragingCoordinator
        c = FederatedAveragingCoordinator(n_features=10)
        assert c is not None


class TestDemandEvolution:
    """Tests for continual_learning.supply_chain_applications.demand_evolution."""

    def test_init(self):
        from continual_learning.supply_chain_applications.demand_evolution import DemandPatternEvolution
        t = DemandPatternEvolution(product_id="SKU001")
        assert t.product_id == "SKU001"
