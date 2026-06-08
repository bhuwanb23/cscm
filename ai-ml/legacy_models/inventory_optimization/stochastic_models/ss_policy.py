"""
(s,S) Policy Models with ML Enhancements

This module implements (s,S) policy models that use ML-based demand forecasting
to determine optimal reorder point (s) and order-up-to level (S).
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, Tuple, List
from scipy import stats
from scipy.optimize import minimize
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SSPolicyModel:
    """(s,S) policy model with ML enhancements."""
    
    def __init__(self,
                 holding_cost: float,
                 ordering_cost: float,
                 shortage_cost: float,
                 lead_time: int = 1,
                 demand_model: Optional[Any] = None,
                 distribution_type: str = 'normal'):
        """
        Initialize the (s,S) policy model.
        
        Args:
            holding_cost: Cost per unit per period for holding inventory
            ordering_cost: Fixed cost per order
            shortage_cost: Cost per unit per period for stockouts
            lead_time: Lead time in periods
            demand_model: ML model for demand forecasting (optional)
            distribution_type: Type of demand distribution ('normal', 'gamma', 'poisson', 'empirical')
        """
        self.holding_cost = holding_cost
        self.ordering_cost = ordering_cost
        self.shortage_cost = shortage_cost
        self.lead_time = lead_time
        self.demand_model = demand_model
        self.distribution_type = distribution_type
        self.reorder_point = None  # s
        self.order_up_to_level = None  # S
        self.demand_distribution_params = {}
        self.is_fitted = False
        
    def _estimate_lead_time_demand_distribution(self,
                                                historical_demand: np.ndarray,
                                                forecast: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Estimate lead-time demand distribution.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            
        Returns:
            Dictionary with distribution parameters for lead-time demand
        """
        if self.distribution_type == 'normal':
            if forecast is not None:
                # Use ML forecast as mean, estimate std from residuals
                mean = np.mean(forecast) * self.lead_time
                residuals = historical_demand - forecast[:len(historical_demand)]
                std = np.std(residuals) * np.sqrt(self.lead_time) if len(residuals) > 0 else np.std(historical_demand) * np.sqrt(self.lead_time)
            else:
                # Use statistical estimation
                mean = np.mean(historical_demand) * self.lead_time
                std = np.std(historical_demand) * np.sqrt(self.lead_time)
                
            return {
                'type': 'normal',
                'mean': mean,
                'std': std,
                'loc': mean,
                'scale': std
            }
            
        elif self.distribution_type == 'gamma':
            if forecast is not None:
                mean = np.mean(forecast) * self.lead_time
                std = np.std(historical_demand) * np.sqrt(self.lead_time)
            else:
                mean = np.mean(historical_demand) * self.lead_time
                std = np.std(historical_demand) * np.sqrt(self.lead_time)
                
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
                lam = np.mean(forecast) * self.lead_time
            else:
                lam = np.mean(historical_demand) * self.lead_time
                
            return {
                'type': 'poisson',
                'lam': lam
            }
            
        elif self.distribution_type == 'empirical':
            # Use empirical distribution
            return {
                'type': 'empirical',
                'values': historical_demand * self.lead_time,  # Approximate
                'weights': np.ones(len(historical_demand)) / len(historical_demand)
            }
            
        else:
            raise ValueError(f"Unsupported distribution type: {self.distribution_type}")
    
    def _calculate_expected_cost(self, s: float, S: float) -> float:
        """
        Calculate expected total cost for (s,S) policy.
        
        Args:
            s: Reorder point
            S: Order-up-to level
            
        Returns:
            Expected total cost
        """
        dist_params = self.demand_distribution_params
        
        # Calculate expected ordering cost
        # Expected number of orders per period
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            prob_below_s = stats.norm.cdf(s, loc=mean, scale=std)
            expected_orders = 1 - prob_below_s  # Simplified
        elif dist_params['type'] == 'gamma':
            shape = dist_params['shape']
            scale = dist_params['scale']
            prob_below_s = stats.gamma.cdf(s, a=shape, scale=scale)
            expected_orders = 1 - prob_below_s
        elif dist_params['type'] == 'poisson':
            lam = dist_params['lam']
            prob_below_s = stats.poisson.cdf(s, mu=lam)
            expected_orders = 1 - prob_below_s
        else:
            expected_orders = 0.5  # Default
        
        ordering_cost = self.ordering_cost * expected_orders
        
        # Calculate expected holding cost
        # Expected inventory level = (S + s) / 2 - expected demand
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            expected_inventory = (S + s) / 2 - mean
        elif dist_params['type'] == 'gamma':
            mean = dist_params['shape'] * dist_params['scale']
            expected_inventory = (S + s) / 2 - mean
        elif dist_params['type'] == 'poisson':
            mean = dist_params['lam']
            expected_inventory = (S + s) / 2 - mean
        else:
            mean = np.mean(dist_params.get('values', [0]))
            expected_inventory = (S + s) / 2 - mean
            
        holding_cost = self.holding_cost * max(0, expected_inventory)
        
        # Calculate expected shortage cost
        # Expected shortage = E[max(D - s, 0)]
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            z = (s - mean) / std if std > 0 else 0
            expected_shortage = std * (stats.norm.pdf(z) - z * (1 - stats.norm.cdf(z)))
        elif dist_params['type'] == 'gamma':
            # Approximate
            mean = dist_params['shape'] * dist_params['scale']
            std = np.sqrt(dist_params['shape']) * dist_params['scale']
            z = (s - mean) / std if std > 0 else 0
            expected_shortage = std * (stats.norm.pdf(z) - z * (1 - stats.norm.cdf(z)))
        elif dist_params['type'] == 'poisson':
            lam = dist_params['lam']
            expected_shortage = sum(
                max(0, d - s) * stats.poisson.pmf(d, mu=lam)
                for d in range(int(s * 2))
            )
        else:
            expected_shortage = 0.0
            
        shortage_cost = self.shortage_cost * expected_shortage
        
        total_cost = ordering_cost + holding_cost + shortage_cost
        
        return total_cost
    
    def _optimize_s_S(self) -> Tuple[float, float]:
        """
        Optimize (s,S) policy parameters.
        
        Returns:
            Tuple of (optimal s, optimal S)
        """
        dist_params = self.demand_distribution_params
        
        # Get initial estimates
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            initial_s = mean - 1.5 * std
            initial_S = mean + 1.5 * std
        elif dist_params['type'] == 'gamma':
            mean = dist_params['shape'] * dist_params['scale']
            std = np.sqrt(dist_params['shape']) * dist_params['scale']
            initial_s = mean - 1.5 * std
            initial_S = mean + 1.5 * std
        elif dist_params['type'] == 'poisson':
            mean = dist_params['lam']
            initial_s = max(0, mean - 2 * np.sqrt(mean))
            initial_S = mean + 2 * np.sqrt(mean)
        else:
            mean = np.mean(dist_params.get('values', [0]))
            initial_s = mean * 0.5
            initial_S = mean * 1.5
        
        # Ensure s < S
        if initial_s >= initial_S:
            initial_s = initial_S * 0.5
        
        # Optimize using scipy
        def objective(params):
            s, S = params
            if s >= S:
                return 1e10  # Penalty for invalid parameters
            return self._calculate_expected_cost(s, S)
        
        # Bounds: s >= 0, S > s
        bounds = [(0, None), (initial_s + 1, None)]
        
        # Initial guess
        x0 = [initial_s, initial_S]
        
        # Optimize
        result = minimize(objective, x0, method='L-BFGS-B', bounds=bounds)
        
        if result.success:
            optimal_s, optimal_S = result.x
            logger.info(f"Optimization successful: s={optimal_s:.2f}, S={optimal_S:.2f}")
        else:
            logger.warning("Optimization did not converge, using initial estimates")
            optimal_s, optimal_S = initial_s, initial_S
        
        return max(0, optimal_s), max(optimal_s + 1, optimal_S)
    
    def fit(self,
            historical_demand: np.ndarray,
            forecast: Optional[np.ndarray] = None,
            features: Optional[pd.DataFrame] = None) -> 'SSPolicyModel':
        """
        Fit the (s,S) policy model to historical demand data.
        
        Args:
            historical_demand: Historical demand data
            forecast: ML-based demand forecast (optional)
            features: Feature data for ML model (optional)
            
        Returns:
            self: Fitted model
        """
        logger.info("Fitting (s,S) policy model")
        
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
        
        # Estimate lead-time demand distribution
        self.demand_distribution_params = self._estimate_lead_time_demand_distribution(
            historical_demand, forecast
        )
        
        # Optimize (s,S) parameters
        self.reorder_point, self.order_up_to_level = self._optimize_s_S()
        
        self.is_fitted = True
        logger.info(f"Optimal reorder point (s): {self.reorder_point:.2f}")
        logger.info(f"Optimal order-up-to level (S): {self.order_up_to_level:.2f}")
        
        return self
    
    def predict_order_quantity(self, current_inventory: float) -> float:
        """
        Predict order quantity based on current inventory level.
        
        Args:
            current_inventory: Current inventory level
            
        Returns:
            Order quantity (0 if no order needed)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before predicting order quantity")
        
        if current_inventory <= self.reorder_point:
            order_quantity = self.order_up_to_level - current_inventory
            return max(0, order_quantity)
        else:
            return 0.0
    
    def calculate_expected_cost(self) -> float:
        """
        Calculate expected total cost for the optimal (s,S) policy.
        
        Returns:
            Expected total cost
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating expected cost")
            
        return self._calculate_expected_cost(self.reorder_point, self.order_up_to_level)
    
    def calculate_service_level(self) -> float:
        """
        Calculate service level (fill rate) for the optimal (s,S) policy.
        
        Returns:
            Service level (0-1)
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before calculating service level")
            
        dist_params = self.demand_distribution_params
        s = self.reorder_point
        
        if dist_params['type'] == 'normal':
            mean = dist_params['mean']
            std = dist_params['std']
            service_level = stats.norm.cdf(s, loc=mean, scale=std)
        elif dist_params['type'] == 'gamma':
            shape = dist_params['shape']
            scale = dist_params['scale']
            service_level = stats.gamma.cdf(s, a=shape, scale=scale)
        elif dist_params['type'] == 'poisson':
            lam = dist_params['lam']
            service_level = stats.poisson.cdf(s, mu=lam)
        else:
            service_level = 0.5  # Default
            
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
            'reorder_point': self.reorder_point,
            'order_up_to_level': self.order_up_to_level,
            'holding_cost': self.holding_cost,
            'ordering_cost': self.ordering_cost,
            'shortage_cost': self.shortage_cost,
            'lead_time': self.lead_time,
            'distribution_type': self.distribution_type,
            'distribution_params': self.demand_distribution_params,
            'expected_cost': self.calculate_expected_cost(),
            'service_level': self.calculate_service_level()
        }
        
        return summary

