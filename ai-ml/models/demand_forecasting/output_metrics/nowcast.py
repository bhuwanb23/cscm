"""
Nowcast (Near Real-Time Demand Signal) Capabilities

This module implements nowcast capabilities for near real-time demand signal generation.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
import logging
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class NowcastEngine:
    """Engine for generating near real-time demand signals (nowcasts)."""
    
    def __init__(self, update_frequency_minutes: int = 15, 
                 lookback_hours: int = 24,
                 aggregation_window_minutes: int = 60):
        """
        Initialize the nowcast engine.
        
        Args:
            update_frequency_minutes: How often to update nowcast (in minutes)
            lookback_hours: How many hours of historical data to use
            aggregation_window_minutes: Window for aggregating recent signals
        """
        self.update_frequency_minutes = update_frequency_minutes
        self.lookback_hours = lookback_hours
        self.aggregation_window_minutes = aggregation_window_minutes
        self.last_update_time = None
        self.nowcast_cache = {}
        
    def _aggregate_recent_signals(self, data: pd.DataFrame, 
                                  current_time: datetime,
                                  signal_column: str = 'sales') -> float:
        """
        Aggregate recent signals within the aggregation window.
        
        Args:
            data: Historical data with timestamps
            current_time: Current timestamp
            signal_column: Name of the signal column
            
        Returns:
            Aggregated signal value
        """
        window_start = current_time - timedelta(minutes=self.aggregation_window_minutes)
        
        # Filter data within window
        if 'timestamp' in data.columns:
            recent_data = data[data['timestamp'] >= window_start]
        elif 'date' in data.columns:
            recent_data = data[pd.to_datetime(data['date']) >= window_start]
        else:
            # Assume index is datetime
            recent_data = data[data.index >= window_start]
            
        if len(recent_data) == 0:
            return 0.0
            
        # Aggregate (sum for sales, mean for rates, etc.)
        if signal_column in recent_data.columns:
            return float(recent_data[signal_column].sum())
        else:
            return 0.0
    
    def _calculate_nowcast_signal(self, historical_data: pd.DataFrame,
                                  recent_signals: pd.DataFrame,
                                  current_time: datetime,
                                  signal_column: str = 'sales') -> Dict[str, Any]:
        """
        Calculate nowcast signal from historical data and recent signals.
        
        Args:
            historical_data: Historical demand data
            recent_signals: Recent real-time signals
            current_time: Current timestamp
            signal_column: Name of the signal column
            
        Returns:
            Dictionary with nowcast signal and metadata
        """
        # Get recent aggregated signal
        recent_aggregate = self._aggregate_recent_signals(recent_signals, current_time, signal_column)
        
        # Calculate historical baseline (same time of day/week)
        historical_baseline = self._calculate_historical_baseline(historical_data, current_time, signal_column)
        
        # Calculate adjustment factor based on recent signals
        if historical_baseline > 0:
            adjustment_factor = recent_aggregate / historical_baseline
        else:
            adjustment_factor = 1.0
            
        # Generate nowcast (adjusted historical baseline)
        nowcast_value = historical_baseline * adjustment_factor
        
        return {
            'nowcast': nowcast_value,
            'historical_baseline': historical_baseline,
            'recent_aggregate': recent_aggregate,
            'adjustment_factor': adjustment_factor,
            'timestamp': current_time,
            'confidence': self._calculate_confidence(recent_aggregate, historical_baseline)
        }
    
    def _calculate_historical_baseline(self, data: pd.DataFrame,
                                       current_time: datetime,
                                       signal_column: str = 'sales') -> float:
        """
        Calculate historical baseline for the same time period.
        
        Args:
            data: Historical data
            current_time: Current timestamp
            signal_column: Name of the signal column
            
        Returns:
            Historical baseline value
        """
        # Get same time of day/week from historical data
        lookback_start = current_time - timedelta(hours=self.lookback_hours)
        
        # Filter historical data
        if 'timestamp' in data.columns:
            historical = data[pd.to_datetime(data['timestamp']) >= lookback_start]
        elif 'date' in data.columns:
            historical = data[pd.to_datetime(data['date']) >= lookback_start]
        else:
            historical = data[data.index >= lookback_start]
            
        if len(historical) == 0:
            return 0.0
            
        # Get same day of week and hour
        current_dow = current_time.weekday()
        current_hour = current_time.hour
        
        if 'timestamp' in historical.columns:
            historical['dow'] = pd.to_datetime(historical['timestamp']).dt.weekday
            historical['hour'] = pd.to_datetime(historical['timestamp']).dt.hour
        elif 'date' in historical.columns:
            historical['dow'] = pd.to_datetime(historical['date']).dt.weekday
            historical['hour'] = pd.to_datetime(historical['date']).dt.hour
        else:
            historical['dow'] = historical.index.weekday
            historical['hour'] = historical.index.hour
            
        # Filter for same day of week and hour
        similar_periods = historical[
            (historical['dow'] == current_dow) & 
            (historical['hour'] == current_hour)
        ]
        
        if len(similar_periods) == 0:
            # Fallback to overall average
            if signal_column in historical.columns:
                return float(historical[signal_column].mean())
            else:
                return 0.0
                
        if signal_column in similar_periods.columns:
            return float(similar_periods[signal_column].mean())
        else:
            return 0.0
    
    def _calculate_confidence(self, recent_aggregate: float, 
                             historical_baseline: float) -> float:
        """
        Calculate confidence score for nowcast.
        
        Args:
            recent_aggregate: Recent aggregated signal
            historical_baseline: Historical baseline
            
        Returns:
            Confidence score (0-1)
        """
        if historical_baseline == 0:
            return 0.5  # Low confidence if no baseline
            
        # Confidence increases with more data and consistency
        ratio = abs(recent_aggregate / historical_baseline) if historical_baseline > 0 else 1.0
        
        # Higher confidence if ratio is close to 1 (consistent with historical)
        # Lower confidence if ratio deviates significantly
        if 0.8 <= ratio <= 1.2:
            confidence = 0.9
        elif 0.6 <= ratio <= 1.4:
            confidence = 0.7
        elif 0.4 <= ratio <= 1.6:
            confidence = 0.5
        else:
            confidence = 0.3
            
        return confidence
    
    def generate_nowcast(self, historical_data: pd.DataFrame,
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
            current_time: Current timestamp (defaults to now)
            sku_id: SKU identifier (optional)
            store_id: Store identifier (optional)
            signal_column: Name of the signal column
            
        Returns:
            Dictionary with nowcast signal and metadata
        """
        if current_time is None:
            current_time = datetime.now()
            
        # Check if we need to update (based on frequency)
        cache_key = f"{sku_id}_{store_id}_{current_time.strftime('%Y%m%d%H%M')}"
        
        if cache_key in self.nowcast_cache:
            cached_time = self.nowcast_cache[cache_key]['timestamp']
            time_diff = (current_time - cached_time).total_seconds() / 60
            
            if time_diff < self.update_frequency_minutes:
                logger.info(f"Returning cached nowcast (age: {time_diff:.1f} minutes)")
                return self.nowcast_cache[cache_key]
        
        # Generate new nowcast
        logger.info(f"Generating nowcast for SKU {sku_id}, Store {store_id} at {current_time}")
        
        nowcast_result = self._calculate_nowcast_signal(
            historical_data, recent_signals, current_time, signal_column
        )
        
        # Add metadata
        nowcast_result['sku_id'] = sku_id
        nowcast_result['store_id'] = store_id
        nowcast_result['update_frequency_minutes'] = self.update_frequency_minutes
        
        # Cache result
        self.nowcast_cache[cache_key] = nowcast_result
        
        # Clean old cache entries (older than 1 hour)
        self._clean_cache(current_time)
        
        return nowcast_result
    
    def _clean_cache(self, current_time: datetime):
        """Clean old cache entries."""
        keys_to_remove = []
        for key, value in self.nowcast_cache.items():
            cache_time = value.get('timestamp')
            if cache_time and (current_time - cache_time).total_seconds() > 3600:
                keys_to_remove.append(key)
                
        for key in keys_to_remove:
            del self.nowcast_cache[key]
    
    def batch_nowcast(self, historical_data: pd.DataFrame,
                     recent_signals: pd.DataFrame,
                     sku_store_pairs: List[Tuple[int, int]],
                     current_time: Optional[datetime] = None,
                     signal_column: str = 'sales') -> pd.DataFrame:
        """
        Generate nowcasts for multiple SKU-store pairs.
        
        Args:
            historical_data: Historical demand data
            recent_signals: Recent real-time signals
            sku_store_pairs: List of (sku_id, store_id) tuples
            current_time: Current timestamp
            signal_column: Name of the signal column
            
        Returns:
            DataFrame with nowcasts for all SKU-store pairs
        """
        if current_time is None:
            current_time = datetime.now()
            
        results = []
        
        for sku_id, store_id in sku_store_pairs:
            # Filter data for this SKU-store pair
            hist_filtered = historical_data[
                (historical_data['sku_id'] == sku_id) & 
                (historical_data['store_id'] == store_id)
            ] if 'sku_id' in historical_data.columns else historical_data
            
            recent_filtered = recent_signals[
                (recent_signals['sku_id'] == sku_id) & 
                (recent_signals['store_id'] == store_id)
            ] if 'sku_id' in recent_signals.columns else recent_signals
            
            nowcast = self.generate_nowcast(
                hist_filtered, recent_filtered, current_time,
                sku_id, store_id, signal_column
            )
            
            results.append(nowcast)
            
        return pd.DataFrame(results)

