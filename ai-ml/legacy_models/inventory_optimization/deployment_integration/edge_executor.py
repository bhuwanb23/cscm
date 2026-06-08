"""
Edge Decision Execution for Local Replenishment

This module implements edge decision execution for local inventory replenishment
decisions at store/distribution center level.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
import json

from .hitl_interface import HITLInterface, OverrideType

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ReplenishmentDecision:
    """Data class for replenishment decision."""
    decision_id: str
    sku_id: int
    store_id: int
    timestamp: datetime
    order_quantity: float
    reorder_point: float
    order_up_to_level: float
    decision_source: str  # 'automated', 'manual', 'override'
    confidence_score: float
    execution_status: str  # 'pending', 'executed', 'failed', 'cancelled'
    executed_at: Optional[datetime] = None
    execution_notes: Optional[str] = None


class EdgeDecisionExecutor:
    """
    Edge decision executor for local replenishment.
    
    Executes inventory replenishment decisions at the edge (store/DC level)
    with support for local optimization and manual overrides.
    """
    
    def __init__(
        self,
        store_id: int,
        hitl_interface: Optional[HITLInterface] = None,
        decision_cache_size: int = 1000
    ):
        """
        Initialize edge decision executor.
        
        Args:
            store_id: Store/distribution center identifier
            hitl_interface: HITL interface for overrides (optional)
            decision_cache_size: Size of decision cache
        """
        self.store_id = store_id
        self.hitl_interface = hitl_interface or HITLInterface()
        self.decision_cache: Dict[str, ReplenishmentDecision] = {}
        self.decision_history: List[ReplenishmentDecision] = []
        self.decision_cache_size = decision_cache_size
    
    def make_replenishment_decision(
        self,
        sku_id: int,
        current_inventory: float,
        demand_forecast: float,
        reorder_point: float,
        order_up_to_level: float,
        decision_source: str = 'automated',
        confidence_score: float = 1.0
    ) -> ReplenishmentDecision:
        """
        Make a replenishment decision for a SKU.
        
        Args:
            sku_id: SKU identifier
            current_inventory: Current inventory level
            demand_forecast: Demand forecast
            reorder_point: Reorder point
            order_up_to_level: Order-up-to level
            decision_source: Source of decision ('automated', 'manual', 'override')
            confidence_score: Confidence score (0-1)
        
        Returns:
            ReplenishmentDecision
        """
        decision_id = f"{self.store_id}_{sku_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Check for manual overrides
        override_order_qty = self.hitl_interface.get_override_value(
            sku_id=sku_id,
            store_id=self.store_id,
            override_type=OverrideType.ORDER_QUANTITY,
            default_value=None
        )
        
        override_reorder_point = self.hitl_interface.get_override_value(
            sku_id=sku_id,
            store_id=self.store_id,
            override_type=OverrideType.REORDER_POINT,
            default_value=None
        )
        
        override_order_up_to = self.hitl_interface.get_override_value(
            sku_id=sku_id,
            store_id=self.store_id,
            override_type=OverrideType.ORDER_UP_TO_LEVEL,
            default_value=None
        )
        
        # Apply overrides if available
        if override_reorder_point is not None:
            reorder_point = override_reorder_point
            decision_source = 'override'
        
        if override_order_up_to is not None:
            order_up_to_level = override_order_up_to
            decision_source = 'override'
        
        # Calculate order quantity
        if current_inventory <= reorder_point:
            order_quantity = max(0, order_up_to_level - current_inventory)
        else:
            order_quantity = 0.0
        
        # Apply override for order quantity if available
        if override_order_qty is not None:
            order_quantity = override_order_qty
            decision_source = 'override'
        
        decision = ReplenishmentDecision(
            decision_id=decision_id,
            sku_id=sku_id,
            store_id=self.store_id,
            timestamp=datetime.now(),
            order_quantity=order_quantity,
            reorder_point=reorder_point,
            order_up_to_level=order_up_to_level,
            decision_source=decision_source,
            confidence_score=confidence_score,
            execution_status='pending'
        )
        
        # Cache decision
        self.decision_cache[decision_id] = decision
        if len(self.decision_cache) > self.decision_cache_size:
            # Remove oldest decision
            oldest_id = min(self.decision_cache.keys(), 
                          key=lambda x: self.decision_cache[x].timestamp)
            del self.decision_cache[oldest_id]
        
        # Add to history
        self.decision_history.append(decision)
        
        logger.info(f"Made replenishment decision {decision_id}: order_qty={order_quantity:.2f}")
        
        return decision
    
    def execute_decision(
        self,
        decision_id: str,
        execution_notes: Optional[str] = None
    ) -> bool:
        """
        Execute a replenishment decision.
        
        Args:
            decision_id: Decision identifier
            execution_notes: Execution notes (optional)
        
        Returns:
            True if executed successfully, False otherwise
        """
        if decision_id not in self.decision_cache:
            logger.warning(f"Decision {decision_id} not found in cache")
            return False
        
        decision = self.decision_cache[decision_id]
        
        if decision.execution_status != 'pending':
            logger.warning(f"Decision {decision_id} is not pending (status: {decision.execution_status})")
            return False
        
        # Execute decision (in real implementation, this would trigger actual order)
        try:
            # Simulate execution
            decision.execution_status = 'executed'
            decision.executed_at = datetime.now()
            decision.execution_notes = execution_notes
            
            logger.info(f"Executed decision {decision_id} for SKU {decision.sku_id}")
            
            return True
        
        except Exception as e:
            decision.execution_status = 'failed'
            decision.execution_notes = f"Execution failed: {str(e)}"
            logger.error(f"Failed to execute decision {decision_id}: {e}")
            
            return False
    
    def cancel_decision(
        self,
        decision_id: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Cancel a pending decision.
        
        Args:
            decision_id: Decision identifier
            reason: Reason for cancellation (optional)
        
        Returns:
            True if cancelled, False otherwise
        """
        if decision_id not in self.decision_cache:
            logger.warning(f"Decision {decision_id} not found in cache")
            return False
        
        decision = self.decision_cache[decision_id]
        
        if decision.execution_status != 'pending':
            logger.warning(f"Decision {decision_id} cannot be cancelled (status: {decision.execution_status})")
            return False
        
        decision.execution_status = 'cancelled'
        decision.execution_notes = reason or "Cancelled by user"
        
        logger.info(f"Cancelled decision {decision_id}")
        
        return True
    
    def get_pending_decisions(self) -> List[ReplenishmentDecision]:
        """
        Get all pending decisions.
        
        Returns:
            List of pending decisions
        """
        return [d for d in self.decision_cache.values() if d.execution_status == 'pending']
    
    def get_decision_history(
        self,
        sku_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get decision history with filters.
        
        Args:
            sku_id: Filter by SKU ID (optional)
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            List of decision history records
        """
        history = []
        
        for decision in self.decision_history:
            if sku_id is not None and decision.sku_id != sku_id:
                continue
            
            if start_date is not None and decision.timestamp < start_date:
                continue
            
            if end_date is not None and decision.timestamp > end_date:
                continue
            
            decision_dict = {
                'decision_id': decision.decision_id,
                'sku_id': decision.sku_id,
                'store_id': decision.store_id,
                'timestamp': decision.timestamp.isoformat(),
                'order_quantity': decision.order_quantity,
                'reorder_point': decision.reorder_point,
                'order_up_to_level': decision.order_up_to_level,
                'decision_source': decision.decision_source,
                'confidence_score': decision.confidence_score,
                'execution_status': decision.execution_status,
                'executed_at': decision.executed_at.isoformat() if decision.executed_at else None,
                'execution_notes': decision.execution_notes
            }
            
            history.append(decision_dict)
        
        return history
    
    def batch_execute_decisions(
        self,
        decision_ids: List[str],
        execution_notes: Optional[str] = None
    ) -> Dict[str, bool]:
        """
        Execute multiple decisions in batch.
        
        Args:
            decision_ids: List of decision identifiers
            execution_notes: Execution notes (optional)
        
        Returns:
            Dictionary mapping decision_id to execution success
        """
        results = {}
        
        for decision_id in decision_ids:
            results[decision_id] = self.execute_decision(decision_id, execution_notes)
        
        logger.info(f"Batch executed {len(decision_ids)} decisions: {sum(results.values())} successful")
        
        return results
    
    def get_store_statistics(self) -> Dict[str, Any]:
        """
        Get statistics for this store.
        
        Returns:
            Dictionary with store statistics
        """
        total_decisions = len(self.decision_history)
        pending = sum(1 for d in self.decision_history if d.execution_status == 'pending')
        executed = sum(1 for d in self.decision_history if d.execution_status == 'executed')
        failed = sum(1 for d in self.decision_history if d.execution_status == 'failed')
        cancelled = sum(1 for d in self.decision_history if d.execution_status == 'cancelled')
        
        automated = sum(1 for d in self.decision_history if d.decision_source == 'automated')
        manual = sum(1 for d in self.decision_history if d.decision_source == 'manual')
        override = sum(1 for d in self.decision_history if d.decision_source == 'override')
        
        total_order_quantity = sum(d.order_quantity for d in self.decision_history if d.execution_status == 'executed')
        
        return {
            'store_id': self.store_id,
            'total_decisions': total_decisions,
            'pending': pending,
            'executed': executed,
            'failed': failed,
            'cancelled': cancelled,
            'automated': automated,
            'manual': manual,
            'override': override,
            'total_order_quantity': total_order_quantity,
            'execution_rate': executed / total_decisions if total_decisions > 0 else 0.0
        }

