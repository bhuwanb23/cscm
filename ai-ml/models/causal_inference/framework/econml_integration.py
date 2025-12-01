"""
EconML Framework Integration for Causal Inference

This module provides a simplified implementation of causal inference concepts
from the EconML framework, focusing on double machine learning and heterogeneous
treatment effect estimation.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DoubleML:
    """
    Double Machine Learning estimator for causal inference.
    
    This implementation follows the Chernozhukov et al. (2018) approach
    for estimating treatment effects with cross-fitting.
    """
    
    def __init__(self, model_y: Any = None, model_t: Any = None, 
                 n_splits: int = 2, random_state: int = 42):
        """
        Initialize DoubleML estimator.
        
        Args:
            model_y: Machine learning model for outcome regression (Y ~ X)
            model_t: Machine learning model for treatment regression (T ~ X)
            n_splits: Number of splits for cross-fitting
            random_state: Random seed for reproducibility
        """
        self.model_y = model_y if model_y is not None else RandomForestRegressor(random_state=random_state)
        self.model_t = model_t if model_t is not None else RandomForestRegressor(random_state=random_state)
        self.n_splits = n_splits
        self.random_state = random_state
        self.treatment_effect = None
        self.se = None
        self.ci_lower = None
        self.ci_upper = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'DoubleML':
        """
        Fit the DoubleML estimator.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted DoubleML estimator
        """
        logger.info("Fitting DoubleML estimator")
        
        n_samples = len(Y)
        split_size = n_samples // self.n_splits
        
        # Initialize arrays to store residuals
        y_resids = np.zeros(n_samples)
        t_resids = np.zeros(n_samples)
        
        # Cross-fitting
        for i in range(self.n_splits):
            # Define train and test indices
            test_start = i * split_size
            test_end = (i + 1) * split_size if i < self.n_splits - 1 else n_samples
            test_idx = np.arange(test_start, test_end)
            train_idx = np.concatenate([np.arange(0, test_start), 
                                      np.arange(test_end, n_samples)])
            
            # Fit models on training data
            self.model_y.fit(X[train_idx], Y[train_idx])
            self.model_t.fit(X[train_idx], T[train_idx])
            
            # Predict on test data and compute residuals
            y_pred = self.model_y.predict(X[test_idx])
            t_pred = self.model_t.predict(X[test_idx])
            
            y_resids[test_idx] = Y[test_idx] - y_pred
            t_resids[test_idx] = T[test_idx] - t_pred
            
        # Final estimation using residuals
        # For continuous treatment, we use linear regression
        # For binary treatment, we could use different approaches
        
        # Check if treatment is binary
        if len(np.unique(T)) == 2:
            # Binary treatment case
            # Use Wald estimator: cov(Y_resid, T_resid) / var(T_resid)
            cov_yt = np.cov(y_resids, t_resids)[0, 1]
            var_t = np.var(t_resids)
            self.treatment_effect = cov_yt / var_t
        else:
            # Continuous treatment case
            # Use linear regression of Y_resid on T_resid
            t_resids_reshaped = t_resids.reshape(-1, 1)
            model_final = LinearRegression()
            model_final.fit(t_resids_reshaped, y_resids)
            self.treatment_effect = model_final.coef_[0]
            
        # Calculate standard error
        # This is a simplified calculation
        residuals = y_resids - self.treatment_effect * t_resids
        mse = np.mean(residuals ** 2)
        var_t_total = np.var(t_resids)
        self.se = np.sqrt(mse / (n_samples * var_t_total))
        
        # Calculate 95% confidence interval
        z_score = 1.96  # For 95% CI
        self.ci_lower = self.treatment_effect - z_score * self.se
        self.ci_upper = self.treatment_effect + z_score * self.se
        
        logger.info(f"DoubleML estimation completed. Treatment effect: {self.treatment_effect:.4f}")
        return self
        
    def effect(self, X: Optional[np.ndarray] = None) -> Union[float, np.ndarray]:
        """
        Get the treatment effect.
        
        Args:
            X: Covariate matrix for heterogeneous effects (optional)
            
        Returns:
            Treatment effect (constant or heterogeneous)
        """
        if X is None:
            return self.treatment_effect
        else:
            # For heterogeneous effects, we would need a more complex model
            # This is a simplified implementation that returns constant effect
            return np.full(X.shape[0], self.treatment_effect)
            
    def effect_interval(self, X: Optional[np.ndarray] = None, 
                       alpha: float = 0.05) -> Tuple[Union[float, np.ndarray], 
                                                    Union[float, np.ndarray]]:
        """
        Get the confidence interval for the treatment effect.
        
        Args:
            X: Covariate matrix for heterogeneous effects (optional)
            alpha: Significance level (default: 0.05 for 95% CI)
            
        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        if X is None:
            return (self.ci_lower, self.ci_upper)
        else:
            # For heterogeneous effects, return constant intervals
            return (np.full(X.shape[0], self.ci_lower), 
                   np.full(X.shape[0], self.ci_upper))

class CausalForest:
    """
    Simplified implementation of causal forest for heterogeneous treatment effects.
    
    This is a simplified version that captures the main ideas of causal forests
    without implementing the full algorithm.
    """
    
    def __init__(self, n_estimators: int = 100, max_depth: Optional[int] = None, 
                 min_samples_split: int = 2, min_samples_leaf: int = 1,
                 random_state: int = 42):
        """
        Initialize Causal Forest.
        
        Args:
            n_estimators: Number of trees in the forest
            max_depth: Maximum depth of trees
            min_samples_split: Minimum samples required to split a node
            min_samples_leaf: Minimum samples required in a leaf
            random_state: Random seed for reproducibility
        """
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.random_state = random_state
        self.trees = []
        self.feature_importances_ = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'CausalForest':
        """
        Fit the causal forest.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted Causal Forest
        """
        logger.info("Fitting Causal Forest")
        
        np.random.seed(self.random_state)
        n_samples, n_features = X.shape
        
        # Fit multiple trees with subsampled data
        for i in range(self.n_estimators):
            # Subsample data
            sample_indices = np.random.choice(n_samples, size=n_samples, replace=True)
            X_sample = X[sample_indices]
            T_sample = T[sample_indices]
            Y_sample = Y[sample_indices]
            
            # Create and fit a tree
            tree = self._create_tree(X_sample, T_sample, Y_sample)
            self.trees.append(tree)
            
        # Calculate feature importances (simplified)
        self.feature_importances_ = np.zeros(n_features)
        valid_trees = 0
        for tree in self.trees:
            if hasattr(tree, 'feature_importances_') and len(tree.feature_importances_) == n_features:
                self.feature_importances_ += tree.feature_importances_
                valid_trees += 1
        if valid_trees > 0:
            self.feature_importances_ /= valid_trees
        
        logger.info(f"Causal Forest fitting completed with {len(self.trees)} trees")
        return self
        
    def _create_tree(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> Any:
        """
        Create and fit a single tree for causal effect estimation.
        
        Args:
            X: Covariate matrix
            T: Treatment vector
            Y: Outcome vector
            
        Returns:
            Fitted tree model
        """
        # This is a simplified implementation
        # A full implementation would:
        # 1. Split nodes based on heterogeneity in treatment effects
        # 2. Use honest splitting (separate samples for splitting and estimation)
        # 3. Estimate treatment effects in leaf nodes
        
        # For this simplified version, we'll use a regular random forest
        # but train it on the residualized outcome
        model_y = RandomForestRegressor(
            n_estimators=10,  # Small number for individual trees
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=None  # No need to set seed for individual trees
        )
        
        # Fit treatment model
        model_t = RandomForestRegressor(
            n_estimators=10,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=None
        )
        
        model_y.fit(X, Y)
        model_t.fit(X, T)
        
        # Compute residuals
        Y_resid = Y - model_y.predict(X)
        T_resid = T - model_t.predict(X)
        
        # Fit final tree on residualized data
        tree = RandomForestRegressor(
            n_estimators=1,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=None
        )
        
        # For the tree, we only use X as features (not including T_resid)
        # This simplifies the prediction interface
        tree.fit(X, Y_resid)
        
        return tree
        
    def effect(self, X: np.ndarray) -> np.ndarray:
        """
        Estimate heterogeneous treatment effects.
        
        Args:
            X: Covariate matrix for which to estimate treatment effects
            
        Returns:
            Array of treatment effects
        """
        if not self.trees:
            raise ValueError("Causal Forest must be fitted before estimating effects")
            
        # Get predictions from all trees
        predictions = []
        for tree in self.trees:
            # For each tree, we would need to extract the treatment effect
            # This is a simplified implementation that just averages predictions
            pred = tree.predict(X)
            predictions.append(pred)
            
        # Average predictions across trees
        effects = np.mean(predictions, axis=0)
        return effects
        
    def effect_interval(self, X: np.ndarray, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray]:
        """
        Get confidence intervals for treatment effects.
        
        Args:
            X: Covariate matrix
            alpha: Significance level
            
        Returns:
            Tuple of (lower_bounds, upper_bounds)
        """
        if not self.trees:
            raise ValueError("Causal Forest must be fitted before estimating effects")
            
        # Get predictions from all trees
        predictions = []
        for tree in self.trees:
            pred = tree.predict(X)
            predictions.append(pred)
            
        # Calculate quantiles for confidence intervals
        lower_percentile = 100 * (alpha / 2)
        upper_percentile = 100 * (1 - alpha / 2)
        
        lower_bounds = np.percentile(predictions, lower_percentile, axis=0)
        upper_bounds = np.percentile(predictions, upper_percentile, axis=0)
        
        return (lower_bounds, upper_bounds)

class InstrumentalVariable:
    """
    Instrumental Variable estimation for causal inference.
    
    This implementation provides methods for IV estimation when unobserved
    confounding is present.
    """
    
    def __init__(self):
        """Initialize Instrumental Variable estimator."""
        self.first_stage_model = None
        self.second_stage_model = None
        self.treatment_effect = None
        self.se = None
        self.ci_lower = None
        self.ci_upper = None
        
    def fit(self, X: np.ndarray, Z: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'InstrumentalVariable':
        """
        Fit the Instrumental Variable estimator.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            Z: Instrument matrix (n_samples, n_instruments)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted IV estimator
        """
        logger.info("Fitting Instrumental Variable estimator")
        
        # First stage: regress T on X and Z
        if X is not None:
            first_stage_features = np.column_stack([X, Z])
        else:
            first_stage_features = Z
            
        self.first_stage_model = LinearRegression()
        self.first_stage_model.fit(first_stage_features, T)
        
        # Get predicted treatment values
        T_pred = self.first_stage_model.predict(first_stage_features)
        
        # Second stage: regress Y on X and predicted T
        if X is not None:
            second_stage_features = np.column_stack([X, T_pred])
        else:
            second_stage_features = T_pred.reshape(-1, 1)
            
        self.second_stage_model = LinearRegression()
        self.second_stage_model.fit(second_stage_features, Y)
        
        # Treatment effect is the coefficient on predicted T
        # If X is included, it's the last coefficient
        # If X is not included, it's the only coefficient
        if X is not None:
            self.treatment_effect = self.second_stage_model.coef_[-1]
        else:
            self.treatment_effect = self.second_stage_model.coef_[0]
            
        # Calculate standard error using simplified approach
        residuals = Y - self.second_stage_model.predict(second_stage_features)
        mse = np.mean(residuals ** 2)
        self.se = np.sqrt(mse)  # Simplified standard error
        
        # Calculate 95% confidence interval
        z_score = 1.96
        self.ci_lower = self.treatment_effect - z_score * self.se
        self.ci_upper = self.treatment_effect + z_score * self.se
        
        logger.info(f"IV estimation completed. Treatment effect: {self.treatment_effect:.4f}")
        return self
        
    def effect(self) -> float:
        """
        Get the treatment effect.
        
        Returns:
            Treatment effect
        """
        return self.treatment_effect
        
    def effect_interval(self, alpha: float = 0.05) -> Tuple[float, float]:
        """
        Get the confidence interval for the treatment effect.
        
        Args:
            alpha: Significance level
            
        Returns:
            Tuple of (lower_bound, upper_bound)
        """
        return (self.ci_lower, self.ci_upper)

# Example usage
if __name__ == "__main__":
    # Generate sample data with confounding
    np.random.seed(42)
    n_samples = 1000
    n_features = 5
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate confounder that affects both treatment and outcome
    confounder = np.random.normal(0, 1, n_samples)
    
    # Generate instrument (affects treatment but not outcome directly)
    Z = np.random.normal(0, 1, (n_samples, 1))
    
    # Generate treatment (affected by X, confounder, and instrument)
    treatment_strength = np.concatenate([np.ones(n_features) * 0.5, [1.0], [2.0]])  # X, confounder, instrument
    T_features = np.column_stack([X, confounder, Z.flatten()])
    T_linear = T_features.dot(treatment_strength)
    T = np.random.binomial(1, 1 / (1 + np.exp(-T_linear)), n_samples)
    
    # Generate outcome (affected by X, confounder, and treatment)
    outcome_strength = np.concatenate([np.ones(n_features) * 0.3, [1.5], [3.0]])  # X, confounder, treatment
    Y_features = np.column_stack([X, confounder, T])
    Y_linear = Y_features.dot(outcome_strength)
    Y = Y_linear + np.random.normal(0, 1, n_samples)
    
    print("=== Double Machine Learning Example ===")
    # Apply DoubleML
    dml = DoubleML()
    dml.fit(X, T, Y)
    print(f"DoubleML Treatment Effect: {dml.effect():.4f}")
    print(f"95% CI: [{dml.effect_interval()[0]:.4f}, {dml.effect_interval()[1]:.4f}]")
    
    print("\n=== Causal Forest Example ===")
    # Apply Causal Forest (on a subset for faster computation)
    subset_idx = np.random.choice(n_samples, size=200, replace=False)
    X_subset = X[subset_idx]
    T_subset = T[subset_idx]
    Y_subset = Y[subset_idx]
    
    cf = CausalForest(n_estimators=10)
    cf.fit(X_subset, T_subset, Y_subset)
    effects = cf.effect(X_subset[:5])  # Estimate effects for first 5 samples
    print(f"Causal Forest Effects (first 5 samples): {effects}")
    
    print("\n=== Instrumental Variable Example ===")
    # Apply IV estimation
    iv = InstrumentalVariable()
    iv.fit(X, Z, T, Y)
    print(f"IV Treatment Effect: {iv.effect():.4f}")
    print(f"95% CI: [{iv.effect_interval()[0]:.4f}, {iv.effect_interval()[1]:.4f}]")