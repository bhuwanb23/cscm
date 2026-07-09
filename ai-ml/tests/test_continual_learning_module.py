"""
Test suite for Continual Learning Module (Module 13).

Covers all classes across all 4 sub-packages:
- continual_learning_framework (knowledge_preservation, adaptive_lr)
- federated_system (training_manager, cross_device_opt)
- advanced_techniques (dynamic_architecture, curriculum_learning)
- supply_chain_applications (inventory_adaptation, supplier_learning)
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from legacy_models.continual_learning import (
    ExperienceReplay, KnowledgeDistillation, RegularizationPreservation,
    KnowledgePreservationSystem, AdaptiveLRController, CyclicLRController,
    LocalTrainer, TrainingManager, DeviceProfiler, ResourceAwareScheduler,
    AdaptiveCompressor, CrossDeviceOptimizer, NetworkExpander, NetworkPruner,
    ModularArchitecture, DynamicArchitectureManager, DifficultyScorer,
    CurriculumScheduler, TaskSequencer, CurriculumLearningManager,
    SafetyStockOptimizer, ReplenishmentStrategy, InventoryAdaptationManager,
    SupplierPerformanceTracker, RiskAssessor, SupplierLearningManager,
    MetaLearningAdapter,
)


# =============================================================================
# Continual Learning Framework
# =============================================================================

class TestExperienceReplay:
    def test_init_default(self):
        buf = ExperienceReplay()
        assert buf.capacity == 10000
        assert buf.strategy == 'reservoir'
        assert buf.get_size() == 0

    def test_add_and_size(self):
        buf = ExperienceReplay(capacity=100)
        X = np.random.randn(10, 4)
        y = np.random.randn(10)
        n = buf.add(X, y)
        assert n == 10
        assert buf.get_size() == 10

    def test_sample(self):
        buf = ExperienceReplay(capacity=100)
        X = np.random.randn(20, 4)
        y = np.random.randn(20)
        buf.add(X, y)
        Xs, ys = buf.sample(5)
        assert Xs.shape == (5, 4)
        assert ys.shape == (5,)

    def test_sample_empty(self):
        buf = ExperienceReplay()
        Xs, ys = buf.sample(5)
        assert Xs.size == 0

    def test_reservoir_capacity(self):
        buf = ExperienceReplay(capacity=10, strategy='reservoir')
        for _ in range(50):
            buf.add(np.random.randn(1, 4), np.random.randn(1))
        assert buf.get_size() == 10

    def test_fifo_strategy(self):
        buf = ExperienceReplay(capacity=10, strategy='fifo')
        for i in range(15):
            buf.add(np.random.randn(1, 4), np.array([float(i)]))
        assert buf.get_size() == 10

    def test_clear(self):
        buf = ExperienceReplay(capacity=50)
        buf.add(np.random.randn(10, 4), np.random.randn(10))
        buf.clear()
        assert buf.get_size() == 0


class TestKnowledgeDistillation:
    def test_distill_loss_regression(self):
        kd = KnowledgeDistillation(temperature=3.0, alpha=0.7)
        student = np.random.randn(10)
        teacher = np.random.randn(10)
        labels = np.random.randn(10)
        loss = kd.distill_loss(student, teacher, labels)
        assert isinstance(loss, float)
        assert loss >= 0

    def test_softmax(self):
        kd = KnowledgeDistillation()
        x = np.array([[1.0, 2.0, 3.0]])
        s = kd._softmax(x)
        assert np.isclose(np.sum(s), 1.0)
        assert s[0, 2] > s[0, 0]


class TestRegularizationPreservation:
    def test_compute_fisher(self):
        reg = RegularizationPreservation(lambda_reg=0.5)
        X = np.random.randn(20, 5)
        y = np.random.randn(20)
        w = np.random.randn(5)
        fisher = reg.compute_fisher(X, y, w, 0.0)
        assert fisher.shape == (5,)

    def test_regularization_loss_no_prior(self):
        reg = RegularizationPreservation()
        loss = reg.compute_regularization_loss(np.random.randn(5))
        assert loss == 0.0

    def test_regularization_loss_with_prior(self):
        reg = RegularizationPreservation(lambda_reg=0.5)
        X = np.random.randn(20, 5)
        y = np.random.randn(20)
        w = np.ones(5)
        reg.compute_fisher(X, y, w, 0.0)
        loss = reg.compute_regularization_loss(np.ones(5) * 1.1)
        assert isinstance(loss, float)
        assert loss > 0


class TestKnowledgePreservationSystem:
    def test_preserve(self):
        kps = KnowledgePreservationSystem(replay_capacity=100)
        X = np.random.randn(16, 5)
        y = np.random.randn(16)
        w = np.random.randn(5)
        metrics = kps.preserve(X, y, w, 0.0)
        assert 'buffer_size' in metrics
        assert 'fisher_mean' in metrics
        assert metrics['buffer_size'] == 16

    def test_get_state(self):
        kps = KnowledgePreservationSystem()
        state = kps.get_state()
        assert 'buffer_size' in state
        assert state['buffer_size'] == 0


class TestAdaptiveLRController:
    def test_init(self):
        ctrl = AdaptiveLRController(initial_lr=0.01)
        assert ctrl.get_lr() == 0.01

    def test_step_returns_dict(self):
        ctrl = AdaptiveLRController(initial_lr=0.01)
        result = ctrl.step(0.5, 0.1)
        assert 'learning_rate' in result
        assert result['learning_rate'] == 0.01

    def test_degradation_adjustment(self):
        ctrl = AdaptiveLRController(initial_lr=0.01, patience=2, factor=0.5, window_size=3)
        for i in range(10):
            ctrl.step(10.0 + i, 0.1)
        assert ctrl.lr < 0.01

    def test_set_lr(self):
        ctrl = AdaptiveLRController(initial_lr=0.01)
        ctrl.set_lr(0.05)
        assert ctrl.get_lr() == 0.05

    def test_reset(self):
        ctrl = AdaptiveLRController(initial_lr=0.01)
        ctrl.step(0.5)
        ctrl.reset(initial_lr=0.02)
        assert ctrl.get_lr() == 0.02


class TestCyclicLRController:
    def test_step_returns_float(self):
        clr = CyclicLRController(base_lr=0.001, max_lr=0.01)
        lr = clr.step()
        assert isinstance(lr, float)
        assert 0.001 <= lr <= 0.01

    def test_cyclic_range(self):
        clr = CyclicLRController(base_lr=0.001, max_lr=0.01, step_size=10)
        for _ in range(25):
            lr = clr.step()
            assert 0.001 <= lr <= 0.01 + 1e-9

    def test_get_state(self):
        clr = CyclicLRController()
        state = clr.get_state()
        assert 'current_lr' in state


# =============================================================================
# Federated System
# =============================================================================

class TestLocalTrainer:
    def test_init(self):
        trainer = LocalTrainer(client_id='test_client')
        assert trainer.client_id == 'test_client'

    def test_train_returns_dict(self):
        trainer = LocalTrainer(client_id='c1', local_epochs=2, batch_size=16)
        X = np.random.randn(32, 5)
        y = np.random.randn(32)
        w = np.random.randn(5)
        result = trainer.train(X, y, w, 0.0)
        assert 'client_id' in result
        assert 'weights' in result
        assert result['n_samples'] == 32

    def test_get_status(self):
        trainer = LocalTrainer(client_id='c1')
        status = trainer.get_status()
        assert status['client_id'] == 'c1'


class TestTrainingManager:
    def test_init(self):
        mgr = TrainingManager(n_features=5)
        assert mgr.n_features == 5

    def test_register_client(self):
        mgr = TrainingManager(n_features=5)
        result = mgr.register_client('c1')
        assert result['status'] == 'registered'

    def test_unregister_client(self):
        mgr = TrainingManager(n_features=5)
        mgr.register_client('c1')
        result = mgr.unregister_client('c1')
        assert result['status'] == 'unregistered'

    def test_run_training_round(self):
        mgr = TrainingManager(n_features=5, min_clients=1)
        mgr.register_client('c1')
        data = {'c1': {'X': np.random.randn(20, 5), 'y': np.random.randn(20)}}
        result = mgr.run_training_round(data)
        assert result['status'] == 'completed'

    def test_run_training_round_insufficient_clients(self):
        mgr = TrainingManager(n_features=5, min_clients=2)
        result = mgr.run_training_round({})
        assert result['status'] == 'skipped'

    def test_predict(self):
        mgr = TrainingManager(n_features=5)
        preds = mgr.predict(np.random.randn(3, 5))
        assert preds.shape == (3,)

    def test_get_state(self):
        mgr = TrainingManager(n_features=5)
        state = mgr.get_state()
        assert 'registered_clients' in state


class TestDeviceProfiler:
    def test_register_device(self):
        profiler = DeviceProfiler()
        profile = profiler.register_device('device_1', compute=2.0, bandwidth=1.0)
        assert profile.compute_score == 2.0

    def test_get_profile(self):
        profiler = DeviceProfiler()
        profiler.register_device('d1', compute=1.0)
        p = profiler.get_profile('d1')
        assert p is not None
        assert profiler.get_profile('nonexistent') is None

    def test_capability_scores(self):
        profiler = DeviceProfiler()
        profiler.register_device('d1', compute=2.0, bandwidth=3.0, memory=1.0, reliability=0.9)
        scores = profiler.get_capability_scores()
        assert 'd1' in scores


class TestResourceAwareScheduler:
    def test_schedule_round(self):
        profiler = DeviceProfiler()
        profiler.register_device('d1', compute=2.0, bandwidth=1.0)
        scheduler = ResourceAwareScheduler(profiler)
        schedule = scheduler.schedule_round(['d1'], {'compute_weight': 1.0})
        assert len(schedule) == 1
        assert schedule[0][0] == 'd1'


class TestAdaptiveCompressor:
    def test_compress(self):
        comp = AdaptiveCompressor(initial_compression=0.5)
        weights = np.random.randn(100)
        compressed, meta = comp.compress(weights)
        assert compressed.shape == weights.shape
        assert 'nonzero_params' in meta

    def test_adjust_compression(self):
        comp = AdaptiveCompressor(initial_compression=0.5)
        comp.adjust_compression(0.3)
        assert comp.compression_ratio < 0.5


class TestCrossDeviceOptimizer:
    def test_optimize_round(self):
        opt = CrossDeviceOptimizer()
        opt.profiler.register_device('d1', compute=2.0, bandwidth=1.0)
        schedule = opt.optimize_round(['d1'])
        assert len(schedule) >= 1


# =============================================================================
# Advanced Techniques
# =============================================================================

class TestNetworkExpander:
    def test_initial_units(self):
        ne = NetworkExpander(initial_units=10)
        assert ne.n_units == 10

    def test_should_expand_true(self):
        ne = NetworkExpander(expansion_threshold=0.1)
        assert ne.should_expand(2.0, 1.0)

    def test_should_expand_false(self):
        ne = NetworkExpander(expansion_threshold=0.5, max_units=5)
        assert not ne.should_expand(1.0, 1.0)

    def test_expand(self):
        ne = NetworkExpander(initial_units=10)
        result = ne.expand(n_features=5)
        assert result['units_added'] > 0
        assert ne.n_units > 10

    def test_expand_at_max(self):
        ne = NetworkExpander(initial_units=5, max_units=5)
        assert not ne.should_expand(2.0, 1.0)


class TestNetworkPruner:
    def test_prune_nothing(self):
        pruner = NetworkPruner(pruning_threshold=0.001, min_units=5)
        w = np.random.randn(8, 5)
        b = np.zeros(8)
        imp = np.ones(8) * 0.1
        pw, pb, mask = pruner.prune(w, b, imp)
        assert len(pw) == 8

    def test_prune_some(self):
        pruner = NetworkPruner(pruning_threshold=0.5, min_units=2)
        w = np.random.randn(10, 5)
        b = np.zeros(10)
        imp = np.array([0.9, 0.8, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
        pw, pb, mask = pruner.prune(w, b, imp)
        assert len(pw) <= len(w)

    def test_prune_too_small(self):
        pruner = NetworkPruner(pruning_threshold=0.5, min_units=8)
        w = np.random.randn(5, 3)
        b = np.zeros(5)
        imp = np.array([0.1, 0.1, 0.1, 0.1, 0.1])
        pw, pb, mask = pruner.prune(w, b, imp)
        assert len(pw) == 5


class TestModularArchitecture:
    def test_create_task_module(self):
        ma = ModularArchitecture(n_shared_units=10, n_task_units=5)
        result = ma.create_task_module('task_1', n_features=4)
        assert result['status'] == 'created'

    def test_create_duplicate(self):
        ma = ModularArchitecture()
        ma.create_task_module('t1', 4)
        result = ma.create_task_module('t1', 4)
        assert result['status'] == 'exists'

    def test_forward(self):
        ma = ModularArchitecture(n_shared_units=2, n_task_units=2)
        ma.create_task_module('t1', n_features=4)
        out = ma.forward(np.random.randn(2, 4), 't1')
        assert out.shape == (2,)


class TestDynamicArchitectureManager:
    def test_adapt_architecture(self):
        mgr = DynamicArchitectureManager(initial_units=8, expansion_threshold=0.5)
        w = np.random.randn(8, 5)
        b = np.zeros(8)
        result = mgr.adapt_architecture('task_1', 5, 0.3, 0.2, w, b)
        assert result['task_id'] == 'task_1'


class TestDifficultyScorer:
    def test_score_samples_distance(self):
        ds = DifficultyScorer(method='distance_from_mean')
        X = np.random.randn(20, 5)
        y = np.random.randn(20)
        scores = ds.score_samples(X, y)
        assert scores.shape == (20,)

    def test_score_samples_prediction_error(self):
        ds = DifficultyScorer(method='prediction_error')
        X = np.random.randn(10, 3)
        y = np.random.randn(10)
        preds = np.random.randn(10)
        scores = ds.score_samples(X, y, preds)
        assert scores.shape == (10,)

    def test_difficulty_distribution(self):
        ds = DifficultyScorer()
        ds.score_samples(np.random.randn(10, 3), np.random.randn(10))
        dist = ds.get_difficulty_distribution()
        assert 'mean' in dist


class TestCurriculumScheduler:
    def test_schedule_batch(self):
        sched = CurriculumScheduler(initial_pacing=0.3)
        X = np.random.randn(100, 5)
        y = np.random.randn(100)
        diff = np.random.rand(100)
        Xb, yb = sched.schedule_batch(X, y, diff, batch_size=32)
        assert Xb.shape[0] <= 32

    def test_pacing_increases(self):
        sched = CurriculumScheduler(initial_pacing=0.3, steps_to_max=50)
        p0 = sched.get_pacing()
        sched.current_step = 25
        p1 = sched.get_pacing()
        assert p1 >= p0


class TestTaskSequencer:
    def test_interleaved(self):
        seq = TaskSequencer(strategy='interleaved')
        tasks = ['a', 'b', 'c']
        next_t = seq.get_next_task(tasks)
        assert next_t in tasks

    def test_worst_first(self):
        seq = TaskSequencer(strategy='worst_first')
        seq.add_task_result('a', 0.9)
        seq.add_task_result('b', 0.5)
        seq.add_task_result('c', 0.7)
        next_t = seq.get_next_task(['a', 'b', 'c'])
        assert next_t == 'b'


class TestCurriculumLearningManager:
    def test_prepare_batch(self):
        mgr = CurriculumLearningManager()
        X = np.random.randn(50, 5)
        y = np.random.randn(50)
        Xb, yb = mgr.prepare_batch(X, y, batch_size=16)
        assert Xb.shape[0] <= 16

    def test_sequence_tasks(self):
        mgr = CurriculumLearningManager()
        t = mgr.sequence_tasks(['a', 'b'])
        assert t in ['a', 'b']


# =============================================================================
# Supply Chain Applications
# =============================================================================

class TestSafetyStockOptimizer:
    def test_init(self):
        sso = SafetyStockOptimizer(sku='SKU-001', target_service_level=0.95)
        assert sso.sku == 'SKU-001'

    def test_update_insufficient_data(self):
        sso = SafetyStockOptimizer(sku='SKU-001')
        result = sso.update(100, 7)
        assert result['status'] == 'insufficient_data'

    def test_update_with_data(self):
        sso = SafetyStockOptimizer(sku='SKU-001', window_size=30)
        for _ in range(30):
            sso.update(100 + np.random.randn() * 10, 7 + np.random.randn())
        result = sso.update(105, 7)
        assert 'safety_stock' in result
        assert result['sku'] == 'SKU-001'


class TestReplenishmentStrategy:
    def test_evaluate_action(self):
        rs = ReplenishmentStrategy(sku='SKU-001')
        result = rs.evaluate_action(demand=80, current_stock=600)
        assert 'inventory_after' in result

    def test_stockout(self):
        rs = ReplenishmentStrategy(sku='SKU-001', reorder_point=10, order_quantity=100)
        result = rs.evaluate_action(demand=2000, current_stock=100)
        assert result['stockout'] is True

    def test_adapt_strategy(self):
        rs = ReplenishmentStrategy(sku='SKU-001', reorder_point=100, order_quantity=500)
        rp_before = rs.reorder_point
        rs.adapt_strategy(demand_volatility=0.5, avg_demand=120)
        assert rs.reorder_point != rp_before


class TestInventoryAdaptationManager:
    def test_update(self):
        mgr = InventoryAdaptationManager(sku='SKU-001')
        for _ in range(20):
            mgr.update(100 + np.random.randn() * 10, 7, 500)
        result = mgr.update(105, 7, 450)
        assert 'safety_stock_update' in result
        assert 'replenishment_update' in result

    def test_get_state(self):
        mgr = InventoryAdaptationManager(sku='SKU-001')
        state = mgr.get_state()
        assert 'safety_stock' in state


class TestSupplierPerformanceTracker:
    def test_init(self):
        spt = SupplierPerformanceTracker(supplier_id='SUP-001')
        assert spt.supplier_id == 'SUP-001'

    def test_update(self):
        spt = SupplierPerformanceTracker(supplier_id='SUP-001')
        metrics = {'on_time_delivery': 0.95, 'quality_score': 0.98, 'cost_index': 1.0, 'responsiveness': 0.85}
        for _ in range(10):
            spt.update(metrics)
        result = spt.update(metrics)
        assert 'overall_score' in result


class TestRiskAssessor:
    def test_assess(self):
        ra = RiskAssessor(supplier_id='SUP-001')
        result = ra.assess({'on_time_delivery': 0.9, 'quality_score': 0.95})
        assert 'overall_risk' in result
        assert 'risk_level' in result

    def test_assess_with_external(self):
        ra = RiskAssessor(supplier_id='SUP-001')
        result = ra.assess({'on_time_delivery': 0.9}, {'financial_stability': 0.8})
        assert result['risk_factors']['financial_stability'] >= 0.5


class TestSupplierLearningManager:
    def test_update(self):
        mgr = SupplierLearningManager(supplier_id='SUP-001')
        metrics = {'on_time_delivery': 0.95, 'quality_score': 0.98, 'cost_index': 1.0, 'responsiveness': 0.85}
        result = mgr.update(metrics)
        assert 'performance' in result
        assert 'risk_assessment' in result

    def test_get_collaboration_insights(self):
        mgr = SupplierLearningManager(supplier_id='SUP-001')
        insights = mgr.get_collaboration_insights()
        assert 'collaboration_score' in insights


class TestMetaLearningAdapter:
    def test_init_with_adaptation_steps(self):
        mla = MetaLearningAdapter(n_features=5, adaptation_steps=10)
        assert mla.inner_steps == 10

    def test_init_without_adaptation_steps(self):
        mla = MetaLearningAdapter(n_features=5, inner_steps=5)
        assert mla.inner_steps == 5

    def test_api_router_compatible(self):
        mla = MetaLearningAdapter(adaptation_steps=5)
        assert mla.inner_steps == 5

    def test_adapt_method(self):
        mla = MetaLearningAdapter(n_features=5)
        support_set = np.random.randn(10, 5).tolist()
        query_set = np.random.randn(10).tolist()
        result = mla.adapt(support_set, query_set)
        assert 'adapted_parameters' in result
        assert 'adaptation_loss' in result
        assert 'generalization_score' in result

    def test_adapt_with_dicts(self):
        mla = MetaLearningAdapter(n_features=5)
        support_set = [
            {'X': np.random.randn(10, 5).tolist(), 'y': np.random.randn(10).tolist()},
            {'X': np.random.randn(10, 5).tolist(), 'y': np.random.randn(10).tolist()},
        ]
        query_set = [{'y': np.random.randn(10).tolist()}]
        result = mla.adapt(support_set, query_set)
        assert 'adapted_parameters' in result

    def test_meta_train_step(self):
        mla = MetaLearningAdapter(n_features=5, meta_batch_size=2)
        tasks = []
        for _ in range(2):
            X_s = np.random.randn(10, 5)
            y_s = np.sum(X_s[:, :3], axis=1)
            X_q = np.random.randn(5, 5)
            y_q = np.sum(X_q[:, :3], axis=1)
            tasks.append({'support': (X_s, y_s), 'query': (X_q, y_q)})
        result = mla.meta_train_step(tasks)
        assert 'meta_loss' in result

    def test_predict(self):
        mla = MetaLearningAdapter(n_features=5)
        X = np.random.randn(3, 5)
        preds = mla.predict(X)
        assert preds.shape == (3,)
