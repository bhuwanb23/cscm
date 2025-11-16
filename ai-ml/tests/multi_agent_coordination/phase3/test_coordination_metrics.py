"""
Tests for Coordination Metrics
"""

import pytest
import numpy as np
from datetime import datetime
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.multi_agent_coordination.training_deployment.coordination_metrics import (
    CoordinationMetricsTracker
)


class TestCoordinationMetricsTracker:
    """Test cases for CoordinationMetricsTracker."""
    
    def test_initialization(self):
        """Test tracker initialization."""
        tracker = CoordinationMetricsTracker()
        
        assert len(tracker.episodes) == 0
        assert len(tracker.agent_performances) == 0
    
    def test_record_episode(self):
        """Test episode recording."""
        tracker = CoordinationMetricsTracker()
        
        episode = tracker.record_episode(
            episode_id=1,
            num_agents=3,
            episode_length=100,
            total_reward=50.0,
            individual_rewards=[15.0, 20.0, 15.0],
            coordination_score=0.8,
            communication_overhead=0.1,
            action_diversity=0.5
        )
        
        assert episode.episode_id == 1
        assert len(tracker.episodes) == 1
        assert len(tracker.agent_performances) == 3
    
    def test_calculate_coordination_efficiency(self):
        """Test coordination efficiency calculation."""
        tracker = CoordinationMetricsTracker()
        
        # Record some episodes
        tracker.record_episode(1, 2, 100, 50.0, [25.0, 25.0], 0.7, 0.1, 0.4)
        tracker.record_episode(2, 2, 100, 60.0, [30.0, 30.0], 0.8, 0.1, 0.5)
        
        efficiency = tracker.calculate_coordination_efficiency()
        
        assert 'avg_coordination_score' in efficiency
        assert 'avg_total_reward' in efficiency
        assert efficiency['avg_coordination_score'] > 0
    
    def test_get_summary_statistics(self):
        """Test summary statistics."""
        tracker = CoordinationMetricsTracker()
        
        tracker.record_episode(1, 2, 100, 50.0, [25.0, 25.0], 0.7, 0.1, 0.4)
        
        summary = tracker.get_summary_statistics()
        
        assert 'total_episodes' in summary
        assert 'avg_coordination' in summary
        assert 'num_agents' in summary


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

