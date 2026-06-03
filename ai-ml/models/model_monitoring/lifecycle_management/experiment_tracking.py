"""
Experiment Tracking for Model Lifecycle Management

This module provides MLflow-style experiment tracking with run management,
hyperparameter logging, metric comparison, and reproducibility support.
"""

import uuid
import json
import numpy as np
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExperimentTracker:
    """
    Tracks ML experiments including hyperparameters, metrics, artifacts,
    and run comparisons. Provides reproducibility and search capabilities.
    """

    def __init__(self, experiment_name: str = "default"):
        """
        Args:
            experiment_name: Name of the experiment group
        """
        self.experiment_name = experiment_name
        self.experiment_id = str(uuid.uuid4())[:8]
        self.runs: Dict[str, Dict[str, Any]] = {}
        self.active_run_id: Optional[str] = None
        self.created_at = datetime.now().isoformat()

    def create_run(self,
                   run_name: Optional[str] = None,
                   tags: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Start a new run.

        Args:
            run_name: Human-readable name for the run
            tags: Optional key-value tags

        Returns:
            Dict with run_id and metadata
        """
        run_id = str(uuid.uuid4())
        self.active_run_id = run_id
        self.runs[run_id] = {
            'run_id': run_id,
            'run_name': run_name or f"run_{len(self.runs) + 1}",
            'experiment_name': self.experiment_name,
            'experiment_id': self.experiment_id,
            'status': 'running',
            'start_time': datetime.now().isoformat(),
            'end_time': None,
            'params': {},
            'metrics': {},
            'tags': tags or {},
            'artifacts': [],
            'dataset_snapshot': None,
        }
        logger.info(f"Created run {run_id} ({self.runs[run_id]['run_name']})")
        return {'run_id': run_id, 'experiment_id': self.experiment_id}

    def log_param(self, key: str, value: Any) -> None:
        """Log a single hyperparameter."""
        if not self.active_run_id:
            raise ValueError("No active run. Call create_run() first.")
        self.runs[self.active_run_id]['params'][key] = value

    def log_params(self, params: Dict[str, Any]) -> None:
        """Log multiple hyperparameters at once."""
        for k, v in params.items():
            self.log_param(k, v)

    def log_metric(self, key: str, value: float, step: Optional[int] = None) -> None:
        """Log a single metric value."""
        if not self.active_run_id:
            raise ValueError("No active run. Call create_run() first.")
        if key not in self.runs[self.active_run_id]['metrics']:
            self.runs[self.active_run_id]['metrics'][key] = []
        entry = {'value': value, 'timestamp': datetime.now().isoformat()}
        if step is not None:
            entry['step'] = step
        self.runs[self.active_run_id]['metrics'][key].append(entry)

    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None) -> None:
        """Log multiple metrics at once."""
        for k, v in metrics.items():
            self.log_metric(k, v, step=step)

    def log_artifact(self, artifact_path: str, artifact_type: str = 'file') -> None:
        """Record an artifact associated with this run."""
        if not self.active_run_id:
            raise ValueError("No active run.")
        self.runs[self.active_run_id]['artifacts'].append({
            'path': artifact_path,
            'type': artifact_type,
            'timestamp': datetime.now().isoformat(),
        })

    def set_dataset_snapshot(self, dataset_info: Dict[str, Any]) -> None:
        """Record dataset metadata for reproducibility."""
        if not self.active_run_id:
            raise ValueError("No active run.")
        self.runs[self.active_run_id]['dataset_snapshot'] = dataset_info

    def end_run(self, status: str = 'completed') -> Dict[str, Any]:
        """
        Finish the active run.

        Args:
            status: 'completed', 'failed', or 'stopped'

        Returns:
            Dict with final run summary
        """
        if not self.active_run_id:
            raise ValueError("No active run.")
        run = self.runs[self.active_run_id]
        run['status'] = status
        run['end_time'] = datetime.now().isoformat()
        self.active_run_id = None
        logger.info(f"Run {run['run_id']} ended with status {status}")
        return self._summarize_run(run['run_id'])

    def get_run(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific run by ID."""
        return self.runs.get(run_id)

    def list_runs(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all runs, optionally filtered by status."""
        runs = list(self.runs.values())
        if status:
            runs = [r for r in runs if r['status'] == status]
        return runs

    def compare_runs(self, run_id_1: str, run_id_2: str) -> Dict[str, Any]:
        """
        Compare metrics and params between two runs.

        Returns:
            Dict with common/different params and metric deltas
        """
        run1 = self.runs.get(run_id_1)
        run2 = self.runs.get(run_id_2)
        if not run1 or not run2:
            raise ValueError("Both run_ids must exist.")

        common_params = set(run1['params']) & set(run2['params'])
        different_params = {}
        for p in common_params:
            if run1['params'][p] != run2['params'][p]:
                different_params[p] = {'run1': run1['params'][p], 'run2': run2['params'][p]}

        metric_deltas = {}
        all_metrics = set(run1['metrics']) | set(run2['metrics'])
        for m in all_metrics:
            v1 = run1['metrics'].get(m, [{'value': None}])[-1]['value']
            v2 = run2['metrics'].get(m, [{'value': None}])[-1]['value']
            if v1 is not None and v2 is not None:
                metric_deltas[m] = {'run1': v1, 'run2': v2, 'delta': v2 - v1}

        return {
            'run1': {'id': run_id_1, 'name': run1['run_name']},
            'run2': {'id': run_id_2, 'name': run2['run_name']},
            'different_params': different_params,
            'metric_deltas': metric_deltas,
            'run1_only_params': set(run1['params']) - set(run2['params']),
            'run2_only_params': set(run2['params']) - set(run1['params']),
        }

    def search_runs(self, query: str) -> List[Dict[str, Any]]:
        """Search runs by name or tags."""
        q = query.lower()
        results = []
        for run in self.runs.values():
            if q in run['run_name'].lower():
                results.append(run)
                continue
            for tag_v in run['tags'].values():
                if q in str(tag_v).lower():
                    results.append(run)
                    break
        return results

    def get_best_run(self, metric_key: str, minimize: bool = True) -> Optional[Dict[str, Any]]:
        """Find the best run by a specific metric."""
        completed = [r for r in self.runs.values() if r['status'] == 'completed']
        if not completed:
            return None

        best = None
        best_val = float('inf') if minimize else float('-inf')

        for run in completed:
            if metric_key in run['metrics'] and run['metrics'][metric_key]:
                val = run['metrics'][metric_key][-1]['value']
                if minimize and val < best_val:
                    best_val = val
                    best = run
                elif not minimize and val > best_val:
                    best_val = val
                    best = run

        return best

    def export_runs(self, filepath: str) -> None:
        """Export all runs to JSON file."""
        export = {
            'experiment_name': self.experiment_name,
            'experiment_id': self.experiment_id,
            'created_at': self.created_at,
            'runs': list(self.runs.values()),
        }
        with open(filepath, 'w') as f:
            json.dump(export, f, indent=2, default=str)
        logger.info(f"Exported {len(self.runs)} runs to {filepath}")

    def _summarize_run(self, run_id: str) -> Dict[str, Any]:
        """Create a summary dict for a run."""
        run = self.runs[run_id]
        summary_metrics = {}
        for k, v in run['metrics'].items():
            if v:
                values = [m['value'] for m in v]
                summary_metrics[k] = {
                    'last': values[-1],
                    'min': min(values),
                    'max': max(values),
                    'mean': float(np.mean(values)) if len(values) > 1 else values[-1],
                }
        return {
            'run_id': run_id,
            'run_name': run['run_name'],
            'status': run['status'],
            'start_time': run['start_time'],
            'end_time': run['end_time'],
            'n_params': len(run['params']),
            'n_metrics': len(run['metrics']),
            'summary_metrics': summary_metrics,
        }

    def get_state(self) -> Dict[str, Any]:
        """Return serializable state."""
        return {
            'experiment_name': self.experiment_name,
            'experiment_id': self.experiment_id,
            'n_runs': len(self.runs),
            'active_run': self.active_run_id,
            'run_statuses': {r['run_id']: r['status'] for r in self.runs.values()},
        }


if __name__ == "__main__":
    import numpy as np
    tracker = ExperimentTracker("demand_forecast_tuning")
    run1 = tracker.create_run("xgboost_v1", tags={"model": "xgboost"})
    tracker.log_params({"lr": 0.1, "max_depth": 6, "n_estimators": 100})
    for step in range(5):
        tracker.log_metric("val_mae", 10.0 - step * 0.5 + np.random.randn() * 0.1, step=step)
    tracker.log_artifact("models/xgboost_v1.pkl")
    tracker.end_run()

    run2 = tracker.create_run("lightgbm_v1", tags={"model": "lightgbm"})
    tracker.log_params({"lr": 0.05, "num_leaves": 31, "n_estimators": 100})
    for step in range(5):
        tracker.log_metric("val_mae", 9.5 - step * 0.4 + np.random.randn() * 0.1, step=step)
    tracker.end_run()

    print("Best run:", tracker.get_best_run("val_mae", minimize=True)['run_name'])
