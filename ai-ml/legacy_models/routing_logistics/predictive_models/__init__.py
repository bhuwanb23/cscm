"""
Predictive Models for Routing & Logistics

This module implements predictive models for routing:
- Gradient-boosted models for travel-time prediction
- LSTM-based ETA models
- Small transformers for routing predictions

Torch-backed modules (LSTM/transformer) import best-effort so the
gradient-boosted models stay usable on torch-free machines.
"""

from .travel_time_prediction import TravelTimePredictor

__all__ = ['TravelTimePredictor']

try:
    from .lstm_eta import LSTMETAModel
    __all__.append('LSTMETAModel')
except Exception as _exc:  # torch missing or broken
    import logging
    logging.getLogger(__name__).warning('lstm_eta unavailable: %s', _exc)

try:
    from .transformer_routing import TransformerRoutingPredictor
    __all__.append('TransformerRoutingPredictor')
except Exception as _exc:
    import logging
    logging.getLogger(__name__).warning('transformer_routing unavailable: %s', _exc)
