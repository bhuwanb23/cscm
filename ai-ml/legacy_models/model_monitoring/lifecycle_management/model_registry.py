"""
Model Registry for Lifecycle Management

This module implements a model registry for tracking model versions,
metadata, lineage, and lifecycle states across the supply chain AI system.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import json
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelRegistry:
    """
    Manages model versions, metadata, and lifecycle states.
    Provides versioning, lineage tracking, staging/promotion,
    and model metadata management.
    """

    VALID_STAGES = ['development', 'staging', 'production', 'archived', 'deprecated']

    def __init__(self, registry_name: str = "cscm_model_registry"):
        """
        Initialize the model registry.

        Args:
            registry_name: Name of the registry
        """
        self.registry_name = registry_name
        self.models = {}
        self.versions = {}
        self.lineage_graph = {}
        self.audit_log = []

    def register_model(self,
                       model_name: str,
                       model_type: str,
                       description: str = "",
                       tags: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Register a new model in the registry.

        Args:
            model_name: Name of the model
            model_type: Type of model (e.g., 'forecasting', 'classification')
            description: Model description
            tags: Optional metadata tags

        Returns:
            Dictionary with registration details
        """
        if model_name in self.models:
            logger.warning(f"Model {model_name} already registered")

        model_id = f"{model_name}_{uuid.uuid4().hex[:8]}"
        self.models[model_name] = {
            'model_id': model_id,
            'model_name': model_name,
            'model_type': model_type,
            'description': description,
            'tags': tags or {},
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'current_stage': 'development',
            'total_versions': 0,
            'latest_version': None,
            'production_version': None,
        }

        self.versions[model_name] = []
        self.lineage_graph[model_name] = []

        self._log_audit('model_registered', {
            'model_name': model_name,
            'model_type': model_type,
            'model_id': model_id,
        })

        logger.info(f"Model {model_name} registered (type={model_type})")
        return self.models[model_name]

    def create_version(self,
                       model_name: str,
                       run_id: str,
                       metrics: Optional[Dict[str, float]] = None,
                       params: Optional[Dict[str, Any]] = None,
                       artifacts: Optional[Dict[str, str]] = None,
                       parent_version: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new version of a model.

        Args:
            model_name: Name of the model
            run_id: Training run identifier
            metrics: Performance metrics for this version
            params: Training parameters
            artifacts: Paths to model artifacts
            parent_version: Parent version ID for lineage tracking

        Returns:
            Dictionary with version details
        """
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not registered")

        model_info = self.models[model_name]
        version_number = model_info['total_versions'] + 1
        version_id = f"{model_name}_v{version_number}"

        version_info = {
            'version_id': version_id,
            'version_number': version_number,
            'model_name': model_name,
            'run_id': run_id,
            'stage': 'development',
            'metrics': metrics or {},
            'params': params or {},
            'artifacts': artifacts or {},
            'parent_version': parent_version,
            'created_at': datetime.now().isoformat(),
            'created_by': 'system',
        }

        self.versions[model_name].append(version_info)
        model_info['total_versions'] = version_number
        model_info['latest_version'] = version_id
        model_info['updated_at'] = datetime.now().isoformat()

        if parent_version:
            self.lineage_graph[model_name].append({
                'parent': parent_version,
                'child': version_id,
                'relationship': 'derived_from',
            })

        self._log_audit('version_created', {
            'model_name': model_name,
            'version_id': version_id,
            'version_number': version_number,
        })

        logger.info(f"Version {version_id} created for {model_name}")
        return version_info

    def transition_version(self,
                           model_name: str,
                           version_id: str,
                           target_stage: str) -> Dict[str, Any]:
        """
        Transition a model version to a new lifecycle stage.

        Args:
            model_name: Name of the model
            version_id: Version identifier
            target_stage: Target stage ('development', 'staging', 'production', 'archived')

        Returns:
            Dictionary with transition details
        """
        if target_stage not in self.VALID_STAGES:
            raise ValueError(f"Invalid stage: {target_stage}. Valid: {self.VALID_STAGES}")

        if model_name not in self.versions:
            raise ValueError(f"No versions for model {model_name}")

        version = None
        for v in self.versions[model_name]:
            if v['version_id'] == version_id:
                version = v
                break

        if version is None:
            raise ValueError(f"Version {version_id} not found for model {model_name}")

        source_stage = version['stage']
        version['stage'] = target_stage
        self.models[model_name]['current_stage'] = target_stage

        if target_stage == 'production':
            self.models[model_name]['production_version'] = version_id

        self.models[model_name]['updated_at'] = datetime.now().isoformat()

        self._log_audit('version_transitioned', {
            'model_name': model_name,
            'version_id': version_id,
            'from_stage': source_stage,
            'to_stage': target_stage,
        })

        logger.info(f"Version {version_id} transitioned: {source_stage} -> {target_stage}")

        return {
            'model_name': model_name,
            'version_id': version_id,
            'from_stage': source_stage,
            'to_stage': target_stage,
            'timestamp': datetime.now().isoformat(),
        }

    def get_model(self, model_name: str) -> Optional[Dict[str, Any]]:
        """
        Get model metadata.

        Args:
            model_name: Name of the model

        Returns:
            Model metadata or None
        """
        return self.models.get(model_name)

    def get_version(self, model_name: str, version_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific model version.

        Args:
            model_name: Name of the model
            version_id: Version identifier

        Returns:
            Version info or None
        """
        if model_name not in self.versions:
            return None
        for v in self.versions[model_name]:
            if v['version_id'] == version_id:
                return v
        return None

    def get_latest_version(self, model_name: str, stage: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get the latest version, optionally filtered by stage.

        Args:
            model_name: Name of the model
            stage: Optional stage filter

        Returns:
            Latest version info or None
        """
        if model_name not in self.versions:
            return None

        versions = self.versions[model_name]
        if stage:
            versions = [v for v in versions if v['stage'] == stage]

        return versions[-1] if versions else None

    def search_models(self, query: str) -> List[Dict[str, Any]]:
        """
        Search models by name or type.

        Args:
            query: Search query

        Returns:
            List of matching models
        """
        query_lower = query.lower()
        results = []
        for name, info in self.models.items():
            if (query_lower in name.lower()
                    or query_lower in info['model_type'].lower()
                    or query_lower in info['description'].lower()):
                results.append(info)
        return results

    def get_lineage(self, model_name: str, version_id: str) -> Dict[str, Any]:
        """
        Get the lineage graph for a model version.

        Args:
            model_name: Name of the model
            version_id: Version identifier

        Returns:
            Dictionary with lineage information
        """
        version = self.get_version(model_name, version_id)
        if version is None:
            return {'error': f'Version {version_id} not found'}

        ancestors = []
        descendants = []

        current_id = version_id
        max_depth = 10
        depth = 0

        while current_id and depth < max_depth:
            for edge in self.lineage_graph.get(model_name, []):
                if edge['child'] == current_id:
                    ancestors.append(edge['parent'])
                    current_id = edge['parent']
                    depth += 1
                    break
            else:
                break

        current_id = version_id
        depth = 0

        while current_id and depth < max_depth:
            for edge in self.lineage_graph.get(model_name, []):
                if edge['parent'] == current_id:
                    descendants.append(edge['child'])
                    current_id = edge['child']
                    depth += 1
                    break
            else:
                break

        return {
            'version_id': version_id,
            'model_name': model_name,
            'ancestors': ancestors,
            'descendants': descendants,
            'version_info': version,
        }

    def compare_versions(self,
                         model_name: str,
                         version_id_1: str,
                         version_id_2: str) -> Dict[str, Any]:
        """
        Compare two versions of a model.

        Args:
            model_name: Name of the model
            version_id_1: First version ID
            version_id_2: Second version ID

        Returns:
            Dictionary with comparison
        """
        v1 = self.get_version(model_name, version_id_1)
        v2 = self.get_version(model_name, version_id_2)

        if v1 is None or v2 is None:
            return {'error': 'One or both versions not found'}

        metrics_diff = {}
        all_metrics = set(list(v1.get('metrics', {}).keys()) + list(v2.get('metrics', {}).keys()))
        for m in all_metrics:
            m1 = v1['metrics'].get(m)
            m2 = v2['metrics'].get(m)
            if m1 is not None and m2 is not None:
                metrics_diff[m] = {
                    'v1': m1,
                    'v2': m2,
                    'delta': m2 - m1,
                    'improvement': m2 > m1,
                }

        return {
            'model_name': model_name,
            'version_1': {'version_id': version_id_1, 'stage': v1['stage']},
            'version_2': {'version_id': version_id_2, 'stage': v2['stage']},
            'metrics_comparison': metrics_diff,
            'params_changed': v1.get('params') != v2.get('params'),
        }

    def list_models(self, stage: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all registered models.

        Args:
            stage: Optional stage filter

        Returns:
            List of model metadata
        """
        if stage:
            return [m for m in self.models.values() if m['current_stage'] == stage]
        return list(self.models.values())

    def _log_audit(self, action: str, details: Dict[str, Any]):
        """Log an audit event."""
        self.audit_log.append({
            'action': action,
            'details': details,
            'timestamp': datetime.now().isoformat(),
        })

    def get_audit_log(self, model_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get the audit log, optionally filtered by model.

        Args:
            model_name: Optional model name filter

        Returns:
            List of audit events
        """
        if model_name:
            return [
                entry for entry in self.audit_log
                if entry['details'].get('model_name') == model_name
            ]
        return self.audit_log


if __name__ == "__main__":
    registry = ModelRegistry()

    registry.register_model("demand_forecaster", "forecasting",
                           "Demand forecasting model for inventory planning",
                           tags={"domain": "inventory", "frequency": "daily"})

    registry.create_version("demand_forecaster", "run_001",
                           metrics={"rmse": 12.5, "mae": 8.3},
                           params={"learning_rate": 0.01, "n_estimators": 100})

    registry.create_version("demand_forecaster", "run_002",
                           metrics={"rmse": 10.2, "mae": 6.8},
                           params={"learning_rate": 0.005, "n_estimators": 200},
                           parent_version="demand_forecaster_v1")

    registry.transition_version("demand_forecaster", "demand_forecaster_v2", "production")

    model = registry.get_model("demand_forecaster")
    print(f"Model: {model['model_name']}, Stage: {model['current_stage']}")
    print(f"Production version: {model['production_version']}")

    latest = registry.get_latest_version("demand_forecaster", stage="production")
    print(f"Production metrics: {latest['metrics']}")

    comparison = registry.compare_versions(
        "demand_forecaster", "demand_forecaster_v1", "demand_forecaster_v2"
    )
    print(f"RMSE improvement: {comparison['metrics_comparison']['rmse']['improvement']}")

    lineage = registry.get_lineage("demand_forecaster", "demand_forecaster_v2")
    print(f"Ancestors: {lineage['ancestors']}")
