"""
Unit tests for multi-agent coordination components.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestMADDPG:
    """Tests for multi_agent_coordination.multi_agent_framework.maddpg."""

    def test_init(self):
        from multi_agent_coordination.multi_agent_framework.maddpg import MADDPGAgent
        a = MADDPGAgent(agent_id=0, num_agents=3, state_dim=10, action_dim=5)
        assert a.agent_id == 0


class TestMAPPO:
    """Tests for multi_agent_coordination.multi_agent_framework.mappo."""

    def test_init(self):
        from multi_agent_coordination.multi_agent_framework.mappo import MAPPOAgent
        a = MAPPOAgent(agent_id=0, num_agents=3, state_dim=10, action_dim=5)
        assert a.agent_id == 0


class TestQMIX:
    """Tests for multi_agent_coordination.multi_agent_framework.qmix."""

    def test_init(self):
        from multi_agent_coordination.multi_agent_framework.qmix import QMIXCoordinator
        c = QMIXCoordinator(num_agents=3, state_dim=10, action_dim=5, global_state_dim=30)
        assert c.num_agents == 3


class TestCoordinationMetrics:
    """Tests for multi_agent_coordination.training_deployment.coordination_metrics."""

    def test_init(self):
        from multi_agent_coordination.training_deployment.coordination_metrics import CoordinationMetricsTracker
        m = CoordinationMetricsTracker()
        assert m is not None

    def test_record_episode(self):
        from multi_agent_coordination.training_deployment.coordination_metrics import CoordinationMetricsTracker
        m = CoordinationMetricsTracker()
        ep = m.record_episode(
            episode_id=1, num_agents=3, episode_length=100,
            total_reward=50.0, individual_rewards=[20.0, 15.0, 15.0],
            coordination_score=0.8
        )
        assert ep.episode_id == 1


class TestStateExchange:
    """Tests for multi_agent_coordination.communication_protocols.state_exchange."""

    def test_init_requires_torch(self):
        pytest.importorskip("torch")
        from multi_agent_coordination.communication_protocols.state_exchange import CompressedStateExchange
        p = CompressedStateExchange(state_dim=10, compressed_dim=5)
        assert p.state_dim == 10
