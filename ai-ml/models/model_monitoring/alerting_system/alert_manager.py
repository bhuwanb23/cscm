"""
Alerting System for Model Monitoring

This module implements alert management with severity-based routing,
notification channels, escalation policies, and alert deduplication
for the model monitoring system.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime, timedelta
import uuid
from collections import defaultdict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AlertManager:
    """
    Manages alerts from model monitoring, supporting severity-based
    routing, multi-channel notifications, escalation policies,
    and alert deduplication.
    """

    VALID_SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']
    VALID_CHANNELS = ['email', 'slack', 'pagerduty', 'webhook', 'log']

    def __init__(self, system_name: str = "cscm_monitoring"):
        self.system_name = system_name
        self.alerts = {}
        self.channels = defaultdict(list)
        self.escalation_policies = {}
        self.alert_rules = {}
        self.dedup_cache = {}
        self.alert_history = []
        self.suppressed_alerts = set()

    def create_alert_rule(self, rule_id: str, name: str,
                           condition: Dict[str, Any],
                           severity: str = 'medium',
                           channels: Optional[List[str]] = None,
                           cooldown_minutes: int = 60) -> Dict[str, Any]:
        if severity not in self.VALID_SEVERITIES:
            raise ValueError(f"Invalid severity: {severity}")

        rule = {
            'rule_id': rule_id,
            'name': name,
            'condition': condition,
            'severity': severity,
            'channels': channels or ['log'],
            'cooldown_minutes': cooldown_minutes,
            'created_at': datetime.now().isoformat(),
            'enabled': True,
        }
        self.alert_rules[rule_id] = rule
        logger.info(f"Alert rule '{name}' created (severity={severity})")
        return rule

    def register_channel(self, channel_type: str, name: str,
                          config: Dict[str, Any]) -> Dict[str, Any]:
        if channel_type not in self.VALID_CHANNELS:
            raise ValueError(f"Invalid channel: {channel_type}")

        channel = {
            'channel_id': f"ch_{uuid.uuid4().hex[:8]}",
            'type': channel_type,
            'name': name,
            'config': config,
            'enabled': True,
        }
        self.channels[channel_type].append(channel)
        logger.info(f"Channel '{name}' registered ({channel_type})")
        return channel

    def set_escalation_policy(self, policy_id: str, name: str,
                                rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        policy = {
            'policy_id': policy_id,
            'name': name,
            'rules': rules,
            'created_at': datetime.now().isoformat(),
        }
        self.escalation_policies[policy_id] = policy
        logger.info(f"Escalation policy '{name}' created with {len(rules)} rules")
        return policy

    def evaluate_rules(self, metrics: Dict[str, float],
                        model_id: str) -> List[Dict[str, Any]]:
        triggered = []

        for rule_id, rule in self.alert_rules.items():
            if not rule['enabled']:
                continue

            condition = rule['condition']
            field = condition.get('field')
            operator = condition.get('operator', 'gt')
            threshold = condition.get('threshold')

            if field not in metrics:
                continue

            value = metrics[field]
            violated = False

            if operator == 'gt':
                violated = value > threshold
            elif operator == 'gte':
                violated = value >= threshold
            elif operator == 'lt':
                violated = value < threshold
            elif operator == 'lte':
                violated = value <= threshold
            elif operator == 'eq':
                violated = abs(value - threshold) < 1e-6

            if violated:
                cooldown_key = f"{model_id}:{rule_id}"
                now = datetime.now()

                if cooldown_key in self.dedup_cache:
                    last_fired = self.dedup_cache[cooldown_key]
                    cooldown = timedelta(minutes=rule['cooldown_minutes'])
                    if now - last_fired < cooldown:
                        logger.debug(f"Alert {rule_id} for {model_id} suppressed (cooldown)")
                        continue

                self.dedup_cache[cooldown_key] = now
                alert = self._create_alert(model_id, rule, value)
                triggered.append(alert)

        return triggered

    def _create_alert(self, model_id: str, rule: Dict[str, Any],
                       value: float) -> Dict[str, Any]:
        alert_id = f"alert_{uuid.uuid4().hex[:8]}"
        severity = rule['severity']
        escalated = False

        for policy_id, policy in self.escalation_policies.items():
            for esc_rule in policy['rules']:
                if (esc_rule.get('severity') == severity and
                        value > esc_rule.get('threshold', float('inf'))):
                    escalated = True
                    severity = esc_rule.get('escalate_to', severity)
                    break

        alert = {
            'alert_id': alert_id,
            'model_id': model_id,
            'rule_name': rule['name'],
            'rule_id': rule['rule_id'],
            'severity': severity,
            'escalated': escalated,
            'value': value,
            'timestamp': datetime.now().isoformat(),
            'channels': rule['channels'],
            'status': 'active',
            'acknowledged': False,
        }

        self.alerts[alert_id] = alert
        self.alert_history.append(alert)
        logger.info(f"Alert {alert_id} created: {rule['name']} ({severity}, value={value:.3f})")
        return alert

    def acknowledge_alert(self, alert_id: str, user: str) -> Dict[str, Any]:
        if alert_id not in self.alerts:
            raise ValueError(f"Alert {alert_id} not found")

        self.alerts[alert_id]['acknowledged'] = True
        self.alerts[alert_id]['acknowledged_by'] = user
        self.alerts[alert_id]['acknowledged_at'] = datetime.now().isoformat()
        logger.info(f"Alert {alert_id} acknowledged by {user}")
        return self.alerts[alert_id]

    def resolve_alert(self, alert_id: str, resolution: str = "") -> Dict[str, Any]:
        if alert_id not in self.alerts:
            raise ValueError(f"Alert {alert_id} not found")

        self.alerts[alert_id]['status'] = 'resolved'
        self.alerts[alert_id]['resolution'] = resolution
        self.alerts[alert_id]['resolved_at'] = datetime.now().isoformat()
        logger.info(f"Alert {alert_id} resolved: {resolution}")
        return self.alerts[alert_id]

    def suppress_alert(self, rule_id: str) -> Dict[str, Any]:
        self.suppressed_alerts.add(rule_id)
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id]['enabled'] = False
        return {'rule_id': rule_id, 'suppressed': True}

    def unsuppress_alert(self, rule_id: str) -> Dict[str, Any]:
        self.suppressed_alerts.discard(rule_id)
        if rule_id in self.alert_rules:
            self.alert_rules[rule_id]['enabled'] = True
        return {'rule_id': rule_id, 'unsuppressed': True}

    def get_active_alerts(self, model_id: Optional[str] = None,
                           severity: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for alert in self.alerts.values():
            if alert['status'] != 'active':
                continue
            if model_id and alert['model_id'] != model_id:
                continue
            if severity and alert['severity'] != severity:
                continue
            results.append(alert)
        return sorted(results, key=lambda x: x['timestamp'], reverse=True)

    def get_alert_summary(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        alerts = list(self.alerts.values())
        if model_id:
            alerts = [a for a in alerts if a['model_id'] == model_id]

        active = [a for a in alerts if a['status'] == 'active']
        resolved = [a for a in alerts if a['status'] == 'resolved']

        severity_counts = defaultdict(int)
        for a in alerts:
            severity_counts[a['severity']] += 1

        return {
            'system': self.system_name,
            'total_alerts': len(alerts),
            'active_alerts': len(active),
            'resolved_alerts': len(resolved),
            'severity_breakdown': dict(severity_counts),
            'active_rules': sum(1 for r in self.alert_rules.values() if r['enabled']),
            'suppressed_rules': len(self.suppressed_alerts),
        }

    def get_alert_history(self, model_id: Optional[str] = None,
                           limit: int = 100) -> List[Dict[str, Any]]:
        history = self.alert_history
        if model_id:
            history = [a for a in history if a['model_id'] == model_id]
        return history[-limit:]


if __name__ == "__main__":
    manager = AlertManager(system_name="cscm_test")

    manager.create_alert_rule(
        "high_mse", "High MSE Detected",
        {"field": "mse", "operator": "gt", "threshold": 0.15},
        severity="high", channels=["email", "slack"]
    )

    manager.create_alert_rule(
        "drift_critical", "Critical Drift",
        {"field": "drift_score", "operator": "gt", "threshold": 0.7},
        severity="critical", channels=["pagerduty", "slack"]
    )

    manager.register_channel("email", "Team Email", {"address": "team@cscm.com"})
    manager.register_channel("slack", "Alerts Channel", {"webhook": "https://hooks.slack.com/xxx"})

    manager.set_escalation_policy(
        "esc_001", "Severity Escalation",
        [
            {"severity": "high", "threshold": 0.3, "escalate_to": "critical"},
        ]
    )

    metrics_1 = {"mse": 0.25, "drift_score": 0.3}
    alerts = manager.evaluate_rules(metrics_1, "model_v1")
    print(f"Triggered {len(alerts)} alerts")

    metrics_2 = {"mse": 0.12, "drift_score": 0.8}
    alerts2 = manager.evaluate_rules(metrics_2, "model_v1")
    print(f"Triggered {len(alerts2)} additional alerts")

    summary = manager.get_alert_summary("model_v1")
    print(f"Active: {summary['active_alerts']}, Total: {summary['total_alerts']}")
    print(f"Severity breakdown: {summary['severity_breakdown']}")
