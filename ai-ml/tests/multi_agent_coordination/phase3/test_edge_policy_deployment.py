"""
Tests for Edge Policy Deployment
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

pytestmark = pytest.mark.skipif(not HAS_TORCH, reason="PyTorch not available")

from models.multi_agent_coordination.training_deployment.edge_policy_deployment import EdgePolicyDeployment


class TestEdgePolicyDeployment:
    """Test cases for EdgePolicyDeployment."""
    
    def test_initialization(self):
        """Test deployment initialization."""
        deployment = EdgePolicyDeployment(
            state_dim=10,
            action_dim=5,
            model_type='lightweight'
        )
        
        assert deployment.state_dim == 10
        assert deployment.action_dim == 5
        assert deployment.model_type == 'lightweight'
    
    def test_get_model_info(self):
        """Test model info retrieval."""
        deployment = EdgePolicyDeployment(
            state_dim=10,
            action_dim=5
        )
        
        info = deployment.get_model_info()
        
        assert 'loaded' in info
        assert 'model_type' in info
        assert 'state_dim' in info
        assert 'action_dim' in info


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

