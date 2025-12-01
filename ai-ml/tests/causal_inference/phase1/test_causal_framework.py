"""
Test suite for causal inference framework components
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.causal_inference.framework.dowhy_integration import CausalGraph, CausalModel
from models.causal_inference.framework.econml_integration import DoubleML, CausalForest, InstrumentalVariable
from models.causal_inference.framework.instrumental_variables import IVValidator, IVSelector, IVAnalyzer

def test_causal_graph():
    """Test CausalGraph functionality."""
    # Create a causal graph
    graph = CausalGraph()
    
    # Add nodes
    graph.add_node('confounder', 'confounder')
    graph.add_node('treatment', 'treatment')
    graph.add_node('outcome', 'outcome')
    
    # Add edges
    graph.add_edge('confounder', 'treatment')
    graph.add_edge('confounder', 'outcome')
    graph.add_edge('treatment', 'outcome')
    
    # Test node types
    assert 'confounder' in graph.confounders
    
    # Test graph structure
    assert graph.get_parents('treatment') == ['confounder']
    assert graph.get_children('treatment') == ['outcome']
    assert len(graph.graph.nodes) == 3
    assert len(graph.graph.edges) == 3

def test_causal_model():
    """Test CausalModel functionality."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    
    # Create confounder
    confounder = np.random.normal(0, 1, n_samples)
    
    # Create treatment variable
    treatment = np.random.binomial(1, 1 / (1 + np.exp(-confounder)), n_samples)
    
    # Create outcome variable
    outcome = 2 * confounder + 3 * treatment + np.random.normal(0, 1, n_samples)
    
    # Create DataFrame
    data = pd.DataFrame({
        'confounder': confounder,
        'treatment': treatment,
        'outcome': outcome
    })
    
    # Create causal graph
    graph = CausalGraph()
    graph.add_node('confounder', 'confounder')
    graph.add_node('treatment', 'treatment')
    graph.add_node('outcome', 'outcome')
    graph.add_edge('confounder', 'treatment')
    graph.add_edge('confounder', 'outcome')
    graph.add_edge('treatment', 'outcome')
    
    # Create causal model
    model = CausalModel(data, 'treatment', 'outcome', graph)
    
    # Test identification
    estimand = model.identify_effect('backdoor')
    assert estimand['estimand_type'] == 'backdoor'
    assert estimand['treatment_variable'] == 'treatment'
    assert estimand['outcome_variable'] == 'outcome'
    
    # Test estimation
    estimate = model.estimate_effect('linear_regression')
    assert 'treatment_effect' in estimate
    assert 'avg_treatment_effect' in estimate
    assert estimate['method'] == 'linear_regression'

def test_double_ml():
    """Test DoubleML functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome
    Y = X[:, 0] + 2 * T + np.random.normal(0, 1, n_samples)
    
    # Test DoubleML
    dml = DoubleML()
    dml.fit(X, T, Y)
    
    # Check results
    effect = dml.effect()
    assert isinstance(effect, (int, float))
    
    ci_lower, ci_upper = dml.effect_interval()
    assert ci_lower <= effect <= ci_upper

def test_causal_forest():
    """Test CausalForest functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 50  # Smaller sample for faster testing
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome
    Y = X[:, 0] + 2 * T + np.random.normal(0, 1, n_samples)
    
    # Test CausalForest
    cf = CausalForest(n_estimators=5)  # Fewer trees for faster testing
    cf.fit(X, T, Y)
    
    # Check results
    effects = cf.effect(X[:5])  # Test on first 5 samples
    assert len(effects) == 5
    assert isinstance(effects, np.ndarray)

def test_instrumental_variable():
    """Test InstrumentalVariable functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_features = 2
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate instrument
    Z = np.random.normal(0, 1, (n_samples, 1))
    
    # Generate treatment
    T = 0.5 * X[:, 0] + 1.5 * Z.flatten() + np.random.normal(0, 0.5, n_samples)
    
    # Generate outcome
    Y = 0.3 * X[:, 0] + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    # Test IV estimation
    iv = InstrumentalVariable()
    iv.fit(X, Z, T, Y)
    
    # Check results
    effect = iv.effect()
    assert isinstance(effect, (int, float))
    
    ci_lower, ci_upper = iv.effect_interval()
    assert ci_lower <= effect <= ci_upper

def test_iv_validator():
    """Test IVValidator functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    
    # Generate strong instrument
    Z = np.random.normal(0, 1, (n_samples, 1))
    
    # Generate treatment strongly correlated with instrument
    T = 2.0 * Z.flatten() + np.random.normal(0, 0.5, n_samples)
    
    # Test validator
    validator = IVValidator()
    relevance_result = validator.test_relevance(Z, T)
    
    # Check results
    assert 'f_statistic' in relevance_result
    assert 'is_strong' in relevance_result

def test_iv_selector():
    """Test IVSelector functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_candidates = 4
    
    # Generate candidate instruments
    candidate_instruments = np.random.normal(0, 1, (n_samples, n_candidates))
    
    # Make first two instruments stronger
    candidate_instruments[:, 0] = candidate_instruments[:, 0] * 3
    candidate_instruments[:, 1] = candidate_instruments[:, 1] * 2
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, 2))
    
    # Generate treatment
    T = np.random.binomial(1, 0.5, n_samples)
    
    # Generate outcome
    Y = np.random.normal(0, 1, n_samples)
    
    # Test selector
    selector = IVSelector()
    selected = selector.select_instruments(candidate_instruments, X, T, Y)
    
    # Check that some instruments were selected
    assert isinstance(selected, list)
    assert len(selected) > 0

def test_iv_analyzer():
    """Test IVAnalyzer functionality."""
    # Generate sample data
    np.random.seed(42)
    n_samples = 100
    n_features = 2
    n_instruments = 2
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate instruments
    Z = np.random.normal(0, 1, (n_samples, n_instruments))
    
    # Generate treatment
    T = 0.5 * X[:, 0] + 1.5 * Z[:, 0] + np.random.normal(0, 0.5, n_samples)
    
    # Generate outcome
    Y = 0.3 * X[:, 0] + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    # Test analyzer
    analyzer = IVAnalyzer()
    results = analyzer.analyze(X, Z, T, Y, validate=True, select_instruments=False)
    
    # Check results
    assert 'treatment_effect' in results
    assert 'ci_lower' in results
    assert 'ci_upper' in results
    assert results['ci_lower'] <= results['treatment_effect'] <= results['ci_upper']

if __name__ == "__main__":
    pytest.main([__file__])