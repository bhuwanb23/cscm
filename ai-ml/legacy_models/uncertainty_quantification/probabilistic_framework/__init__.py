"""
Probabilistic Framework submodule

Bayesian neural networks, ensemble uncertainty, Monte Carlo dropout,
and quantile regression methods for probabilistic modeling.

Torch-backed methods import best-effort so sklearn-based ones stay
usable on torch-free machines.
"""

__all__ = []

from .bayesian_nets import BayesianNeuralNetwork
from .ensemble_methods import EnsembleUncertainty
__all__ += ['BayesianNeuralNetwork', 'EnsembleUncertainty']

try:
    from .mc_dropout_pytorch import MCDropoutWrapper
    from .quantile_regression import QuantileRegressionWrapper, pinball_loss, QuantileRegressionHead
    __all__ += ['MCDropoutWrapper', 'QuantileRegressionWrapper', 'pinball_loss', 'QuantileRegressionHead']
except Exception as _exc:  # torch missing or broken
    import logging
    logging.getLogger(__name__).warning('torch-backed uncertainty methods unavailable: %s', _exc)
