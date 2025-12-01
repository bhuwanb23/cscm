"""
Test suite for intervention impact analysis use case
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from models.causal_inference.use_cases.intervention_analysis import (
    InterventionAnalyzer, SyntheticControlAnalyzer, EventStudyAnalyzer
)

def test_intervention_analyzer_initialization():
    """Test initialization of InterventionAnalyzer."""
    analyzer = InterventionAnalyzer()
    assert analyzer.interventions == {}
    assert analyzer.results == {}

def test_intervention_registration():
    """Test registering interventions."""
    analyzer = InterventionAnalyzer()
    
    # Register an intervention
    start_date = datetime(2023, 1, 1)
    end_date = datetime(2023, 12, 31)
    analyzer.register_intervention('process_improvement', start_date, end_date)
    
    # Check registration
    assert 'process_improvement' in analyzer.interventions
    assert analyzer.interventions['process_improvement']['start_date'] == start_date
    assert analyzer.interventions['process_improvement']['end_date'] == end_date

def test_intervention_data_preparation():
    """Test preparing data for intervention analysis."""
    analyzer = InterventionAnalyzer()
    
    # Register an intervention
    start_date = datetime(2023, 6, 1)
    analyzer.register_intervention('new_policy', start_date)
    
    # Create sample data
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    np.random.seed(42)
    
    data = pd.DataFrame({
        'date': dates,
        'efficiency': np.random.normal(80, 10, len(dates)),
        'cost': np.random.normal(1000, 100, len(dates))
    })
    
    # Prepare data
    prepared_data = analyzer.prepare_intervention_data(data, 'date')
    
    # Check that treatment column was added
    assert 'intervention_new_policy' in prepared_data.columns
    assert prepared_data['intervention_new_policy'].sum() > 0  # Some days should be treated

def test_intervention_impact_analysis():
    """Test intervention impact analysis."""
    analyzer = InterventionAnalyzer()
    
    # Register an intervention
    start_date = datetime(2023, 7, 1)
    analyzer.register_intervention('technology_upgrade', start_date)
    
    # Create sample data with clear intervention effect
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    np.random.seed(42)
    
    # Create treatment indicator
    treatment = (dates >= start_date).astype(int)
    
    # Generate outcomes with treatment effect
    efficiency = (75 + 
                  5 * treatment +  # 5 unit increase from intervention
                  np.random.normal(0, 2, len(dates)))
    
    cost = (1100 - 
            100 * treatment +  # 100 unit decrease from intervention
            np.random.normal(0, 20, len(dates)))
    
    data = pd.DataFrame({
        'date': dates,
        'efficiency': efficiency,
        'cost': cost
    })
    
    # Analyze impact
    outcome_vars = ['efficiency', 'cost']
    results = analyzer.analyze_impact(data, outcome_vars, 'date')
    
    # Check results structure
    assert 'technology_upgrade' in results
    assert 'efficiency' in results['technology_upgrade']
    assert 'cost' in results['technology_upgrade']
    
    # Check that effects are in expected direction
    # Efficiency should increase (positive effect)
    assert results['technology_upgrade']['efficiency']['ate'] > 0
    # Cost should decrease (negative effect)
    assert results['technology_upgrade']['cost']['ate'] < 0

def test_roi_calculation():
    """Test ROI calculation for interventions."""
    analyzer = InterventionAnalyzer()
    
    # Mock some results
    analyzer.results = {
        'test_intervention': {
            'efficiency': {'ate': 5.0},
            'cost': {'ate': -50.0}
        }
    }
    
    # Calculate ROI
    cost = 10000
    value_per_unit_improvement = 100  # $100 per unit improvement
    roi_results = analyzer.calculate_roi('test_intervention', cost, value_per_unit_improvement)
    
    # Check results structure
    assert 'roi' in roi_results
    assert 'net_benefit' in roi_results
    assert 'benefit_cost_ratio' in roi_results
    assert 'total_effect' in roi_results
    assert 'total_benefits' in roi_results

def test_synthetic_control_analyzer():
    """Test synthetic control analysis."""
    analyzer = SyntheticControlAnalyzer()
    
    # Create sample data
    np.random.seed(42)
    n_time = 100
    
    # Treated unit (with intervention at time 50)
    treated = np.concatenate([
        np.random.normal(100, 5, 50),  # Pre-intervention
        np.random.normal(110, 5, 50)   # Post-intervention (10 unit increase)
    ])
    
    # Control units
    control_data = {}
    for i in range(5):
        # Controls follow similar trend but no intervention effect
        control_data[f'control_{i}'] = np.random.normal(100, 5, n_time)
    
    control_df = pd.DataFrame(control_data)
    
    # Construct synthetic control
    pre_period = slice(0, 50)
    weights = analyzer.construct_synthetic_control(
        pd.Series(treated), control_df, pre_period
    )
    
    # Check weights
    assert len(weights) == 5
    assert np.isclose(np.sum(weights), 1.0)
    assert all(w >= 0 for w in weights)

def test_synthetic_control_effect_estimation():
    """Test synthetic control treatment effect estimation."""
    analyzer = SyntheticControlAnalyzer()
    
    # Create sample data
    np.random.seed(42)
    
    # Treated unit
    treated = np.concatenate([
        np.random.normal(100, 3, 30),  # Pre-intervention
        np.random.normal(115, 3, 30)   # Post-intervention (15 unit increase)
    ])
    
    # Control units (no effect)
    control_data = {}
    for i in range(4):
        control_data[f'control_{i}'] = np.random.normal(100, 3, 60)
    
    control_df = pd.DataFrame(control_data)
    
    # Set weights (equal for simplicity)
    weights = np.array([0.25, 0.25, 0.25, 0.25])
    analyzer.synthetic_weights = weights
    analyzer.control_units = list(control_df.columns)
    
    # Estimate treatment effect
    post_period = slice(30, 60)
    results = analyzer.estimate_treatment_effect(
        pd.Series(treated), control_df, weights, post_period
    )
    
    # Check results structure
    assert 'average_effect' in results
    assert 'effect_over_time' in results
    assert 'synthetic_control_trajectory' in results
    assert 'actual_trajectory' in results
    assert 'cumulative_effect' in results

def test_event_study_analyzer():
    """Test event study analysis."""
    analyzer = EventStudyAnalyzer()
    
    # Create sample data
    event_date = datetime(2023, 6, 15)
    dates = pd.date_range('2023-01-01', '2023-12-31', freq='D')
    np.random.seed(42)
    
    # Create treatment indicator (event occurs on event_date)
    treatment = (dates >= event_date).astype(int)
    
    # Generate outcome with event effect
    outcome = (80 + 
               8 * treatment +  # 8 unit increase after event
               np.random.normal(0, 2, len(dates)))
    
    data = pd.DataFrame({
        'date': dates,
        'outcome': outcome,
        'treatment': treatment
    })
    
    # Create event study data
    event_data = analyzer.create_event_study_data(data, event_date, 'date', window=6)
    
    # Check that relative time column was created
    assert 'periods_since_event' in event_data.columns
    assert event_data['periods_since_event'].min() >= -6
    assert event_data['periods_since_event'].max() <= 6

def test_dynamic_effect_estimation():
    """Test dynamic effect estimation."""
    # Create sample event study data
    np.random.seed(42)
    n_periods = 13  # -6 to +6
    
    periods = list(range(-6, 7))
    treatment_rates = [0.1] * 6 + [0.1] + [0.8] * 6  # Higher treatment rate after event
    outcomes = [np.random.normal(80, 3) for _ in range(6)] + \
              [np.random.normal(80, 3)] + \
              [np.random.normal(88, 3) for _ in range(6)]  # 8 unit increase after event
    sample_sizes = [100] * n_periods
    
    data = pd.DataFrame({
        'periods_since_event': periods,
        'outcome_mean': outcomes,
        'treatment_rate': treatment_rates,
        'outcome_count': sample_sizes
    })
    
    analyzer = EventStudyAnalyzer()
    results = analyzer.estimate_dynamic_effects(
        data, 'outcome_mean', 'treatment_rate', 'periods_since_event'
    )
    
    # Check results structure
    assert 'period_effects' in results
    assert 'pre_event_periods' in results
    assert 'post_event_periods' in results
    assert len(results['period_effects']) == n_periods

if __name__ == '__main__':
    pytest.main([__file__])