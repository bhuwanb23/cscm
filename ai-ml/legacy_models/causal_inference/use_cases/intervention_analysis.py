"""
Intervention Impact Analysis for Supply Chain Operations

This module implements causal inference methods to analyze the impact of 
various interventions on supply chain performance metrics.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
import logging
from datetime import datetime, timedelta
import warnings

# Import causal inference components
from ..framework.dowhy_integration import CausalModel
from ..framework.econml_integration import DoubleML
from ..matching.propensity_matching import PropensityScoreMatcher
from ..matching.uplift_modeling import UpliftRandomForest

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InterventionAnalyzer:
    """
    Analyzes the causal impact of interventions on supply chain performance.
    
    This class evaluates how different interventions (e.g., process changes,
    policy implementations, technology deployments) affect key performance
    metrics like efficiency, cost, and service levels.
    """
    
    def __init__(self):
        self.interventions = {}
        self.results = {}
        
    def register_intervention(self, name: str, start_date: datetime, 
                           end_date: Optional[datetime] = None) -> None:
        """
        Register an intervention for analysis.
        
        Args:
            name: Name of the intervention
            start_date: Date when intervention started
            end_date: Date when intervention ended (optional)
        """
        self.interventions[name] = {
            'start_date': start_date,
            'end_date': end_date
        }
        
    def prepare_intervention_data(self, df: pd.DataFrame, 
                                date_col: str = 'date') -> pd.DataFrame:
        """
        Prepare data for intervention analysis by adding treatment indicators.
        
        Args:
            df: DataFrame with time series performance data
            date_col: Name of the date column
            
        Returns:
            DataFrame with treatment indicators for each registered intervention
        """
        df = df.copy()
        
        # Ensure date column is datetime
        df[date_col] = pd.to_datetime(df[date_col])
        
        # Add treatment indicators for each intervention
        for name, details in self.interventions.items():
            treatment_col = f"intervention_{name}"
            df[treatment_col] = (
                (df[date_col] >= details['start_date']) & 
                (df[date_col] <= (details['end_date'] or datetime.now()))
            ).astype(int)
        
        return df
    
    def analyze_impact(self, df: pd.DataFrame, outcome_vars: List[str], 
                      date_col: str = 'date') -> Dict[str, Any]:
        """
        Analyze the causal impact of interventions on outcome variables.
        
        Args:
            df: DataFrame with performance data
            outcome_vars: List of outcome variables to analyze
            date_col: Name of the date column
            
        Returns:
            Dictionary with impact analysis results
        """
        # Prepare data with treatment indicators
        data = self.prepare_intervention_data(df, date_col)
        
        results = {}
        
        # Analyze each intervention
        for intervention_name in self.interventions.keys():
            treatment_col = f"intervention_{intervention_name}"
            
            if treatment_col not in data.columns:
                continue
                
            results[intervention_name] = {}
            
            # Analyze each outcome variable
            for outcome in outcome_vars:
                if outcome not in data.columns:
                    continue
                    
                # Filter relevant columns
                analysis_cols = [col for col in data.columns 
                               if col not in [outcome, treatment_col, date_col]]
                analysis_cols = [col for col in analysis_cols if col in data.columns]
                
                # Prepare data for causal analysis
                X = data[analysis_cols].values if analysis_cols else np.ones((len(data), 1))
                T = data[treatment_col].values.reshape(-1, 1)
                y = data[outcome].values.reshape(-1, 1)
                
                # Handle missing values
                valid_idx = ~(np.isnan(X).any(axis=1) | np.isnan(T).any(axis=1) | np.isnan(y).any(axis=1))
                X = X[valid_idx]
                T = T[valid_idx]
                y = y[valid_idx]
                
                if len(X) == 0:
                    results[intervention_name][outcome] = {
                        'ate': 0,
                        'ci_lower': 0,
                        'ci_upper': 0,
                        'p_value': 1.0
                    }
                    continue
                
                try:
                    # Use DoubleML for robust effect estimation
                    dml = DoubleML()
                    effect_estimate = dml.estimate_effect(X, T, y)
                    
                    results[intervention_name][outcome] = {
                        'ate': effect_estimate['ate'],
                        'ci_lower': effect_estimate['ci_lower'],
                        'ci_upper': effect_estimate['ci_upper'],
                        'p_value': effect_estimate.get('p_value', 0.05),
                        'significant': effect_estimate.get('p_value', 0.05) < 0.05
                    }
                except Exception as e:
                    logger.warning(f"Could not estimate effect for {intervention_name} on {outcome}: {e}")
                    results[intervention_name][outcome] = {
                        'ate': 0,
                        'ci_lower': 0,
                        'ci_upper': 0,
                        'p_value': 1.0,
                        'significant': False
                    }
        
        self.results = results
        return results
    
    def calculate_roi(self, intervention_name: str, cost: float, 
                     value_per_unit_improvement: float) -> Dict[str, float]:
        """
        Calculate ROI for an intervention.
        
        Args:
            intervention_name: Name of the intervention
            cost: Cost of implementing the intervention
            value_per_unit_improvement: Monetary value of one unit improvement in outcome
            
        Returns:
            Dictionary with ROI metrics
        """
        if intervention_name not in self.results:
            return {'roi': 0, 'net_benefit': 0, 'benefit_cost_ratio': 0}
        
        # Calculate total effect across all outcomes
        total_effect = 0
        for outcome_results in self.results[intervention_name].values():
            total_effect += outcome_results['ate']
        
        # Calculate benefits
        total_benefits = total_effect * value_per_unit_improvement
        
        # Calculate ROI metrics
        net_benefit = total_benefits - cost
        roi = (net_benefit / cost) * 100 if cost > 0 else 0
        benefit_cost_ratio = total_benefits / cost if cost > 0 else 0
        
        return {
            'roi': roi,
            'net_benefit': net_benefit,
            'benefit_cost_ratio': benefit_cost_ratio,
            'total_effect': total_effect,
            'total_benefits': total_benefits
        }

class SyntheticControlAnalyzer:
    """
    Implements synthetic control methods for intervention analysis.
    
    This approach constructs a synthetic control group that mimics the
    behavior of the treated unit before the intervention.
    """
    
    def __init__(self):
        self.synthetic_weights = None
        self.control_units = None
        
    def construct_synthetic_control(self, treated_unit: pd.Series, 
                                 control_units: pd.DataFrame,
                                 pre_intervention_period: slice) -> np.ndarray:
        """
        Construct a synthetic control unit.
        
        Args:
            treated_unit: Time series of the treated unit
            control_units: DataFrame with control units (columns) over time (rows)
            pre_intervention_period: Slice object defining pre-intervention period
            
        Returns:
            Array of weights for control units
        """
        # Extract pre-intervention data
        treated_pre = treated_unit.iloc[pre_intervention_period].values
        control_pre = control_units.iloc[pre_intervention_period].values
        
        # Solve for weights that minimize difference between treated and weighted controls
        # This is a simplified implementation - in practice, this would use more sophisticated methods
        try:
            # Simple least squares solution
            weights = np.linalg.lstsq(control_pre, treated_pre, rcond=None)[0]
            
            # Normalize weights to sum to 1
            weights = np.abs(weights)  # Ensure non-negative weights
            weights = weights / np.sum(weights) if np.sum(weights) > 0 else weights
            
            self.synthetic_weights = weights
            self.control_units = control_units.columns.tolist()
            
            return weights
        except np.linalg.LinAlgError:
            # Fallback to equal weights if matrix is singular
            weights = np.ones(len(control_units.columns)) / len(control_units.columns)
            self.synthetic_weights = weights
            self.control_units = control_units.columns.tolist()
            return weights
    
    def estimate_treatment_effect(self, treated_unit: pd.Series,
                                control_units: pd.DataFrame,
                                synthetic_weights: np.ndarray,
                                post_intervention_period: slice) -> Dict[str, Any]:
        """
        Estimate treatment effect using synthetic control.
        
        Args:
            treated_unit: Time series of the treated unit
            control_units: DataFrame with control units
            synthetic_weights: Weights for constructing synthetic control
            post_intervention_period: Slice for post-intervention period
            
        Returns:
            Dictionary with treatment effect estimates
        """
        # Construct synthetic control for post-intervention period
        control_post = control_units.iloc[post_intervention_period].values
        synthetic_control = np.dot(control_post, synthetic_weights)
        
        # Actual treated unit in post-intervention period
        actual_treated = treated_unit.iloc[post_intervention_period].values
        
        # Calculate treatment effect
        treatment_effect = actual_treated - synthetic_control
        
        return {
            'average_effect': np.mean(treatment_effect),
            'effect_over_time': treatment_effect,
            'synthetic_control_trajectory': synthetic_control,
            'actual_trajectory': actual_treated,
            'cumulative_effect': np.sum(treatment_effect)
        }

class EventStudyAnalyzer:
    """
    Conducts event study analysis for interventions.
    
    Examines how outcomes evolve over time relative to intervention timing.
    """
    
    def __init__(self):
        self.event_windows = None
        
    def create_event_study_data(self, df: pd.DataFrame, event_date: datetime,
                              date_col: str = 'date', 
                              window: int = 12) -> pd.DataFrame:
        """
        Create event study dataset with relative time periods.
        
        Args:
            df: DataFrame with time series data
            event_date: Date of the intervention/event
            date_col: Name of date column
            window: Number of periods before and after event to include
            
        Returns:
            DataFrame formatted for event study analysis
        """
        df = df.copy()
        df[date_col] = pd.to_datetime(df[date_col])
        
        # Calculate relative time to event
        df['days_since_event'] = (df[date_col] - event_date).dt.days
        df['periods_since_event'] = df['days_since_event'] // 30  # Approximate months
        
        # Filter to window around event
        df = df[
            (df['periods_since_event'] >= -window) & 
            (df['periods_since_event'] <= window)
        ]
        
        return df
    
    def estimate_dynamic_effects(self, df: pd.DataFrame, outcome_var: str,
                               treatment_var: str, time_var: str) -> Dict[str, Any]:
        """
        Estimate treatment effects at different time periods relative to intervention.
        
        Args:
            df: Event study formatted DataFrame
            outcome_var: Name of outcome variable
            treatment_var: Name of treatment variable
            time_var: Name of time variable (periods since event)
            
        Returns:
            Dictionary with dynamic effect estimates
        """
        # Group by time periods and calculate average outcomes
        grouped = df.groupby(time_var).agg({
            outcome_var: ['mean', 'count', 'std'],
            treatment_var: 'mean'
        }).reset_index()
        
        # Flatten column names
        grouped.columns = [time_var, f'{outcome_var}_mean', f'{outcome_var}_count', 
                          f'{outcome_var}_std', f'{treatment_var}_rate']
        
        # Calculate treatment effects for each period
        effects = []
        for _, row in grouped.iterrows():
            effects.append({
                'period': row[time_var],
                'outcome_mean': row[f'{outcome_var}_mean'],
                'treatment_rate': row[f'{treatment_var}_rate'],
                'sample_size': row[f'{outcome_var}_count']
            })
        
        return {
            'period_effects': effects,
            'pre_event_periods': [e for e in effects if e['period'] < 0],
            'post_event_periods': [e for e in effects if e['period'] >= 0]
        }