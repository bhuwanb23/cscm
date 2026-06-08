# Supplier Risk & Reliability Scoring

Comprehensive toolkit for evaluating and mitigating supplier risk using survival analysis, gradient-boosted models, probabilistic reasoning, and deployment metrics.

## Phase 1: Survival Analysis ✅
- `survival_analysis/cox_model.py`: Cox proportional hazards (lifelines fallback -> logistic)
- `survival_analysis/kaplan_meier.py`: Vanilla Kaplan-Meier estimator
- `survival_analysis/time_to_event.py`: Dataset preparation utilities

## Phase 2: Gradient-Boosted Models ✅
- `gradient_boosted/risk_predictor.py`: Auto-selects XGBoost/LightGBM/SKLearn models with categorical encoding
- `LeadTimeFeatureEngineer` and `FinancialFeatureIntegrator` create variability and financial features

## Phase 3: Probabilistic Models ✅
- `probabilistic/bayesian_network.py`: Naive Bayesian network for causal reasoning
- `probabilistic/graph_embeddings.py`: Node2Vec-style embeddings with NetworkX fallback
- `probabilistic/correlated_risk.py`: Correlated scenario analysis

## Phase 4: Metrics & Evaluation ✅
- `metrics_evaluation/risk_metrics.py`: AUC/precision/recall for delay events
- `metrics_evaluation/probability_calibration.py`: Isotonic/logistic calibration
- `metrics_evaluation/backup_recommendation.py`: Backup supplier recommender

## Data & Tests
- Sample data: `data/test/supplier_risk_data.csv`, `supplier_network_edges.csv`
- Tests: `tests/supplier_risk/phase{1-4}` with 12 pytest cases

Run tests with:
```bash
.\venv\Scripts\activate
pytest tests/supplier_risk/ -v
```
