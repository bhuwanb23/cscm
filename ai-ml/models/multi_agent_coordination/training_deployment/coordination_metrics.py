"""
Metrics for Coordination Efficiency

This module implements metrics tracking for multi-agent coordination efficiency.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CoordinationEpisode:
    """Coordination episode data."""
    episode_id: int
    num_agents: int
    episode_length: int
    total_reward: float
    individual_rewards: List[float]
    coordination_score: float
    communication_overhead: float
    action_diversity: float
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class AgentPerformance:
    """Individual agent performance metrics."""
    agent_id: int
    total_reward: float
    avg_reward: float
    num_episodes: int
    coordination_contribution: float
    communication_efficiency: float


class CoordinationMetricsTracker:
    """
    Metrics tracker for coordination efficiency.
    
    Tracks various metrics related to multi-agent coordination performance.
    """
    
    def __init__(self):
        """Initialize metrics tracker."""
        self.episodes: List[CoordinationEpisode] = []
        self.agent_performances: Dict[int, AgentPerformance] = {}
        self.coordination_history: List[Dict[str, Any]] = []
    
    def record_episode(
        self,
        episode_id: int,
        num_agents: int,
        episode_length: int,
        total_reward: float,
        individual_rewards: List[float],
        coordination_score: float,
        communication_overhead: float = 0.0,
        action_diversity: float = 0.0,
        timestamp: Optional[datetime] = None
    ) -> CoordinationEpisode:
        """
        Record coordination episode.
        
        Args:
            episode_id: Episode identifier
            num_agents: Number of agents
            episode_length: Episode length
            total_reward: Total reward
            individual_rewards: List of individual agent rewards
            coordination_score: Coordination score
            communication_overhead: Communication overhead
            action_diversity: Action diversity metric
            timestamp: Timestamp (defaults to now)
        
        Returns:
            CoordinationEpisode object
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        episode = CoordinationEpisode(
            episode_id=episode_id,
            num_agents=num_agents,
            episode_length=episode_length,
            total_reward=total_reward,
            individual_rewards=individual_rewards,
            coordination_score=coordination_score,
            communication_overhead=communication_overhead,
            action_diversity=action_diversity,
            timestamp=timestamp
        )
        
        self.episodes.append(episode)
        
        # Update agent performances
        for agent_id, reward in enumerate(individual_rewards):
            if agent_id not in self.agent_performances:
                self.agent_performances[agent_id] = AgentPerformance(
                    agent_id=agent_id,
                    total_reward=0.0,
                    avg_reward=0.0,
                    num_episodes=0,
                    coordination_contribution=0.0,
                    communication_efficiency=0.0
                )
            
            perf = self.agent_performances[agent_id]
            perf.total_reward += reward
            perf.num_episodes += 1
            perf.avg_reward = perf.total_reward / perf.num_episodes
        
        return episode
    
    def calculate_coordination_efficiency(
        self,
        num_episodes: Optional[int] = None
    ) -> Dict[str, float]:
        """
        Calculate coordination efficiency metrics.
        
        Args:
            num_episodes: Number of recent episodes to consider (None = all)
        
        Returns:
            Dictionary of efficiency metrics
        """
        if not self.episodes:
            return {
                'avg_coordination_score': 0.0,
                'avg_total_reward': 0.0,
                'avg_communication_overhead': 0.0,
                'avg_action_diversity': 0.0,
                'coordination_improvement': 0.0
            }
        
        # Get recent episodes
        if num_episodes is not None:
            episodes = self.episodes[-num_episodes:]
        else:
            episodes = self.episodes
        
        if not episodes:
            return {
                'avg_coordination_score': 0.0,
                'avg_total_reward': 0.0,
                'avg_communication_overhead': 0.0,
                'avg_action_diversity': 0.0,
                'coordination_improvement': 0.0
            }
        
        avg_coordination_score = np.mean([e.coordination_score for e in episodes])
        avg_total_reward = np.mean([e.total_reward for e in episodes])
        avg_communication_overhead = np.mean([e.communication_overhead for e in episodes])
        avg_action_diversity = np.mean([e.action_diversity for e in episodes])
        
        # Calculate improvement (compare first half to second half)
        if len(episodes) >= 2:
            first_half = episodes[:len(episodes)//2]
            second_half = episodes[len(episodes)//2:]
            
            first_avg = np.mean([e.coordination_score for e in first_half])
            second_avg = np.mean([e.coordination_score for e in second_half])
            
            coordination_improvement = second_avg - first_avg
        else:
            coordination_improvement = 0.0
        
        return {
            'avg_coordination_score': avg_coordination_score,
            'avg_total_reward': avg_total_reward,
            'avg_communication_overhead': avg_communication_overhead,
            'avg_action_diversity': avg_action_diversity,
            'coordination_improvement': coordination_improvement,
            'num_episodes': len(episodes)
        }
    
    def calculate_agent_performance(
        self,
        agent_id: int
    ) -> Optional[AgentPerformance]:
        """
        Calculate performance metrics for an agent.
        
        Args:
            agent_id: Agent identifier
        
        Returns:
            AgentPerformance object or None
        """
        return self.agent_performances.get(agent_id)
    
    def calculate_communication_efficiency(
        self,
        num_episodes: Optional[int] = None
    ) -> Dict[str, float]:
        """
        Calculate communication efficiency metrics.
        
        Args:
            num_episodes: Number of recent episodes to consider (None = all)
        
        Returns:
            Dictionary of communication metrics
        """
        if not self.episodes:
            return {
                'avg_overhead': 0.0,
                'communication_per_episode': 0.0,
                'efficiency_score': 0.0
            }
        
        # Get recent episodes
        if num_episodes is not None:
            episodes = self.episodes[-num_episodes:]
        else:
            episodes = self.episodes
        
        if not episodes:
            return {
                'avg_overhead': 0.0,
                'communication_per_episode': 0.0,
                'efficiency_score': 0.0
            }
        
        avg_overhead = np.mean([e.communication_overhead for e in episodes])
        avg_reward = np.mean([e.total_reward for e in episodes])
        
        # Efficiency score: higher reward with lower overhead is better
        if avg_overhead > 0:
            efficiency_score = avg_reward / (avg_overhead + 1e-8)
        else:
            efficiency_score = avg_reward
        
        return {
            'avg_overhead': avg_overhead,
            'communication_per_episode': avg_overhead,
            'efficiency_score': efficiency_score,
            'num_episodes': len(episodes)
        }
    
    def get_summary_statistics(self) -> Dict[str, Any]:
        """
        Get summary statistics.
        
        Returns:
            Dictionary of summary statistics
        """
        if not self.episodes:
            return {
                'total_episodes': 0,
                'avg_coordination': 0.0,
                'avg_reward': 0.0,
                'num_agents': 0
            }
        
        return {
            'total_episodes': len(self.episodes),
            'avg_coordination': np.mean([e.coordination_score for e in self.episodes]),
            'avg_reward': np.mean([e.total_reward for e in self.episodes]),
            'avg_episode_length': np.mean([e.episode_length for e in self.episodes]),
            'num_agents': self.episodes[0].num_agents if self.episodes else 0,
            'agent_performances': {
                agent_id: {
                    'avg_reward': perf.avg_reward,
                    'num_episodes': perf.num_episodes
                }
                for agent_id, perf in self.agent_performances.items()
            }
        }
    
    def export_metrics(
        self,
        filepath: str,
        format: str = 'csv'  # 'csv' or 'json'
    ):
        """
        Export metrics to file.
        
        Args:
            filepath: Output file path
            format: Export format
        """
        if format == 'csv':
            # Export episodes
            episodes_df = pd.DataFrame([
                {
                    'episode_id': e.episode_id,
                    'num_agents': e.num_agents,
                    'episode_length': e.episode_length,
                    'total_reward': e.total_reward,
                    'coordination_score': e.coordination_score,
                    'communication_overhead': e.communication_overhead,
                    'action_diversity': e.action_diversity,
                    'timestamp': e.timestamp
                }
                for e in self.episodes
            ])
            
            episodes_df.to_csv(filepath, index=False)
            
        elif format == 'json':
            import json
            data = {
                'episodes': [
                    {
                        'episode_id': e.episode_id,
                        'num_agents': e.num_agents,
                        'episode_length': e.episode_length,
                        'total_reward': e.total_reward,
                        'individual_rewards': e.individual_rewards,
                        'coordination_score': e.coordination_score,
                        'communication_overhead': e.communication_overhead,
                        'action_diversity': e.action_diversity,
                        'timestamp': e.timestamp.isoformat()
                    }
                    for e in self.episodes
                ],
                'agent_performances': {
                    str(agent_id): {
                        'total_reward': perf.total_reward,
                        'avg_reward': perf.avg_reward,
                        'num_episodes': perf.num_episodes
                    }
                    for agent_id, perf in self.agent_performances.items()
                }
            }
            
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        
        logger.info(f"Metrics exported to {filepath}")
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Get data for dashboard visualization.
        
        Returns:
            Dictionary of dashboard data
        """
        # Last 100 episodes
        recent_episodes = self.episodes[-100:] if len(self.episodes) > 100 else self.episodes
        
        coordination_eff = self.calculate_coordination_efficiency(num_episodes=100)
        communication_eff = self.calculate_communication_efficiency(num_episodes=100)
        summary = self.get_summary_statistics()
        
        return {
            'coordination_efficiency': coordination_eff,
            'communication_efficiency': communication_eff,
            'summary': summary,
            'recent_episodes': len(recent_episodes)
        }

