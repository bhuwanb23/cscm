"""
Tests for Risk Dashboard Integration
"""

import pytest
import sys
import os
from datetime import datetime

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.anomaly_detection.deployment.risk_dashboard import RiskDashboardIntegration, AnomalyAlert


class TestRiskDashboardIntegration:
    """Test cases for RiskDashboardIntegration."""
    
    def test_initialization(self):
        """Test dashboard initialization."""
        dashboard = RiskDashboardIntegration(
            dashboard_url="http://localhost:8000",
            api_key="test_key"
        )
        
        assert dashboard.dashboard_url == "http://localhost:8000"
        assert len(dashboard.alerts) == 0
    
    def test_create_alert(self):
        """Test alert creation."""
        dashboard = RiskDashboardIntegration()
        
        alert = dashboard.create_alert(
            anomaly_type="outlier",
            entity_id="entity_1",
            entity_type="supplier",
            score=0.85,
            description="High anomaly score detected"
        )
        
        assert isinstance(alert, AnomalyAlert)
        assert alert.entity_id == "entity_1"
        assert alert.score == 0.85
        assert len(dashboard.alerts) == 1
    
    def test_send_alert(self):
        """Test alert sending."""
        dashboard = RiskDashboardIntegration()
        
        alert = dashboard.create_alert(
            anomaly_type="outlier",
            entity_id="entity_1",
            entity_type="supplier",
            score=0.85,
            description="High anomaly score detected"
        )
        
        success = dashboard.send_alert(alert)
        
        assert success
        assert len(dashboard.alert_history) == 1
    
    def test_batch_send_alerts(self):
        """Test batch alert sending."""
        dashboard = RiskDashboardIntegration()
        
        alerts = []
        for i in range(5):
            alert = dashboard.create_alert(
                anomaly_type="outlier",
                entity_id=f"entity_{i}",
                entity_type="supplier",
                score=0.7 + i * 0.05,
                description=f"Anomaly {i}"
            )
            alerts.append(alert)
        
        stats = dashboard.batch_send_alerts(alerts)
        
        assert stats['total'] == 5
        assert stats['success'] == 5
    
    def test_get_dashboard_data(self):
        """Test dashboard data retrieval."""
        dashboard = RiskDashboardIntegration()
        
        # Create some alerts
        for i in range(3):
            dashboard.create_alert(
                anomaly_type="outlier",
                entity_id=f"entity_{i}",
                entity_type="supplier",
                score=0.7 + i * 0.1,
                description=f"Anomaly {i}"
            )
        
        data = dashboard.get_dashboard_data()
        
        assert 'total_alerts' in data
        assert 'severity_distribution' in data
        assert 'type_distribution' in data
    
    def test_get_statistics(self):
        """Test statistics retrieval."""
        dashboard = RiskDashboardIntegration()
        
        dashboard.create_alert(
            anomaly_type="outlier",
            entity_id="entity_1",
            entity_type="supplier",
            score=0.85,
            description="Test alert"
        )
        
        stats = dashboard.get_statistics()
        
        assert 'total_alerts' in stats
        assert 'severity_distribution' in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

