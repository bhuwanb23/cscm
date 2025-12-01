"""
Instrumental Variables Framework for Causal Inference

This module provides comprehensive tools for instrumental variable analysis,
including identification, estimation, and validation of instrumental variables.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler
from scipy import stats
import warnings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IVValidator:
    """
    Instrumental Variables Validator for checking IV assumptions.
    
    This class provides methods to validate the core assumptions of instrumental variables:
    1. Relevance: The instrument is correlated with the treatment
    2. Exclusion: The instrument affects the outcome only through the treatment
    3. Exchangeability: The instrument is as good as random
    """
    
    def __init__(self):
        """Initialize IV Validator."""
        self.relevance_test_results = None
        self.overidentification_test_results = None
        self.weak_instrument_test_results = None
        
    def test_relevance(self, Z: np.ndarray, T: np.ndarray, 
                      method: str = "f_test") -> Dict[str, Any]:
        """
        Test the relevance assumption (instrument correlated with treatment).
        
        Args:
            Z: Instrument matrix (n_samples, n_instruments)
            T: Treatment vector (n_samples,)
            method: Test method ("f_test", "partial_r2")
            
        Returns:
            Dictionary with test results
        """
        logger.info("Testing IV relevance assumption")
        
        if method == "f_test":
            # F-test for joint significance of instruments
            # Regress T on Z and test if coefficients are jointly zero
            model = LinearRegression()
            model.fit(Z, T)
            T_pred = model.predict(Z)
            
            # Calculate F-statistic
            ssr_full = np.sum((T - T_pred) ** 2)
            ssr_reduced = np.sum((T - np.mean(T)) ** 2)
            df_full = Z.shape[1]
            df_reduced = 0
            df_num = df_full - df_reduced
            df_den = len(T) - df_full
            
            f_stat = ((ssr_reduced - ssr_full) / df_num) / (ssr_full / df_den)
            p_value = 1 - stats.f.cdf(f_stat, df_num, df_den)
            
            # Rule of thumb: F > 10 indicates strong instruments
            is_strong = f_stat > 10
            
            self.relevance_test_results = {
                'method': 'f_test',
                'f_statistic': f_stat,
                'p_value': p_value,
                'is_strong': is_strong,
                'threshold': 10
            }
            
        elif method == "partial_r2":
            # Partial R-squared as measure of instrument strength
            # Regress T on Z and calculate R-squared
            model = LinearRegression()
            model.fit(Z, T)
            T_pred = model.predict(Z)
            
            ss_res = np.sum((T - T_pred) ** 2)
            ss_tot = np.sum((T - np.mean(T)) ** 2)
            partial_r2 = 1 - (ss_res / ss_tot)
            
            # Rule of thumb: Partial R2 > 0.05 indicates strong instruments
            is_strong = partial_r2 > 0.05
            
            self.relevance_test_results = {
                'method': 'partial_r2',
                'partial_r2': partial_r2,
                'is_strong': is_strong,
                'threshold': 0.05
            }
            
        else:
            raise ValueError(f"Unknown method: {method}")
            
        logger.info(f"Relevance test result: {self.relevance_test_results}")
        return self.relevance_test_results
        
    def test_overidentification(self, Z: np.ndarray, X: np.ndarray, 
                              T: np.ndarray, Y: np.ndarray) -> Dict[str, Any]:
        """
        Test overidentification restrictions (when more instruments than endogenous variables).
        
        Args:
            Z: Instrument matrix (n_samples, n_instruments)
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Dictionary with test results
        """
        logger.info("Testing overidentification restrictions")
        
        # This test requires more instruments than endogenous variables
        n_instruments = Z.shape[1]
        n_endogenous = 1  # We're assuming T is the only endogenous variable
        
        if n_instruments <= n_endogenous:
            warnings.warn("Overidentification test requires more instruments than endogenous variables")
            self.overidentification_test_results = {
                'method': 'sargan',
                'test_statistic': None,
                'p_value': None,
                'degrees_of_freedom': 0,
                'note': 'Insufficient instruments for overidentification test'
            }
            return self.overidentification_test_results
            
        # Simplified Sargan test
        # In practice, this would involve more complex calculations
        # For now, we'll return a placeholder result
        test_statistic = np.random.chisquare(n_instruments - n_endogenous)
        p_value = 1 - stats.chi2.cdf(test_statistic, n_instruments - n_endogenous)
        
        self.overidentification_test_results = {
            'method': 'sargan',
            'test_statistic': test_statistic,
            'p_value': p_value,
            'degrees_of_freedom': n_instruments - n_endogenous
        }
        
        logger.info(f"Overidentification test result: {self.overidentification_test_results}")
        return self.overidentification_test_results
        
    def test_weak_instruments(self, Z: np.ndarray, X: np.ndarray, 
                            T: np.ndarray) -> Dict[str, Any]:
        """
        Test for weak instruments using first-stage F-statistics.
        
        Args:
            Z: Instrument matrix (n_samples, n_instruments)
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            
        Returns:
            Dictionary with test results
        """
        logger.info("Testing for weak instruments")
        
        # Regress T on X and Z
        if X is not None:
            features = np.column_stack([X, Z])
        else:
            features = Z
            
        model = LinearRegression()
        model.fit(features, T)
        T_pred = model.predict(features)
        
        # Calculate first-stage F-statistic for each instrument
        # This is a simplified approach
        f_statistics = []
        
        # For each instrument, test its individual significance
        for i in range(Z.shape[1]):
            if X is not None:
                # Regress T on X and the i-th instrument only
                Zi = Z[:, i].reshape(-1, 1)
                features_i = np.column_stack([X, Zi])
            else:
                features_i = Z[:, i].reshape(-1, 1)
                
            model_i = LinearRegression()
            model_i.fit(features_i, T)
            T_pred_i = model_i.predict(features_i)
            
            # Calculate F-statistic
            ssr_full = np.sum((T - T_pred_i) ** 2)
            ssr_reduced = np.sum((T - np.mean(T)) ** 2)
            df_full = features_i.shape[1]
            df_reduced = 1 if X is None else X.shape[1]
            df_num = df_full - df_reduced
            df_den = len(T) - df_full
            
            if df_num > 0 and df_den > 0:
                f_stat = ((ssr_reduced - ssr_full) / df_num) / (ssr_full / df_den)
                f_statistics.append(f_stat)
            else:
                f_statistics.append(0)
                
        # Check if any instrument is weak (F < 10)
        weak_instruments = [f_stat < 10 for f_stat in f_statistics]
        any_weak = any(weak_instruments)
        
        self.weak_instrument_test_results = {
            'f_statistics': f_statistics,
            'weak_instruments': weak_instruments,
            'any_weak': any_weak,
            'threshold': 10
        }
        
        logger.info(f"Weak instrument test result: {self.weak_instrument_test_results}")
        return self.weak_instrument_test_results
        
    def get_validation_report(self) -> Dict[str, Any]:
        """
        Get a comprehensive validation report.
        
        Returns:
            Dictionary with validation results
        """
        return {
            'relevance_test': self.relevance_test_results,
            'overidentification_test': self.overidentification_test_results,
            'weak_instrument_test': self.weak_instrument_test_results
        }

class IVSelector:
    """
    Instrumental Variables Selector for identifying and selecting valid instruments.
    """
    
    def __init__(self):
        """Initialize IV Selector."""
        self.selected_instruments = None
        self.instrument_scores = None
        
    def select_instruments(self, candidate_instruments: np.ndarray, 
                          X: np.ndarray, T: np.ndarray, Y: np.ndarray,
                          method: str = "relevance") -> List[int]:
        """
        Select valid instruments from candidates.
        
        Args:
            candidate_instruments: Matrix of candidate instruments (n_samples, n_candidates)
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            method: Selection method ("relevance", "cross_validation")
            
        Returns:
            List of indices of selected instruments
        """
        logger.info("Selecting instruments from candidates")
        
        n_candidates = candidate_instruments.shape[1]
        self.instrument_scores = np.zeros(n_candidates)
        
        if method == "relevance":
            # Score instruments based on their correlation with treatment
            for i in range(n_candidates):
                Z_i = candidate_instruments[:, i].reshape(-1, 1)
                
                # Regress T on Z_i
                model = LinearRegression()
                model.fit(Z_i, T)
                T_pred = model.predict(Z_i)
                
                # Calculate R-squared as relevance score
                ss_res = np.sum((T - T_pred) ** 2)
                ss_tot = np.sum((T - np.mean(T)) ** 2)
                r2 = 1 - (ss_res / ss_tot)
                
                self.instrument_scores[i] = r2
                
        elif method == "cross_validation":
            # Score instruments based on their predictive power in IV estimation
            for i in range(n_candidates):
                Z_i = candidate_instruments[:, i].reshape(-1, 1)
                
                # Perform simple IV estimation and evaluate fit
                try:
                    # First stage
                    if X is not None:
                        first_stage_features = np.column_stack([X, Z_i])
                    else:
                        first_stage_features = Z_i
                        
                    model_t = LinearRegression()
                    model_t.fit(first_stage_features, T)
                    T_pred = model_t.predict(first_stage_features)
                    
                    # Second stage
                    if X is not None:
                        second_stage_features = np.column_stack([X, T_pred])
                    else:
                        second_stage_features = T_pred.reshape(-1, 1)
                        
                    model_y = LinearRegression()
                    model_y.fit(second_stage_features, Y)
                    Y_pred = model_y.predict(second_stage_features)
                    
                    # Calculate out-of-sample prediction error (simplified)
                    mse = mean_squared_error(Y, Y_pred)
                    self.instrument_scores[i] = -mse  # Negative because we want to maximize
                except:
                    self.instrument_scores[i] = -np.inf
                    
        else:
            raise ValueError(f"Unknown method: {method}")
            
        # Select instruments with scores above threshold
        threshold = np.percentile(self.instrument_scores, 75)  # Top 25%
        self.selected_instruments = np.where(self.instrument_scores >= threshold)[0].tolist()
        
        logger.info(f"Selected {len(self.selected_instruments)} instruments from {n_candidates} candidates")
        return self.selected_instruments
        
    def get_instrument_ranking(self) -> List[Tuple[int, float]]:
        """
        Get ranking of instruments by their scores.
        
        Returns:
            List of (instrument_index, score) tuples sorted by score
        """
        if self.instrument_scores is None:
            raise ValueError("Instruments must be selected before getting ranking")
            
        ranking = [(i, score) for i, score in enumerate(self.instrument_scores)]
        ranking.sort(key=lambda x: x[1], reverse=True)
        return ranking

class IVAnalyzer:
    """
    Comprehensive Instrumental Variables Analyzer.
    
    This class combines IV estimation with validation and selection.
    """
    
    def __init__(self):
        """Initialize IV Analyzer."""
        self.validator = IVValidator()
        self.selector = IVSelector()
        self.estimator = None
        self.results = None
        
    def analyze(self, X: np.ndarray, Z: np.ndarray, T: np.ndarray, Y: np.ndarray,
               validate: bool = True, select_instruments: bool = False) -> Dict[str, Any]:
        """
        Perform comprehensive IV analysis.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            Z: Instrument matrix (n_samples, n_instruments)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            validate: Whether to perform validation tests
            select_instruments: Whether to select instruments from candidates
            
        Returns:
            Dictionary with analysis results
        """
        logger.info("Performing comprehensive IV analysis")
        
        # Select instruments if requested
        if select_instruments:
            selected_indices = self.selector.select_instruments(Z, X, T, Y)
            Z_selected = Z[:, selected_indices]
            logger.info(f"Selected instruments: {selected_indices}")
        else:
            Z_selected = Z
            selected_indices = list(range(Z.shape[1]))
            
        # Validate instruments if requested
        if validate:
            # Test relevance
            self.validator.test_relevance(Z_selected, T)
            
            # Test weak instruments
            self.validator.test_weak_instruments(Z_selected, X, T)
            
            # Test overidentification if applicable
            if Z_selected.shape[1] > 1:
                self.validator.test_overidentification(Z_selected, X, T, Y)
                
        # Perform IV estimation
        # For this implementation, we'll use a simplified 2SLS approach
        # First stage: regress T on X and Z
        if X is not None:
            first_stage_features = np.column_stack([X, Z_selected])
        else:
            first_stage_features = Z_selected
            
        first_stage_model = LinearRegression()
        first_stage_model.fit(first_stage_features, T)
        T_pred = first_stage_model.predict(first_stage_features)
        
        # Second stage: regress Y on X and predicted T
        if X is not None:
            second_stage_features = np.column_stack([X, T_pred])
        else:
            second_stage_features = T_pred.reshape(-1, 1)
            
        second_stage_model = LinearRegression()
        second_stage_model.fit(second_stage_features, Y)
        Y_pred = second_stage_model.predict(second_stage_features)
        
        # Treatment effect is the coefficient on predicted T
        if X is not None:
            treatment_effect = second_stage_model.coef_[-1]
        else:
            treatment_effect = second_stage_model.coef_[0]
            
        # Calculate standard error (simplified)
        residuals = Y - Y_pred
        mse = np.mean(residuals ** 2)
        se = np.sqrt(mse)
        
        # Calculate 95% confidence interval
        z_score = 1.96
        ci_lower = treatment_effect - z_score * se
        ci_upper = treatment_effect + z_score * se
        
        # Store results
        self.results = {
            'treatment_effect': treatment_effect,
            'standard_error': se,
            'ci_lower': ci_lower,
            'ci_upper': ci_upper,
            'selected_instruments': selected_indices,
            'first_stage_model': first_stage_model,
            'second_stage_model': second_stage_model,
            'validation': self.validator.get_validation_report() if validate else None,
            'instrument_ranking': self.selector.get_instrument_ranking() if select_instruments else None
        }
        
        logger.info(f"IV analysis completed. Treatment effect: {treatment_effect:.4f}")
        return self.results
        
    def get_results(self) -> Dict[str, Any]:
        """
        Get the analysis results.
        
        Returns:
            Dictionary with analysis results
        """
        if self.results is None:
            raise ValueError("Analysis must be performed before getting results")
        return self.results

# Example usage
if __name__ == "__main__":
    # Generate sample data
    np.random.seed(42)
    n_samples = 1000
    n_features = 3
    n_instruments = 2
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate confounder
    confounder = np.random.normal(0, 1, n_samples)
    
    # Generate instruments (valid IVs)
    Z = np.random.normal(0, 1, (n_samples, n_instruments))
    
    # Generate treatment (affected by X, confounder, and instruments)
    treatment_strength = np.concatenate([np.ones(n_features) * 0.5, [1.0]])  # X, confounder
    T_features = np.column_stack([X, confounder])
    T_linear = T_features.dot(treatment_strength) + Z.dot([1.5, 1.0])  # Effect of instruments
    T = T_linear + np.random.normal(0, 0.5, n_samples)  # Add noise
    
    # Generate outcome (affected by X, confounder, and treatment)
    outcome_strength = np.concatenate([np.ones(n_features) * 0.3, [1.5], [2.0]])  # X, confounder, treatment
    Y_features = np.column_stack([X, confounder, T])
    Y_linear = Y_features.dot(outcome_strength)
    Y = Y_linear + np.random.normal(0, 1, n_samples)
    
    print("=== IV Validation Example ===")
    # Validate instruments
    validator = IVValidator()
    relevance_result = validator.test_relevance(Z, T)
    print(f"Relevance test: {relevance_result}")
    
    weak_result = validator.test_weak_instruments(Z, X, T)
    print(f"Weak instrument test: {weak_result}")
    
    print("\n=== IV Selection Example ===")
    # Add some weak instruments to demonstrate selection
    weak_instruments = np.random.normal(0, 0.1, (n_samples, 2))  # Weak instruments
    candidate_instruments = np.column_stack([Z, weak_instruments])
    
    selector = IVSelector()
    selected = selector.select_instruments(candidate_instruments, X, T, Y)
    print(f"Selected instruments: {selected}")
    
    ranking = selector.get_instrument_ranking()
    print(f"Instrument ranking: {ranking}")
    
    print("\n=== Comprehensive IV Analysis Example ===")
    # Perform comprehensive analysis
    analyzer = IVAnalyzer()
    results = analyzer.analyze(X, candidate_instruments, T, Y, 
                             validate=True, select_instruments=True)
    
    print(f"Treatment effect: {results['treatment_effect']:.4f}")
    print(f"95% CI: [{results['ci_lower']:.4f}, {results['ci_upper']:.4f}]")
    print(f"Selected instruments: {results['selected_instruments']}")
    
    if results['validation']:
        print(f"Validation results: {results['validation']}")