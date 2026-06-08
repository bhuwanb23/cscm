"""
Test suite for Uncertainty Quantification Module (Module 14).

Covers all classes across all 4 sub-packages:
- probabilistic_framework (BayesianNN, Ensemble, MCDropout, QuantileRegression)
- risk_assessment (DemandForecastUncertainty, InventoryRisk, Supplier, Financial)
- calibration_verification (ProbabilityCalibration, CalibrationValidator, Robustness)
- propagation_techniques (UncertaintyPropagation, MonteCarlo, ConfidenceIntervals)
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from legacy_models.uncertainty_quantification import (
    BayesianNeuralNetwork,
    EnsembleUncertainty,
    MCDropoutWrapper,
    QuantileRegressionWrapper,
    pinball_loss,
    QuantileRegressionHead,
    DemandForecastUncertainty,
    InventoryRiskEstimator,
    SafetyStockComputer,
    SupplierUncertaintyModel,
    FinancialRiskPropagator,
    ProbabilityCalibration,
    CalibrationValidator,
    ReliabilityDiagram,
    RobustnessTester,
    UncertaintyPropagationEngine,
    MonteCarloPropagator,
    ConfidenceIntervalEstimator,
)


# =============================================================================
# Probabilistic Framework
# =============================================================================

class TestBayesianNeuralNetwork:
    def test_init_requires_tf(self):
        try:
            import tensorflow
            bnn = BayesianNeuralNetwork(input_dim=5)
            assert bnn.input_dim == 5
        except ImportError:
            pytest.skip("tensorflow not available")


class TestEnsembleUncertainty:
    def test_init(self):
        ensemble = EnsembleUncertainty(n_estimators=5)
        assert ensemble.n_estimators == 5

    def test_fit_predict(self):
        ensemble = EnsembleUncertainty(n_estimators=3)
        X = np.random.randn(20, 4)
        y = np.random.randn(20)
        ensemble.fit(X, y)
        result = ensemble.predict(X)
        assert 'mean' in result
        assert 'std' in result


class TestMCDropoutWrapper:
    def test_init_with_model(self):
        try:
            import torch
            import torch.nn as nn
            model = nn.Linear(5, 1)
            wrapper = MCDropoutWrapper(model=model, num_samples=20)
            assert wrapper.num_samples == 20
        except ImportError:
            pytest.skip("torch not available")


class TestQuantileRegressionWrapper:
    def test_init_requires_torch(self):
        try:
            import torch.nn as nn
            base = nn.Linear(10, 1)
            qr = QuantileRegressionWrapper(base_model=base, hidden_dim=64, quantiles=[0.1, 0.5, 0.9])
            assert len(qr.quantiles) == 3
        except ImportError:
            pytest.skip("torch not available")


class TestPinballLoss:
    def test_pinball_loss(self):
        try:
            import torch
            pred = torch.randn(10)
            target = torch.randn(10)
            loss = pinball_loss(pred, target, quantile=0.5)
            assert loss.item() >= 0
        except ImportError:
            pytest.skip("torch not available")


class TestQuantileRegressionHead:
    def test_init(self):
        try:
            import torch
            import torch.nn as nn
            head = QuantileRegressionHead(hidden_dim=64, quantiles=[0.1, 0.5, 0.9])
            assert head.num_quantiles == 3
        except ImportError:
            pytest.skip("torch not available")


# =============================================================================
# Risk Assessment
# =============================================================================

class TestSafetyStockComputer:
    def test_compute(self):
        ssc = SafetyStockComputer(lead_time_mean=7, target_service_level=0.95)
        result = ssc.compute(demand_mean=100, demand_std=20)
        assert 'safety_stock' in result
        assert 'reorder_point' in result
        assert result['safety_stock'] > 0

    def test_stockout_probability(self):
        ssc = SafetyStockComputer()
        prob = ssc.stockout_probability(current_stock=500, demand_mean=100, demand_std=20, lead_time=7)
        assert 0 <= prob <= 1

    def test_update_service_level(self):
        ssc = SafetyStockComputer(target_service_level=0.95)
        ssc.update_service_level(0.99)
        assert ssc.target_service_level == 0.99


class TestInventoryRiskEstimator:
    def test_init(self):
        estimator = InventoryRiskEstimator(sku="SKU-001")
        assert estimator.sku == "SKU-001"

    def test_estimate_risk(self):
        estimator = InventoryRiskEstimator(sku="SKU-001")
        result = estimator.estimate_risk(
            current_stock=500, demand_mean=100,
            demand_std=20, lead_time=7,
        )
        assert 'risk_score' in result
        assert 'risk_level' in result
        assert 0 <= result['risk_score'] <= 1

    def test_risk_trend_insufficient(self):
        estimator = InventoryRiskEstimator(sku="SKU-001")
        trend = estimator.get_risk_trend()
        assert trend['trend'] == 'insufficient_data'

    def test_risk_trend(self):
        estimator = InventoryRiskEstimator(sku="SKU-001")
        for _ in range(15):
            estimator.estimate_risk(current_stock=500, demand_mean=100, demand_std=20, lead_time=7)
        trend = estimator.get_risk_trend()
        assert 'trend' in trend


class TestSupplierUncertaintyModel:
    def test_init(self):
        model = SupplierUncertaintyModel(supplier_id="SUP-001")
        assert model.supplier_id == "SUP-001"

    def test_update(self):
        model = SupplierUncertaintyModel(supplier_id="SUP-001")
        result = model.update(lead_time=7.0, quality_score=0.95, on_time=True)
        assert 'lead_time_mean' in result

    def test_predict_lead_time(self):
        model = SupplierUncertaintyModel(supplier_id="SUP-001")
        for _ in range(10):
            model.update(lead_time=np.random.normal(7, 1), quality_score=0.95, on_time=True)
        pred = model.predict_lead_time(confidence=0.95)
        assert 'lower_bound' in pred
        assert 'upper_bound' in pred

    def test_reliability_distribution(self):
        model = SupplierUncertaintyModel(supplier_id="SUP-001")
        for _ in range(5):
            model.update(lead_time=7, quality_score=0.95, on_time=True)
        rel = model.reliability_distribution()
        assert 'mean_reliability' in rel


class TestFinancialRiskPropagator:
    def test_simulate_cost(self):
        propagator = FinancialRiskPropagator(n_simulations=1000)
        result = propagator.simulate_cost(
            base_cost=50, cost_std=5,
            volume=1000, volume_std=100,
            fixed_cost=10000,
        )
        assert 'total_cost_mean' in result

    def test_simulate_margin(self):
        propagator = FinancialRiskPropagator(n_simulations=1000)
        result = propagator.simulate_margin(
            revenue=80, revenue_std=8,
            cost=50, cost_std=5,
            correlation=0.3,
        )
        assert 'margin_mean' in result
        assert 'loss_probability' in result
        assert 0 <= result['loss_probability'] <= 1


class TestDemandForecastUncertainty:
    def test_init(self):
        dfu = DemandForecastUncertainty(product_id="SKU-001")
        assert dfu.product_id == "SKU-001"

    def test_fit(self):
        dfu = DemandForecastUncertainty(product_id="SKU-001")
        history = [100 + np.random.randn() * 10 for _ in range(30)]
        result = dfu.fit(history)
        assert 'status' in result

    def test_forecast(self):
        dfu = DemandForecastUncertainty(product_id="SKU-001")
        history = [100 + np.random.randn() * 10 for _ in range(30)]
        dfu.fit(history)
        forecast = dfu.forecast(horizon=10)
        assert 'point_forecast' in forecast
        assert len(forecast['point_forecast']) == 10


# =============================================================================
# Calibration & Verification
# =============================================================================

class TestProbabilityCalibration:
    def test_init(self):
        cal = ProbabilityCalibration(method='platt')
        assert cal.method == 'platt'

    def test_fit_platt(self):
        cal = ProbabilityCalibration(method='platt')
        logits = np.random.randn(100)
        targets = (logits > 0).astype(float)
        cal.fit(logits, targets)
        assert cal.is_fitted

    def test_calibrate(self):
        cal = ProbabilityCalibration(method='platt')
        logits = np.random.randn(100)
        targets = (logits > 0).astype(float)
        cal.fit(logits, targets)
        probs = cal.calibrate(logits)
        assert np.all((probs >= 0) & (probs <= 1))


class TestReliabilityDiagram:
    def test_compute(self):
        rd = ReliabilityDiagram(n_bins=10)
        probs = np.random.uniform(0, 1, 200)
        outcomes = (np.random.random(200) < probs).astype(float)
        result = rd.compute(probs, outcomes)
        assert 'bin_counts' in result
        assert len(result['bin_counts']) == 10


class TestCalibrationValidator:
    def test_compute_ece(self):
        validator = CalibrationValidator(n_bins=10)
        probs = np.random.uniform(0, 1, 200)
        outcomes = (np.random.random(200) < probs).astype(float)
        ece = validator.compute_ece(probs, outcomes)
        assert 0 <= ece <= 1

    def test_brier_score(self):
        validator = CalibrationValidator()
        probs = np.array([0.9, 0.8, 0.2, 0.6])
        outcomes = np.array([1, 1, 0, 1])
        score = validator.brier_score(probs, outcomes)
        assert 0 <= score <= 1

    def test_log_loss(self):
        validator = CalibrationValidator()
        probs = np.array([0.9, 0.8, 0.2, 0.6])
        outcomes = np.array([1, 1, 0, 1])
        loss = validator.log_loss(probs, outcomes)
        assert loss >= 0

    def test_validate(self):
        validator = CalibrationValidator()
        probs = np.random.uniform(0, 1, 200)
        outcomes = (np.random.random(200) < probs).astype(float)
        result = validator.validate(probs, outcomes)
        assert 'ece' in result
        assert 'mce' in result
        assert 'brier_score' in result


class TestRobustnessTester:
    def test_add_noise(self):
        tester = RobustnessTester()
        X = np.random.randn(20, 5)
        X_noisy = tester.add_noise(X)
        assert X_noisy.shape == X.shape

    def test_shift_distribution(self):
        tester = RobustnessTester()
        X = np.random.randn(20, 5)
        X_shifted = tester.shift_distribution(X)
        assert X_shifted.shape == X.shape

    def test_perturbation_robustness(self):
        tester = RobustnessTester()

        def model_fn(X):
            return np.dot(X, np.array([1.0, 2.0, 3.0, 0.5, -1.0]))

        X = np.random.randn(20, 5)
        result = tester.test_perturbation_robustness(model_fn, X)
        assert 'overall_stability' in result
        assert 'results' in result

    def test_extreme_scenarios(self):
        tester = RobustnessTester(n_stress_scenarios=3)

        def model_fn(X):
            return np.sum(X, axis=1)

        X = np.random.randn(20, 5)
        result = tester.test_extreme_scenarios(model_fn, X)
        assert 'robustness_score' in result


# =============================================================================
# Propagation Techniques
# =============================================================================

class TestUncertaintyPropagationEngine:
    def test_init(self):
        engine = UncertaintyPropagationEngine(method='monte_carlo', n_samples=100)
        assert engine.method == 'monte_carlo'

    def test_monte_carlo_propagate(self):
        engine = UncertaintyPropagationEngine(n_samples=500)

        def model_fn(x, y):
            return x + y

        dists = {
            'x': {'type': 'normal', 'params': {'mean': 100, 'std': 10}},
            'y': {'type': 'normal', 'params': {'mean': 50, 'std': 5}},
        }
        result = engine.monte_carlo_propagate(model_fn, dists)
        assert 'mean' in result
        assert 'std' in result

    def test_fosm_propagate(self):
        engine = UncertaintyPropagationEngine()

        sensitivities = {'x': 1.0, 'y': 2.0}
        input_stds = {'x': 10.0, 'y': 5.0}
        result = engine.fosm_propagate(sensitivities, input_stds)
        assert 'output_std' in result
        assert 'contributions' in result


class TestMonteCarloPropagator:
    def test_propagate(self):
        propagator = MonteCarloPropagator(n_samples=500)

        def cost_model(params):
            return params['material_cost'] * params['quantity'] + params['fixed_overhead']

        dists = {
            'material_cost': {'type': 'normal', 'params': {'mean': 50, 'std': 5}},
            'quantity': {'type': 'normal', 'params': {'mean': 1000, 'std': 100}},
            'fixed_overhead': {'type': 'uniform', 'params': {'low': 5000, 'high': 8000}},
        }
        result = propagator.propagate(cost_model, dists)
        assert 'output_mean' in result
        assert 'output_std' in result
        assert 'sensitivity' in result

    def test_latin_hypercube(self):
        propagator = MonteCarloPropagator(n_samples=200, sampling_method='latin')

        def model_fn(params):
            return params['x']

        dists = {'x': {'type': 'normal', 'params': {'mean': 0, 'std': 1}}}
        result = propagator.propagate(model_fn, dists)
        assert 'output_mean' in result


class TestConfidenceIntervalEstimator:
    def test_bootstrap_ci(self):
        estimator = ConfidenceIntervalEstimator(n_bootstrap=200)
        data = np.random.normal(100, 15, 50)
        result = estimator.bootstrap_ci(data)
        assert 'original_statistic' in result
        assert 'lower_bound' in result
        assert 'upper_bound' in result
        assert result['lower_bound'] < result['upper_bound']

    def test_normal_ci(self):
        estimator = ConfidenceIntervalEstimator()
        result = estimator.normal_ci(mean=100, std=15, n=50)
        assert 'lower_bound' in result
        assert 'upper_bound' in result

    def test_bootstrap_difference(self):
        estimator = ConfidenceIntervalEstimator(n_bootstrap=200)
        data_a = np.random.normal(100, 15, 30)
        data_b = np.random.normal(95, 15, 30)
        result = estimator.bootstrap_difference(data_a, data_b)
        assert 'observed_difference' in result
        assert 'significant' in result
