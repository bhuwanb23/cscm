"""
Uncertainty Quantification Module

This module provides uncertainty quantification capabilities for the
Cognitive Supply Chain Mesh (CSCM) AI/ML system, including Bayesian methods,
ensemble uncertainty, quantile regression, calibration, risk assessment,
and uncertainty propagation.

Torch-backed names import best-effort so the sklearn-based calibration,
risk and propagation tools stay usable on torch-free machines.
"""

import logging

logger = logging.getLogger(__name__)

from .probabilistic_framework import BayesianNeuralNetwork, EnsembleUncertainty

from .risk_assessment import (
    DemandForecastUncertainty,
    InventoryRiskEstimator,
    SafetyStockComputer,
    SupplierUncertaintyModel,
    FinancialRiskPropagator,
)
from .calibration_verification import (
    ProbabilityCalibration,
    CalibrationValidator,
    ReliabilityDiagram,
    RobustnessTester,
)
from .propagation_techniques import (
    UncertaintyPropagationEngine,
    MonteCarloPropagator,
    ConfidenceIntervalEstimator,
)

__all__ = [
    'BayesianNeuralNetwork',
    'EnsembleUncertainty',
    'DemandForecastUncertainty',
    'InventoryRiskEstimator',
    'SafetyStockComputer',
    'SupplierUncertaintyModel',
    'FinancialRiskPropagator',
    'ProbabilityCalibration',
    'CalibrationValidator',
    'ReliabilityDiagram',
    'RobustnessTester',
    'UncertaintyPropagationEngine',
    'MonteCarloPropagator',
    'ConfidenceIntervalEstimator',
]

try:
    from .probabilistic_framework import (
        MCDropoutWrapper,
        QuantileRegressionWrapper,
        pinball_loss,
        QuantileRegressionHead,
    )
    __all__ += ['MCDropoutWrapper', 'QuantileRegressionWrapper', 'pinball_loss', 'QuantileRegressionHead']
except Exception as _exc:  # torch missing or broken
    logger.warning('torch-backed uncertainty methods unavailable: %s', _exc)
