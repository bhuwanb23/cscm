"""
Tests for Edge ETA Deployment
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.routing_logistics.deployment_infrastructure.edge_deployment import EdgeETADeployment


class TestEdgeETADeployment:
    """Test cases for EdgeETADeployment."""
    
    def test_initialization(self):
        """Test deployment initialization."""
        deployment = EdgeETADeployment(model_type='lightweight')
        
        assert deployment.model_type == 'lightweight'
        assert deployment.model_loaded == False
    
    def test_get_model_info(self):
        """Test model info retrieval."""
        deployment = EdgeETADeployment(model_type='lightweight')
        
        info = deployment.get_model_info()
        
        assert 'model_type' in info
        assert 'model_loaded' in info
        assert 'cache_size' in info
    
    def test_clear_cache(self):
        """Test cache clearing."""
        deployment = EdgeETADeployment(model_type='lightweight')
        
        deployment.clear_cache()
        
        assert len(deployment.cache) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

