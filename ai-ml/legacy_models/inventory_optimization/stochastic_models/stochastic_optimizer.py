"""
Stochastic Inventory Optimization Algorithms

This module implements stochastic inventory optimization algorithms that can
handle uncertainty in demand, lead times, and costs.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple, List, Callable
from scipy import stats
from scipy.optimize import minimize, differential_evolution
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class StochasticInventoryOptimizer:
    """Stochastic inventory optimization algorithms."""
    
    def __init__(self,
                 holding_cost: float,
                 ordering_cost: float,
                 shortage_cost: float,
                 lead_time: int = 1,
                 demand_model: Optional[Any] = None,
                 distribution_type: str = 'normal'):
        """
        Initialize the stochastic inventory optimizer.
        
        Args:
            holding_cost: Cost per unit per period for holding inventory
            ordering_cost: Fixed cost per order
            shortage_cost: Cost per unit per period for stockouts
            lead_time: Lead time in periods
            demand_model: ML model for demand forecasting (optional)
            distribution_type: Type of demand distribution
        """
        self.holding_cost = holding_cost
        self.ordering_cost = ordering_cost
        self.shortage_cost = shortage_cost
        self.lead_time = lead_time
        self.demand_model = demand_model
        self.distribution_type = distribution_type
        self.optimal_policy = None
        self.demand_distribution_params = {}
        self.is_fitted = False
        
    def _estimate_demand_distribution(self,
                                     historical_demand: np.ndarray,
                                     forecast: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Estimate demand distribution parameters.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            
        Returns:
            Dictionary with distribution parameters
        """
        if self.distribution_type == 'normal':
            if forecast is not None:
                mean = np.mean(forecast)
                residuals = historical_demand - forecast[:len(historical_demand)]
                std = np.std(residuals) if len(residuals) > 0 else np.std(historical_demand)
            else:
                mean = np.mean(historical_demand)
                std = np.std(historical_demand)
                
            return {
                'type': 'normal',
                'mean': mean,
                'std': std
            }
        elif self.distribution_type == 'gamma':
            if forecast is not None:
                mean = np.mean(forecast)
                std = np.std(historical_demand)
            else:
                mean = np.mean(historical_demand)
                std = np.std(historical_demand)
                
            shape = (mean / std) ** 2 if std > 0 else 1.0
            scale = std ** 2 / mean if mean > 0 else 1.0
            
            return {
                'type': 'gamma',
                'shape': shape,
                'scale': scale
            }
        elif self.distribution_type == 'poisson':
            if forecast is not None:
                lam = np.mean(forecast)
            else:
                lam = np.mean(historical_demand)
                
            return {
                'type': 'poisson',
                'lam': lam
            }
        else:
            raise ValueError(f"Unsupported distribution type: {self.distribution_type}")
    
    def _simulate_demand(self, n_samples: int = 1000) -> np.ndarray:
        """
        Simulate demand samples from the estimated distribution.
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            Array of demand samples
        """
        dist_params = self.demand_distribution_params
        
        if dist_params['type'] == 'normal':
            samples = np.random.normal(
                dist_params['mean'],
                dist_params['std'],
                n_samples
            )
        elif dist_params['type'] == 'gamma':
            samples = np.random.gamma(
                dist_params['shape'],
                dist_params['scale'],
                n_samples
            )
        elif dist_params['type'] == 'poisson':
            samples = np.random.poisson(
                dist_params['lam'],
                n_samples
            )
        else:
            raise ValueError(f"Unsupported distribution type: {dist_params['type']}")
        
        return np.maximum(0, samples)  # Ensure non-negative
    
    def _calculate_cost_function(self, order_quantity: float,
                                demand_samples: np.ndarray) -> float:
        """
        Calculate expected cost for a given order quantity using Monte Carlo simulation.
        
        Args:
            order_quantity: Order quantity to evaluate
            demand_samples: Demand samples for simulation
            
        Returns:
            Expected cost
        """
        # Calculate costs for each demand scenario
        costs = []
        
        for demand in demand_samples:
            # Overage cost (holding)
            overage = max(0, order_quantity - demand)
            overage_cost = self.holding_cost * overage
            
            # Underage cost (shortage)
            underage = max(0, demand - order_quantity)
            underage_cost = self.shortage_cost * underage
            
            # Total cost for this scenario
            total_cost = overage_cost + underage_cost
            costs.append(total_cost)
        
        # Expected cost
        expected_cost = np.mean(costs)
        
        return expected_cost
    
    def optimize_newsvendor(self,
                           historical_demand: np.ndarray,
                           forecast: Optional[np.ndarray] = None,
                           features: Optional[pd.DataFrame] = None,
                           n_samples: int = 1000) -> Dict[str, Any]:
        """
        Optimize single-period Newsvendor problem using stochastic optimization.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            features: Feature data for ML model (optional)
            n_samples: Number of Monte Carlo samples
            
        Returns:
            Dictionary with optimal policy and metrics
        """
        logger.info("Optimizing Newsvendor problem using stochastic optimization")
        
        # Generate forecast if ML model provided
        if self.demand_model is not None and features is not None:
            try:
                if hasattr(self.demand_model, 'predict'):
                    forecast = self.demand_model.predict(features)
                    logger.info("Generated ML-based demand forecast")
            except Exception as e:
                logger.warning(f"Failed to generate ML forecast: {e}")
        
        # Estimate demand distribution
        self.demand_distribution_params = self._estimate_demand_distribution(
            historical_demand, forecast
        )
        
        # Generate demand samples
        demand_samples = self._simulate_demand(n_samples)
        
        # Optimize using differential evolution
        def objective(q):
            return self._calculate_cost_function(q, demand_samples)
        
        # Bounds: order quantity >= 0
        bounds = [(0, np.max(demand_samples) * 2)]
        
        # Optimize
        result = differential_evolution(objective, bounds, seed=42)
        
        optimal_qty = result.x[0]
        optimal_cost = result.fun
        
        self.optimal_policy = {
            'type': 'newsvendor',
            'order_quantity': optimal_qty,
            'expected_cost': optimal_cost
        }
        
        self.is_fitted = True
        
        logger.info(f"Optimal order quantity: {optimal_qty:.2f}")
        logger.info(f"Expected cost: {optimal_cost:.2f}")
        
        return self.optimal_policy
    
    def optimize_multi_period(self,
                             historical_demand: np.ndarray,
                             forecast: Optional[np.ndarray] = None,
                             features: Optional[pd.DataFrame] = None,
                             n_periods: int = 10,
                             n_samples: int = 1000) -> Dict[str, Any]:
        """
        Optimize multi-period inventory problem using stochastic optimization.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            features: Feature data for ML model (optional)
            n_periods: Number of periods to optimize
            n_samples: Number of Monte Carlo samples
            
        Returns:
            Dictionary with optimal policy and metrics
        """
        logger.info(f"Optimizing {n_periods}-period inventory problem")
        
        # Generate forecast if ML model provided
        if self.demand_model is not None and features is not None:
            try:
                if hasattr(self.demand_model, 'predict'):
                    forecast = self.demand_model.predict(features)
                    logger.info("Generated ML-based demand forecast")
            except Exception as e:
                logger.warning(f"Failed to generate ML forecast: {e}")
        
        # Estimate demand distribution
        self.demand_distribution_params = self._estimate_demand_distribution(
            historical_demand, forecast
        )
        
        # Generate demand samples for each period
        demand_samples_period = [self._simulate_demand(n_samples) for _ in range(n_periods)]
        
        # Optimize using dynamic programming or heuristic
        # For simplicity, we'll use a heuristic approach
        optimal_quantities = []
        total_cost = 0.0
        
        for period in range(n_periods):
            demand_samples = demand_samples_period[period]
            
            # Optimize for this period
            def objective(q):
                return self._calculate_cost_function(q, demand_samples)
            
            bounds = [(0, np.max(demand_samples) * 2)]
            result = differential_evolution(objective, bounds, seed=42)
            
            optimal_qty = result.x[0]
            optimal_quantities.append(optimal_qty)
            total_cost += result.fun
        
        self.optimal_policy = {
            'type': 'multi_period',
            'order_quantities': optimal_quantities,
            'total_expected_cost': total_cost,
            'average_order_quantity': np.mean(optimal_quantities)
        }
        
        self.is_fitted = True
        
        logger.info(f"Optimal order quantities: {optimal_quantities}")
        logger.info(f"Total expected cost: {total_cost:.2f}")
        
        return self.optimal_policy
    
    def optimize_with_constraints(self,
                                  historical_demand: np.ndarray,
                                  constraints: Dict[str, Any],
                                  forecast: Optional[np.ndarray] = None,
                                  features: Optional[pd.DataFrame] = None,
                                  n_samples: int = 1000) -> Dict[str, Any]:
        """
        Optimize inventory with constraints (budget, capacity, service level).
        
        Args:
            historical_demand: Historical demand data
            constraints: Dictionary with constraints (budget, capacity, service_level)
            forecast: ML-based demand forecast (optional)
            features: Feature data for ML model (optional)
            n_samples: Number of Monte Carlo samples
            
        Returns:
            Dictionary with optimal policy and metrics
        """
        logger.info("Optimizing inventory with constraints")
        
        # Generate forecast if ML model provided
        if self.demand_model is not None and features is not None:
            try:
                if hasattr(self.demand_model, 'predict'):
                    forecast = self.demand_model.predict(features)
                    logger.info("Generated ML-based demand forecast")
            except Exception as e:
                logger.warning(f"Failed to generate ML forecast: {e}")
        
        # Estimate demand distribution
        self.demand_distribution_params = self._estimate_demand_distribution(
            historical_demand, forecast
        )
        
        # Generate demand samples
        demand_samples = self._simulate_demand(n_samples)
        
        # Define constraints
        budget = constraints.get('budget', None)
        capacity = constraints.get('capacity', None)
        service_level = constraints.get('service_level', None)
        
        # Optimize with constraints
        def objective(q):
            return self._calculate_cost_function(q, demand_samples)
        
        # Define constraint functions
        constraints_list = []
        
        if budget is not None:
            def budget_constraint(q):
                return budget - (self.ordering_cost + self.holding_cost * q)
            constraints_list.append({'type': 'ineq', 'fun': budget_constraint})
        
        if capacity is not None:
            def capacity_constraint(q):
                return capacity - q
            constraints_list.append({'type': 'ineq', 'fun': capacity_constraint})
        
        if service_level is not None:
            def service_level_constraint(q):
                # Calculate service level
                dist_params = self.demand_distribution_params
                if dist_params['type'] == 'normal':
                    mean = dist_params['mean']
                    std = dist_params['std']
                    sl = stats.norm.cdf(q, loc=mean, scale=std)
                elif dist_params['type'] == 'gamma':
                    shape = dist_params['shape']
                    scale = dist_params['scale']
                    sl = stats.gamma.cdf(q, a=shape, scale=scale)
                elif dist_params['type'] == 'poisson':
                    lam = dist_params['lam']
                    sl = stats.poisson.cdf(q, mu=lam)
                else:
                    sl = 0.5
                return sl - service_level
            constraints_list.append({'type': 'ineq', 'fun': service_level_constraint})
        
        # Bounds
        bounds = [(0, np.max(demand_samples) * 2)]
        
        # Optimize
        if constraints_list:
            result = minimize(objective, x0=[np.mean(demand_samples)], 
                            method='SLSQP', bounds=bounds, constraints=constraints_list)
        else:
            result = differential_evolution(objective, bounds, seed=42)
        
        optimal_qty = result.x[0] if hasattr(result, 'x') else result.x[0]
        optimal_cost = result.fun
        
        self.optimal_policy = {
            'type': 'constrained',
            'order_quantity': optimal_qty,
            'expected_cost': optimal_cost,
            'constraints': constraints
        }
        
        self.is_fitted = True
        
        logger.info(f"Optimal order quantity (with constraints): {optimal_qty:.2f}")
        logger.info(f"Expected cost: {optimal_cost:.2f}")
        
        return self.optimal_policy
    
    def get_optimal_policy(self) -> Dict[str, Any]:
        """
        Get the optimal inventory policy.
        
        Returns:
            Dictionary with optimal policy
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before getting optimal policy")
            
        return self.optimal_policy
    
    def calculate_expected_cost(self, order_quantity: float,
                               n_samples: int = 1000) -> float:
        """
        Calculate expected cost for a given order quantity.
        
        Args:
            order_quantity: Order quantity to evaluate
            n_samples: Number of Monte Carlo samples
            
        Returns:
            Expected cost
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating expected cost")
            
        demand_samples = self._simulate_demand(n_samples)
        return self._calculate_cost_function(order_quantity, demand_samples)
    
    def get_model_summary(self) -> Dict[str, Any]:
        """
        Get summary of the fitted model.
        
        Returns:
            Dictionary with model summary
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before getting summary")
            
        summary = {
            'optimal_policy': self.optimal_policy,
            'holding_cost': self.holding_cost,
            'ordering_cost': self.ordering_cost,
            'shortage_cost': self.shortage_cost,
            'lead_time': self.lead_time,
            'distribution_type': self.distribution_type,
            'distribution_params': self.demand_distribution_params
        }
        
        return summary

