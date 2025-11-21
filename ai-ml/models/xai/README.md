# Explainability & XAI Models

## Structure
- `feature_attribution/`: SHAP-style, LIME-style, feature importance utils
- `model_specific/`: attention summaries, rule extraction, surrogate trees
- `counterfactuals/`: counterfactual engine, what-if simulator, rationale generator
- `integration/`: decision bridge, confidence estimator, influence tracker

## Data
Sample dataset: `data/test/xai_sample.csv`

## Feature Attribution
- `TabularSHAPExplainer`: uses `shap.KernelExplainer` when available with permutation fallback.
- `TabularLIMEExplainer`: integrates with the LIME package or uses an internal surrogate.
- `FeatureImportanceVisualizer`: normalized importance with DataFrame/plot helpers.

## Model-Specific XAI
- `AttentionVisualizer`: aggregates attention heads and token level weights.
- `RuleExtractor`: tree-based rule mining with both text and structured outputs.
- `SurrogateTreeApproximator`: fits trees directly or via base-model predictions.

## Counterfactuals
- `CounterfactualEngine`: iterative search with noise and feature weighting.
- `WhatIfSimulator`: single or batch scenario evaluation.
- `RationaleGenerator`: human-readable top feature rationale.

## Integration
- `DecisionExplanationBridge`: logs decisions with rationale + confidence.
- `ConfidenceEstimator`: summary statistics for probability vectors.
- `InfluenceTracker`: tracks top features over time for auditing.

## Tests
`tests/xai/phase1-4/` covering all components.

Run:
```bash
.\venv\Scripts\activate
pytest tests/xai/ -v
```
