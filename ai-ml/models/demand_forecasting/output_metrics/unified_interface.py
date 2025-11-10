"""
Unified Interface for Phase 4 Output & Metrics

This module provides a unified interface for all Phase 4 capabilities.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import logging

from .prediction_intervals import PredictionIntervalGenerator
from .nowcast import NowcastEngine
from .error_metrics import ErrorMetricsCalculator, SKUConfidenceMetrics
from .probabilistic_metrics import ProbabilisticMetricsCalculator
from .service_level_metrics import ServiceLevelMetricsCalculator

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemandForecastOutputMetrics:
    """Unified interface for Phase 4 output and metrics."""
    
    def __init__(self):
        """Initialize the unified interface."""
        self.prediction_intervals = PredictionIntervalGenerator()
        self.nowcast_engine = NowcastEngine()
        self.error_calculator = ErrorMetricsCalculator()
        self.sku_confidence = SKUConfidenceMetrics(self.error_calculator)
        self.probabilistic_metrics = ProbabilisticMetricsCalculator()
        self.service_level_metrics = ServiceLevelMetricsCalculator()
        
    def generate_forecast_with_intervals(self,
                                        model,
                                        X: Optional[np.ndarray] = None,
                                        point_forecast: Optional[np.ndarray] = None,
                                        samples: Optional[np.ndarray] = None,
                                        std_error: Optional[np.ndarray] = None,
                                        confidence_levels: List[float] = [0.8, 0.95],
                                        sku_id: Optional[int] = None,
                                        store_id: Optional[int] = None,
                                        forecast_date: Optional[datetime] = None) -> pd.DataFrame:
        """
        Generate point forecast with prediction intervals (80%/95%).
        
        Args:
            model: Trained forecasting model
            X: Input features
            point_forecast: Pre-computed point forecast
            samples: Probabilistic forecast samples
            std_error: Standard error for analytical method
            confidence_levels: Confidence levels [0.8, 0.95]
            sku_id: SKU identifier
            store_id: Store identifier
            forecast_date: Forecast date
            
        Returns:
            DataFrame with point forecast and intervals
        """
        intervals = self.prediction_intervals.generate(
            model=model,
            X=X,
            point_forecast=point_forecast,
            samples=samples,
            std_error=std_error,
            confidence_levels=confidence_levels
        )
        
        return self.prediction_intervals.format_output(
            intervals, sku_id, store_id, forecast_date
        )
    
    def generate_nowcast(self,
                        historical_data: pd.DataFrame,
                        recent_signals: pd.DataFrame,
                        current_time: Optional[datetime] = None,
                        sku_id: Optional[int] = None,
                        store_id: Optional[int] = None,
                        signal_column: str = 'sales') -> Dict[str, Any]:
        """
        Generate nowcast (near real-time demand signal).
        
        Args:
            historical_data: Historical demand data
            recent_signals: Recent real-time signals
            current_time: Current timestamp
            sku_id: SKU identifier
            store_id: Store identifier
            signal_column: Name of signal column
            
        Returns:
            Dictionary with nowcast signal
        """
        return self.nowcast_engine.generate_nowcast(
            historical_data, recent_signals, current_time,
            sku_id, store_id, signal_column
        )
    
    def calculate_error_metrics(self,
                               y_true: np.ndarray,
                               y_pred: np.ndarray,
                               y_train: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Calculate MAPE, sMAPE, MAE, RMSE.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            y_train: Training data (optional, for MASE)
            
        Returns:
            Dictionary with error metrics
        """
        return self.error_calculator.calculate_all_metrics(y_true, y_pred, y_train)
    
    def calculate_sku_confidence_metrics(self,
                                        forecasts: pd.DataFrame,
                                        actuals: pd.DataFrame,
                                        sku_id: int,
                                        store_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Calculate demand error/confidence metrics per SKU.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            sku_id: SKU identifier
            store_id: Store identifier (optional)
            
        Returns:
            Dictionary with SKU metrics
        """
        return self.sku_confidence.calculate_sku_metrics(
            forecasts, actuals, sku_id, store_id
        )
    
    def calculate_probabilistic_metrics(self,
                                      y_true: np.ndarray,
                                      y_pred_samples: Optional[np.ndarray] = None,
                                      y_pred_quantiles: Optional[np.ndarray] = None,
                                      quantile_levels: Optional[List[float]] = None) -> Dict[str, float]:
        """
        Calculate CRPS and pinball loss for probabilistic forecasts.
        
        Args:
            y_true: True values
            y_pred_samples: Forecast samples
            y_pred_quantiles: Predicted quantiles
            quantile_levels: Quantile levels
            
        Returns:
            Dictionary with probabilistic metrics
        """
        return self.probabilistic_metrics.calculate_all_probabilistic_metrics(
            y_true, y_pred_samples, y_pred_quantiles, quantile_levels
        )
    
    def calculate_service_level_impact(self,
                                      forecasts: pd.DataFrame,
                                      actuals: pd.DataFrame,
                                      inventory_levels: pd.DataFrame,
                                      orders: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate service-level impact metrics (stockouts prevented, fill-rate improvement).
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            inventory_levels: DataFrame with inventory levels
            orders: DataFrame with order quantities
            
        Returns:
            Dictionary with service-level metrics
        """
        return self.service_level_metrics.calculate_service_level_metrics(
            forecasts, actuals, inventory_levels, orders
        )
    
    def generate_comprehensive_report(self,
                                     forecasts: pd.DataFrame,
                                     actuals: pd.DataFrame,
                                     inventory_levels: Optional[pd.DataFrame] = None,
                                     orders: Optional[pd.DataFrame] = None,
                                     y_pred_samples: Optional[np.ndarray] = None,
                                     y_pred_quantiles: Optional[np.ndarray] = None,
                                     quantile_levels: Optional[List[float]] = None) -> Dict[str, Any]:
        """
        Generate comprehensive report with all Phase 4 metrics.
        
        Args:
            forecasts: DataFrame with forecasts
            actuals: DataFrame with actuals
            inventory_levels: DataFrame with inventory levels (optional)
            orders: DataFrame with order quantities (optional)
            y_pred_samples: Forecast samples (optional)
            y_pred_quantiles: Predicted quantiles (optional)
            quantile_levels: Quantile levels (optional)
            
        Returns:
            Dictionary with comprehensive metrics report
        """
        report = {
            'timestamp': datetime.now().isoformat(),
            'error_metrics': {},
            'sku_confidence_metrics': None,
            'probabilistic_metrics': {},
            'service_level_metrics': {}
        }
        
        # Calculate error metrics
        if 'forecast' in forecasts.columns and 'actual' in actuals.columns:
            merged = pd.merge(
                forecasts[['sku_id', 'store_id', 'date', 'forecast']],
                actuals[['sku_id', 'store_id', 'date', 'actual']],
                on=['sku_id', 'store_id', 'date'],
                how='inner'
            )
            
            if len(merged) > 0:
                y_true = merged['actual'].values
                y_pred = merged['forecast'].values
                
                report['error_metrics'] = self.calculate_error_metrics(y_true, y_pred)
                
                # Calculate SKU confidence metrics
                report['sku_confidence_metrics'] = self.sku_confidence.calculate_all_sku_metrics(
                    forecasts, actuals
                )
        
        # Calculate probabilistic metrics if samples or quantiles provided
        if y_pred_samples is not None or y_pred_quantiles is not None:
            if 'actual' in actuals.columns:
                y_true = actuals['actual'].values
                report['probabilistic_metrics'] = self.calculate_probabilistic_metrics(
                    y_true, y_pred_samples, y_pred_quantiles, quantile_levels
                )
        
        # Calculate service-level metrics if inventory and orders provided
        if inventory_levels is not None and orders is not None:
            report['service_level_metrics'] = self.calculate_service_level_impact(
                forecasts, actuals, inventory_levels, orders
            )
            
        return report

