"""
Uplift Modeling for Causal Inference

This module implements uplift modeling techniques for estimating heterogeneous treatment effects
and optimizing treatment assignment decisions.
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional, Tuple, Union
import logging
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.tree import DecisionTreeClassifier
import warnings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UpliftRandomForest:
    """
    Uplift Random Forest for estimating heterogeneous treatment effects.
    
    This implements the Class Variable Transformation (CVT) approach where
    separate models are trained for treatment and control groups.
    """
    
    def __init__(self, n_estimators: int = 100,
                 max_depth: Optional[int] = None,
                 min_samples_split: int = 2,
                 min_samples_leaf: int = 1,
                 random_state: Optional[int] = None):
        """
        Initialize UpliftRandomForest.
        
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
        self.treatment_model = None
        self.control_model = None
        self.feature_importances_ = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'UpliftRandomForest':
        """
        Fit the uplift random forest.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted UpliftRandomForest
        """
        logger.info("Fitting uplift random forest")
        
        np.random.seed(self.random_state)
        
        # Separate treatment and control groups
        treatment_mask = T == 1
        control_mask = T == 0
        
        X_treatment, Y_treatment = X[treatment_mask], Y[treatment_mask]
        X_control, Y_control = X[control_mask], Y[control_mask]
        
        # Fit separate models for treatment and control groups
        self.treatment_model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=self.random_state
        )
        
        self.control_model = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=self.min_samples_split,
            min_samples_leaf=self.min_samples_leaf,
            random_state=self.random_state
        )
        
        self.treatment_model.fit(X_treatment, Y_treatment)
        self.control_model.fit(X_control, Y_control)
        
        # Calculate feature importances as difference between treatment and control
        if (hasattr(self.treatment_model, 'feature_importances_') and 
            hasattr(self.control_model, 'feature_importances_')):
            self.feature_importances_ = (
                self.treatment_model.feature_importances_ - 
                self.control_model.feature_importances_
            )
        else:
            self.feature_importances_ = np.zeros(X.shape[1])
            
        logger.info("Uplift random forest fitting completed")
        return self
        
    def predict_uplift(self, X: np.ndarray) -> np.ndarray:
        """
        Predict uplift (conditional average treatment effect) for new samples.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted uplift values
        """
        if self.treatment_model is None or self.control_model is None:
            raise ValueError("Model must be fitted before prediction")
            
        # Predict outcomes for treatment and control
        treatment_pred = self.treatment_model.predict(X)
        control_pred = self.control_model.predict(X)
        
        # Uplift is the difference
        uplift = treatment_pred - control_pred
        return uplift
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Alias for predict_uplift for consistency.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted uplift values
        """
        return self.predict_uplift(X)
        
    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Predict probability of positive uplift for classification tasks.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of probabilities of positive uplift
        """
        uplift = self.predict_uplift(X)
        # Convert uplift to probability using sigmoid
        prob_positive = 1 / (1 + np.exp(-uplift))
        return np.column_stack([1 - prob_positive, prob_positive])

class UpliftKNN:
    """
    Uplift k-Nearest Neighbors for estimating treatment effects.
    
    This implements a simplified version of uplift k-NN where treatment effects
    are estimated based on similar individuals in the training data.
    """
    
    def __init__(self, n_neighbors: int = 5, p: int = 2):
        """
        Initialize UpliftKNN.
        
        Args:
            n_neighbors: Number of neighbors to consider
            p: Power parameter for Minkowski distance (p=2 for Euclidean)
        """
        self.n_neighbors = n_neighbors
        self.p = p
        self.X_train = None
        self.T_train = None
        self.Y_train = None
        
    def fit(self, X: np.ndarray, T: np.ndarray, Y: np.ndarray) -> 'UpliftKNN':
        """
        Fit the uplift k-NN model.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            
        Returns:
            Fitted UpliftKNN
        """
        logger.info("Fitting uplift k-NN")
        
        # Store training data
        self.X_train = X.copy()
        self.T_train = T.copy()
        self.Y_train = Y.copy()
        
        logger.info("Uplift k-NN fitting completed")
        return self
        
    def predict_uplift(self, X: np.ndarray) -> np.ndarray:
        """
        Predict uplift for new samples using k-NN.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted uplift values
        """
        if self.X_train is None:
            raise ValueError("Model must be fitted before prediction")
            
        n_samples = X.shape[0]
        uplift_predictions = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Calculate distances to all training samples
            distances = np.linalg.norm(
                self.X_train - X[i], ord=self.p, axis=1)
                
            # Find k nearest neighbors
            nearest_indices = np.argpartition(distances, self.n_neighbors)[:self.n_neighbors]
            
            # Calculate treatment effects for neighbors
            neighbor_treatments = self.T_train[nearest_indices]
            neighbor_outcomes = self.Y_train[nearest_indices]
            
            # Separate treated and control neighbors
            treated_mask = neighbor_treatments == 1
            control_mask = neighbor_treatments == 0
            
            if np.sum(treated_mask) > 0 and np.sum(control_mask) > 0:
                treated_outcomes = neighbor_outcomes[treated_mask]
                control_outcomes = neighbor_outcomes[control_mask]
                
                # Estimate uplift as difference in means
                uplift = np.mean(treated_outcomes) - np.mean(control_outcomes)
            else:
                # Not enough samples in both groups, use overall mean difference
                uplift = 0.0
                
            uplift_predictions[i] = uplift
            
        return uplift_predictions
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Alias for predict_uplift for consistency.
        
        Args:
            X: Covariate matrix (n_samples, n_features)
            
        Returns:
            Array of predicted uplift values
        """
        return self.predict_uplift(X)

class UpliftEvaluator:
    """
    Evaluator for uplift models using Qini curves and uplift metrics.
    """
    
    def __init__(self):
        """Initialize UpliftEvaluator."""
        pass
        
    def calculate_uplift_metrics(self, T: np.ndarray, Y: np.ndarray, 
                              uplift_scores: np.ndarray) -> Dict[str, float]:
        """
        Calculate various uplift metrics.
        
        Args:
            T: Treatment vector (n_samples,)
            Y: Outcome vector (n_samples,)
            uplift_scores: Predicted uplift scores (n_samples,)
            
        Returns:
            Dictionary with uplift metrics
        """
        # Sort by uplift scores (descending)
        sorted_indices = np.argsort(uplift_scores)[::-1]
        T_sorted = T[sorted_indices]
        Y_sorted = Y[sorted_indices]
        uplift_sorted = uplift_scores[sorted_indices]
        
        n_samples = len(T_sorted)
        n_treated = np.sum(T_sorted)
        n_control = n_samples - n_treated
        
        # Calculate cumulative gains
        cum_treated_outcomes = np.cumsum(Y_sorted * T_sorted)
        cum_control_outcomes = np.cumsum(Y_sorted * (1 - T_sorted))
        
        # Avoid division by zero
        treated_rate = n_treated / n_samples if n_samples > 0 else 0
        control_rate = n_control / n_samples if n_samples > 0 else 0
        
        # Calculate Qini curve values
        qini_curve = np.zeros(n_samples)
        for i in range(n_samples):
            if i + 1 > 0:
                treated_share = np.sum(T_sorted[:i+1]) / (i + 1) if i + 1 > 0 else 0
                control_share = np.sum(1 - T_sorted[:i+1]) / (i + 1) if i + 1 > 0 else 0
                if treated_share > 0 and control_share > 0:
                    qini_curve[i] = (
                        cum_treated_outcomes[i] / np.sum(T_sorted[:i+1]) * treated_share -
                        cum_control_outcomes[i] / np.sum(1 - T_sorted[:i+1]) * control_share
                    ) * (i + 1) / n_samples
                else:
                    qini_curve[i] = 0
                    
        # Calculate Qini coefficient (area between Qini curve and diagonal)
        # Simplified calculation
        qini_coefficient = np.mean(qini_curve)  # Very simplified
        
        # Calculate expected response rates
        expected_response_treated = np.mean(Y_sorted[T_sorted == 1]) if np.sum(T_sorted) > 0 else 0
        expected_response_control = np.mean(Y_sorted[T_sorted == 0]) if np.sum(1 - T_sorted) > 0 else 0
        
        # Calculate uplift at k (top 30% of population)
        k = int(0.3 * n_samples)
        if k > 0:
            top_k_treated = Y_sorted[:k][T_sorted[:k] == 1]
            top_k_control = Y_sorted[:k][T_sorted[:k] == 0]
            uplift_at_k = (np.mean(top_k_treated) if len(top_k_treated) > 0 else 0) - \
                         (np.mean(top_k_control) if len(top_k_control) > 0 else 0)
        else:
            uplift_at_k = 0
            
        metrics = {
            'qini_coefficient': qini_coefficient,
            'expected_response_treated': expected_response_treated,
            'expected_response_control': expected_response_control,
            'uplift_at_k': uplift_at_k,
            'overall_uplift': expected_response_treated - expected_response_control
        }
        
        return metrics
        
    def plot_qini_curve(self, T: np.ndarray, Y: np.ndarray, 
                       uplift_scores: np.ndarray,
                       random_line: bool = True) -> None:
        """
        Plot Qini curve (simplified textual representation).
        
        Args:
            T: Treatment vector
            Y: Outcome vector
            uplift_scores: Predicted uplift scores
            random_line: Whether to include random selection line
        """
        # This is a simplified textual representation
        # In practice, you would use matplotlib or similar
        metrics = self.calculate_uplift_metrics(T, Y, uplift_scores)
        print(f"Qini Coefficient: {metrics['qini_coefficient']:.4f}")
        print(f"Overall Uplift: {metrics['overall_uplift']:.4f}")
        print(f"Uplift at Top 30%: {metrics['uplift_at_k']:.4f}")

class UpliftOptimizer:
    """
    Optimizer for treatment assignment based on uplift predictions.
    """
    
    def __init__(self, budget_constraint: Optional[float] = None):
        """
        Initialize UpliftOptimizer.
        
        Args:
            budget_constraint: Maximum fraction of population to treat (None for no constraint)
        """
        self.budget_constraint = budget_constraint
        
    def optimize_treatment_assignment(self, uplift_scores: np.ndarray, 
                                   treatment_cost: float = 1.0,
                                   treatment_benefit: float = 1.0) -> np.ndarray:
        """
        Optimize treatment assignment based on uplift scores.
        
        Args:
            uplift_scores: Predicted uplift scores
            treatment_cost: Cost of treatment per unit
            treatment_benefit: Benefit per unit of positive outcome
            
        Returns:
            Boolean array indicating who should be treated
        """
        n_samples = len(uplift_scores)
        
        # Net benefit per unit = uplift * benefit - cost
        net_benefit = uplift_scores * treatment_benefit - treatment_cost
        
        # Treat those with positive net benefit
        treatment_assignment = net_benefit > 0
        
        # Apply budget constraint if specified
        if self.budget_constraint is not None:
            max_treatments = int(self.budget_constraint * n_samples)
            if np.sum(treatment_assignment) > max_treatments:
                # Sort by net benefit and treat top max_treatments
                sorted_indices = np.argsort(net_benefit)[::-1]
                treatment_assignment = np.zeros(n_samples, dtype=bool)
                treatment_assignment[sorted_indices[:max_treatments]] = True
                
        return treatment_assignment
        
    def calculate_expected_gain(self, uplift_scores: np.ndarray, 
                              treatment_assignment: np.ndarray,
                              treatment_cost: float = 1.0,
                              treatment_benefit: float = 1.0) -> float:
        """
        Calculate expected gain from treatment assignment.
        
        Args:
            uplift_scores: Predicted uplift scores
            treatment_assignment: Boolean array of treatment assignments
            treatment_cost: Cost of treatment per unit
            treatment_benefit: Benefit per unit of positive outcome
            
        Returns:
            Expected total gain
        """
        # Expected gain = sum of (uplift * benefit - cost) for treated units
        net_benefit = uplift_scores * treatment_benefit - treatment_cost
        expected_gain = np.sum(net_benefit[treatment_assignment])
        return expected_gain

# Example usage
if __name__ == "__main__":
    # Generate sample data with uplift patterns
    np.random.seed(42)
    n_samples = 1000
    n_features = 4
    
    # Generate covariates
    X = np.random.normal(0, 1, (n_samples, n_features))
    
    # Generate treatment assignment
    T = np.random.binomial(1, 0.5, n_samples)  # Random treatment assignment
    
    # Generate heterogeneous treatment effects
    # Treatment effect depends on first covariate
    treatment_effect = 1.0 + 2.0 * X[:, 0]  # Positive effect for high X[:, 0]
    
    # Generate outcomes
    # Control outcome depends on second covariate
    control_outcome = 0.5 * X[:, 1] + np.random.normal(0, 1, n_samples)
    # Treated outcome = control + treatment effect
    treated_outcome = control_outcome + treatment_effect
    # Actual outcome based on treatment assignment
    Y = np.where(T == 1, treated_outcome, control_outcome)
    
    print("=== Uplift Modeling Example ===")
    
    # Test Uplift Random Forest
    uplift_rf = UpliftRandomForest(n_estimators=50, random_state=42)
    uplift_rf.fit(X, T, Y)
    
    # Predict uplift
    uplift_predictions = uplift_rf.predict_uplift(X[:10])
    true_effects_sample = treatment_effect[:10]
    
    print("True vs Predicted Uplift (first 10 samples):")
    for i in range(10):
        print(f"Sample {i+1}: True={true_effects_sample[i]:.3f}, Predicted={uplift_predictions[i]:.3f}")
        
    # Test Uplift KNN
    uplift_knn = UpliftKNN(n_neighbors=10)
    uplift_knn.fit(X, T, Y)
    
    uplift_knn_predictions = uplift_knn.predict_uplift(X[:10])
    print("\nUplift KNN Predictions (first 10 samples):")
    for i in range(10):
        print(f"Sample {i+1}: {uplift_knn_predictions[i]:.3f}")
        
    # Evaluate uplift model
    evaluator = UpliftEvaluator()
    metrics = evaluator.calculate_uplift_metrics(T, Y, uplift_predictions)
    print(f"\nUplift Metrics:")
    print(f"  Qini Coefficient: {metrics['qini_coefficient']:.4f}")
    print(f"  Overall Uplift: {metrics['overall_uplift']:.4f}")
    print(f"  Uplift at Top 30%: {metrics['uplift_at_k']:.4f}")
    
    # Optimize treatment assignment
    optimizer = UpliftOptimizer(budget_constraint=0.3)  # Treat at most 30% of population
    treatment_assignment = optimizer.optimize_treatment_assignment(uplift_predictions)
    expected_gain = optimizer.calculate_expected_gain(uplift_predictions, treatment_assignment)
    
    print(f"\nTreatment Assignment Optimization:")
    print(f"  Number to treat: {np.sum(treatment_assignment)}")
    print(f"  Expected gain: {expected_gain:.2f}")