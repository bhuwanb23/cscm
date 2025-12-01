"""
Test suite for distribution center placement comparison use case
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.causal_inference.use_cases.dc_placement import DistributionCenterComparator, NetworkImpactAnalyzer

def test_distribution_center_comparator_initialization():
    """Test initialization of DistributionCenterComparator."""
    comparator = DistributionCenterComparator()
    assert comparator.causal_model is None
    assert comparator.results == {}

def test_dc_data_preparation():
    """Test data preparation for DC placement analysis."""
    # Create sample data
    np.random.seed(42)
    n_samples = 50
    
    data = pd.DataFrame({
        'delivery_time': np.random.normal(24, 4, n_samples),
        'shipping_cost': np.random.normal(15, 3, n_samples),
        'customer_satisfaction': np.random.normal(4.5, 0.5, n_samples),
        'lat': np.random.uniform(-90, 90, n_samples),
        'lon': np.random.uniform(-180, 180, n_samples),
        'population_density': np.random.uniform(0, 10000, n_samples),
        'dc_placement_strategy': np.random.choice(['centralized', 'decentralized', 'hybrid'], n_samples)
    })
    
    comparator = DistributionCenterComparator()
    prepared_data = comparator.prepare_dc_data(data)
    
    # Check that treatment column was added
    assert 'treatment' in prepared_data.columns
    assert prepared_data['treatment'].nunique() <= 3  # At most 3 strategies

def test_dc_clustering():
    """Test DC strategy clustering functionality."""
    # Create sample data
    np.random.seed(42)
    n_samples = 100
    
    data = pd.DataFrame({
        'lat': np.random.uniform(-90, 90, n_samples),
        'lon': np.random.uniform(-180, 180, n_samples),
        'population_density': np.random.uniform(0, 10000, n_samples)
    })
    
    comparator = DistributionCenterComparator()
    clustered_data = comparator.cluster_dc_strategies(data, n_strategies=3)
    
    # Check that strategy column was added
    assert 'dc_placement_strategy' in clustered_data.columns
    assert clustered_data['dc_placement_strategy'].nunique() == 3

def test_placement_effect_estimation():
    """Test DC placement effect estimation."""
    # Create sample data
    np.random.seed(42)
    n_samples = 200
    
    # Generate geographic data
    lat = np.random.uniform(-90, 90, n_samples)
    lon = np.random.uniform(-180, 180, n_samples)
    population_density = np.random.uniform(0, 10000, n_samples)
    
    # Generate treatment strategies
    strategies = np.random.choice([0, 1, 2], n_samples)
    
    # Generate outcomes with some dependence on strategy
    delivery_time = (20 + 
                     0.1 * np.abs(lat) + 
                     0.05 * population_density/1000 +
                     strategies * 2 +  # Strategy effect
                     np.random.normal(0, 2, n_samples))
    
    shipping_cost = (10 + 
                     0.05 * np.abs(lon) + 
                     0.1 * population_density/1000 +
                     strategies * 1.5 +  # Strategy effect
                     np.random.normal(0, 1.5, n_samples))
    
    # Add the missing dc_placement_strategy column
    strategy_labels = ['centralized', 'decentralized', 'hybrid']
    dc_placement_strategy = [strategy_labels[s] for s in strategies]
    
    data = pd.DataFrame({
        'delivery_time': delivery_time,
        'shipping_cost': shipping_cost,
        'lat': lat,
        'lon': lon,
        'population_density': population_density,
        'treatment': strategies,
        'dc_placement_strategy': dc_placement_strategy
    })
    
    comparator = DistributionCenterComparator()
    effects = comparator.estimate_placement_effects(data)
    
    # Check results structure
    assert isinstance(effects, dict)
    assert len(effects) > 0

def test_placement_recommendation():
    """Test DC placement recommendation functionality."""
    # Create sample effects data
    effects = {
        'delivery_time': {
            'strategy_1_vs_baseline': {'ate': -2.5, 'ci_lower': -3.5, 'ci_upper': -1.5},
            'strategy_2_vs_baseline': {'ate': -1.0, 'ci_lower': -2.0, 'ci_upper': 0.0}
        },
        'shipping_cost': {
            'strategy_1_vs_baseline': {'ate': 1.0, 'ci_lower': 0.5, 'ci_upper': 1.5},
            'strategy_2_vs_baseline': {'ate': -0.5, 'ci_lower': -1.0, 'ci_upper': 0.0}
        },
        'customer_satisfaction': {
            'strategy_1_vs_baseline': {'ate': 0.2, 'ci_lower': 0.1, 'ci_upper': 0.3},
            'strategy_2_vs_baseline': {'ate': 0.1, 'ci_lower': 0.0, 'ci_upper': 0.2}
        }
    }
    
    comparator = DistributionCenterComparator()
    recommendation = comparator.recommend_optimal_placement(effects)
    
    # Check results structure
    assert 'recommended_strategy' in recommendation
    assert 'expected_benefit' in recommendation
    assert 'all_scores' in recommendation

def test_network_impact_analyzer():
    """Test network impact analyzer functionality."""
    analyzer = NetworkImpactAnalyzer()
    
    # Create sample network data
    data = pd.DataFrame({
        'dc_id': ['DC1', 'DC2'],
        'store_id': ['S1', 'S2'],
        'supplier_id': ['SUP1', 'SUP2']
    })
    
    # Build network
    graph = analyzer.build_supply_chain_network(data)
    
    # Check graph properties
    assert len(graph.nodes()) > 0
    assert len(graph.edges()) >= 0

def test_network_simulation():
    """Test network change simulation."""
    analyzer = NetworkImpactAnalyzer()
    
    # Create a simple graph
    import networkx as nx
    graph = nx.Graph()
    graph.add_nodes_from(['DC1', 'S1', 'S2'])
    graph.add_edges_from([('DC1', 'S1'), ('DC1', 'S2')])
    
    # Simulate adding a DC
    results = analyzer.simulate_network_changes(graph, change_type='add_dc')
    
    # Check results structure
    assert 'original_metrics' in results
    assert 'simulated_metrics' in results
    assert 'impact' in results
    assert 'change_type' in results

if __name__ == '__main__':
    pytest.main([__file__])