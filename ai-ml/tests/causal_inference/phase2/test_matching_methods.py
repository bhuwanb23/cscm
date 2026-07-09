"""
Test suite for matching methods in causal inference
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.causal_inference.matching.propensity_matching import PropensityScoreMatcher
from legacy_models.causal_inference.matching.causal_forests import CausalTree, CausalForest
from legacy_models.causal_inference.matching.uplift_modeling import UpliftRandomForest, UpliftKNN, UpliftEvaluator, UpliftOptimizer

def test_propensity_score_matching():
    """Test PropensityScoreMatcher functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 200
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment probability
    treatment_prob = 1 / (1 + np.exp(-(0.5 * X[:, 0] + 0.3 * X[:, 1])))
    T = np.random.binomial(1, treatment_prob, n_samples)
    
    # Generate outcome
    Y = 0.5 * X[:, 0] + 0.3 * X[:, 1] + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    # Test nearest neighbor matching
    matcher = PropensityScoreMatcher(method='nearest_neighbor', n_neighbors=1)
    results = matcher.match(X, T, Y)
    
    # Check results
    assert 'ATE' in results
    assert 'ATE_ci' in results
    assert isinstance(results['ATE'], (int, float))
    assert len(results['ATE_ci']) == 2
    
    # Test caliper matching
    matcher_caliper = PropensityScoreMatcher(method='caliper', caliper=0.1)
    results_caliper = matcher_caliper.match(X, T, Y)
    assert 'ATE' in results_caliper
    
    # Test stratification matching
    matcher_strat = PropensityScoreMatcher(method='stratification')
    results_strat = matcher_strat.match(X, T, Y)
    assert 'ATE' in results_strat
    
    # Test balance assessment
    balance_results = matcher.assess_balance(X, T)
    assert 'before_matching' in balance_results
    assert 'after_matching' in balance_results

def test_causal_tree():
    """Test CausalTree functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome with treatment effect
    Y = X[:, 0] + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    # Test causal tree
    tree = CausalTree(max_depth=3, random_state=42)
    tree.fit(X, T, Y)
    
    # Check that tree was built
    assert tree.tree is not None
    
    # Test prediction
    predictions = tree.predict(X[:5])
    assert len(predictions) == 5
    assert isinstance(predictions, np.ndarray)

def test_causal_forest():
    """Test CausalForest functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 150
    n_features = 4
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome with heterogeneous treatment effects
    treatment_effect = 1.0 + 0.5 * X[:, 0]  # Effect depends on first covariate
    Y = X[:, 1] + T * treatment_effect + np.random.normal(0, 1, n_samples)
    
    # Test causal forest
    forest = CausalForest(n_estimators=10, max_depth=3, random_state=42)
    forest.fit(X, T, Y)
    
    # Check that trees were built
    assert len(forest.trees) == 10
    
    # Test prediction
    predictions = forest.predict(X[:5])
    assert len(predictions) == 5
    assert isinstance(predictions, np.ndarray)
    
    # Test confidence intervals
    lower_bounds, upper_bounds = forest.predict_interval(X[:5])
    assert len(lower_bounds) == 5
    assert len(upper_bounds) == 5
    assert np.all(lower_bounds <= predictions)
    assert np.all(predictions <= upper_bounds)
    
    # Test ATE estimation
    ate, ate_ci = forest.estimate_ate(X)
    assert isinstance(ate, (int, float))
    assert len(ate_ci) == 2

def test_uplift_random_forest():
    """Test UpliftRandomForest functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 150
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome with uplift
    uplift = 1.0 + 0.5 * X[:, 0]  # Uplift depends on first covariate
    control_outcome = 0.5 * X[:, 1] + np.random.normal(0, 1, n_samples)
    treated_outcome = control_outcome + uplift
    Y = np.where(T == 1, treated_outcome, control_outcome)
    
    # Test uplift random forest
    uplift_rf = UpliftRandomForest(n_estimators=10, random_state=42)
    uplift_rf.fit(X, T, Y)
    
    # Check that models were fitted
    assert uplift_rf.treatment_model is not None
    assert uplift_rf.control_model is not None
    
    # Test uplift prediction
    uplift_predictions = uplift_rf.predict_uplift(X[:5])
    assert len(uplift_predictions) == 5
    assert isinstance(uplift_predictions, np.ndarray)
    
    # Test probability prediction
    prob_predictions = uplift_rf.predict_proba(X[:5])
    assert prob_predictions.shape == (5, 2)

def test_uplift_knn():
    """Test UpliftKNN functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome
    Y = X[:, 0] + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    # Test uplift k-NN
    uplift_knn = UpliftKNN(n_neighbors=5)
    uplift_knn.fit(X, T, Y)
    
    # Test uplift prediction
    uplift_predictions = uplift_knn.predict_uplift(X[:5])
    assert len(uplift_predictions) == 5
    assert isinstance(uplift_predictions, np.ndarray)

def test_uplift_evaluator():
    """Test UpliftEvaluator functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    
    # Generate treatment and outcome
    T = np.random.binomial(1, 0.5, n_samples)
    Y = np.random.binomial(1, 0.6, n_samples)  # Binary outcome
    
    # Generate uplift scores
    uplift_scores = np.random.normal(0, 1, n_samples)
    
    # Test evaluator
    evaluator = UpliftEvaluator()
    metrics = evaluator.calculate_uplift_metrics(T, Y, uplift_scores)
    
    # Check metrics
    assert 'qini_coefficient' in metrics
    assert 'overall_uplift' in metrics
    assert isinstance(metrics['qini_coefficient'], (int, float))

def test_uplift_optimizer():
    """Test UpliftOptimizer functionality."""
    # Generate uplift scores
    np.random.seed(42)
    uplift_scores = np.random.normal(0, 1, 50)
    
    # Test optimizer without budget constraint
    optimizer = UpliftOptimizer()
    treatment_assignment = optimizer.optimize_treatment_assignment(uplift_scores)
    
    # Check assignment
    assert len(treatment_assignment) == 50
    assert treatment_assignment.dtype == bool
    
    # Test optimizer with budget constraint
    optimizer_constrained = UpliftOptimizer(budget_constraint=0.3)
    treatment_assignment_constrained = optimizer_constrained.optimize_treatment_assignment(uplift_scores)
    
    # Check that constraint is respected
    assert np.sum(treatment_assignment_constrained) <= 0.3 * 50
    
    # Test expected gain calculation
    expected_gain = optimizer.calculate_expected_gain(uplift_scores, treatment_assignment)
    assert isinstance(expected_gain, (int, float))

if __name__ == "__main__":
    pytest.main([__file__])