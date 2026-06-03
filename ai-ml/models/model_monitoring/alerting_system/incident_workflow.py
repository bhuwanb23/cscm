"""
Incident Response Workflow for Alerting System

This module provides automated incident classification, playbook execution,
stakeholder notification, and resolution tracking for model monitoring alerts.
"""

import uuid
import numpy as np
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IncidentSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentStatus(Enum):
    DETECTED = "detected"
    ACKNOWLEDGED = "acknowledged"
    INVESTIGATING = "investigating"
    MITIGATING = "mitigating"
    RESOLVED = "resolved"
    CLOSED = "closed"


class IncidentWorkflowManager:
    """
    Manages the full incident lifecycle from detection through resolution.
    Includes automated classification, playbook execution, notification,
    escalation, and post-mortem tracking.
    """

    def __init__(self, system_name: str = "cscm_monitoring"):
        """
        Args:
            system_name: Name of the monitoring system
        """
        self.system_name = system_name
        self.incidents: Dict[str, Dict[str, Any]] = {}
        self.playbooks: Dict[str, List[Dict[str, Any]]] = {}
        self.escalation_policies: Dict[str, List[Dict[str, Any]]] = {}
        self.resolution_templates: Dict[str, str] = {}

    def create_incident(self,
                        title: str,
                        description: str,
                        severity: str = "medium",
                        source: str = "monitoring",
                        model_id: Optional[str] = None,
                        tags: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Create a new incident.

        Args:
            title: Short incident title
            description: Detailed incident description
            severity: Incident severity level
            source: Source system that detected the incident
            model_id: Affected model ID
            tags: Additional metadata tags

        Returns:
            Dict with created incident
        """
        incident_id = str(uuid.uuid4())[:8]
        now = datetime.now()

        incident = {
            'incident_id': incident_id,
            'title': title,
            'description': description,
            'severity': severity if severity in [s.value for s in IncidentSeverity] else 'medium',
            'status': IncidentStatus.DETECTED.value,
            'source': source,
            'model_id': model_id,
            'tags': tags or {},
            'detected_at': now.isoformat(),
            'acknowledged_at': None,
            'resolved_at': None,
            'closed_at': None,
            'acknowledged_by': None,
            'resolved_by': None,
            'resolution_notes': None,
            'escalation_level': 0,
            'playbook_executed': None,
            'notifications_sent': [],
            'timeline': [{'timestamp': now.isoformat(), 'event': 'detected', 'detail': title}],
        }

        self.incidents[incident_id] = incident
        logger.info(f"Incident {incident_id} created: {title} [{severity}]")

        playbook = self._find_matching_playbook(title, severity)
        if playbook:
            self._execute_playbook(incident_id, playbook)

        self._send_notifications(incident_id, 'detected')

        return incident

    def acknowledge_incident(self, incident_id: str, user: str) -> Dict[str, Any]:
        """Acknowledge an incident."""
        incident = self._get_incident(incident_id)
        incident['status'] = IncidentStatus.ACKNOWLEDGED.value
        incident['acknowledged_at'] = datetime.now().isoformat()
        incident['acknowledged_by'] = user
        incident['timeline'].append({
            'timestamp': incident['acknowledged_at'],
            'event': 'acknowledged',
            'detail': f"Acknowledged by {user}",
        })
        return incident

    def start_investigation(self, incident_id: str, investigator: str) -> Dict[str, Any]:
        """Mark incident as being investigated."""
        incident = self._get_incident(incident_id)
        incident['status'] = IncidentStatus.INVESTIGATING.value
        incident['timeline'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'investigating',
            'detail': f"Investigation started by {investigator}",
        })
        return incident

    def resolve_incident(self,
                         incident_id: str,
                         resolved_by: str,
                         resolution_notes: str,
                         auto_ticket: bool = False) -> Dict[str, Any]:
        """
        Resolve an incident.

        Args:
            incident_id: ID of the incident
            resolved_by: Person who resolved it
            resolution_notes: Description of the resolution
            auto_ticket: Whether to create an auto-ticketing entry for follow-up

        Returns:
            Dict with resolved incident
        """
        incident = self._get_incident(incident_id)
        incident['status'] = IncidentStatus.RESOLVED.value
        incident['resolved_at'] = datetime.now().isoformat()
        incident['resolved_by'] = resolved_by
        incident['resolution_notes'] = resolution_notes
        incident['timeline'].append({
            'timestamp': incident['resolved_at'],
            'event': 'resolved',
            'detail': resolution_notes,
        })

        if auto_ticket:
            ticket = self._create_auto_ticket(incident)
            incident['auto_ticket'] = ticket

        self._send_notifications(incident_id, 'resolved')
        logger.info(f"Incident {incident_id} resolved by {resolved_by}")
        return incident

    def close_incident(self, incident_id: str, closed_by: str) -> Dict[str, Any]:
        """Close a resolved incident."""
        incident = self._get_incident(incident_id)
        incident['status'] = IncidentStatus.CLOSED.value
        incident['closed_at'] = datetime.now().isoformat()
        incident['timeline'].append({
            'timestamp': incident['closed_at'],
            'event': 'closed',
            'detail': f"Closed by {closed_by}",
        })
        return incident

    def escalate_incident(self, incident_id: str, reason: str) -> Dict[str, Any]:
        """Escalate an incident to the next level."""
        incident = self._get_incident(incident_id)
        incident['escalation_level'] += 1
        incident['timeline'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'escalated',
            'detail': f"Escalated to level {incident['escalation_level']}: {reason}",
        })

        policy = self.escalation_policies.get(str(incident['escalation_level']), [])
        for step in policy:
            self._send_notification(incident_id, step.get('channel', 'log'),
                                    f"Escalation level {incident['escalation_level']}")

        logger.warning(f"Incident {incident_id} escalated to level {incident['escalation_level']}")
        return incident

    def register_playbook(self,
                          playbook_id: str,
                          name: str,
                          steps: List[Dict[str, Any]],
                          match_pattern: Optional[str] = None) -> Dict[str, Any]:
        """Register an automated response playbook."""
        self.playbooks[playbook_id] = {
            'playbook_id': playbook_id,
            'name': name,
            'steps': steps,
            'match_pattern': match_pattern,
        }
        return self.playbooks[playbook_id]

    def set_escalation_policy(self,
                              level: int,
                              channels: List[Dict[str, Any]]) -> None:
        """Set escalation policy for a given level."""
        self.escalation_policies[str(level)] = channels

    def get_active_incidents(self,
                             severity: Optional[str] = None,
                             model_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve active (non-resolved, non-closed) incidents."""
        active = []
        resolving_statuses = {IncidentStatus.RESOLVED.value, IncidentStatus.CLOSED.value}
        for inc in self.incidents.values():
            if inc['status'] in resolving_statuses:
                continue
            if severity and inc['severity'] != severity:
                continue
            if model_id and inc.get('model_id') != model_id:
                continue
            active.append(inc)
        return sorted(active, key=lambda x: x['detected_at'], reverse=True)

    def get_incident_summary(self, model_id: Optional[str] = None) -> Dict[str, Any]:
        """Return aggregated incident statistics."""
        incidents = list(self.incidents.values())
        if model_id:
            incidents = [i for i in incidents if i.get('model_id') == model_id]

        total = len(incidents)
        by_severity = {}
        by_status = {}
        resolving_statuses = {IncidentStatus.RESOLVED.value, IncidentStatus.CLOSED.value}
        for inc in incidents:
            s = inc['severity']
            by_severity[s] = by_severity.get(s, 0) + 1
            st = inc['status']
            by_status[st] = by_status.get(st, 0) + 1

        resolved = [i for i in incidents if i['status'] == IncidentStatus.RESOLVED.value]
        if resolved:
            times = []
            for r in resolved:
                if r.get('resolved_at') and r.get('detected_at'):
                    detected = datetime.fromisoformat(r['detected_at'])
                    resolved_at = datetime.fromisoformat(r['resolved_at'])
                    times.append((resolved_at - detected).total_seconds() / 60)
            avg_mttr = float(np.mean(times)) if times else None
        else:
            avg_mttr = None

        return {
            'total_incidents': total,
            'active_count': len([i for i in incidents if i['status'] not in resolving_statuses]),
            'by_severity': by_severity,
            'by_status': by_status,
            'avg_mttr_minutes': avg_mttr,
        }

    def _get_incident(self, incident_id: str) -> Dict[str, Any]:
        """Get incident or raise."""
        if incident_id not in self.incidents:
            raise ValueError(f"Incident {incident_id} not found")
        return self.incidents[incident_id]

    def _find_matching_playbook(self, title: str, severity: str) -> Optional[List[Dict[str, Any]]]:
        """Find a matching playbook by title pattern or severity."""
        for pb in self.playbooks.values():
            pattern = pb.get('match_pattern')
            if pattern and pattern.lower() in title.lower():
                return pb['steps']
        return None

    def _execute_playbook(self, incident_id: str, steps: List[Dict[str, Any]]) -> None:
        """Execute playbook steps for an incident."""
        incident = self.incidents[incident_id]
        incident['playbook_executed'] = []
        for step in steps:
            action = step.get('action', 'log')
            detail = step.get('detail', '')
            incident['playbook_executed'].append({'action': action, 'detail': detail})
            incident['timeline'].append({
                'timestamp': datetime.now().isoformat(),
                'event': 'playbook_step',
                'detail': f"{action}: {detail}",
            })
            logger.info(f"Playbook step for {incident_id}: {action} - {detail}")

    def _send_notifications(self, incident_id: str, event: str) -> None:
        """Send notifications for incident events."""
        incident = self.incidents[incident_id]
        channels = ['log']
        for ch in channels:
            self._send_notification(incident_id, ch, f"Incident {event}: {incident['title']}")

    def _send_notification(self, incident_id: str, channel: str, message: str) -> None:
        """Send a single notification."""
        self.incidents[incident_id]['notifications_sent'].append({
            'channel': channel,
            'message': message,
            'timestamp': datetime.now().isoformat(),
        })

    def _create_auto_ticket(self, incident: Dict[str, Any]) -> Dict[str, str]:
        """Create an auto-ticketing entry for follow-up."""
        ticket_id = f"TICKET-{incident['incident_id']}"
        logger.info(f"Auto-ticket {ticket_id} created for incident {incident['incident_id']}")
        return {
            'ticket_id': ticket_id,
            'system': 'auto_ticketing',
            'created_at': datetime.now().isoformat(),
        }

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        active = self.get_active_incidents()
        return {
            'system_name': self.system_name,
            'total_incidents': len(self.incidents),
            'active_count': len(active),
            'playbooks_count': len(self.playbooks),
            'recent_incidents': [{
                'incident_id': i['incident_id'],
                'title': i['title'],
                'severity': i['severity'],
                'status': i['status'],
                'detected_at': i['detected_at'],
            } for i in list(self.incidents.values())[-5:]],
        }


if __name__ == "__main__":
    import numpy as np
    wf = IncidentWorkflowManager()
    inc = wf.create_incident(
        title="MAE degradation detected for demand model",
        description="MAE increased 15% above baseline in last hour",
        severity="high",
        model_id="demand_v1",
    )
    print(f"Created: {inc['incident_id']}")
    wf.acknowledge_incident(inc['incident_id'], "alice")
    wf.start_investigation(inc['incident_id'], "bob")
    wf.resolve_incident(inc['incident_id'], "bob", "Retrained with latest data", auto_ticket=True)
    print(wf.get_incident_summary())
