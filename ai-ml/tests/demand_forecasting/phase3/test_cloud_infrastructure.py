"""
Test suite for the cloud infrastructure system
"""

import pytest
import pandas as pd
import numpy as np
import os
import sys
from datetime import datetime, timedelta
import tempfile
import shutil
import json

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..')
sys.path.insert(0, parent_dir)

from models.demand_forecasting.cloud_infrastructure.models import (
    GPUCluster, DistributedTrainingManager, CostOptimizer, 
    SecurityManager, CloudInfrastructureManager
)

def test_gpu_cluster_creation():
    """Test GPU cluster creation and basic functionality."""
    cluster = GPUCluster("test-cluster", "us-west-2")
    
    # Check initial state
    assert cluster.cluster_name == "test-cluster"
    assert cluster.region == "us-west-2"
    assert cluster.status == "stopped"
    assert len(cluster.nodes) == 0
    
    # Add nodes
    cluster.add_node("p3.2xlarge", 2)
    cluster.add_node("p3.8xlarge", 1)
    
    # Check node addition
    assert len(cluster.nodes) == 3
    assert cluster.total_gpus == 6  # 2*1 + 1*4
    assert cluster.total_vcpus == 48  # 2*8 + 1*32
    assert cluster.total_memory_gb == 366  # 2*61 + 1*244
    
    # Check cluster info
    info = cluster.get_cluster_info()
    assert info['total_nodes'] == 3
    assert info['running_nodes'] == 0
    
    # Start cluster
    cluster.start_cluster()
    assert cluster.status == "running"
    
    # Check running nodes
    info = cluster.get_cluster_info()
    assert info['running_nodes'] == 3
    
    # Stop cluster
    cluster.stop_cluster()
    assert cluster.status == "stopped"

def test_gpu_cluster_unsupported_node():
    """Test GPU cluster with unsupported node type."""
    cluster = GPUCluster("test-cluster")
    
    # Should raise ValueError for unsupported node type
    with pytest.raises(ValueError):
        cluster.add_node("unsupported-node-type")

def test_distributed_training_manager():
    """Test distributed training manager functionality."""
    cluster = GPUCluster("test-cluster")
    cluster.add_node("p3.2xlarge", 1)
    
    training_manager = DistributedTrainingManager(cluster)
    
    # Submit a training job
    job_id = "test-job-1"
    model_type = "lstm"
    data_config = {"data_path": "/data/sales.csv"}
    training_config = {"epochs": 100, "batch_size": 32}
    
    result = training_manager.submit_training_job(
        job_id, model_type, data_config, training_config
    )
    
    # Check job submission
    assert "submitted successfully" in result
    
    # Check job status
    status = training_manager.get_job_status(job_id)
    assert status['job_id'] == job_id
    assert status['status'] == 'submitted'
    assert status['model_type'] == model_type
    
    # Start the job
    training_manager.start_training_job(job_id)
    
    # Check job is running
    status = training_manager.get_job_status(job_id)
    assert status['status'] == 'running'
    
    # Cancel the job
    training_manager.cancel_job(job_id)
    
    # Check job is cancelled
    status = training_manager.get_job_status(job_id)
    assert status['status'] == 'cancelled'

def test_distributed_training_manager_invalid_job():
    """Test distributed training manager with invalid job."""
    cluster = GPUCluster("test-cluster")
    cluster.add_node("p3.2xlarge", 1)
    
    training_manager = DistributedTrainingManager(cluster)
    
    # Should raise ValueError for non-existent job
    with pytest.raises(ValueError):
        training_manager.get_job_status("non-existent-job")
        
    # Should raise ValueError for non-existent job
    with pytest.raises(ValueError):
        training_manager.start_training_job("non-existent-job")

def test_cost_optimizer():
    """Test cost optimizer functionality."""
    cluster = GPUCluster("test-cluster")
    cluster.add_node("p3.2xlarge", 2)
    cluster.add_node("p3.8xlarge", 1)
    
    cost_optimizer = CostOptimizer(cluster)
    
    # Calculate regular cost
    regular_cost = cost_optimizer.calculate_cost(24, spot_instances=False)
    assert regular_cost['total_cost'] > 0
    assert regular_cost['hours'] == 24
    assert regular_cost['spot_instances'] == False
    
    # Calculate spot cost
    spot_cost = cost_optimizer.calculate_cost(24, spot_instances=True)
    assert spot_cost['total_cost'] > 0
    assert spot_cost['hours'] == 24
    assert spot_cost['spot_instances'] == True
    
    # Check that spot cost is lower
    assert spot_cost['total_cost'] < regular_cost['total_cost']
    
    # Get savings recommendations
    recommendations = cost_optimizer.recommend_savings()
    assert isinstance(recommendations, list)
    assert len(recommendations) > 0

def test_security_manager():
    """Test security manager functionality."""
    cluster = GPUCluster("test-cluster")
    
    security_manager = SecurityManager(cluster)
    
    # Check initial security status
    status = security_manager.get_security_status()
    assert status['cluster_name'] == "test-cluster"
    assert status['encryption_enabled'] == False
    assert status['access_control_policies'] == 0
    
    # Enable encryption
    security_manager.enable_encryption("test-kms-key")
    status = security_manager.get_security_status()
    assert status['encryption_enabled'] == True
    
    # Add access control policy
    policy = {
        'role': 'data-scientist',
        'permissions': ['read', 'write', 'execute']
    }
    security_manager.add_access_control_policy(policy)
    status = security_manager.get_security_status()
    assert status['access_control_policies'] == 1
    
    # Run security audit
    audit_result = security_manager.run_security_audit()
    assert 'timestamp' in audit_result
    assert 'findings' in audit_result
    assert 'passed' in audit_result

def test_cloud_infrastructure_manager():
    """Test cloud infrastructure manager functionality."""
    cloud_manager = CloudInfrastructureManager("test-cluster", "us-west-2")
    
    # Set up cluster
    node_config = [
        {'type': 'p3.2xlarge', 'count': 1},
        {'type': 'p3.8xlarge', 'count': 1}
    ]
    cloud_manager.setup_cluster(node_config)
    
    # Check infrastructure status
    status = cloud_manager.get_infrastructure_status()
    assert 'cluster' in status
    assert 'security' in status
    assert status['cluster']['cluster_name'] == "test-cluster"
    assert status['cluster']['status'] == "running"
    
    # Enable security features
    cloud_manager.security_manager.enable_encryption()
    cloud_manager.security_manager.add_access_control_policy({
        'role': 'data-scientist',
        'permissions': ['read', 'write']
    })
    
    # Optimize costs
    cost_optimization = cloud_manager.optimize_costs()
    assert 'regular_cost' in cost_optimization
    assert 'spot_cost' in cost_optimization
    assert 'savings_recommendations' in cost_optimization
    assert cost_optimization['potential_daily_savings'] >= 0
    
    # Run security check
    security_check = cloud_manager.run_security_check()
    assert 'timestamp' in security_check
    assert 'findings' in security_check
    assert 'passed' in security_check

def test_cloud_infrastructure_manager_training_job():
    """Test cloud infrastructure manager training job functionality."""
    cloud_manager = CloudInfrastructureManager("test-cluster")
    
    # Set up cluster
    node_config = [{'type': 'p3.2xlarge', 'count': 1}]
    cloud_manager.setup_cluster(node_config)
    
    # Submit training job through cloud manager
    job_id = "test-job-1"
    model_type = "ets"
    data_config = {"data_path": "/data/sales.csv"}
    training_config = {"seasonal_periods": 7}
    
    result = cloud_manager.training_manager.submit_training_job(
        job_id, model_type, data_config, training_config
    )
    
    # Check job submission
    assert "submitted successfully" in result
    
    # Start the job
    cloud_manager.training_manager.start_training_job(job_id)
    
    # Check job status
    status = cloud_manager.training_manager.get_job_status(job_id)
    assert status['status'] == 'running'

if __name__ == "__main__":
    pytest.main([__file__])