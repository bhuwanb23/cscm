"""
Initialization file for models package.

Subpackage imports here are best-effort: some model families depend on
optional heavy frameworks (PyTorch, torch-geometric) that are deliberately
commented out of requirements.txt. Failing to import one of them must not
poison `import legacy_models.<anything-else>` — tests and routers that do
not need those models stay usable on torch-free machines (CI, slim deps).

A missing optional dependency surfaces only when the specific model is
actually used, with the original import error in `_OPTIONAL_IMPORT_ERRORS`.
"""

import importlib
import logging

logger = logging.getLogger(__name__)

_OPTIONAL_IMPORT_ERRORS = {}

from .data_models import (
    SalesDataModel,
    PriceDataModel,
    StoreAttributeModel,
    ProductAttributeModel,
    InventoryDataModel,
)

__all__ = [
    'SalesDataModel',
    'PriceDataModel',
    'StoreAttributeModel',
    'ProductAttributeModel',
    'InventoryDataModel',
]

# Optional, heavy model families. Each import is isolated so a missing
# optional dependency (e.g. torch) disables only that family.
_OPTIONAL_SUBMODULES = {
    'demand_forecasting': ['DemandForecaster'],
    'uncertainty_quantification': [
        'BayesianNeuralNetwork',
        'EnsembleUncertainty',
        'MCDropoutWrapper',
        'QuantileRegressionWrapper',
        'pinball_loss',
        'QuantileRegressionHead',
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
    ],
    'model_monitoring': [
        'PerformanceTracker',
        'PredictionDriftDetector',
        'ADWINDetector',
        'FeatureDriftDetector',
        'ModelRegistry',
        'ExperimentTracker',
        'RetrainingPipelineManager',
        'CanaryRolloutManager',
        'ShadowDeploymentManager',
        'ModelGovernanceFramework',
        'AutoRollbackManager',
        'AlertManager',
        'IncidentWorkflowManager',
    ],
    'continual_learning': [
        'OnlineLearningAdapter',
        'SimpleOnlineAdapter',
        'IncrementalModelUpdater',
        'PyTorchEWC',
        'FederatedAveragingCoordinator',
        'DifferentialPrivacy',
        'SecureAggregator',
        'CrossStoreFLOrchestrator',
        'MetaLearningAdapter',
    ],
}

for _sub, _names in _OPTIONAL_SUBMODULES.items():
    try:
        _module = importlib.import_module(f'.{_sub}', __name__)
    except Exception as _exc:  # ImportError and optional-dep DLL failures
        _OPTIONAL_IMPORT_ERRORS[_sub] = _exc
        logger.warning('legacy_models.%s unavailable: %s', _sub, _exc)
        continue
    for _name in _names:
        if hasattr(_module, _name):
            globals()[_name] = getattr(_module, _name)
            __all__.append(_name)


def __getattr__(name):
    """Raise a clear error when a known-optional model was not importable."""
    for _sub, _exc in _OPTIONAL_IMPORT_ERRORS.items():
        if name in _OPTIONAL_SUBMODULES[_sub]:
            raise ImportError(
                f"'{name}' is unavailable because optional dependency for "
                f"legacy_models.{_sub} failed to import: {_exc}"
            ) from _exc
    raise AttributeError(f'module {__name__!r} has no attribute {name!r}')
