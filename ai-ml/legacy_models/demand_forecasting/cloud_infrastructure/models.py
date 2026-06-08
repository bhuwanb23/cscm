"""
Cloud/GPU Infrastructure for Heavy Training Workloads

This module implements cloud infrastructure components that support:
- GPU cluster architecture design
- Distributed training framework
- Cost optimization strategies
- Security protocols
"""

import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List, Tuple
import logging
import os
from datetime import datetime, timedelta
import json
import threading
import time
from abc import ABC, abstractmethod

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GPUCluster:
    """Represents a GPU cluster for distributed training."""
    
    def __init__(self, cluster_name: str, region: str = "us-west-2"):
        """
        Initialize the GPU cluster.
        
        Args:
            cluster_name: Name of the cluster
            region: Cloud region for the cluster
        """
        self.cluster_name = cluster_name
        self.region = region
        self.nodes = []
        self.status = "stopped"
        self.total_gpus = 0
        self.total_vcpus = 0
        self.total_memory_gb = 0
        
    def add_node(self, node_type: str, count: int = 1):
        """
        Add nodes to the cluster.
        
        Args:
            node_type: Type of node to add (e.g., 'p3.2xlarge', 'p3.8xlarge', 'p3.16xlarge')
            count: Number of nodes to add
        """
        # Define node specifications
        node_specs = {
            'p3.2xlarge': {'gpus': 1, 'vcpus': 8, 'memory_gb': 61},
            'p3.8xlarge': {'gpus': 4, 'vcpus': 32, 'memory_gb': 244},
            'p3.16xlarge': {'gpus': 8, 'vcpus': 64, 'memory_gb': 488},
            'p4d.24xlarge': {'gpus': 8, 'vcpus': 96, 'memory_gb': 1152},
            'g4dn.12xlarge': {'gpus': 4, 'vcpus': 48, 'memory_gb': 192}
        }
        
        if node_type not in node_specs:
            raise ValueError(f"Unsupported node type: {node_type}")
            
        spec = node_specs[node_type]
        for _ in range(count):
            node = {
                'id': f"{node_type}-{len(self.nodes)}",
                'type': node_type,
                'gpus': spec['gpus'],
                'vcpus': spec['vcpus'],
                'memory_gb': spec['memory_gb'],
                'status': 'stopped'
            }
            self.nodes.append(node)
            
        # Update cluster totals
        self.total_gpus += spec['gpus'] * count
        self.total_vcpus += spec['vcpus'] * count
        self.total_memory_gb += spec['memory_gb'] * count
        
        logger.info(f"Added {count} {node_type} nodes to cluster {self.cluster_name}")
        
    def start_cluster(self):
        """Start the GPU cluster."""
        logger.info(f"Starting cluster {self.cluster_name}")
        self.status = "starting"
        
        # Simulate cluster startup
        for node in self.nodes:
            node['status'] = 'running'
            
        self.status = "running"
        logger.info(f"Cluster {self.cluster_name} started successfully")
        
    def stop_cluster(self):
        """Stop the GPU cluster."""
        logger.info(f"Stopping cluster {self.cluster_name}")
        self.status = "stopping"
        
        # Simulate cluster shutdown
        for node in self.nodes:
            node['status'] = 'stopped'
            
        self.status = "stopped"
        logger.info(f"Cluster {self.cluster_name} stopped successfully")
        
    def get_cluster_info(self) -> Dict[str, Any]:
        """
        Get information about the cluster.
        
        Returns:
            Cluster information
        """
        running_nodes = [node for node in self.nodes if node['status'] == 'running']
        
        return {
            'cluster_name': self.cluster_name,
            'region': self.region,
            'status': self.status,
            'total_nodes': len(self.nodes),
            'running_nodes': len(running_nodes),
            'total_gpus': self.total_gpus,
            'total_vcpus': self.total_vcpus,
            'total_memory_gb': self.total_memory_gb,
            'nodes': self.nodes
        }

class DistributedTrainingManager:
    """Manages distributed training across GPU clusters."""
    
    def __init__(self, cluster: GPUCluster):
        """
        Initialize the distributed training manager.
        
        Args:
            cluster: GPU cluster to use for training
        """
        self.cluster = cluster
        self.training_jobs = {}
        self.job_lock = threading.Lock()
        
    def submit_training_job(self, job_id: str, model_type: str, 
                          data_config: Dict[str, Any], 
                          training_config: Dict[str, Any]) -> str:
        """
        Submit a training job to the cluster.
        
        Args:
            job_id: Unique identifier for the job
            model_type: Type of model to train
            data_config: Configuration for data loading
            training_config: Configuration for training parameters
            
        Returns:
            Job submission status
        """
        with self.job_lock:
            job = {
                'job_id': job_id,
                'model_type': model_type,
                'data_config': data_config,
                'training_config': training_config,
                'status': 'submitted',
                'submit_time': datetime.now(),
                'start_time': None,
                'end_time': None,
                'progress': 0.0
            }
            self.training_jobs[job_id] = job
            
        logger.info(f"Submitted training job {job_id} for {model_type} model")
        return f"Job {job_id} submitted successfully"
        
    def start_training_job(self, job_id: str):
        """
        Start a submitted training job.
        
        Args:
            job_id: ID of the job to start
        """
        with self.job_lock:
            if job_id not in self.training_jobs:
                raise ValueError(f"Job {job_id} not found")
                
            job = self.training_jobs[job_id]
            if job['status'] != 'submitted':
                raise ValueError(f"Job {job_id} is not in submitted state")
                
            job['status'] = 'running'
            job['start_time'] = datetime.now()
            
        logger.info(f"Started training job {job_id}")
        
        # Simulate training progress in a separate thread
        def simulate_training():
            for i in range(101):
                time.sleep(0.1)  # Simulate training time
                with self.job_lock:
                    if job_id in self.training_jobs:
                        self.training_jobs[job_id]['progress'] = i
                        
            with self.job_lock:
                if job_id in self.training_jobs:
                    self.training_jobs[job_id]['status'] = 'completed'
                    self.training_jobs[job_id]['end_time'] = datetime.now()
                    
            logger.info(f"Training job {job_id} completed")
            
        training_thread = threading.Thread(target=simulate_training)
        training_thread.daemon = True
        training_thread.start()
        
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a training job.
        
        Args:
            job_id: ID of the job to check
            
        Returns:
            Job status information
        """
        with self.job_lock:
            if job_id not in self.training_jobs:
                raise ValueError(f"Job {job_id} not found")
                
            job = self.training_jobs[job_id].copy()
            
        # Calculate duration if job has started
        if job['start_time']:
            if job['end_time']:
                duration = job['end_time'] - job['start_time']
            else:
                duration = datetime.now() - job['start_time']
            job['duration_seconds'] = duration.total_seconds()
        else:
            job['duration_seconds'] = 0
            
        return job
        
    def cancel_job(self, job_id: str):
        """
        Cancel a training job.
        
        Args:
            job_id: ID of the job to cancel
        """
        with self.job_lock:
            if job_id not in self.training_jobs:
                raise ValueError(f"Job {job_id} not found")
                
            job = self.training_jobs[job_id]
            job['status'] = 'cancelled'
            job['end_time'] = datetime.now()
            
        logger.info(f"Cancelled training job {job_id}")

class CostOptimizer:
    """Optimizes cloud infrastructure costs."""
    
    def __init__(self, cluster: GPUCluster):
        """
        Initialize the cost optimizer.
        
        Args:
            cluster: GPU cluster to optimize
        """
        self.cluster = cluster
        self.cost_history = []
        self.savings_recommendations = []
        
    def calculate_cost(self, hours: float, spot_instances: bool = False) -> Dict[str, float]:
        """
        Calculate the cost of running the cluster.
        
        Args:
            hours: Number of hours to run
            spot_instances: Whether to use spot instances
            
        Returns:
            Cost breakdown
        """
        # Hourly rates (simplified for demonstration)
        hourly_rates = {
            'p3.2xlarge': 3.06 if not spot_instances else 0.92,
            'p3.8xlarge': 12.24 if not spot_instances else 3.67,
            'p3.16xlarge': 24.48 if not spot_instances else 7.34,
            'p4d.24xlarge': 32.76 if not spot_instances else 9.83,
            'g4dn.12xlarge': 3.91 if not spot_instances else 1.17
        }
        
        total_cost = 0.0
        cost_breakdown = {}
        
        for node in self.cluster.nodes:
            node_type = node['type']
            if node_type in hourly_rates:
                node_cost = hourly_rates[node_type] * hours
                total_cost += node_cost
                if node_type not in cost_breakdown:
                    cost_breakdown[node_type] = 0.0
                cost_breakdown[node_type] += node_cost
                
        result = {
            'total_cost': total_cost,
            'cost_breakdown': cost_breakdown,
            'spot_instances': spot_instances,
            'hours': hours
        }
        
        # Store in history
        self.cost_history.append({
            'timestamp': datetime.now(),
            'calculation': result
        })
        
        return result
        
    def recommend_savings(self) -> List[Dict[str, Any]]:
        """
        Recommend cost savings strategies.
        
        Returns:
            List of savings recommendations
        """
        recommendations = []
        
        # Check if spot instances would save money
        regular_cost = self.calculate_cost(24, spot_instances=False)
        spot_cost = self.calculate_cost(24, spot_instances=True)
        
        if spot_cost['total_cost'] < regular_cost['total_cost']:
            savings = regular_cost['total_cost'] - spot_cost['total_cost']
            recommendations.append({
                'type': 'spot_instances',
                'description': f"Use spot instances to save ${savings:.2f}/day",
                'estimated_savings': savings,
                'priority': 'high'
            })
            
        # Check for over-provisioned nodes
        total_gpus = self.cluster.total_gpus
        if total_gpus > 8:
            recommendations.append({
                'type': 'rightsizing',
                'description': "Consider using smaller instances for better GPU utilization",
                'estimated_savings': 0.0,
                'priority': 'medium'
            })
            
        # Check for idle time
        recommendations.append({
            'type': 'auto_scaling',
            'description': "Implement auto-scaling to reduce costs during low utilization",
            'estimated_savings': 0.0,
            'priority': 'high'
        })
        
        self.savings_recommendations = recommendations
        return recommendations

class SecurityManager:
    """Manages security protocols for cloud infrastructure."""
    
    def __init__(self, cluster: GPUCluster):
        """
        Initialize the security manager.
        
        Args:
            cluster: GPU cluster to secure
        """
        self.cluster = cluster
        self.encryption_enabled = False
        self.access_control_policies = []
        self.audit_logs = []
        
    def enable_encryption(self, kms_key_id: Optional[str] = None):
        """
        Enable encryption for data at rest and in transit.
        
        Args:
            kms_key_id: Optional KMS key ID for encryption
        """
        self.encryption_enabled = True
        logger.info(f"Encryption enabled for cluster {self.cluster.cluster_name}")
        
        # Log the security event
        self.audit_logs.append({
            'timestamp': datetime.now(),
            'event': 'encryption_enabled',
            'details': {'kms_key_id': kms_key_id}
        })
        
    def add_access_control_policy(self, policy: Dict[str, Any]):
        """
        Add an access control policy.
        
        Args:
            policy: Access control policy
        """
        self.access_control_policies.append(policy)
        logger.info(f"Access control policy added for cluster {self.cluster.cluster_name}")
        
        # Log the security event
        self.audit_logs.append({
            'timestamp': datetime.now(),
            'event': 'access_policy_added',
            'details': policy
        })
        
    def get_security_status(self) -> Dict[str, Any]:
        """
        Get the security status of the cluster.
        
        Returns:
            Security status information
        """
        return {
            'cluster_name': self.cluster.cluster_name,
            'encryption_enabled': self.encryption_enabled,
            'access_control_policies': len(self.access_control_policies),
            'audit_log_entries': len(self.audit_logs),
            'last_audit_event': self.audit_logs[-1] if self.audit_logs else None
        }
        
    def run_security_audit(self) -> Dict[str, Any]:
        """
        Run a security audit.
        
        Returns:
            Audit results
        """
        findings = []
        
        # Check if encryption is enabled
        if not self.encryption_enabled:
            findings.append({
                'severity': 'high',
                'issue': 'Encryption not enabled',
                'recommendation': 'Enable encryption for data at rest and in transit'
            })
            
        # Check for access control policies
        if len(self.access_control_policies) == 0:
            findings.append({
                'severity': 'medium',
                'issue': 'No access control policies defined',
                'recommendation': 'Define access control policies to restrict access'
            })
            
        audit_result = {
            'timestamp': datetime.now(),
            'findings': findings,
            'passed': len(findings) == 0,
            'critical_findings': len([f for f in findings if f['severity'] == 'high'])
        }
        
        # Log the audit
        self.audit_logs.append({
            'timestamp': datetime.now(),
            'event': 'security_audit',
            'details': audit_result
        })
        
        return audit_result

class CloudInfrastructureManager:
    """Main manager for cloud/GPU infrastructure."""
    
    def __init__(self, cluster_name: str, region: str = "us-west-2"):
        """
        Initialize the cloud infrastructure manager.
        
        Args:
            cluster_name: Name of the GPU cluster
            region: Cloud region for the cluster
        """
        self.cluster = GPUCluster(cluster_name, region)
        self.training_manager = DistributedTrainingManager(self.cluster)
        self.cost_optimizer = CostOptimizer(self.cluster)
        self.security_manager = SecurityManager(self.cluster)
        
    def setup_cluster(self, node_config: List[Dict[str, Any]]):
        """
        Set up the GPU cluster with specified nodes.
        
        Args:
            node_config: List of node configurations
        """
        logger.info(f"Setting up cluster {self.cluster.cluster_name}")
        
        for config in node_config:
            node_type = config['type']
            count = config.get('count', 1)
            self.cluster.add_node(node_type, count)
            
        self.cluster.start_cluster()
        logger.info(f"Cluster {self.cluster.cluster_name} setup completed")
        
    def get_infrastructure_status(self) -> Dict[str, Any]:
        """
        Get the status of the entire infrastructure.
        
        Returns:
            Infrastructure status information
        """
        cluster_info = self.cluster.get_cluster_info()
        security_status = self.security_manager.get_security_status()
        
        return {
            'cluster': cluster_info,
            'security': security_status,
            'timestamp': datetime.now()
        }
        
    def optimize_costs(self) -> Dict[str, Any]:
        """
        Optimize infrastructure costs.
        
        Returns:
            Cost optimization results
        """
        # Calculate current costs
        regular_cost = self.cost_optimizer.calculate_cost(24, spot_instances=False)
        spot_cost = self.cost_optimizer.calculate_cost(24, spot_instances=True)
        
        # Get savings recommendations
        recommendations = self.cost_optimizer.recommend_savings()
        
        return {
            'regular_cost': regular_cost,
            'spot_cost': spot_cost,
            'savings_recommendations': recommendations,
            'potential_daily_savings': regular_cost['total_cost'] - spot_cost['total_cost']
        }
        
    def run_security_check(self) -> Dict[str, Any]:
        """
        Run a comprehensive security check.
        
        Returns:
            Security check results
        """
        return self.security_manager.run_security_audit()

# Example usage
if __name__ == "__main__":
    # Create cloud infrastructure manager
    cloud_manager = CloudInfrastructureManager("demand-forecasting-cluster", "us-west-2")
    
    # Set up cluster with node configuration
    node_config = [
        {'type': 'p3.2xlarge', 'count': 2},
        {'type': 'p3.8xlarge', 'count': 1}
    ]
    cloud_manager.setup_cluster(node_config)
    
    # Enable security features
    cloud_manager.security_manager.enable_encryption()
    cloud_manager.security_manager.add_access_control_policy({
        'role': 'data-scientist',
        'permissions': ['read', 'write', 'execute']
    })
    
    # Optimize costs
    cost_optimization = cloud_manager.optimize_costs()
    print(f"Potential daily savings: ${cost_optimization['potential_daily_savings']:.2f}")
    
    # Run security check
    security_check = cloud_manager.run_security_check()
    print(f"Security check passed: {security_check['passed']}")