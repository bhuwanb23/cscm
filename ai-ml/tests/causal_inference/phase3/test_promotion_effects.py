"""
Test suite for promotion effect estimation use case
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.causal_inference.use_cases.promotion_effects import PromotionEffectEstimator, PromotionOptimizer

def test_promotion_effect_estimator_initialization():
    """Test initialization of PromotionEffectEstimator."""
    estimator = PromotionEffectEstimator(method='dml')
    assert estimator.method == 'dml'
    assert estimator.model is None
    assert estimator.treatment_effect is None

def test_promotion_effect_estimator_data_preparation():
    """Test data preparation for promotion effect estimation."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    
    data = pd.DataFrame({
        'sales': np.random.normal(100, 20, n_samples),
        'promo_any': np.random.binomial(1, 0.3, n_samples),
        'price': np.random.normal(50, 10, n_samples),
        'competition_price': np.random.normal(45, 8, n_samples),
        'seasonality': np.random.normal(0, 1, n_samples)
    })
    
    estimator = PromotionEffectEstimator()
    X, T, y = estimator.prepare_data(data)
    
    # Check shapes
    assert X.shape == (n_samples, 3)  # 3 covariates
    assert T.shape == (n_samples,)
    assert y.shape == (n_samples,)
    
    # Check column names
    assert 'price' in X.columns
    assert 'competition_price' in X.columns
    assert 'seasonality' in X.columns

def test_promotion_effect_estimation_dml():
    """Test promotion effect estimation using DoubleML."""
    # Create sample data with causal effect
    np.random.seed(42)
    n_samples = 200
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, 3))
    
    # Generate treatment with some dependence on covariates
    treatment_prob = 1 / (1 + np.exp(-(0.5 * X[:, 0] + 0.3 * X[:, 1])))
    T = np.random.binomial(1, treatment_prob)
    
    # Generate outcome with true treatment effect of 10
    y = 5 + 2 * X[:, 0] + 1.5 * X[:, 1] + 10 * T + np.random.normal(0, 1, n_samples)
    
    # Create DataFrame with correct column names
    data = pd.DataFrame({
        'feature_1': X[:, 0],
        'feature_2': X[:, 1],
        'feature_3': X[:, 2],
        'promo_any': T,
        'sales': y
    })
    
    # Test DML estimation
    estimator = PromotionEffectEstimator(method='dml')
    results = estimator.estimate_effect(data)
    
    # Check results structure
    assert 'method' in results
    assert 'ate' in results
    assert 'ci_lower' in results
    assert 'ci_upper' in results
    assert 'standard_error' in results
    
    # Check method
    assert results['method'] == 'DoubleML'

def test_promotion_effect_estimation_psm():
    """Test promotion effect estimation using Propensity Score Matching."""
    # Create sample data
    np.random.seed(42)
    n_samples = 150
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, 2))
    
    # Generate treatment
    treatment_prob = 1 / (1 + np.exp(-(0.8 * X[:, 0] + 0.5 * X[:, 1])))
    T = np.random.binomial(1, treatment_prob)
    
    # Generate outcome with treatment effect
    y = 3 + 1.2 * X[:, 0] + 0.8 * X[:, 1] + 8 * T + np.random.normal(0, 1.5, n_samples)
    
    # Create DataFrame with correct column names
    data = pd.DataFrame({
        'covariate_1': X[:, 0],
        'covariate_2': X[:, 1],
        'promo_any': T,  # Using promo_ prefix as expected by prepare_data
        'sales': y
    })
    
    # Test PSM estimation
    estimator = PromotionEffectEstimator(method='psm')
    results = estimator.estimate_effect(data)
    
    # Check results structure
    assert 'method' in results
    assert 'ate' in results
    assert 'ci_lower' in results
    assert 'ci_upper' in results
    assert 'standard_error' in results
    
    # Check method
    assert results['method'] == 'PropensityScoreMatching'

def test_promotion_optimizer():
    """Test promotion optimizer functionality."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    
    data = pd.DataFrame({
        'sales': np.random.normal(100, 20, n_samples),
        'promo_any': np.random.binomial(1, 0.3, n_samples),
        'price': np.random.normal(50, 10, n_samples),
        'competition_price': np.random.normal(45, 8, n_samples),
        'seasonality': np.random.normal(0, 1, n_samples)
    })
    
    # Initialize optimizer
    optimizer = PromotionOptimizer()
    
    # Test optimization with a budget
    budget = 10000
    results = optimizer.optimize_promotion_allocation(data, budget)
    
    # Check results structure
    assert 'recommended_budget' in results
    assert 'expected_lift' in results
    assert 'confidence_interval' in results
    
    # Check budget allocation is reasonable
    assert 0 <= results['recommended_budget'] <= budget

if __name__ == '__main__':
    pytest.main([__file__])