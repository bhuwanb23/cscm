"""
Propensity Score Matching for Causal Inference

This module implements propensity score matching methods for estimating causal effects
with observational data.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import roc_auc_score
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
from scipy.spatial.distance import cdist
import warnings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PropensityScoreMatcher:
    """
    Propensity Score Matching for causal inference.
    
    This class implements various propensity score matching methods including:
    - Nearest neighbor matching
    - Caliper matching
    - Kernel matching
    - Stratification matching
    """
    
    def __init__(self, method: str = 'nearest_neighbor', 
                 caliper: Optional[float] = None,
                 n_neighbors: int = 1,
                 random_state: int = 42):
        """
        Initialize PropensityScoreMatcher.
        
        Args:
            method: Matching method ('nearest_neighbor', 'caliper', 'kernel', 'stratification')
            caliper: Caliper width for caliper matching (standard deviations)
            n_neighbors: Number of neighbors for k-nearest neighbor matching
            random_state: Random seed for reproducibility
        """
        self.method = method
        self.caliper = caliper
        self.n_neighbors = n_neighbors
        self.random_state = random_state
        self.propensity_model = None
        self.propensity_scores = None
        self.treatment = None
        self.outcome = None
        self.covariates = None
        self.matches = None
        self.ATE = None
        self.ATE_ci = None
        
    def fit_propensity_model(self, X: np.ndarray, T: np.ndarray, 
                           model_type: str = 'logistic') -> np.ndarray:
        """
        Fit propensity score model and compute propensity scores.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            model_type: Model type ('logistic', 'random_forest')
            
        Returns:
            Propensity scores
        """
        logger.info(f"Fitting propensity score model using {model_type}")
        
        # Standardize covariates
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Fit propensity model
        if model_type == 'logistic':
            self.propensity_model = LogisticRegression(random_state=self.random_state)
        elif model_type == 'random_forest':
            self.propensity_model = RandomForestClassifier(
                n_estimators=100, random_state=self.random_state)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
            
        self.propensity_model.fit(X_scaled, T)
        
        # Compute propensity scores
        if model_type == 'logistic':
            self.propensity_scores = self.propensity_model.predict_proba(X_scaled)[:, 1]
        else:
            self.propensity_scores = self.propensity_model.predict_proba(X_scaled)[:, 1]
            
        logger.info(f"Propensity scores computed. Range: [{self.propensity_scores.min():.4f}, {self.propensity_scores.max():.4f}]")
        return self.propensity_scores
        
    def match(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> Dict[str, Any]:
        """
        Perform propensity score matching.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Dictionary with matching results
        """
        logger.info(f"Performing {self.method} matching")
        
        # Store data
        self.treatment = T
        self.outcome = Y
        self.covariates = X
        
        # Fit propensity model if not already done
        if self.propensity_scores is None:
            self.fit_propensity_model(X, T)
            
        # Perform matching based on method
        if self.method == 'nearest_neighbor':
            matches = self._nearest_neighbor_match(T)
        elif self.method == 'caliper':
            matches = self._caliper_match(T)
        elif self.method == 'kernel':
            matches = self._kernel_match(T)
        elif self.method == 'stratification':
            matches = self._stratification_match(T)
        else:
            raise ValueError(f"Unknown matching method: {self.method}")
            
        self.matches = matches
        
        # Calculate treatment effect
        ate, ate_ci = self._calculate_ate(matches, Y)
        self.ATE = ate
        self.ATE_ci = ate_ci
        
        results = {
            'matches': matches,
            'ATE': ate,
            'ATE_ci': ate_ci,
            'propensity_scores': self.propensity_scores,
            'method': self.method
        }
        
        logger.info(f"Matching completed. ATE: {ate:.4f} (95% CI: [{ate_ci[0]:.4f}, {ate_ci[1]:.4f}])")
        return results
        
    def _nearest_neighbor_match(self, T: np.ndarray) -> Dict[str, List[int]]:
        """
        Perform nearest neighbor matching.
        
        Args:
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary mapping treated units to matched control units
        """
        # Separate treated and control units
        treated_indices = np.where(T == 1)[0]
        control_indices = np.where(T == 0)[0]
        
        # Get propensity scores for treated and control
        treated_scores = self.propensity_scores[treated_indices]
        control_scores = self.propensity_scores[control_indices]
        
        # Find nearest neighbors
        matches = {}
        for i, treated_idx in enumerate(treated_indices):
            treated_score = treated_scores[i]
            
            # Calculate distances to all control units
            distances = np.abs(control_scores - treated_score)
            
            # Find k nearest neighbors
            nearest_indices = np.argsort(distances)[:self.n_neighbors]
            matched_control_indices = control_indices[nearest_indices].tolist()
            
            matches[treated_idx] = matched_control_indices
            
        return matches
        
    def _caliper_match(self, T: np.ndarray) -> Dict[str, List[int]]:
        """
        Perform caliper matching.
        
        Args:
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary mapping treated units to matched control units
        """
        # Set default caliper if not provided
        if self.caliper is None:
            # Use 0.2 standard deviations of propensity scores as default
            self.caliper = 0.2 * np.std(self.propensity_scores)
            
        logger.info(f"Using caliper width: {self.caliper:.4f}")
        
        # Separate treated and control units
        treated_indices = np.where(T == 1)[0]
        control_indices = np.where(T == 0)[0]
        
        # Get propensity scores for treated and control
        treated_scores = self.propensity_scores[treated_indices]
        control_scores = self.propensity_scores[control_indices]
        
        # Find matches within caliper
        matches = {}
        for i, treated_idx in enumerate(treated_indices):
            treated_score = treated_scores[i]
            
            # Calculate distances to all control units
            distances = np.abs(control_scores - treated_score)
            
            # Find controls within caliper
            within_caliper = distances <= self.caliper
            eligible_controls = control_indices[within_caliper]
            eligible_distances = distances[within_caliper]
            
            if len(eligible_controls) > 0:
                # If multiple controls within caliper, choose nearest
                if self.n_neighbors == 1:
                    nearest_idx = np.argmin(eligible_distances)
                    matches[treated_idx] = [eligible_controls[nearest_idx]]
                else:
                    # Choose k nearest within caliper
                    nearest_indices = np.argsort(eligible_distances)[:self.n_neighbors]
                    matched_controls = eligible_controls[nearest_indices].tolist()
                    matches[treated_idx] = matched_controls
            else:
                # No matches within caliper
                matches[treated_idx] = []
                
        return matches
        
    def _kernel_match(self, T: np.ndarray) -> Dict[str, List[int]]:
        """
        Perform kernel matching (not implemented in this simplified version).
        
        Args:
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary with kernel weights
        """
        # This is a simplified implementation
        # A full implementation would compute kernel weights for all units
        warnings.warn("Kernel matching is not fully implemented. Using nearest neighbor matching as fallback.")
        return self._nearest_neighbor_match(T)
        
    def _stratification_match(self, T: np.ndarray) -> Dict[str, List[int]]:
        """
        Perform stratification matching.
        
        Args:
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary with stratification results
        """
        # Create strata based on propensity scores
        n_strata = 5
        strata_edges = np.percentile(self.propensity_scores, 
                                   np.linspace(0, 100, n_strata + 1))
        
        # Assign each unit to a stratum
        strata = np.digitize(self.propensity_scores, strata_edges, right=True)
        # Adjust for edge case where score equals max edge
        strata = np.clip(strata, 1, n_strata)
        
        # For each stratum, calculate treatment effect
        stratum_effects = {}
        for stratum in range(1, n_strata + 1):
            stratum_mask = strata == stratum
            stratum_treatment = T[stratum_mask]
            stratum_outcome = self.outcome[stratum_mask]
            
            if len(np.unique(stratum_treatment)) == 2:  # Both treated and control present
                treated_outcomes = stratum_outcome[stratum_treatment == 1]
                control_outcomes = stratum_outcome[stratum_treatment == 0]
                
                stratum_ate = np.mean(treated_outcomes) - np.mean(control_outcomes)
                stratum_effects[stratum] = {
                    'ate': stratum_ate,
                    'n_treated': len(treated_outcomes),
                    'n_control': len(control_outcomes)
                }
            else:
                stratum_effects[stratum] = {
                    'ate': 0.0,
                    'n_treated': 0,
                    'n_control': 0
                }
                
        # Calculate overall ATE as weighted average
        total_treated = np.sum([effect['n_treated'] for effect in stratum_effects.values()])
        if total_treated > 0:
            weighted_ate = np.sum([
                effect['ate'] * effect['n_treated'] 
                for effect in stratum_effects.values()
            ]) / total_treated
        else:
            weighted_ate = 0.0
            
        return {
            'strata': strata,
            'stratum_effects': stratum_effects,
            'weighted_ate': weighted_ate
        }
        
    def _calculate_ate(self, matches: Dict[str, List[int]], 
                      Y: np.ndarray) -> Tuple[float, Tuple[float, float]]:
        """
        Calculate Average Treatment Effect from matches.
        
        Args:
            matches: Matching results
            Y: Outcome vector
            
        Returns:
            Tuple of (ATE, 95% confidence interval)
        """
        if self.method == 'stratification':
            # For stratification, we already calculated the effect
            ate = matches.get('weighted_ate', 0.0)
            # Simplified CI calculation
            se = np.std(Y) / np.sqrt(len(Y))  # Very simplified
            ci_lower = ate - 1.96 * se
            ci_upper = ate + 1.96 * se
            return ate, (ci_lower, ci_upper)
            
        # For other methods, calculate from matched pairs
        treated_outcomes = []
        control_outcomes = []
        
        for treated_idx, matched_controls in matches.items():
            if len(matched_controls) > 0:
                treated_outcomes.append(Y[treated_idx])
                # Average outcomes of matched controls
                control_mean = np.mean([Y[control_idx] for control_idx in matched_controls])
                control_outcomes.append(control_mean)
                
        if len(treated_outcomes) == 0:
            warnings.warn("No matches found. ATE set to 0.")
            return 0.0, (0.0, 0.0)
            
        # Calculate ATE
        ate = np.mean(treated_outcomes) - np.mean(control_outcomes)
        
        # Calculate standard error and confidence interval (simplified)
        # This is a very simplified approach - a full implementation would use
        # more sophisticated methods accounting for matching
        pooled_var = np.var(treated_outcomes) / len(treated_outcomes) + \
                     np.var(control_outcomes) / len(control_outcomes)
        se = np.sqrt(pooled_var)
        ci_lower = ate - 1.96 * se
        ci_upper = ate + 1.96 * se
        
        return ate, (ci_lower, ci_upper)
        
    def assess_balance(self, X: np.ndarray, T: np.ndarray) -> Dict[str, Any]:
        """
        Assess covariate balance before and after matching.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary with balance statistics
        """
        logger.info("Assessing covariate balance")
        
        # Standardize covariates
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Calculate standardized differences before matching
        treated_mask = T == 1
        control_mask = T == 0
        
        before_means = {}
        after_means = {}
        std_diffs_before = {}
        std_diffs_after = {}
        
        for i in range(X_scaled.shape[1]):
            # Before matching
            treated_mean = np.mean(X_scaled[treated_mask, i])
            control_mean = np.mean(X_scaled[control_mask, i])
            pooled_std = np.sqrt(
                (np.var(X_scaled[treated_mask, i]) * np.sum(treated_mask) +
                 np.var(X_scaled[control_mask, i]) * np.sum(control_mask)) /
                (np.sum(treated_mask) + np.sum(control_mask) - 2)
            )
            
            std_diff_before = (treated_mean - control_mean) / pooled_std
            before_means[f'covariate_{i}'] = {
                'treated': treated_mean,
                'control': control_mean
            }
            std_diffs_before[f'covariate_{i}'] = std_diff_before
            
            # After matching (if matches exist)
            if self.matches is not None and self.method != 'stratification':
                matched_treated = []
                matched_control = []
                
                for treated_idx, matched_controls in self.matches.items():
                    if len(matched_controls) > 0:
                        matched_treated.append(X_scaled[treated_idx, i])
                        # Average of matched controls
                        control_vals = [X_scaled[control_idx, i] for control_idx in matched_controls]
                        matched_control.append(np.mean(control_vals))
                        
                if len(matched_treated) > 0:
                    matched_treated_mean = np.mean(matched_treated)
                    matched_control_mean = np.mean(matched_control)
                    # Simplified pooled std for matched sample
                    pooled_std_matched = np.sqrt(
                        (np.var(matched_treated) * len(matched_treated) +
                         np.var(matched_control) * len(matched_control)) /
                        (len(matched_treated) + len(matched_control) - 2)
                    )
                    std_diff_after = (matched_treated_mean - matched_control_mean) / pooled_std_matched
                    after_means[f'covariate_{i}'] = {
                        'treated': matched_treated_mean,
                        'control': matched_control_mean
                    }
                    std_diffs_after[f'covariate_{i}'] = std_diff_after
                else:
                    after_means[f'covariate_{i}'] = before_means[f'covariate_{i}']
                    std_diffs_after[f'covariate_{i}'] = std_diff_before
            else:
                after_means[f'covariate_{i}'] = before_means[f'covariate_{i}']
                std_diffs_after[f'covariate_{i}'] = std_diff_before
                
        # Calculate summary statistics
        max_std_diff_before = np.max(np.abs(list(std_diffs_before.values())))
        max_std_diff_after = np.max(np.abs(list(std_diffs_after.values())))
        percent_reduction = (max_std_diff_before - max_std_diff_after) / max_std_diff_before * 100
        
        balance_results = {
            'before_matching': {
                'standardized_differences': std_diffs_before,
                'means': before_means
            },
            'after_matching': {
                'standardized_differences': std_diffs_after,
                'means': after_means
            },
            'balance_summary': {
                'max_std_diff_before': max_std_diff_before,
                'max_std_diff_after': max_std_diff_after,
                'percent_reduction': percent_reduction
            }
        }
        
        logger.info(f"Balance assessment completed. Max std diff reduction: {percent_reduction:.2f}%")
        return balance_results

# Example usage
if __name__ == "__main__":
    # Generate sample data
    np.random.seed(42)
    n_samples = 1000
    n_features = 3
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate confounder that affects both treatment and outcome
    confounder = np.random.normal(0, 1, n_samples)
    
    # Generate treatment probability based on covariates and confounder
    treatment_prob = 1 / (1 + np.exp(-(0.5 * X[:, 0] + 0.3 * X[:, 1] + 1.0 * confounder)))
    T = np.random.binomial(1, treatment_prob, n_samples)
    
    # Generate outcome (affected by covariates, confounder, and treatment)
    Y = 0.5 * X[:, 0] + 0.3 * X[:, 1] + 1.0 * confounder + 2.0 * T + np.random.normal(0, 1, n_samples)
    
    print("=== Propensity Score Matching Example ===")
    
    # Test nearest neighbor matching
    matcher_nn = PropensityScoreMatcher(method='nearest_neighbor', n_neighbors=1)
    results_nn = matcher_nn.match(X, T, Y)
    print(f"Nearest Neighbor Matching ATE: {results_nn['ATE']:.4f}")
    print(f"95% CI: [{results_nn['ATE_ci'][0]:.4f}, {results_nn['ATE_ci'][1]:.4f}]")
    
    # Test caliper matching
    matcher_caliper = PropensityScoreMatcher(method='caliper', caliper=0.1, n_neighbors=1)
    results_caliper = matcher_caliper.match(X, T, Y)
    print(f"Caliper Matching ATE: {results_caliper['ATE']:.4f}")
    print(f"95% CI: [{results_caliper['ATE_ci'][0]:.4f}, {results_caliper['ATE_ci'][1]:.4f}]")
    
    # Test stratification matching
    matcher_strat = PropensityScoreMatcher(method='stratification')
    results_strat = matcher_strat.match(X, T, Y)
    print(f"Stratification Matching ATE: {results_strat['ATE']:.4f}")
    print(f"95% CI: [{results_strat['ATE_ci'][0]:.4f}, {results_strat['ATE_ci'][1]:.4f}]")
    
    # Assess balance
    balance_results = matcher_nn.assess_balance(X, T)
    print(f"Balance improvement: {balance_results['balance_summary']['percent_reduction']:.2f}%")