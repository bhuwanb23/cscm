"""
Metrics Tracking for Routing & Logistics

This module implements metrics tracking for route efficiency and on-time delivery.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RouteMetrics:
    """Route metrics data class."""
    route_id: str
    vehicle_id: int
    total_distance: float
    total_time: float
    planned_time: float
    on_time: bool
    time_window_violations: int
    capacity_utilization: float
    num_stops: int
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class DeliveryMetrics:
    """Delivery metrics data class."""
    delivery_id: str
    route_id: str
    location_id: int
    planned_arrival: datetime
    actual_arrival: datetime
    on_time: bool
    delay_minutes: float
    time_window_start: datetime
    time_window_end: datetime
    time_window_met: bool


class RoutingMetricsTracker:
    """
    Metrics tracker for routing and logistics.
    
    Tracks route efficiency, on-time delivery, and other key metrics.
    """
    
    def __init__(self):
        """Initialize metrics tracker."""
        self.route_metrics: List[RouteMetrics] = []
        self.delivery_metrics: List[DeliveryMetrics] = []
        self.period_metrics: Dict[str, Dict[str, Any]] = {}
    
    def record_route(
        self,
        route_id: str,
        vehicle_id: int,
        total_distance: float,
        total_time: float,
        planned_time: float,
        time_window_violations: int,
        capacity_utilization: float,
        num_stops: int,
        timestamp: Optional[datetime] = None
    ) -> RouteMetrics:
        """
        Record route metrics.
        
        Args:
            route_id: Route identifier
            vehicle_id: Vehicle identifier
            total_distance: Total route distance
            total_time: Total route time
            planned_time: Planned route time
            time_window_violations: Number of time window violations
            capacity_utilization: Capacity utilization (0-1)
            num_stops: Number of stops
            timestamp: Timestamp (defaults to now)
        
        Returns:
            RouteMetrics object
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        on_time = total_time <= planned_time * 1.1  # 10% tolerance
        
        metrics = RouteMetrics(
            route_id=route_id,
            vehicle_id=vehicle_id,
            total_distance=total_distance,
            total_time=total_time,
            planned_time=planned_time,
            on_time=on_time,
            time_window_violations=time_window_violations,
            capacity_utilization=capacity_utilization,
            num_stops=num_stops,
            timestamp=timestamp
        )
        
        self.route_metrics.append(metrics)
        return metrics
    
    def record_delivery(
        self,
        delivery_id: str,
        route_id: str,
        location_id: int,
        planned_arrival: datetime,
        actual_arrival: datetime,
        time_window_start: datetime,
        time_window_end: datetime
    ) -> DeliveryMetrics:
        """
        Record delivery metrics.
        
        Args:
            delivery_id: Delivery identifier
            route_id: Route identifier
            location_id: Location identifier
            planned_arrival: Planned arrival time
            actual_arrival: Actual arrival time
            time_window_start: Time window start
            time_window_end: Time window end
        
        Returns:
            DeliveryMetrics object
        """
        delay_minutes = (actual_arrival - planned_arrival).total_seconds() / 60.0
        on_time = delay_minutes <= 15.0  # 15 minute tolerance
        time_window_met = time_window_start <= actual_arrival <= time_window_end
        
        metrics = DeliveryMetrics(
            delivery_id=delivery_id,
            route_id=route_id,
            location_id=location_id,
            planned_arrival=planned_arrival,
            actual_arrival=actual_arrival,
            on_time=on_time,
            delay_minutes=delay_minutes,
            time_window_start=time_window_start,
            time_window_end=time_window_end,
            time_window_met=time_window_met
        )
        
        self.delivery_metrics.append(metrics)
        return metrics
    
    def calculate_route_efficiency(
        self,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Calculate route efficiency metrics.
        
        Args:
            period_start: Start of period (defaults to all time)
            period_end: End of period (defaults to all time)
        
        Returns:
            Dictionary of efficiency metrics
        """
        # Filter routes by period
        routes = self._filter_by_period(self.route_metrics, period_start, period_end)
        
        if not routes:
            return {
                'avg_distance': 0.0,
                'avg_time': 0.0,
                'avg_time_efficiency': 0.0,
                'on_time_rate': 0.0,
                'avg_capacity_utilization': 0.0,
                'avg_time_window_violations': 0.0
            }
        
        total_distance = sum(r.total_distance for r in routes)
        total_time = sum(r.total_time for r in routes)
        total_planned_time = sum(r.planned_time for r in routes)
        on_time_count = sum(1 for r in routes if r.on_time)
        total_capacity_util = sum(r.capacity_utilization for r in routes)
        total_violations = sum(r.time_window_violations for r in routes)
        
        return {
            'avg_distance': total_distance / len(routes),
            'avg_time': total_time / len(routes),
            'avg_time_efficiency': total_planned_time / total_time if total_time > 0 else 0.0,
            'on_time_rate': on_time_count / len(routes),
            'avg_capacity_utilization': total_capacity_util / len(routes),
            'avg_time_window_violations': total_violations / len(routes),
            'total_routes': len(routes)
        }
    
    def calculate_on_time_delivery(
        self,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> Dict[str, float]:
        """
        Calculate on-time delivery metrics.
        
        Args:
            period_start: Start of period (defaults to all time)
            period_end: End of period (defaults to all time)
        
        Returns:
            Dictionary of on-time delivery metrics
        """
        # Filter deliveries by period
        deliveries = self._filter_by_period(self.delivery_metrics, period_start, period_end)
        
        if not deliveries:
            return {
                'on_time_rate': 0.0,
                'avg_delay_minutes': 0.0,
                'time_window_compliance_rate': 0.0,
                'total_deliveries': 0
            }
        
        on_time_count = sum(1 for d in deliveries if d.on_time)
        time_window_met_count = sum(1 for d in deliveries if d.time_window_met)
        total_delay = sum(d.delay_minutes for d in deliveries)
        
        return {
            'on_time_rate': on_time_count / len(deliveries),
            'avg_delay_minutes': total_delay / len(deliveries),
            'time_window_compliance_rate': time_window_met_count / len(deliveries),
            'total_deliveries': len(deliveries)
        }
    
    def get_period_summary(
        self,
        period_start: datetime,
        period_end: datetime
    ) -> Dict[str, Any]:
        """
        Get summary metrics for a period.
        
        Args:
            period_start: Start of period
            period_end: End of period
        
        Returns:
            Dictionary of summary metrics
        """
        route_eff = self.calculate_route_efficiency(period_start, period_end)
        on_time = self.calculate_on_time_delivery(period_start, period_end)
        
        return {
            'period_start': period_start,
            'period_end': period_end,
            'route_efficiency': route_eff,
            'on_time_delivery': on_time,
            'overall_score': (route_eff['on_time_rate'] + on_time['on_time_rate']) / 2.0
        }
    
    def _filter_by_period(
        self,
        items: List[Any],
        period_start: Optional[datetime],
        period_end: Optional[datetime]
    ) -> List[Any]:
        """Filter items by time period."""
        filtered = items
        
        if period_start is not None:
            filtered = [item for item in filtered if item.timestamp >= period_start]
        
        if period_end is not None:
            filtered = [item for item in filtered if item.timestamp <= period_end]
        
        return filtered
    
    def export_metrics(
        self,
        filepath: str,
        format: str = 'csv'  # 'csv' or 'json'
    ):
        """
        Export metrics to file.
        
        Args:
            filepath: Output file path
            format: Export format
        """
        if format == 'csv':
            # Export route metrics
            route_df = pd.DataFrame([
                {
                    'route_id': m.route_id,
                    'vehicle_id': m.vehicle_id,
                    'total_distance': m.total_distance,
                    'total_time': m.total_time,
                    'planned_time': m.planned_time,
                    'on_time': m.on_time,
                    'time_window_violations': m.time_window_violations,
                    'capacity_utilization': m.capacity_utilization,
                    'num_stops': m.num_stops,
                    'timestamp': m.timestamp
                }
                for m in self.route_metrics
            ])
            
            delivery_df = pd.DataFrame([
                {
                    'delivery_id': d.delivery_id,
                    'route_id': d.route_id,
                    'location_id': d.location_id,
                    'planned_arrival': d.planned_arrival,
                    'actual_arrival': d.actual_arrival,
                    'on_time': d.on_time,
                    'delay_minutes': d.delay_minutes,
                    'time_window_met': d.time_window_met
                }
                for d in self.delivery_metrics
            ])
            
            # Save to separate CSV files
            route_df.to_csv(filepath.replace('.csv', '_routes.csv'), index=False)
            delivery_df.to_csv(filepath.replace('.csv', '_deliveries.csv'), index=False)
            
        elif format == 'json':
            import json
            data = {
                'route_metrics': [
                    {
                        'route_id': m.route_id,
                        'vehicle_id': m.vehicle_id,
                        'total_distance': m.total_distance,
                        'total_time': m.total_time,
                        'planned_time': m.planned_time,
                        'on_time': m.on_time,
                        'time_window_violations': m.time_window_violations,
                        'capacity_utilization': m.capacity_utilization,
                        'num_stops': m.num_stops,
                        'timestamp': m.timestamp.isoformat()
                    }
                    for m in self.route_metrics
                ],
                'delivery_metrics': [
                    {
                        'delivery_id': d.delivery_id,
                        'route_id': d.route_id,
                        'location_id': d.location_id,
                        'planned_arrival': d.planned_arrival.isoformat(),
                        'actual_arrival': d.actual_arrival.isoformat(),
                        'on_time': d.on_time,
                        'delay_minutes': d.delay_minutes,
                        'time_window_met': d.time_window_met
                    }
                    for d in self.delivery_metrics
                ]
            }
            
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        
        logger.info(f"Metrics exported to {filepath}")
    
    def get_dashboard_data(self) -> Dict[str, Any]:
        """
        Get data for dashboard visualization.
        
        Returns:
            Dictionary of dashboard data
        """
        # Last 24 hours
        period_end = datetime.now()
        period_start = period_end - timedelta(hours=24)
        
        route_eff = self.calculate_route_efficiency(period_start, period_end)
        on_time = self.calculate_on_time_delivery(period_start, period_end)
        
        return {
            'route_efficiency': route_eff,
            'on_time_delivery': on_time,
            'total_routes_24h': route_eff.get('total_routes', 0),
            'total_deliveries_24h': on_time.get('total_deliveries', 0),
            'overall_performance': (route_eff['on_time_rate'] + on_time['on_time_rate']) / 2.0
        }

