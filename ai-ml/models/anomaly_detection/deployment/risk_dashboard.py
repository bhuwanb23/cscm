"""
Risk Dashboard Integration

Implements integration with risk dashboard for anomaly visualization and monitoring.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class AnomalyAlert:
    """Anomaly alert data structure."""
    alert_id: str
    timestamp: datetime
    anomaly_type: str
    severity: str  # 'low', 'medium', 'high', 'critical'
    entity_id: str
    entity_type: str
    score: float
    description: str
    metadata: Dict[str, Any]


class RiskDashboardIntegration:
    """
    Risk dashboard integration.
    
    Provides interface for sending anomaly alerts to risk dashboard.
    """
    
    def __init__(
        self,
        dashboard_url: Optional[str] = None,
        api_key: Optional[str] = None
    ):
        """
        Initialize risk dashboard integration.
        
        Args:
            dashboard_url: Dashboard API URL
            api_key: API key for authentication
        """
        self.dashboard_url = dashboard_url
        self.api_key = api_key
        
        self.alerts: List[AnomalyAlert] = []
        self.alert_history: List[Dict[str, Any]] = []
    
    def create_alert(
        self,
        anomaly_type: str,
        entity_id: str,
        entity_type: str,
        score: float,
        description: str,
        severity: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AnomalyAlert:
        """
        Create anomaly alert.
        
        Args:
            anomaly_type: Type of anomaly
            entity_id: Entity identifier
            entity_type: Type of entity
            score: Anomaly score
            description: Alert description
            severity: Alert severity (auto-determined if None)
            metadata: Additional metadata
        
        Returns:
            AnomalyAlert object
        """
        # Auto-determine severity if not provided
        if severity is None:
            if score >= 0.9:
                severity = 'critical'
            elif score >= 0.7:
                severity = 'high'
            elif score >= 0.5:
                severity = 'medium'
            else:
                severity = 'low'
        
        alert_id = f"{entity_type}_{entity_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        alert = AnomalyAlert(
            alert_id=alert_id,
            timestamp=datetime.now(),
            anomaly_type=anomaly_type,
            severity=severity,
            entity_id=entity_id,
            entity_type=entity_type,
            score=score,
            description=description,
            metadata=metadata or {}
        )
        
        self.alerts.append(alert)
        
        return alert
    
    def send_alert(self, alert: AnomalyAlert) -> bool:
        """
        Send alert to dashboard.
        
        Args:
            alert: Anomaly alert
        
        Returns:
            Success status
        """
        logger.info(f"Sending alert {alert.alert_id} to dashboard")
        
        # Convert to dictionary
        alert_dict = asdict(alert)
        alert_dict['timestamp'] = alert.timestamp.isoformat()
        
        # In real implementation, this would send to dashboard API
        if self.dashboard_url:
            # Simulate API call
            logger.info(f"Alert sent to {self.dashboard_url}")
            success = True
        else:
            # Just log
            logger.info("Dashboard URL not configured, alert logged locally")
            success = True
        
        # Store in history
        self.alert_history.append(alert_dict)
        
        return success
    
    def batch_send_alerts(
        self,
        alerts: List[AnomalyAlert]
    ) -> Dict[str, int]:
        """
        Send multiple alerts in batch.
        
        Args:
            alerts: List of alerts
        
        Returns:
            Statistics dictionary
        """
        logger.info(f"Sending {len(alerts)} alerts in batch")
        
        success_count = 0
        failure_count = 0
        
        for alert in alerts:
            try:
                if self.send_alert(alert):
                    success_count += 1
                else:
                    failure_count += 1
            except Exception as e:
                logger.error(f"Failed to send alert {alert.alert_id}: {e}")
                failure_count += 1
        
        stats = {
            'total': len(alerts),
            'success': success_count,
            'failure': failure_count
        }
        
        logger.info(f"Batch send complete: {stats}")
        
        return stats
    
    def get_dashboard_data(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        severity: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get dashboard data for visualization.
        
        Args:
            start_time: Start time filter
            end_time: End time filter
            severity: Severity filter
        
        Returns:
            Dashboard data dictionary
        """
        # Filter alerts
        filtered_alerts = self.alerts
        
        if start_time:
            filtered_alerts = [a for a in filtered_alerts if a.timestamp >= start_time]
        
        if end_time:
            filtered_alerts = [a for a in filtered_alerts if a.timestamp <= end_time]
        
        if severity:
            filtered_alerts = [a for a in filtered_alerts if a.severity == severity]
        
        # Aggregate statistics
        severity_counts = {}
        type_counts = {}
        
        for alert in filtered_alerts:
            severity_counts[alert.severity] = severity_counts.get(alert.severity, 0) + 1
            type_counts[alert.anomaly_type] = type_counts.get(alert.anomaly_type, 0) + 1
        
        # Time series data
        time_series = {}
        for alert in filtered_alerts:
            hour = alert.timestamp.replace(minute=0, second=0, microsecond=0)
            time_series[hour] = time_series.get(hour, 0) + 1
        
        dashboard_data = {
            'total_alerts': len(filtered_alerts),
            'severity_distribution': severity_counts,
            'type_distribution': type_counts,
            'time_series': {k.isoformat(): v for k, v in sorted(time_series.items())},
            'recent_alerts': [
                asdict(a) for a in sorted(filtered_alerts, key=lambda x: x.timestamp, reverse=True)[:10]
            ],
            'alerts': [asdict(a) for a in filtered_alerts]
        }
        
        # Convert timestamps
        for alert_dict in dashboard_data['recent_alerts']:
            alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
        
        for alert_dict in dashboard_data['alerts']:
            alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
        
        return dashboard_data
    
    def export_alerts(
        self,
        filepath: str,
        format: str = 'json'  # 'json' or 'csv'
    ):
        """
        Export alerts to file.
        
        Args:
            filepath: Output file path
            format: Export format
        """
        if format == 'json':
            alerts_data = [asdict(a) for a in self.alerts]
            for alert_dict in alerts_data:
                alert_dict['timestamp'] = alert_dict['timestamp'].isoformat()
            
            with open(filepath, 'w') as f:
                json.dump(alerts_data, f, indent=2)
        
        elif format == 'csv':
            alerts_df = pd.DataFrame([asdict(a) for a in self.alerts])
            alerts_df['timestamp'] = alerts_df['timestamp'].apply(lambda x: x.isoformat())
            alerts_df.to_csv(filepath, index=False)
        
        logger.info(f"Alerts exported to {filepath}")
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get dashboard statistics.
        
        Returns:
            Statistics dictionary
        """
        if not self.alerts:
            return {
                'total_alerts': 0,
                'severity_distribution': {},
                'type_distribution': {}
            }
        
        severity_counts = {}
        type_counts = {}
        
        for alert in self.alerts:
            severity_counts[alert.severity] = severity_counts.get(alert.severity, 0) + 1
            type_counts[alert.anomaly_type] = type_counts.get(alert.anomaly_type, 0) + 1
        
        return {
            'total_alerts': len(self.alerts),
            'severity_distribution': severity_counts,
            'type_distribution': type_counts,
            'avg_score': np.mean([a.score for a in self.alerts]),
            'max_score': np.max([a.score for a in self.alerts]),
            'min_score': np.min([a.score for a in self.alerts])
        }

