"""
Enhanced Newsvendor Model with ML Demand Distribution Inputs

This module implements an enhanced Newsvendor model that uses ML-based demand
distribution estimation instead of traditional statistical methods.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple, List
from scipy import stats
from scipy.optimize import minimize_scalar
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EnhancedNewsvendorModel:
    """Enhanced Newsvendor model with ML demand distribution inputs."""
    
    def __init__(self, 
                 holding_cost: float,
                 shortage_cost: float,
                 demand_model: Optional[Any] = None,
                 distribution_type: str = 'normal'):
        """
        Initialize the enhanced Newsvendor model.
        
        Args:
            holding_cost: Cost per unit per period for holding inventory
            shortage_cost: Cost per unit per period for stockouts
            demand_model: ML model for demand forecasting (optional)
            distribution_type: Type of demand distribution ('normal', 'gamma', 'poisson', 'empirical')
        """
        self.holding_cost = holding_cost
        self.shortage_cost = shortage_cost
        self.demand_model = demand_model
        self.distribution_type = distribution_type
        self.optimal_order_quantity = None
        self.demand_distribution_params = {}
        self.is_fitted = False
        
    def _estimate_demand_distribution(self, 
                                     historical_demand: np.ndarray,
                                     forecast: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Estimate demand distribution parameters using ML or statistical methods.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            
        Returns:
            Dictionary with distribution parameters
        """
        if self.distribution_type == 'normal':
            if forecast is not None:
                # Use ML forecast as mean, estimate std from residuals
                mean = np.mean(forecast)
                residuals = historical_demand - forecast[:len(historical_demand)]
                std = np.std(residuals) if len(residuals) > 0 else np.std(historical_demand)
            else:
                # Use statistical estimation
                mean = np.mean(historical_demand)
                std = np.std(historical_demand)
                
            return {
                'type': 'normal',
                'mean': mean,
                'std': std,
                'loc': mean,
                'scale': std
            }
            
        elif self.distribution_type == 'gamma':
            if forecast is not None:
                # Use ML forecast as mean, estimate shape/scale
                mean = np.mean(forecast)
                std = np.std(historical_demand)
                shape = (mean / std) ** 2
                scale = std ** 2 / mean
            else:
                # Use statistical estimation
                mean = np.mean(historical_demand)
                std = np.std(historical_demand)
                shape = (mean / std) ** 2 if std > 0 else 1.0
                scale = std ** 2 / mean if mean > 0 else 1.0
                
            return {
                'type': 'gamma',
                'shape': shape,
                'scale': scale,
                'loc': 0
            }
            
        elif self.distribution_type == 'poisson':
            if forecast is not None:
                # Use ML forecast as lambda
                lam = np.mean(forecast)
            else:
                # Use statistical estimation
                lam = np.mean(historical_demand)
                
            return {
                'type': 'poisson',
                'lam': lam
            }
            
        elif self.distribution_type == 'empirical':
            # Use empirical distribution
            return {
                'type': 'empirical',
                'values': historical_demand,
                'weights': np.ones(len(historical_demand)) / len(historical_demand)
            }
            
        else:
            raise ValueError(f"Unsupported distribution type: {self.distribution_type}")
    
    def _calculate_critical_ratio(self) -> float:
        """
        Calculate the critical ratio (Cu / (Cu + Co)).
        
        Returns:
            Critical ratio
        """
        cu = self.shortage_cost  # Underage cost (shortage)
        co = self.holding_cost   # Overage cost (holding)
        
        if cu + co == 0:
            return 0.5  # Default to 50% if costs are zero
            
        return cu / (cu + co)
    
    def _calculate_optimal_quantity_normal(self, mean: float, std: float) -> float:
        """
        Calculate optimal order quantity for normal distribution.
        
        Args:
            mean: Mean of demand distribution
            std: Standard deviation of demand distribution
            
        Returns:
            Optimal order quantity
        """
        critical_ratio = self._calculate_critical_ratio()
        
        # Find quantile corresponding to critical ratio
        z_score = stats.norm.ppf(critical_ratio, loc=0, scale=1)
        
        optimal_qty = mean + z_score * std
        
        return max(0, optimal_qty)
    
    def _calculate_optimal_quantity_gamma(self, shape: float, scale: float) -> float:
        """
        Calculate optimal order quantity for gamma distribution.
        
        Args:
            shape: Shape parameter
            scale: Scale parameter
            
        Returns:
            Optimal order quantity
        """
        critical_ratio = self._calculate_critical_ratio()
        
        # Find quantile corresponding to critical ratio
        optimal_qty = stats.gamma.ppf(critical_ratio, a=shape, scale=scale)
        
        return max(0, optimal_qty)
    
    def _calculate_optimal_quantity_poisson(self, lam: float) -> float:
        """
        Calculate optimal order quantity for Poisson distribution.
        
        Args:
            lam: Lambda parameter (mean)
            
        Returns:
            Optimal order quantity
        """
        critical_ratio = self._calculate_critical_ratio()
        
        # Find quantile corresponding to critical ratio
        optimal_qty = stats.poisson.ppf(critical_ratio, mu=lam)
        
        return max(0, optimal_qty)
    
    def _calculate_optimal_quantity_empirical(self, values: np.ndarray, 
                                              weights: np.ndarray) -> float:
        """
        Calculate optimal order quantity for empirical distribution.
        
        Args:
            values: Demand values
            weights: Weights for each value
            
        Returns:
            Optimal order quantity
        """
        critical_ratio = self._calculate_critical_ratio()
        
        # Sort values and calculate cumulative weights
        sorted_indices = np.argsort(values)
        sorted_values = values[sorted_indices]
        sorted_weights = weights[sorted_indices]
        cumulative_weights = np.cumsum(sorted_weights)
        
        # Find value where cumulative weight >= critical ratio
        idx = np.searchsorted(cumulative_weights, critical_ratio)
        
        if idx >= len(sorted_values):
            optimal_qty = sorted_values[-1]
        else:
            optimal_qty = sorted_values[idx]
            
        return max(0, optimal_qty)
    
    def fit(self, 
            historical_demand: np.ndarray,
            forecast: Optional[np.ndarray] = None,
            features: Optional[pd.DataFrame] = None) -> 'EnhancedNewsvendorModel':
        """
        Fit the Newsvendor model to historical demand data.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            features: Feature data for ML model (optional)
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting enhanced Newsvendor model")
        
        # Generate forecast if ML model provided
        if self.demand_model is not None and features is not None:
            try:
                if hasattr(self.demand_model, 'predict'):
                    forecast = self.demand_model.predict(features)
                    logger.info("Generated ML-based demand forecast")
                else:
                    logger.warning("Demand model does not have predict method")
            except Exception as e:
                logger.warning(f"Failed to generate ML forecast: {e}")
        
        # Estimate demand distribution
        self.demand_distribution_params = self._estimate_demand_distribution(
            historical_demand, forecast
        )
        
        # Calculate optimal order quantity
        dist_params = self.demand_distribution_params
        
        if dist_params['type'] == 'normal':
            self.optimal_order_quantity = self._calculate_optimal_quantity_normal(
                dist_params['mean'], dist_params['std']
            )
        elif dist_params['type'] == 'gamma':
            self.optimal_order_quantity = self._calculate_optimal_quantity_gamma(
                dist_params['shape'], dist_params['scale']
            )
        elif dist_params['type'] == 'poisson':
            self.optimal_order_quantity = self._calculate_optimal_quantity_poisson(
                dist_params['lam']
            )
        elif dist_params['type'] == 'empirical':
            self.optimal_order_quantity = self._calculate_optimal_quantity_empirical(
                dist_params['values'], dist_params['weights']
            )
        
        self.is_fitted = True
        logger.info(f"Optimal order quantity: {self.optimal_order_quantity:.2f}")
        
        return self
    
    def predict_optimal_quantity(self) -> float:
        """
        Get the optimal order quantity.
        
        Returns:
            Optimal order quantity
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting optimal quantity")
            
        return self.optimal_order_quantity
    
    def calculate_expected_cost(self, order_quantity: float) -> float:
        """
        Calculate expected cost for a given order quantity.
        
        Args:
            order_quantity: Order quantity to evaluate
            
        Returns:
            Expected cost
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating expected cost")
            
        dist_params = self.demand_distribution_params
        
        # Calculate expected overage and underage
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            
            # Expected overage: E[max(Q - D, 0)]
            z = (order_quantity - mean) / std if std > 0 else 0
            expected_overage = std * (z * stats.norm.cdf(z) + stats.norm.pdf(z))
            
            # Expected underage: E[max(D - Q, 0)]
            expected_underage = mean - order_quantity + expected_overage
            
        elif dist_params['type'] == 'gamma':
            shape = dist_params['shape']
            scale = dist_params['scale']
            mean = shape * scale
            
            # Approximate expected overage and underage
            z = (order_quantity - mean) / (np.sqrt(shape) * scale) if scale > 0 else 0
            expected_overage = np.sqrt(shape) * scale * (z * stats.norm.cdf(z) + stats.norm.pdf(z))
            expected_underage = mean - order_quantity + expected_overage
            
        elif dist_params['type'] == 'poisson':
            lam = dist_params['lam']
            
            # Calculate expected overage and underage for Poisson
            expected_overage = sum(
                max(0, order_quantity - d) * stats.poisson.pmf(d, mu=lam)
                for d in range(int(order_quantity * 2))
            )
            expected_underage = sum(
                max(0, d - order_quantity) * stats.poisson.pmf(d, mu=lam)
                for d in range(int(order_quantity * 2))
            )
            
        elif dist_params['type'] == 'empirical':
            values = dist_params['values']
            weights = dist_params['weights']
            
            expected_overage = sum(
                max(0, order_quantity - d) * w
                for d, w in zip(values, weights)
            )
            expected_underage = sum(
                max(0, d - order_quantity) * w
                for d, w in zip(values, weights)
            )
        else:
            raise ValueError(f"Unsupported distribution type: {dist_params['type']}")
        
        # Total expected cost
        expected_cost = (self.holding_cost * expected_overage + 
                        self.shortage_cost * expected_underage)
        
        return expected_cost
    
    def calculate_service_level(self, order_quantity: float) -> float:
        """
        Calculate service level (fill rate) for a given order quantity.
        
        Args:
            order_quantity: Order quantity to evaluate
            
        Returns:
            Service level (0-1)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating service level")
            
        dist_params = self.demand_distribution_params
        
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            service_level = stats.norm.cdf(order_quantity, loc=mean, scale=std)
            
        elif dist_params['type'] == 'gamma':
            shape = dist_params['shape']
            scale = dist_params['scale']
            service_level = stats.gamma.cdf(order_quantity, a=shape, scale=scale)
            
        elif dist_params['type'] == 'poisson':
            lam = dist_params['lam']
            service_level = stats.poisson.cdf(order_quantity, mu=lam)
            
        elif dist_params['type'] == 'empirical':
            values = dist_params['values']
            weights = dist_params['weights']
            service_level = sum(
                w for d, w in zip(values, weights) if d <= order_quantity
            )
        else:
            raise ValueError(f"Unsupported distribution type: {dist_params['type']}")
        
        return min(1.0, max(0.0, service_level))
    
    def get_model_summary(self) -> Dict[str, Any]:
        """
        Get summary of the fitted model.
        
        Returns:
            Dictionary with model summary
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before getting summary")
            
        summary = {
            'optimal_order_quantity': self.optimal_order_quantity,
            'holding_cost': self.holding_cost,
            'shortage_cost': self.shortage_cost,
            'critical_ratio': self._calculate_critical_ratio(),
            'distribution_type': self.distribution_type,
            'distribution_params': self.demand_distribution_params,
            'expected_cost': self.calculate_expected_cost(self.optimal_order_quantity),
            'service_level': self.calculate_service_level(self.optimal_order_quantity)
        }
        
        return summary

