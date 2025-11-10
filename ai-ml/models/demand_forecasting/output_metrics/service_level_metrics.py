"""
Service-Level Impact Metrics for Demand Forecasting

This module implements:
- Stockouts prevented
- Fill-rate improvement
- Service-level impact metrics
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ServiceLevelMetricsCalculator:
    """Calculate service-level impact metrics."""
    
    def __init__(self, target_service_level: float = 0.95):
        """
        Initialize service-level metrics calculator.
        
        Args:
            target_service_level: Target service level (0-1)
        """
        self.target_service_level = target_service_level
        
    def calculate_stockouts_prevented(self, 
                                    forecasts: pd.DataFrame,
                                    actuals: pd.DataFrame,
                                    inventory_levels: pd.DataFrame,
                                    lead_time_days: int = 7) -> Dict[str, Any]:
        """
        Calculate number of stockouts prevented by accurate forecasting.
        
        Args:
            forecasts: DataFrame with forecasts (columns: sku_id, store_id, date, forecast)
            actuals: DataFrame with actuals (columns: sku_id, store_id, date, actual)
            inventory_levels: DataFrame with inventory (columns: sku_id, store_id, date, inventory)
            lead_time_days: Lead time in days for replenishment
            
        Returns:
            Dictionary with stockout prevention metrics
        """
        # Merge data
        merged = pd.merge(
            forecasts,
            actuals,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        merged = pd.merge(
            merged,
            inventory_levels,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        if len(merged) == 0:
            return {
                'stockouts_prevented': 0,
                'total_potential_stockouts': 0,
                'prevention_rate': 0.0
            }
        
        # Calculate potential stockouts without forecast
        # (assuming no replenishment based on forecast)
        merged['demand_exceeds_inventory'] = merged['actual'] > merged['inventory']
        merged['forecast_would_prevent'] = (
            (merged['forecast'] > merged['inventory']) & 
            (merged['actual'] > merged['inventory'])
        )
        
        # Stockouts that would have occurred without forecast
        potential_stockouts = merged['demand_exceeds_inventory'].sum()
        
        # Stockouts prevented by forecast-based replenishment
        # (assuming replenishment happens when forecast > inventory)
        stockouts_prevented = merged['forecast_would_prevent'].sum()
        
        prevention_rate = (stockouts_prevented / potential_stockouts * 100) if potential_stockouts > 0 else 0.0
        
        return {
            'stockouts_prevented': int(stockouts_prevented),
            'total_potential_stockouts': int(potential_stockouts),
            'prevention_rate': float(prevention_rate),
            'stockouts_occurred': int(potential_stockouts - stockouts_prevented)
        }
    
    def calculate_fill_rate_improvement(self,
                                       forecasts: pd.DataFrame,
                                       actuals: pd.DataFrame,
                                       inventory_levels: pd.DataFrame,
                                       orders: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate fill-rate improvement from forecasting.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            inventory_levels: DataFrame with inventory levels
            orders: DataFrame with order quantities (columns: sku_id, store_id, date, order_qty)
            
        Returns:
            Dictionary with fill-rate improvement metrics
        """
        # Merge data
        merged = pd.merge(
            forecasts,
            actuals,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        merged = pd.merge(
            merged,
            inventory_levels,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        merged = pd.merge(
            merged,
            orders,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        if len(merged) == 0:
            return {
                'fill_rate_with_forecast': 0.0,
                'fill_rate_without_forecast': 0.0,
                'improvement': 0.0
            }
        
        # Calculate fill rate with forecast-based ordering
        # Fill rate = (demand fulfilled) / (total demand)
        merged['demand_fulfilled'] = np.minimum(merged['actual'], merged['inventory'] + merged['order_qty'])
        fill_rate_with_forecast = (merged['demand_fulfilled'].sum() / merged['actual'].sum() * 100) if merged['actual'].sum() > 0 else 0.0
        
        # Calculate fill rate without forecast (baseline - no ordering)
        fill_rate_without_forecast = (merged['inventory'].clip(lower=0).sum() / merged['actual'].sum() * 100) if merged['actual'].sum() > 0 else 0.0
        
        improvement = fill_rate_with_forecast - fill_rate_without_forecast
        
        return {
            'fill_rate_with_forecast': float(fill_rate_with_forecast),
            'fill_rate_without_forecast': float(fill_rate_without_forecast),
            'improvement': float(improvement),
            'improvement_percentage': float((improvement / fill_rate_without_forecast * 100) if fill_rate_without_forecast > 0 else 0.0)
        }
    
    def calculate_service_level_metrics(self,
                                       forecasts: pd.DataFrame,
                                       actuals: pd.DataFrame,
                                       inventory_levels: pd.DataFrame,
                                       orders: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate comprehensive service-level impact metrics.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            inventory_levels: DataFrame with inventory levels
            orders: DataFrame with order quantities
            
        Returns:
            Dictionary with all service-level metrics
        """
        stockout_metrics = self.calculate_stockouts_prevented(
            forecasts, actuals, inventory_levels
        )
        
        fill_rate_metrics = self.calculate_fill_rate_improvement(
            forecasts, actuals, inventory_levels, orders
        )
        
        # Calculate additional metrics
        merged = pd.merge(
            forecasts,
            actuals,
            on=['sku_id', 'store_id', 'date'],
            how='inner'
        )
        
        # Forecast accuracy impact on service level
        forecast_accuracy = self._calculate_forecast_accuracy_impact(merged)
        
        return {
            'stockout_prevention': stockout_metrics,
            'fill_rate_improvement': fill_rate_metrics,
            'forecast_accuracy_impact': forecast_accuracy,
            'overall_service_level': self._calculate_overall_service_level(
                stockout_metrics, fill_rate_metrics
            )
        }
    
    def _calculate_forecast_accuracy_impact(self, merged: pd.DataFrame) -> Dict[str, float]:
        """
        Calculate impact of forecast accuracy on service level.
        
        Args:
            merged: Merged DataFrame with forecasts and actuals
            
        Returns:
            Dictionary with accuracy impact metrics
        """
        if len(merged) == 0:
            return {
                'mape': 0.0,
                'over_forecast_rate': 0.0,
                'under_forecast_rate': 0.0
            }
        
        # Calculate MAPE
        errors = merged['actual'] - merged['forecast']
        mape = np.mean(np.abs(errors / merged['actual'].clip(lower=1))) * 100
        
        # Calculate over/under forecast rates
        over_forecast = (merged['forecast'] > merged['actual']).sum()
        under_forecast = (merged['forecast'] < merged['actual']).sum()
        total = len(merged)
        
        return {
            'mape': float(mape),
            'over_forecast_rate': float(over_forecast / total * 100),
            'under_forecast_rate': float(under_forecast / total * 100)
        }
    
    def _calculate_overall_service_level(self,
                                        stockout_metrics: Dict[str, Any],
                                        fill_rate_metrics: Dict[str, Any]) -> float:
        """
        Calculate overall service level score.
        
        Args:
            stockout_metrics: Stockout prevention metrics
            fill_rate_metrics: Fill rate improvement metrics
            
        Returns:
            Overall service level score (0-100)
        """
        # Weighted combination of metrics
        prevention_score = stockout_metrics.get('prevention_rate', 0.0)
        fill_rate_score = fill_rate_metrics.get('fill_rate_with_forecast', 0.0)
        
        # Weight: 40% prevention, 60% fill rate
        overall_score = 0.4 * prevention_score + 0.6 * fill_rate_score
        
        return float(overall_score)
    
    def calculate_per_sku_metrics(self,
                                  forecasts: pd.DataFrame,
                                  actuals: pd.DataFrame,
                                  inventory_levels: pd.DataFrame,
                                  orders: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate service-level metrics per SKU.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            inventory_levels: DataFrame with inventory levels
            orders: DataFrame with order quantities
            
        Returns:
            DataFrame with metrics for each SKU
        """
        # Get unique SKU-store pairs
        if 'store_id' in forecasts.columns:
            sku_store_pairs = forecasts[['sku_id', 'store_id']].drop_duplicates()
        else:
            sku_store_pairs = pd.DataFrame({'sku_id': forecasts['sku_id'].unique(), 'store_id': None})
            
        results = []
        
        for _, row in sku_store_pairs.iterrows():
            sku_id = row['sku_id']
            store_id = row.get('store_id')
            
            # Filter data for this SKU-store pair
            forecast_filtered = forecasts[forecasts['sku_id'] == sku_id]
            actual_filtered = actuals[actuals['sku_id'] == sku_id]
            inventory_filtered = inventory_levels[inventory_levels['sku_id'] == sku_id]
            orders_filtered = orders[orders['sku_id'] == sku_id]
            
            if store_id is not None:
                forecast_filtered = forecast_filtered[forecast_filtered['store_id'] == store_id]
                actual_filtered = actual_filtered[actual_filtered['store_id'] == store_id]
                inventory_filtered = inventory_filtered[inventory_filtered['store_id'] == store_id]
                orders_filtered = orders_filtered[orders_filtered['store_id'] == store_id]
                
            metrics = self.calculate_service_level_metrics(
                forecast_filtered, actual_filtered, inventory_filtered, orders_filtered
            )
            
            metrics['sku_id'] = sku_id
            metrics['store_id'] = store_id
            
            results.append(metrics)
            
        return pd.DataFrame(results)

