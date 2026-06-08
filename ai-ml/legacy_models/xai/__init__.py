"""Explainability & XAI Models."""

from .feature_attribution.shap_explainer import TabularSHAPExplainer
from .feature_attribution.lime_explainer import TabularLIMEExplainer
from .feature_attribution.feature_viz import FeatureImportanceVisualizer

from .model_specific.attention_viz import AttentionVisualizer
from .model_specific.rule_extraction import RuleExtractor
from .model_specific.surrogate_tree import SurrogateTreeApproximator

from .counterfactuals.counterfactual_engine import CounterfactualEngine
from .counterfactuals.what_if import WhatIfSimulator
from .counterfactuals.rationale_generator import RationaleGenerator

from .integration.decision_bridge import DecisionExplanationBridge
from .integration.confidence_metrics import ConfidenceEstimator
from .integration.influence_tracker import InfluenceTracker

__all__ = [
    'TabularSHAPExplainer',
    'TabularLIMEExplainer',
    'FeatureImportanceVisualizer',
    'AttentionVisualizer',
    'RuleExtractor',
    'SurrogateTreeApproximator',
    'CounterfactualEngine',
    'WhatIfSimulator',
    'RationaleGenerator',
    'DecisionExplanationBridge',
    'ConfidenceEstimator',
    'InfluenceTracker'
]
