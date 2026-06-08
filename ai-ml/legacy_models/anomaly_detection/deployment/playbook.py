"""
Automated Playbooks for Anomalies

Implements automated playbooks for handling detected anomalies.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any, Callable
import logging
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlaybookAction(Enum):
    """Types of playbook actions."""
    ALERT = "alert"
    ESCALATE = "escalate"
    ISOLATE = "isolate"
    INVESTIGATE = "investigate"
    REMEDIATE = "remediate"
    IGNORE = "ignore"


@dataclass
class PlaybookRule:
    """Playbook rule definition."""
    rule_id: str
    name: str
    condition: Callable[[Dict[str, Any]], bool]
    actions: List[PlaybookAction]
    priority: int
    description: str


class AnomalyPlaybook:
    """
    Automated playbook for anomaly handling.
    
    Executes predefined actions based on anomaly characteristics.
    """
    
    def __init__(self):
        """Initialize playbook."""
        self.rules: List[PlaybookRule] = []
        self.execution_history: List[Dict[str, Any]] = []
    
    def add_rule(
        self,
        rule_id: str,
        name: str,
        condition: Callable[[Dict[str, Any]], bool],
        actions: List[PlaybookAction],
        priority: int = 0,
        description: str = ""
    ):
        """
        Add playbook rule.
        
        Args:
            rule_id: Rule identifier
            name: Rule name
            condition: Condition function
            actions: List of actions to execute
            priority: Rule priority (higher = more important)
            description: Rule description
        """
        rule = PlaybookRule(
            rule_id=rule_id,
            name=name,
            condition=condition,
            actions=actions,
            priority=priority,
            description=description
        )
        
        self.rules.append(rule)
        
        # Sort by priority
        self.rules.sort(key=lambda x: x.priority, reverse=True)
        
        logger.info(f"Added playbook rule: {rule_id}")
    
    def execute(
        self,
        anomaly_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute playbook for anomaly.
        
        Args:
            anomaly_data: Anomaly data dictionary
        
        Returns:
            Execution results
        """
        logger.info(f"Executing playbook for anomaly: {anomaly_data.get('entity_id', 'unknown')}")
        
        executed_actions = []
        matched_rules = []
        
        # Check each rule
        for rule in self.rules:
            try:
                if rule.condition(anomaly_data):
                    matched_rules.append(rule.rule_id)
                    
                    # Execute actions
                    for action in rule.actions:
                        action_result = self._execute_action(action, anomaly_data, rule)
                        executed_actions.append({
                            'action': action.value,
                            'rule_id': rule.rule_id,
                            'result': action_result
                        })
            except Exception as e:
                logger.error(f"Error executing rule {rule.rule_id}: {e}")
        
        execution_result = {
            'timestamp': datetime.now().isoformat(),
            'anomaly_id': anomaly_data.get('entity_id', 'unknown'),
            'matched_rules': matched_rules,
            'executed_actions': executed_actions,
            'success': len(executed_actions) > 0
        }
        
        self.execution_history.append(execution_result)
        
        return execution_result
    
    def _execute_action(
        self,
        action: PlaybookAction,
        anomaly_data: Dict[str, Any],
        rule: PlaybookRule
    ) -> Dict[str, Any]:
        """
        Execute a single action.
        
        Args:
            action: Action to execute
            anomaly_data: Anomaly data
            rule: Rule that triggered the action
        
        Returns:
            Action result
        """
        logger.info(f"Executing action: {action.value}")
        
        result = {
            'action': action.value,
            'status': 'success',
            'message': ''
        }
        
        if action == PlaybookAction.ALERT:
            result['message'] = f"Alert sent for {anomaly_data.get('entity_id', 'unknown')}"
        
        elif action == PlaybookAction.ESCALATE:
            result['message'] = f"Anomaly escalated to management"
        
        elif action == PlaybookAction.ISOLATE:
            result['message'] = f"Entity isolated from system"
        
        elif action == PlaybookAction.INVESTIGATE:
            result['message'] = f"Investigation initiated"
        
        elif action == PlaybookAction.REMEDIATE:
            result['message'] = f"Remediation process started"
        
        elif action == PlaybookAction.IGNORE:
            result['message'] = f"Anomaly ignored based on rule"
        
        return result
    
    def batch_execute(
        self,
        anomalies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Execute playbook for multiple anomalies.
        
        Args:
            anomalies: List of anomaly data dictionaries
        
        Returns:
            Batch execution results
        """
        logger.info(f"Batch executing playbook for {len(anomalies)} anomalies")
        
        results = []
        success_count = 0
        failure_count = 0
        
        for anomaly in anomalies:
            try:
                result = self.execute(anomaly)
                results.append(result)
                if result['success']:
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                logger.error(f"Error executing playbook for anomaly: {e}")
                failure_count += 1
        
        batch_result = {
            'total': len(anomalies),
            'success': success_count,
            'failure': failure_count,
            'results': results
        }
        
        return batch_result
    
    def get_default_rules(self):
        """Add default playbook rules."""
        # High severity rule
        self.add_rule(
            rule_id='high_severity',
            name='High Severity Anomaly',
            condition=lambda data: data.get('severity') in ['high', 'critical'],
            actions=[PlaybookAction.ALERT, PlaybookAction.ESCALATE, PlaybookAction.INVESTIGATE],
            priority=10,
            description='Handle high severity anomalies'
        )
        
        # Critical severity rule
        self.add_rule(
            rule_id='critical_severity',
            name='Critical Severity Anomaly',
            condition=lambda data: data.get('severity') == 'critical',
            actions=[PlaybookAction.ALERT, PlaybookAction.ESCALATE, PlaybookAction.ISOLATE, PlaybookAction.REMEDIATE],
            priority=20,
            description='Handle critical severity anomalies'
        )
        
        # Low score rule
        self.add_rule(
            rule_id='low_score',
            name='Low Score Anomaly',
            condition=lambda data: data.get('score', 0) < 0.3,
            actions=[PlaybookAction.IGNORE],
            priority=1,
            description='Ignore low score anomalies'
        )
        
        logger.info("Default playbook rules added")
    
    def get_execution_history(
        self,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get execution history.
        
        Args:
            limit: Maximum number of records to return
        
        Returns:
            List of execution records
        """
        if limit:
            return self.execution_history[-limit:]
        return self.execution_history
    
    def export_playbook(self, filepath: str):
        """
        Export playbook to file.
        
        Args:
            filepath: Output file path
        """
        playbook_data = {
            'rules': [
                {
                    'rule_id': rule.rule_id,
                    'name': rule.name,
                    'priority': rule.priority,
                    'description': rule.description,
                    'actions': [action.value for action in rule.actions]
                }
                for rule in self.rules
            ],
            'execution_history': self.execution_history[-100:]  # Last 100 executions
        }
        
        with open(filepath, 'w') as f:
            json.dump(playbook_data, f, indent=2)
        
        logger.info(f"Playbook exported to {filepath}")
    
    def load_playbook(self, filepath: str):
        """
        Load playbook from file.
        
        Args:
            filepath: Playbook file path
        """
        # Note: This is a simplified version
        # In practice, condition functions would need to be serialized differently
        logger.info(f"Loading playbook from {filepath}")
        # Implementation would load rules and recreate condition functions
        logger.warning("Full playbook loading not implemented (requires condition function serialization)")

