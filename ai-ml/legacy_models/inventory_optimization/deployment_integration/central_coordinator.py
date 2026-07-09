"""
Central Coordination System in Cloud

This module implements a central coordination system for managing
inventory optimization across multiple stores/distribution centers.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging
from collections import defaultdict

from .edge_executor import EdgeDecisionExecutor
from .hitl_interface import HITLInterface
from .metrics_tracker import InventoryMetricsTracker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CentralCoordinator:
    """
    Central coordination system for inventory optimization.
    
    Coordinates inventory decisions across multiple stores/distribution centers,
    aggregates metrics, and provides centralized oversight.
    """
    
    def __init__(
        self,
        hitl_interface: Optional[HITLInterface] = None,
        metrics_tracker: Optional[InventoryMetricsTracker] = None
    ):
        """
        Initialize central coordinator.
        
        Args:
            hitl_interface: HITL interface for overrides (optional)
            metrics_tracker: Metrics tracker (optional)
        """
        self.hitl_interface = hitl_interface or HITLInterface()
        self.metrics_tracker = metrics_tracker or InventoryMetricsTracker()
        self.edge_executors: Dict[int, EdgeDecisionExecutor] = {}
        self.coordination_history: List[Dict[str, Any]] = []
    
    def register_store(
        self,
        store_id: int,
        edge_executor: Optional[EdgeDecisionExecutor] = None
    ):
        """
        Register a store/distribution center.
        
        Args:
            store_id: Store identifier
            edge_executor: Edge executor for the store (optional, creates new if not provided)
        """
        if edge_executor is None:
            edge_executor = EdgeDecisionExecutor(
                store_id=store_id,
                hitl_interface=self.hitl_interface
            )
        
        self.edge_executors[store_id] = edge_executor
        logger.info(f"Registered store {store_id}")
    
    def coordinate_replenishment(
        self,
        store_id: int,
        sku_id: int,
        current_inventory: float,
        demand_forecast: float,
        reorder_point: float,
        order_up_to_level: float,
        confidence_score: float = 1.0
    ) -> Dict[str, Any]:
        """
        Coordinate replenishment decision for a store-SKU combination.
        
        Args:
            store_id: Store identifier
            sku_id: SKU identifier
            current_inventory: Current inventory level
            demand_forecast: Demand forecast
            reorder_point: Reorder point
            order_up_to_level: Order-up-to level
            confidence_score: Confidence score (0-1)
        
        Returns:
            Dictionary with coordination result
        """
        if store_id not in self.edge_executors:
            logger.warning(f"Store {store_id} not registered")
            return {
                'status': 'error',
                'message': f'Store {store_id} not registered'
            }
        
        edge_executor = self.edge_executors[store_id]
        
        # Make decision at edge
        decision = edge_executor.make_replenishment_decision(
            sku_id=sku_id,
            current_inventory=current_inventory,
            demand_forecast=demand_forecast,
            reorder_point=reorder_point,
            order_up_to_level=order_up_to_level,
            confidence_score=confidence_score
        )
        
        # Track coordination
        coordination_record = {
            'timestamp': datetime.now(),
            'store_id': store_id,
            'sku_id': sku_id,
            'decision_id': decision.decision_id,
            'order_quantity': decision.order_quantity,
            'decision_source': decision.decision_source,
            'confidence_score': confidence_score
        }
        
        self.coordination_history.append(coordination_record)
        
        logger.info(f"Coordinated replenishment for Store {store_id}, SKU {sku_id}: {decision.order_quantity:.2f}")
        
        return {
            'status': 'success',
            'decision_id': decision.decision_id,
            'order_quantity': decision.order_quantity,
            'decision_source': decision.decision_source
        }
    
    def batch_coordinate_replenishment(
        self,
        store_sku_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Coordinate replenishment for multiple store-SKU combinations.
        
        Args:
            store_sku_data: List of dictionaries with store-SKU data
        
        Returns:
            Dictionary with batch coordination results
        """
        results = []
        errors = []
        
        for data in store_sku_data:
            try:
                result = self.coordinate_replenishment(
                    store_id=data['store_id'],
                    sku_id=data['sku_id'],
                    current_inventory=data['current_inventory'],
                    demand_forecast=data['demand_forecast'],
                    reorder_point=data.get('reorder_point', 0.0),
                    order_up_to_level=data.get('order_up_to_level', 0.0),
                    confidence_score=data.get('confidence_score', 1.0)
                )
                results.append(result)
            except Exception as e:
                errors.append({
                    'store_id': data.get('store_id'),
                    'sku_id': data.get('sku_id'),
                    'error': str(e)
                })
                logger.error(f"Error coordinating replenishment: {e}")
        
        return {
            'total': len(store_sku_data),
            'successful': len(results),
            'failed': len(errors),
            'results': results,
            'errors': errors
        }
    
    def get_store_metrics(
        self,
        store_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get metrics for a specific store.
        
        Args:
            store_id: Store identifier
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            Dictionary with store metrics
        """
        if store_id not in self.edge_executors:
            return {'error': f'Store {store_id} not registered'}
        
        edge_executor = self.edge_executors[store_id]
        store_stats = edge_executor.get_store_statistics()
        
        # Get inventory metrics
        inventory_metrics = self.metrics_tracker.get_aggregate_metrics(
            store_id=store_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            'store_id': store_id,
            'decision_statistics': store_stats,
            'inventory_metrics': inventory_metrics
        }
    
    def get_aggregate_metrics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get aggregate metrics across all stores.
        
        Args:
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            Dictionary with aggregate metrics
        """
        all_store_metrics = []
        
        for store_id in self.edge_executors.keys():
            store_metrics = self.get_store_metrics(
                store_id=store_id,
                start_date=start_date,
                end_date=end_date
            )
            all_store_metrics.append(store_metrics)
        
        # Aggregate across stores
        total_decisions = sum(m['decision_statistics']['total_decisions'] 
                            for m in all_store_metrics)
        total_executed = sum(m['decision_statistics']['executed'] 
                           for m in all_store_metrics)
        total_order_quantity = sum(m['decision_statistics']['total_order_quantity'] 
                                 for m in all_store_metrics)
        
        # Aggregate inventory metrics
        inventory_metrics = self.metrics_tracker.get_aggregate_metrics(
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            'total_stores': len(self.edge_executors),
            'total_decisions': total_decisions,
            'total_executed': total_executed,
            'total_order_quantity': total_order_quantity,
            'overall_execution_rate': total_executed / total_decisions if total_decisions > 0 else 0.0,
            'inventory_metrics': inventory_metrics,
            'store_metrics': all_store_metrics
        }
    
    def get_coordination_history(
        self,
        store_id: Optional[int] = None,
        sku_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get coordination history with filters.
        
        Args:
            store_id: Filter by store ID (optional)
            sku_id: Filter by SKU ID (optional)
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            List of coordination history records
        """
        history = []
        
        for record in self.coordination_history:
            if store_id is not None and record['store_id'] != store_id:
                continue
            
            if sku_id is not None and record['sku_id'] != sku_id:
                continue
            
            if start_date is not None and record['timestamp'] < start_date:
                continue
            
            if end_date is not None and record['timestamp'] > end_date:
                continue
            
            history.append(record)
        
        return history
    
    def sync_with_edge(
        self,
        store_id: int
    ) -> Dict[str, Any]:
        """
        Synchronize with edge executor for a store.
        
        Args:
            store_id: Store identifier
        
        Returns:
            Dictionary with sync result
        """
        if store_id not in self.edge_executors:
            return {'status': 'error', 'message': f'Store {store_id} not registered'}
        
        edge_executor = self.edge_executors[store_id]
        
        # Get pending decisions
        pending_decisions = edge_executor.get_pending_decisions()
        
        # Get recent decision history
        recent_history = edge_executor.get_decision_history(
            start_date=datetime.now() - timedelta(days=1)
        )
        
        return {
            'status': 'success',
            'store_id': store_id,
            'pending_decisions': len(pending_decisions),
            'recent_decisions': len(recent_history),
            'last_sync': datetime.now().isoformat()
        }
    
    def sync_all_stores(self) -> Dict[str, Any]:
        """
        Synchronize with all edge executors.
        
        Returns:
            Dictionary with sync results for all stores
        """
        sync_results = {}
        
        for store_id in self.edge_executors.keys():
            sync_results[store_id] = self.sync_with_edge(store_id)
        
        return {
            'total_stores': len(sync_results),
            'sync_results': sync_results,
            'sync_timestamp': datetime.now().isoformat()
        }

