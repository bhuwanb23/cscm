"""
Tests for Anomaly Playbook
"""

import pytest
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.anomaly_detection.deployment.playbook import AnomalyPlaybook, PlaybookAction


class TestAnomalyPlaybook:
    """Test cases for AnomalyPlaybook."""
    
    def test_initialization(self):
        """Test playbook initialization."""
        playbook = AnomalyPlaybook()
        
        assert len(playbook.rules) == 0
        assert len(playbook.execution_history) == 0
    
    def test_add_rule(self):
        """Test rule addition."""
        playbook = AnomalyPlaybook()
        
        def condition(data):
            return data.get('severity') == 'high'
        
        playbook.add_rule(
            rule_id='test_rule',
            name='Test Rule',
            condition=condition,
            actions=[PlaybookAction.ALERT, PlaybookAction.ESCALATE],
            priority=10,
            description='Test rule description'
        )
        
        assert len(playbook.rules) == 1
        assert playbook.rules[0].rule_id == 'test_rule'
    
    def test_execute(self):
        """Test playbook execution."""
        playbook = AnomalyPlaybook()
        
        def condition(data):
            return data.get('severity') == 'high'
        
        playbook.add_rule(
            rule_id='high_severity',
            name='High Severity',
            condition=condition,
            actions=[PlaybookAction.ALERT],
            priority=10
        )
        
        anomaly_data = {
            'entity_id': 'entity_1',
            'severity': 'high',
            'score': 0.85
        }
        
        result = playbook.execute(anomaly_data)
        
        assert result['success']
        assert len(result['executed_actions']) > 0
        assert len(playbook.execution_history) == 1
    
    def test_batch_execute(self):
        """Test batch execution."""
        playbook = AnomalyPlaybook()
        
        def condition(data):
            return data.get('score', 0) > 0.5
        
        playbook.add_rule(
            rule_id='high_score',
            name='High Score',
            condition=condition,
            actions=[PlaybookAction.ALERT],
            priority=5
        )
        
        anomalies = [
            {'entity_id': f'entity_{i}', 'score': 0.6 + i * 0.1}
            for i in range(3)
        ]
        
        batch_result = playbook.batch_execute(anomalies)
        
        assert batch_result['total'] == 3
        assert batch_result['success'] == 3
    
    def test_get_default_rules(self):
        """Test default rules."""
        playbook = AnomalyPlaybook()
        playbook.get_default_rules()
        
        assert len(playbook.rules) > 0
    
    def test_get_execution_history(self):
        """Test execution history retrieval."""
        playbook = AnomalyPlaybook()
        
        def condition(data):
            return True
        
        playbook.add_rule(
            rule_id='test',
            name='Test',
            condition=condition,
            actions=[PlaybookAction.ALERT],
            priority=1
        )
        
        playbook.execute({'entity_id': 'entity_1'})
        
        history = playbook.get_execution_history()
        
        assert len(history) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

