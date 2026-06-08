"""
Supplier Relationship Learning for Supply Chain Applications

This module implements performance pattern recognition, risk assessment
evolution, collaboration optimization, and contract term adaptation
for supplier relationships using continual learning.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupplierPerformanceTracker:
    """
    Tracks and evaluates supplier performance over time using
    continual learning to adapt to changing supplier capabilities
    and market conditions.
    """

    def __init__(self,
                 supplier_id: str,
                 metrics: Optional[List[str]] = None,
                 window_size: int = 30):
        self.supplier_id = supplier_id
        self.metrics = metrics or ['on_time_delivery', 'quality_score', 'cost_index', 'responsiveness']
        self.window_size = window_size

        self.performance_history: Dict[str, deque] = {
            m: deque(maxlen=window_size) for m in self.metrics
        }
        self.baselines: Dict[str, float] = {m: 0.0 for m in self.metrics}
        self.trends: Dict[str, float] = {m: 0.0 for m in self.metrics}
        self.alerts: List[Dict[str, Any]] = []

    def update(self, metric_values: Dict[str, float]) -> Dict[str, Any]:
        for metric, value in metric_values.items():
            if metric in self.performance_history:
                self.performance_history[metric].append(value)

        if len(self.performance_history[self.metrics[0]]) >= 5:
            self._update_baselines()
            self._update_trends()

        anomalies = self._detect_anomalies()
        for anomaly in anomalies:
            self.alerts.append(anomaly)

        overall_score = self._compute_overall_score()

        return {
            'supplier_id': self.supplier_id,
            'overall_score': overall_score,
            'baselines': dict(self.baselines),
            'trends': dict(self.trends),
            'anomalies_detected': len(anomalies),
            'observations': len(self.performance_history[self.metrics[0]]),
        }

    def _update_baselines(self):
        for metric in self.metrics:
            data = list(self.performance_history[metric])
            if data:
                self.baselines[metric] = float(np.mean(data))

    def _update_trends(self):
        for metric in self.metrics:
            data = list(self.performance_history[metric])
            if len(data) >= 10:
                x = np.arange(len(data))
                slope = np.polyfit(x, data, 1)[0]
                self.trends[metric] = float(slope)

    def _detect_anomalies(self) -> List[Dict[str, Any]]:
        anomalies = []
        for metric in self.metrics:
            data = list(self.performance_history[metric])
            if len(data) >= 10:
                mean = np.mean(data[:-3])
                std = np.std(data[:-3])
                recent = data[-3:]
                for val in recent:
                    if std > 0 and abs(val - mean) > 2 * std:
                        anomalies.append({
                            'supplier_id': self.supplier_id,
                            'metric': metric,
                            'value': float(val),
                            'expected': float(mean),
                            'severity': 'high' if abs(val - mean) > 3 * std else 'medium',
                        })
        return anomalies

    def _compute_overall_score(self) -> float:
        scores = []
        for metric in self.metrics:
            data = list(self.performance_history[metric])
            if data:
                baseline = self.baselines[metric]
                if baseline > 0:
                    scores.append(float(np.mean(data[-5:])) / baseline)
                else:
                    scores.append(1.0)
        return float(np.mean(scores)) if scores else 0.0

    def get_state(self) -> Dict[str, Any]:
        return {
            'supplier_id': self.supplier_id,
            'observations': len(self.performance_history[self.metrics[0]]),
            'baselines': self.baselines,
            'trends': self.trends,
            'alerts_count': len(self.alerts),
        }


class RiskAssessor:
    """
    Evolves risk assessment models for suppliers based on historical
    performance, market conditions, and external factors.
    """

    def __init__(self,
                 supplier_id: str,
                 risk_factors: Optional[List[str]] = None):
        self.supplier_id = supplier_id
        self.risk_factors = risk_factors or [
            'financial_stability', 'operational_reliability',
            'geopolitical_risk', 'quality_risk',
        ]
        self.risk_scores: Dict[str, float] = {f: 0.5 for f in self.risk_factors}
        self.overall_risk = 0.5
        self.risk_history: List[float] = []
        self.threshold_adjustments = 0

    def assess(self, performance_scores: Dict[str, float],
               external_risks: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        if external_risks:
            for factor, risk in external_risks.items():
                if factor in self.risk_scores:
                    self.risk_scores[factor] = 0.7 * self.risk_scores[factor] + 0.3 * risk

        if 'on_time_delivery' in performance_scores:
            self.risk_scores['operational_reliability'] = 1.0 - performance_scores['on_time_delivery']
        if 'quality_score' in performance_scores:
            self.risk_scores['quality_risk'] = 1.0 - performance_scores['quality_score']

        self.overall_risk = float(np.mean(list(self.risk_scores.values())))
        self.risk_history.append(self.overall_risk)

        risk_level = 'low' if self.overall_risk < 0.3 else 'medium' if self.overall_risk < 0.6 else 'high'

        if len(self.risk_history) >= 10:
            recent_avg = np.mean(self.risk_history[-10:])
            if abs(recent_avg - self.overall_risk) > 0.15:
                self.threshold_adjustments += 1

        return {
            'supplier_id': self.supplier_id,
            'overall_risk': float(self.overall_risk),
            'risk_level': risk_level,
            'risk_factors': dict(self.risk_scores),
            'threshold_adjustments': self.threshold_adjustments,
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'supplier_id': self.supplier_id,
            'overall_risk': float(self.overall_risk),
            'risk_factors': self.risk_scores,
            'assessments_made': len(self.risk_history),
        }


class SupplierLearningManager:
    """
    Integrated manager combining performance tracking, risk assessment,
    and collaboration optimization for supplier relationship learning.
    """

    def __init__(self, supplier_id: str):
        self.performance = SupplierPerformanceTracker(supplier_id)
        self.risk = RiskAssessor(supplier_id)
        self.supplier_id = supplier_id
        self.collaboration_score = 0.5
        self.learning_history: List[Dict[str, Any]] = []

    def update(self, metric_values: Dict[str, float],
               external_risks: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        perf_result = self.performance.update(metric_values)
        risk_result = self.risk.assess(metric_values, external_risks)

        self.collaboration_score = perf_result['overall_score'] * (1 - risk_result['overall_risk'])

        combined = {
            'supplier_id': self.supplier_id,
            'performance': perf_result,
            'risk_assessment': risk_result,
            'collaboration_score': float(self.collaboration_score),
        }
        self.learning_history.append(combined)
        return combined

    def get_collaboration_insights(self) -> Dict[str, Any]:
        return {
            'supplier_id': self.supplier_id,
            'collaboration_score': float(self.collaboration_score),
            'overall_performance': self.performance._compute_overall_score(),
            'overall_risk': self.risk.overall_risk,
            'total_updates': len(self.learning_history),
            'anomalies': self.performance.alerts[-5:] if self.performance.alerts else [],
        }

    def get_state(self) -> Dict[str, Any]:
        return {
            'performance': self.performance.get_state(),
            'risk': self.risk.get_state(),
            'collaboration_score': float(self.collaboration_score),
            'total_updates': len(self.learning_history),
        }


if __name__ == "__main__":
    np.random.seed(42)
    manager = SupplierLearningManager(supplier_id="SUP-001")

    for week in range(12):
        metrics = {
            'on_time_delivery': min(1.0, max(0.7, 0.85 + np.random.randn() * 0.05)),
            'quality_score': min(1.0, max(0.8, 0.92 + np.random.randn() * 0.03)),
            'cost_index': 1.0 + np.random.randn() * 0.02,
            'responsiveness': min(1.0, max(0.5, 0.75 + np.random.randn() * 0.08)),
        }

        external = {
            'financial_stability': np.random.uniform(0.2, 0.4),
            'geopolitical_risk': np.random.uniform(0.1, 0.3),
        }

        result = manager.update(metrics, external)
        if (week + 1) % 4 == 0:
            print(f"Week {week+1}: perf={result['performance']['overall_score']:.3f}, "
                  f"risk={result['risk_assessment']['overall_risk']:.3f}, "
                  f"collab={result['collaboration_score']:.3f}")

    insights = manager.get_collaboration_insights()
    print(f"Insights: collab={insights['collaboration_score']:.3f}, "
          f"anomalies={insights.get('anomalies', [])}")
