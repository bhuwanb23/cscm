"""
Tests for Model Monitoring & MLOps Module (13 classes, 4 sub-packages).
"""

import numpy as np
import pytest
from datetime import datetime, timedelta


class TestPerformanceTracker:
    def test_init(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001")
        assert pt.model_id == "model_001"
        assert pt.total_predictions == 0

    def test_update_during_warmup(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001", warmup_period=10)
        result = pt.update(y_true=1.0, y_pred=1.1)
        assert 'current_metrics' in result

    def test_update_batch(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001", warmup_period=0)
        result = pt.update(y_true=np.array([1.0, 2.0]), y_pred=np.array([1.1, 2.2]))
        assert 'drift_detected' in result

    def test_calculate_current_metrics(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001", warmup_period=0)
        pt.update(y_true=1.0, y_pred=1.1)
        pt.update(y_true=2.0, y_pred=2.2)
        metrics = pt.calculate_current_metrics()
        assert 'mae' in metrics

    def test_get_performance_summary(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001", warmup_period=0)
        pt.update(y_true=1.0, y_pred=1.1)
        summary = pt.get_performance_summary()
        assert summary['model_id'] == "model_001"

    def test_reset(self):
        from legacy_models.model_monitoring import PerformanceTracker
        pt = PerformanceTracker(model_id="model_001", warmup_period=0)
        pt.update(y_true=1.0, y_pred=1.1)
        pt.reset()
        assert pt.total_predictions == 0


class TestPredictionDriftDetector:
    def test_init(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001")
        assert pdd.model_id == "model_001"

    def test_update_during_reference_phase(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001", reference_size=10, window_size=5)
        for _ in range(5):
            result = pdd.update(prediction=float(np.random.randn()))
            assert result['phase'] == 'building_reference'

    def test_update_switches_to_monitoring(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001", reference_size=10, window_size=15)
        for _ in range(26):
            pdd.update(prediction=float(np.random.randn()))
        result = pdd.update(prediction=float(np.random.randn()))
        assert result['phase'] in ('monitoring', 'drift_detected')

    def test_drift_summary_contains_keys(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001")
        summary = pdd.get_drift_summary()
        assert 'drift_detected' in summary

    def test_set_reference(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001")
        pdd.set_reference([1.0, 2.0, 3.0])
        assert len(pdd.reference_predictions) == 3

    def test_get_drift_summary(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001", reference_size=10, window_size=5)
        for _ in range(12):
            pdd.update(prediction=float(np.random.randn()))
        summary = pdd.get_drift_summary()
        assert 'drift_detected' in summary

    def test_reset_window(self):
        from legacy_models.model_monitoring import PredictionDriftDetector
        pdd = PredictionDriftDetector(model_id="model_001", reference_size=10, window_size=5)
        for _ in range(12):
            pdd.update(prediction=float(np.random.randn()))
        pdd.reset_window()
        assert len(pdd.current_window) == 0


class TestADWINDetector:
    def test_init(self):
        from legacy_models.model_monitoring import ADWINDetector
        detector = ADWINDetector(delta=0.01)
        assert detector.delta == 0.01

    def test_update_no_drift(self):
        from legacy_models.model_monitoring import ADWINDetector
        detector = ADWINDetector(delta=0.1)
        for _ in range(50):
            detector.update(value=float(np.random.randn()))
        assert isinstance(detector.total_drifts, int)

    def test_get_mean(self):
        from legacy_models.model_monitoring import ADWINDetector
        detector = ADWINDetector(delta=0.1)
        detector.update(1.0)
        assert detector.get_mean() == 1.0

    def test_get_stats(self):
        from legacy_models.model_monitoring import ADWINDetector
        detector = ADWINDetector(delta=0.1)
        detector.update(1.0)
        stats = detector.get_stats()
        assert 'mean' in stats

    def test_reset(self):
        from legacy_models.model_monitoring import ADWINDetector
        detector = ADWINDetector(delta=0.1)
        detector.update(1.0)
        detector.reset()
        assert detector.window_length == 0


class TestFeatureDriftDetector:
    def test_init(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(model_id="model_001", feature_names=["feat_a", "feat_b"])
        assert fdd.model_id == "model_001"
        assert len(fdd.feature_names) == 2

    def test_update_building_reference(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(
            model_id="model_001",
            feature_names=["price"],
            reference_window=5,
            test_window=3,
        )
        for _ in range(3):
            result = fdd.update({"price": float(np.random.randn())})
            assert result['phase'] == 'building_reference'

    def test_update_monitoring_phase(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(
            model_id="model_001",
            feature_names=["price"],
            reference_window=5,
            test_window=3,
        )
        for _ in range(5):
            fdd.update({"price": float(np.random.randn())})
        result = fdd.update({"price": float(np.random.randn())})
        assert 'drift_detected' in result

    def test_set_feature_importance(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(model_id="m", feature_names=["a", "b"])
        fdd.set_feature_importance({"a": 0.7, "b": 0.3})
        assert abs(fdd.feature_importances["a"] - 0.7) < 1e-6

    def test_get_drift_summary(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(
            model_id="model_001",
            feature_names=["x"],
            reference_window=5,
            test_window=3,
        )
        for _ in range(6):
            fdd.update({"x": float(np.random.randn())})
        summary = fdd.get_drift_summary()
        assert 'n_drift_events' in summary

    def test_reset_reference(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(
            model_id="m", feature_names=["x"],
            reference_window=5, test_window=3,
        )
        for _ in range(5):
            fdd.update({"x": float(np.random.randn())})
        fdd.reset_reference()
        assert fdd.current_phase == 'building_reference'

    def test_get_state(self):
        from legacy_models.model_monitoring import FeatureDriftDetector
        fdd = FeatureDriftDetector(model_id="m", feature_names=["x"])
        state = fdd.get_state()
        assert state['model_id'] == "m"


class TestModelRegistry:
    def test_init(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry(registry_name="test_reg")
        assert mr.registry_name == "test_reg"

    def test_register_model(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        result = mr.register_model(model_name="demand_v1", model_type="forecasting")
        assert result['model_name'] == "demand_v1"

    def test_create_version(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        version = mr.create_version(
            model_name="demand_v1",
            run_id="run_001",
            metrics={"mae": 8.5},
        )
        assert version['model_name'] == "demand_v1"

    def test_transition_version(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        v = mr.create_version("demand_v1", "run_001")
        result = mr.transition_version("demand_v1", v['version_id'], "staging")
        assert result['to_stage'] == 'staging'

    def test_get_model(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        model = mr.get_model("demand_v1")
        assert model['model_name'] == "demand_v1"

    def test_get_latest_version(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        v1 = mr.create_version("demand_v1", "run_001")
        v2 = mr.create_version("demand_v1", "run_002")
        latest = mr.get_latest_version("demand_v1")
        assert latest['version_id'] == v2['version_id']

    def test_list_models(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        mr.register_model("inventory_v1", "optimization")
        models = mr.list_models()
        assert len(models) == 2

    def test_search_models(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        results = mr.search_models("demand")
        assert len(results) == 1

    def test_get_lineage(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        v1 = mr.create_version("demand_v1", "run_001")
        v2 = mr.create_version("demand_v1", "run_002", parent_version=v1['version_id'])
        lineage = mr.get_lineage("demand_v1", v2['version_id'])
        assert 'ancestors' in lineage

    def test_compare_versions(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        v1 = mr.create_version("demand_v1", "run_001", metrics={"mae": 8.0})
        v2 = mr.create_version("demand_v1", "run_002", metrics={"mae": 7.5})
        comparison = mr.compare_versions("demand_v1", v1['version_id'], v2['version_id'])
        assert 'metrics_comparison' in comparison

    def test_get_audit_log(self):
        from legacy_models.model_monitoring import ModelRegistry
        mr = ModelRegistry()
        mr.register_model("demand_v1", "forecasting")
        log = mr.get_audit_log()
        assert len(log) > 0


class TestExperimentTracker:
    def test_init(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker(experiment_name="test_exp")
        assert et.experiment_name == "test_exp"

    def test_create_run(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        run = et.create_run(run_name="xgboost_v1", tags={"model": "xgboost"})
        assert 'run_id' in run

    def test_log_param(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run()
        et.log_param("lr", 0.1)
        run = et.get_run(et.active_run_id)
        assert run['params']['lr'] == 0.1

    def test_log_params(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run()
        et.log_params({"lr": 0.1, "max_depth": 6})
        run = et.get_run(et.active_run_id)
        assert len(run['params']) == 2

    def test_log_metric(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run()
        et.log_metric("val_mae", 8.5)
        run = et.get_run(et.active_run_id)
        assert len(run['metrics']['val_mae']) == 1

    def test_end_run(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run()
        summary = et.end_run(status='completed')
        assert summary['status'] == 'completed'

    def test_list_runs(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run("run1")
        et.end_run()
        et.create_run("run2")
        et.end_run()
        runs = et.list_runs()
        assert len(runs) == 2

    def test_compare_runs(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        r1 = et.create_run("run1")
        et.log_metric("mae", 8.0)
        et.end_run()
        r2 = et.create_run("run2")
        et.log_metric("mae", 7.0)
        et.end_run()
        cmp = et.compare_runs(r1['run_id'], r2['run_id'])
        assert 'metric_deltas' in cmp

    def test_get_best_run(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        r1 = et.create_run("run1")
        et.log_metric("mae", 8.0)
        et.end_run()
        r2 = et.create_run("run2")
        et.log_metric("mae", 7.0)
        et.end_run()
        best = et.get_best_run("mae", minimize=True)
        assert best['run_name'] == "run2"

    def test_search_runs(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        et.create_run("xgboost_v1", tags={"type": "tree"})
        et.end_run()
        results = et.search_runs("xgboost")
        assert len(results) == 1

    def test_get_state(self):
        from legacy_models.model_monitoring import ExperimentTracker
        et = ExperimentTracker()
        state = et.get_state()
        assert 'n_runs' in state


class TestRetrainingPipelineManager:
    def test_init(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager(pipeline_name="test")
        assert rp.pipeline_name == "test"

    def test_should_retrain_forced(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        result = rp.should_retrain(force=True)
        assert result['should_retrain']

    def test_should_retrain_no_trigger(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager(cooldown_hours=0)
        result = rp.should_retrain()
        assert not result['should_retrain']

    def test_should_retrain_drift(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager(cooldown_hours=0)
        result = rp.should_retrain(drift_detected=True)
        assert result['should_retrain']

    def test_execute_retraining_success(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        def train_fn(**kw):
            return {'val_mae': 8.5}
        result = rp.execute_retraining(train_fn, trigger='drift_detected')
        assert result['status'] == 'completed'

    def test_execute_retraining_failure(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        def train_fn(**kw):
            raise RuntimeError("training failed")
        result = rp.execute_retraining(train_fn, trigger='manual')
        assert result['status'] == 'failed'

    def test_get_pipeline_status(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        status = rp.get_pipeline_status()
        assert 'total_runs' in status

    def test_set_trigger(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        rp.set_trigger("scheduled", True)
        assert rp.triggers['scheduled']

    def test_get_state(self):
        from legacy_models.model_monitoring import RetrainingPipelineManager
        rp = RetrainingPipelineManager()
        state = rp.get_state()
        assert 'pipeline_name' in state


class TestCanaryRolloutManager:
    def test_init(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager(rollout_name="test", canary_traffic_pct=10.0)
        assert cr.rollout_name == "test"

    def test_start_rollout(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager()
        result = cr.start_rollout(canary_model_id="v2", baseline_model_id="v1")
        assert result['status'] == 'canary'

    def test_record_and_evaluate_canary(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager(evaluation_window=5)
        cr.start_rollout("v2", "v1")
        for _ in range(10):
            cr.record_canary_prediction(float(np.random.randn()), float(np.random.randn()))
        actuals = [float(np.random.randn()) for _ in range(10)]
        result = cr.evaluate_canary(actuals)
        assert 'decision' in result

    def test_promote_step(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager(canary_traffic_pct=10.0, step_increase_pct=50.0)
        cr.start_rollout("v2", "v1")
        result = cr.promote_step()
        assert result['traffic_pct_to'] == 60.0

    def test_get_rollout_status(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager()
        cr.start_rollout("v2", "v1")
        status = cr.get_rollout_status()
        assert status['status'] == 'canary'

    def test_get_state(self):
        from legacy_models.model_monitoring import CanaryRolloutManager
        cr = CanaryRolloutManager()
        state = cr.get_state()
        assert 'status' in state


class TestShadowDeploymentManager:
    def test_init(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager(deployment_name="test_shadow")
        assert sd.deployment_name == "test_shadow"

    def test_start_shadow(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager()
        result = sd.start_shadow("v2", "v1")
        assert result['shadow_model'] == "v2"

    def test_record_prediction(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager()
        sd.start_shadow("v2", "v1")
        sd.record_prediction(1.0, 1.1, actual=1.05)
        assert len(sd.shadow_predictions) == 1

    def test_evaluate(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager(evaluation_window=5)
        sd.start_shadow("v2", "v1")
        for _ in range(10):
            t = float(np.random.randn())
            sd.record_prediction(t + 0.1, t + 0.5, actual=t)
        result = sd.evaluate()
        assert 'evaluated' in result

    def test_stop_shadow(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager()
        sd.start_shadow("v2", "v1")
        summary = sd.stop_shadow()
        assert 'total_predictions' in summary

    def test_compare_segments(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager()
        sd.start_shadow("v2", "v1")
        for i in range(10):
            t = float(np.random.randn())
            sd.record_prediction(t, t, actual=t, meta={"store": f"store_{i % 3}"})
        segments = sd.compare_segments("store")
        assert 'segments' in segments

    def test_get_state(self):
        from legacy_models.model_monitoring import ShadowDeploymentManager
        sd = ShadowDeploymentManager()
        state = sd.get_state()
        assert 'deployment_name' in state


class TestModelGovernanceFramework:
    def test_init(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework(framework_name="test_gov")
        assert gf.framework_name == "test_gov"

    def test_create_policy(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        policy = gf.create_policy(
            policy_id="p1",
            name="Accuracy Minimum",
            description="Min accuracy threshold",
            rules=[{"field": "accuracy", "op": "gte", "value": 0.8}],
        )
        assert policy['policy_id'] == "p1"

    def test_evaluate_compliance(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        gf.create_policy("p1", "Acc Min", "desc",
                         [{"field": "accuracy", "operator": "gte", "threshold": 0.8}],
                         severity="high")
        result = gf.evaluate_compliance("model_001", {"accuracy": 0.85})
        assert result['is_compliant']

    def test_evaluate_compliance_violation(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        gf.create_policy("p1", "Acc Min", "desc",
                         [{"field": "accuracy", "operator": "gte", "threshold": 0.8}],
                         severity="high")
        result = gf.evaluate_compliance("model_001", {"accuracy": 0.7})
        assert not result['is_compliant']

    def test_create_approval_workflow(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        wf = gf.create_approval_workflow("model_001", "deployment", ["alice", "bob"])
        assert wf['workflow_type'] == "deployment"

    def test_approve_reject(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        wf = gf.create_approval_workflow("model_001", "deployment", ["alice", "bob"])
        gf.approve(wf['workflow_id'], "alice")
        status = gf.approve(wf['workflow_id'], "bob")
        assert status['status'] == 'approved'

    def test_get_audit_trail(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        gf.create_policy("p1", "Test", "desc", [])
        trail = gf.get_audit_trail()
        assert len(trail) > 0

    def test_get_governance_summary(self):
        from legacy_models.model_monitoring import ModelGovernanceFramework
        gf = ModelGovernanceFramework()
        gf.create_policy("p1", "Test", "desc", [])
        gf.evaluate_compliance("model_001", {"x": 1})
        summary = gf.get_governance_summary("model_001")
        assert 'compliance' in summary


class TestAutoRollbackManager:
    def test_init(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager(system_name="test")
        assert arb.system_name == "test"

    def test_register_deployment(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        result = arb.register_deployment("dep_001", "model_v1")
        assert result['status'] == 'registered'

    def test_record_metrics(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        arb.register_deployment("dep_001", "model_v1")
        result = arb.record_metrics("dep_001", {"mae": 10.0})
        assert 'status' in result

    def test_rollback_on_degradation(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager(
            degradation_threshold=0.1,
            min_samples_before_rollback=5,
        )
        arb.register_deployment("dep_001", "model_v1", baseline_metrics={"mae": 10.0})
        for _ in range(10):
            arb.record_metrics("dep_001", {"mae": 15.0})
        status = arb.get_rollback_status("dep_001")
        assert status['state'] == 'rolled_back'

    def test_manual_rollback(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        arb.register_deployment("dep_001", "model_v1")
        result = arb.manual_rollback("dep_001", "manual test", "alice")
        assert result['trigger'] == 'manual'

    def test_can_promote(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        arb.register_deployment("dep_001", "model_v1")
        result = arb.can_promote("dep_001")
        assert result['can_promote']

    def test_get_rollback_status(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        arb.register_deployment("dep_001", "model_v1")
        status = arb.get_rollback_status("dep_001")
        assert status['deployment_id'] == "dep_001"

    def test_get_state(self):
        from legacy_models.model_monitoring import AutoRollbackManager
        arb = AutoRollbackManager()
        state = arb.get_state()
        assert 'system_name' in state


class TestAlertManager:
    def test_init(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager(system_name="test")
        assert am.system_name == "test"

    def test_create_alert_rule(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        rule = am.create_alert_rule(
            rule_id="r1",
            name="high_mae",
            condition={"metric": "mae", "op": "gt", "value": 10.0},
        )
        assert rule['name'] == "high_mae"

    def test_register_channel(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        ch = am.register_channel("slack", "alerts_channel", {"webhook_url": "https://..."})
        assert ch['type'] == "slack"

    def test_evaluate_rules(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"field": "mae", "operator": "gt", "threshold": 10.0})
        alerts = am.evaluate_rules({"mae": 15.0}, "model_001")
        assert len(alerts) > 0

    def test_evaluate_rules_no_match(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"field": "mae", "operator": "gt", "threshold": 10.0})
        alerts = am.evaluate_rules({"mae": 5.0}, "model_001")
        assert len(alerts) == 0

    def test_acknowledge_alert(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"field": "mae", "operator": "gt", "threshold": 10.0})
        alerts = am.evaluate_rules({"mae": 15.0}, "model_001")
        result = am.acknowledge_alert(alerts[0]['alert_id'], "alice")
        assert result['acknowledged']

    def test_resolve_alert(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"field": "mae", "operator": "gt", "threshold": 10.0})
        alerts = am.evaluate_rules({"mae": 15.0}, "model_001")
        result = am.resolve_alert(alerts[0]['alert_id'], "resolved via retrain")
        assert result['status'] == 'resolved'

    def test_suppress_unsuppress(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"metric": "mae", "op": "gt", "value": 10.0})
        am.suppress_alert("r1")
        assert not am.alert_rules["r1"]['enabled']
        am.unsuppress_alert("r1")
        assert am.alert_rules["r1"]['enabled']

    def test_get_active_alerts(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        am.create_alert_rule("r1", "high_mae", {"field": "mae", "operator": "gt", "threshold": 10.0})
        am.evaluate_rules({"mae": 15.0}, "model_001")
        active = am.get_active_alerts()
        assert len(active) > 0

    def test_get_alert_summary(self):
        from legacy_models.model_monitoring import AlertManager
        am = AlertManager()
        summary = am.get_alert_summary()
        assert 'total_alerts' in summary


class TestIncidentWorkflowManager:
    def test_init(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager(system_name="test")
        assert iw.system_name == "test"

    def test_create_incident(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        inc = iw.create_incident(
            title="MAE degradation",
            description="MAE up 15%",
            severity="high",
            model_id="demand_v1",
        )
        assert inc['title'] == "MAE degradation"

    def test_acknowledge_incident(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        inc = iw.create_incident("test", "desc")
        result = iw.acknowledge_incident(inc['incident_id'], "alice")
        assert result['status'] == 'acknowledged'

    def test_resolve_incident(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        inc = iw.create_incident("test", "desc")
        result = iw.resolve_incident(inc['incident_id'], "bob", "retrained model", auto_ticket=True)
        assert result['status'] == 'resolved'
        assert 'auto_ticket' in result

    def test_escalate_incident(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        inc = iw.create_incident("test", "desc", severity="critical")
        result = iw.escalate_incident(inc['incident_id'], "needs urgent attention")
        assert result['escalation_level'] == 1

    def test_get_active_incidents(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        iw.create_incident("incident1", "desc", severity="high")
        iw.create_incident("incident2", "desc", severity="low")
        active = iw.get_active_incidents()
        assert len(active) == 2

    def test_get_incident_summary(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        iw.create_incident("test", "desc")
        summary = iw.get_incident_summary()
        assert 'total_incidents' in summary

    def test_register_playbook(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        pb = iw.register_playbook(
            "pb1", "auto_retrain",
            steps=[{"action": "retrain", "detail": "retrain model"}],
            match_pattern="degradation",
        )
        assert pb['playbook_id'] == "pb1"

    def test_close_incident(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        inc = iw.create_incident("test", "desc")
        iw.resolve_incident(inc['incident_id'], "bob", "fixed")
        result = iw.close_incident(inc['incident_id'], "alice")
        assert result['status'] == 'closed'

    def test_get_state(self):
        from legacy_models.model_monitoring import IncidentWorkflowManager
        iw = IncidentWorkflowManager()
        state = iw.get_state()
        assert 'system_name' in state
