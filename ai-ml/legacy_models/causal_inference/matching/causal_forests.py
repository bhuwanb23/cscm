"""
Causal Forests for Heterogeneous Treatment Effect Estimation

This module implements causal forests for estimating heterogeneous treatment effects
using the approach from Athey and Imbens (2016) and Wager and Athey (2018).
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from sklearn.ensemble import RandomForestRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
import warnings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CausalTree:
    """
    Individual causal tree for estimating treatment effects.
    
    This implements a simplified version of the causal tree algorithm
    that splits nodes based on heterogeneity in treatment effects.
    """
    
    def __init__(self, max_depth: Optional[int] = None, 
                 min_samples_split: int = 2,
                 min_samples_leaf: int = 1,
                 honest: bool = True,
                 random_state: Optional[int] = None):
        """
        Initialize CausalTree.
        
        Args:
            max_depth: Maximum depth of the tree
            min_samples_split: Minimum samples required to split a node
            min_samples_leaf: Minimum samples required in a leaf
            honest: Whether to use honest splitting (separate samples for splitting and estimation)
            random_state: Random seed for reproducibility
        """
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.honest = honest
        self.random_state = random_state
        self.tree = None
        self.feature_importances_ = None
        self.n_features_ = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'CausalTree':
        """
        Fit the causal tree.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted CausalTree
        """
        logger.debug("Fitting causal tree")
        
        self.n_features_ = X.shape[1]
        np.random.seed(self.random_state)
        
        # If using honest splitting, split data
        if self.honest:
            # Split data into splitting and estimation sets
            split_indices, est_indices = train_test_split(
                np.arange(len(X)), test_size=0.5, random_state=self.random_state)
            X_split, T_split, Y_split = X[split_indices], T[split_indices], Y[split_indices]
            X_est, T_est, Y_est = X[est_indices], T[est_indices], Y[est_indices]
        else:
            X_split, T_split, Y_split = X, T, Y
            X_est, T_est, Y_est = X, T, Y
            
        # Build tree
        self.tree = self._build_tree(X_split, T_split, Y_split, X_est, T_est, Y_est, 
                                   depth=0, indices=np.arange(len(X_split)))
                                   
        # Calculate feature importances (simplified)
        self.feature_importances_ = np.zeros(self.n_features_)
        if self.tree is not None:
            self._calculate_feature_importances(self.tree)
            
        logger.debug("Causal tree fitting completed")
        return self
        
    def _build_tree(self, X_split: np.ndarray, T_split: np.ndarray, Y_split: np.ndarray,
                   X_est: np.ndarray, T_est: np.ndarray, Y_est: np.ndarray,
                   depth: int, indices: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Recursively build the causal tree.
        
        Args:
            X_split: Covariate matrix for splitting
            T_split: Treatment vector for splitting
            Y_split: Outcome vector for splitting
            X_est: Covariate matrix for estimation
            T_est: Treatment vector for estimation
            Y_est: Outcome vector for estimation
            depth: Current depth
            indices: Indices of samples in current node
            
        Returns:
            Tree node dictionary
        """
        n_samples = len(indices)
        
        # Stopping criteria
        if (depth >= self.max_depth if self.max_depth is not None else False) or \
           n_samples < self.min_samples_split:
            return self._create_leaf(X_est, T_est, Y_est, indices)
           
        # Find best split
        best_split = self._find_best_split(X_split[indices], T_split[indices], Y_split[indices],
                                         X_est, T_est, Y_est, indices)
                                         
        if best_split is None:
            return self._create_leaf(X_est, T_est, Y_est, indices)
            
        # Split data
        feature_idx, threshold = best_split['feature'], best_split['threshold']
        left_mask = X_split[indices, feature_idx] <= threshold
        right_mask = ~left_mask
        
        if np.sum(left_mask) < self.min_samples_leaf or np.sum(right_mask) < self.min_samples_leaf:
            return self._create_leaf(X_est, T_est, Y_est, indices)
            
        # Recursively build left and right subtrees
        left_indices = indices[left_mask]
        right_indices = indices[right_mask]
        
        left_child = self._build_tree(X_split, T_split, Y_split, X_est, T_est, Y_est,
                                    depth + 1, left_indices)
        right_child = self._build_tree(X_split, T_split, Y_split, X_est, T_est, Y_est,
                                     depth + 1, right_indices)
                                     
        if left_child is None or right_child is None:
            return self._create_leaf(X_est, T_est, Y_est, indices)
            
        # Create internal node
        node = {
            'feature': feature_idx,
            'threshold': threshold,
            'left': left_child,
            'right': right_child,
            'n_samples': n_samples,
            'treatment_effect': best_split['treatment_effect'],
            'treatment_effect_var': best_split['treatment_effect_var']
        }
        
        return node
        
    def _find_best_split(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray,
                        X_est: np.ndarray, T_est: np.ndarray, Y_est: np.ndarray,
                        indices: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Find the best split for the current node.
        
        Args:
            X: Covariate matrix for current node
            T: Treatment vector for current node
            Y: Outcome vector for current node
            X_est: Covariate matrix for estimation
            T_est: Treatment vector for estimation
            Y_est: Outcome vector for estimation
            indices: Indices of samples in current node
            
        Returns:
            Best split information or None if no valid split found
        """
        n_samples, n_features = X.shape
        if n_samples < self.min_samples_split:
            return None
            
        best_score = -np.inf
        best_split = None
        
        # Try random subset of features (similar to Random Forest)
        n_features_to_try = max(1, int(np.sqrt(n_features)))
        feature_indices = np.random.choice(n_features, n_features_to_try, replace=False)
        
        for feature_idx in feature_indices:
            # Get unique values for splitting
            feature_values = np.unique(X[:, feature_idx])
            if len(feature_values) < 2:
                continue
                
            # Try different split points
            for i in range(len(feature_values) - 1):
                threshold = (feature_values[i] + feature_values[i + 1]) / 2
                
                # Split samples
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask
                
                if np.sum(left_mask) < self.min_samples_leaf or np.sum(right_mask) < self.min_samples_leaf:
                    continue
                    
                # Calculate treatment effects for both sides
                left_te, left_var = self._estimate_treatment_effect(
                    T[left_mask], Y[left_mask])
                right_te, right_var = self._estimate_treatment_effect(
                    T[right_mask], Y[right_mask])
                    
                # Calculate heterogeneity score (difference in treatment effects)
                te_diff = np.abs(left_te - right_te)
                score = te_diff  # Simple scoring - could be improved
                
                if score > best_score:
                    best_score = score
                    best_split = {
                        'feature': feature_idx,
                        'threshold': threshold,
                        'treatment_effect': (left_te + right_te) / 2,
                        'treatment_effect_var': (left_var + right_var) / 2
                    }
                    
        return best_split
        
    def _estimate_treatment_effect(self, T: np.ndarray, Y: np.ndarray) -> Tuple[float, float]:
        """
        Estimate treatment effect using simple difference in means.
        
        Args:
            T: Treatment vector
            Y: Outcome vector
            
        Returns:
            Tuple of (treatment_effect, variance)
        """
        if len(np.unique(T)) < 2:
            return 0.0, 0.0
            
        treated_outcomes = Y[T == 1]
        control_outcomes = Y[T == 0]
        
        if len(treated_outcomes) == 0 or len(control_outcomes) == 0:
            return 0.0, 0.0
            
        te = np.mean(treated_outcomes) - np.mean(control_outcomes)
        
        # Simplified variance calculation
        var_treated = np.var(treated_outcomes) / len(treated_outcomes)
        var_control = np.var(control_outcomes) / len(control_outcomes)
        te_var = var_treated + var_control
        
        return te, te_var
        
    def _create_leaf(self, X_est: np.ndarray, T_est: np.ndarray, Y_est: np.ndarray,
                    indices: np.ndarray) -> Dict[str, Any]:
        """
        Create a leaf node.
        
        Args:
            X_est: Covariate matrix for estimation
            T_est: Treatment vector for estimation
            Y_est: Outcome vector for estimation
            indices: Indices of samples in leaf
            
        Returns:
            Leaf node dictionary
        """
        if len(indices) == 0:
            return {
                'leaf': True,
                'treatment_effect': 0.0,
                'treatment_effect_var': 0.0,
                'n_samples': 0,
                'samples': []
            }
            
        # Estimate treatment effect for samples in this leaf
        te, te_var = self._estimate_treatment_effect(T_est[indices], Y_est[indices])
        
        leaf = {
            'leaf': True,
            'treatment_effect': te,
            'treatment_effect_var': te_var,
            'n_samples': len(indices),
            'samples': indices.tolist()
        }
        
        return leaf
        
    def _calculate_feature_importances(self, node: Dict[str, Any], 
                                    impurity_decrease: float = 0.0):
        """
        Calculate feature importances recursively.
        
        Args:
            node: Current tree node
            impurity_decrease: Impurity decrease contribution
        """
        if node.get('leaf', False):
            return
            
        # Add impurity decrease to feature importance
        feature_idx = node['feature']
        self.feature_importances_[feature_idx] += impurity_decrease
        
        # Recursively calculate for children
        if 'left' in node and node['left'] is not None:
            self._calculate_feature_importances(node['left'])
        if 'right' in node and node['right'] is not None:
            self._calculate_feature_importances(node['right'])
            
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict treatment effects for new samples.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted treatment effects
        """
        if self.tree is None:
            raise ValueError("Tree must be fitted before prediction")
            
        predictions = np.zeros(X.shape[0])
        for i in range(X.shape[0]):
            predictions[i] = self._predict_sample(X[i], self.tree)
            
        return predictions
        
    def _predict_sample(self, x: np.ndarray, node: Dict[str, Any]) -> float:
        """
        Predict treatment effect for a single sample.
        
        Args:
            x: Single sample covariates
            node: Current tree node
            
        Returns:
            Predicted treatment effect
        """
        if node.get('leaf', False):
            return node['treatment_effect']
            
        # Navigate to appropriate child
        if x[node['feature']] <= node['threshold']:
            return self._predict_sample(x, node['left'])
        else:
            return self._predict_sample(x, node['right'])

class CausalForest:
    """
    Causal Forest for estimating heterogeneous treatment effects.
    
    This implements the causal forest algorithm from Wager and Athey (2018)
    for estimating conditional average treatment effects.
    """
    
    def __init__(self, n_estimators: int = 100,
                 max_depth: Optional[int] = None,
                 min_samples_split: int = 2,
                 min_samples_leaf: int = 1,
                 honest: bool = True,
                 subsample_fraction: float = 0.5,
                 random_state: Optional[int] = None):
        """
        Initialize CausalForest.
        
        Args:
            n_estimators: Number of trees in the forest
            max_depth: Maximum depth of trees
            min_samples_split: Minimum samples required to split a node
            min_samples_leaf: Minimum samples required in a leaf
            honest: Whether to use honest splitting
            subsample_fraction: Fraction of samples to use for each tree
            random_state: Random seed for reproducibility
        """
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.honest = honest
        self.subsample_fraction = subsample_fraction
        self.random_state = random_state
        self.trees = []
        self.feature_importances_ = None
        self.oob_predictions = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'CausalForest':
        """
        Fit the causal forest.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted CausalForest
        """
        logger.info(f"Fitting causal forest with {self.n_estimators} trees")
        
        np.random.seed(self.random_state)
        n_samples, n_features = X.shape
        self.trees = []
        
        # Fit multiple trees
        for i in range(self.n_estimators):
            # Subsample data
            subsample_size = int(n_samples * self.subsample_fraction)
            sample_indices = np.random.choice(n_samples, size=subsample_size, replace=True)
            X_sub = X[sample_indices]
            T_sub = T[sample_indices]
            Y_sub = Y[sample_indices]
            
            # Create and fit tree
            tree = CausalTree(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                min_samples_leaf=self.min_samples_leaf,
                honest=self.honest,
                random_state=None  # No need to set for individual trees
            )
            
            tree.fit(X_sub, T_sub, Y_sub)
            self.trees.append(tree)
            
        # Calculate feature importances
        self.feature_importances_ = np.zeros(n_features)
        for tree in self.trees:
            if hasattr(tree, 'feature_importances_') and tree.feature_importances_ is not None:
                self.feature_importances_ += tree.feature_importances_
        self.feature_importances_ /= len(self.trees)
        
        logger.info("Causal forest fitting completed")
        return self
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict treatment effects for new samples.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted treatment effects
        """
        if not self.trees:
            raise ValueError("Forest must be fitted before prediction")
            
        # Get predictions from all trees
        predictions = []
        for tree in self.trees:
            pred = tree.predict(X)
            predictions.append(pred)
            
        # Average predictions across trees
        return np.mean(predictions, axis=0)
        
    def predict_interval(self, X: np.ndarray, alpha: float = 0.05) -> Tuple[np.ndarray, np.ndarray]:
        """
        Predict confidence intervals for treatment effects.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            alpha: Significance level (default: 0.05 for 95% CI)
            
        Returns:
            Tuple of (lower_bounds, upper_bounds)
        """
        if not self.trees:
            raise ValueError("Forest must be fitted before prediction")
            
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
        
        return lower_bounds, upper_bounds
        
    def estimate_ate(self, X: Optional[np.ndarray] = None) -> Tuple[float, Tuple[float, float]]:
        """
        Estimate Average Treatment Effect.
        
        Args:
            X: Covariate matrix for which to estimate ATE (optional, if None uses training data)
            
        Returns:
            Tuple of (ATE, 95% confidence interval)
        """
        if X is None:
            # Use out-of-bag predictions if available, otherwise use training data
            warnings.warn("ATE estimation without specific X uses a simplified approach")
            # This is a simplified implementation
            effects = [tree.tree['treatment_effect'] for tree in self.trees if tree.tree is not None]
            ate = np.mean(effects) if effects else 0.0
            ate_se = np.std(effects) / np.sqrt(len(effects)) if effects else 0.0
            ci_lower = ate - 1.96 * ate_se
            ci_upper = ate + 1.96 * ate_se
            return ate, (ci_lower, ci_upper)
        else:
            # Estimate ATE for specific covariates
            effects = self.predict(X)
            ate = np.mean(effects)
            ate_se = np.std(effects) / np.sqrt(len(effects))
            ci_lower = ate - 1.96 * ate_se
            ci_upper = ate + 1.96 * ate_se
            return ate, (ci_lower, ci_upper)

# Example usage
if __name__ == "__main__":
    # Generate sample data with heterogeneous treatment effects
    np.random.seed(42)
    n_samples = 1000
    n_features = 5
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment assignment
    treatment_prob = 1 / (1 + np.exp(-0.5 * X[:, 0]))  # Treatment depends on first covariate
    T = np.random.binomial(1, treatment_prob, n_samples)
    
    # Generate heterogeneous treatment effects
    # Treatment effect depends on second covariate
    true_effects = 1.0 + 2.0 * X[:, 1]  # Baseline effect of 1 plus modifier
    
    # Generate outcomes
    Y = X[:, 0] + T * true_effects + np.random.normal(0, 1, n_samples)
    
    print("=== Causal Forest Example ===")
    
    # Fit causal forest
    cf = CausalForest(n_estimators=50, honest=True, random_state=42)
    cf.fit(X, T, Y)
    
    # Predict treatment effects
    predicted_effects = cf.predict(X[:10])  # Predict for first 10 samples
    true_effects_sample = true_effects[:10]
    
    print("True vs Predicted Treatment Effects (first 10 samples):")
    for i in range(10):
        print(f"Sample {i+1}: True={true_effects_sample[i]:.3f}, Predicted={predicted_effects[i]:.3f}")
        
    # Estimate ATE
    ate, ate_ci = cf.estimate_ate(X)
    print(f"\nEstimated ATE: {ate:.3f} (95% CI: [{ate_ci[0]:.3f}, {ate_ci[1]:.3f}])")
    
    # Predict confidence intervals
    lower_bounds, upper_bounds = cf.predict_interval(X[:5])
    print("\nConfidence Intervals for first 5 samples:")
    for i in range(5):
        print(f"Sample {i+1}: [{lower_bounds[i]:.3f}, {upper_bounds[i]:.3f}]")