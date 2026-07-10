"""
Unit tests for uncertainty quantification components.
"""
import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'legacy_models'))


class TestEnsembleMethods:
    """Tests for uncertainty_quantification.probabilistic_framework.ensemble_methods."""

    def test_init(self):
        from uncertainty_quantification.probabilistic_framework.ensemble_methods import EnsembleUncertainty
        e = EnsembleUncertainty()
        assert e is not None


class TestQuantileRegression:
    """Tests for uncertainty_quantification.probabilistic_framework.quantile_regression."""

    def test_init(self):
        pytest.importorskip("torch")
        from uncertainty_quantification.probabilistic_framework.quantile_regression import QuantileRegressionWrapper
        import torch.nn as nn
        base_model = nn.Linear(10, 1)
        q = QuantileRegressionWrapper(base_model, hidden_dim=10)
        assert q is not None


class TestCalibration:
    """Tests for uncertainty_quantification.calibration_verification.calibration."""

    def test_init(self):
        from uncertainty_quantification.calibration_verification.calibration import ProbabilityCalibration
        c = ProbabilityCalibration()
        assert c is not None


class TestDemandUncertainty:
    """Tests for uncertainty_quantification.risk_assessment.demand_uncertainty."""

    def test_init(self):
        from uncertainty_quantification.risk_assessment.demand_uncertainty import DemandForecastUncertainty
        d = DemandForecastUncertainty(product_id="SKU001")
        assert d.product_id == "SKU001"
