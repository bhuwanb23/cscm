"""
Human-In-The-Loop (HITL) Interface for Manual Overrides

This module provides an interface for human operators to override
automated inventory decisions and provide feedback.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from enum import Enum
import logging
from dataclasses import dataclass, asdict
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class OverrideType(Enum):
    """Types of manual overrides."""
    ORDER_QUANTITY = "order_quantity"
    REORDER_POINT = "reorder_point"
    ORDER_UP_TO_LEVEL = "order_up_to_level"
    HOLD_ORDER = "hold_order"
    EXPEDITE_ORDER = "expedite_order"
    CANCEL_ORDER = "cancel_order"


class OverrideStatus(Enum):
    """Status of an override."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    APPLIED = "applied"
    EXPIRED = "expired"


@dataclass
class OverrideRequest:
    """Data class for override request."""
    override_id: str
    sku_id: int
    store_id: int
    override_type: OverrideType
    original_value: float
    override_value: float
    reason: str
    requested_by: str
    requested_at: datetime
    status: OverrideStatus = OverrideStatus.PENDING
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None


class HITLInterface:
    """
    Human-In-The-Loop interface for manual overrides.
    
    Allows operators to override automated decisions and provides
    audit trail and feedback mechanisms.
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize HITL interface.
        
        Args:
            storage_path: Path to store override history (optional)
        """
        self.overrides: Dict[str, OverrideRequest] = {}
        self.override_history: List[OverrideRequest] = []
        self.storage_path = storage_path
        self.auto_approve_threshold: Optional[float] = None  # Percentage change threshold
    
    def create_override(
        self,
        sku_id: int,
        store_id: int,
        override_type: OverrideType,
        original_value: float,
        override_value: float,
        reason: str,
        requested_by: str,
        expires_at: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> str:
        """
        Create a new override request.
        
        Args:
            sku_id: SKU identifier
            store_id: Store identifier
            override_type: Type of override
            original_value: Original automated value
            override_value: Override value
            reason: Reason for override
            requested_by: User who requested the override
            expires_at: Expiration date (optional)
            notes: Additional notes (optional)
        
        Returns:
            Override ID
        """
        override_id = f"{sku_id}_{store_id}_{override_type.value}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        override = OverrideRequest(
            override_id=override_id,
            sku_id=sku_id,
            store_id=store_id,
            override_type=override_type,
            original_value=original_value,
            override_value=override_value,
            reason=reason,
            requested_by=requested_by,
            requested_at=datetime.now(),
            expires_at=expires_at,
            notes=notes
        )
        
        # Auto-approve if within threshold
        if self.auto_approve_threshold is not None:
            change_percent = abs((override_value - original_value) / original_value) * 100
            if change_percent <= self.auto_approve_threshold:
                override.status = OverrideStatus.APPROVED
                override.approved_by = "system"
                override.approved_at = datetime.now()
                logger.info(f"Auto-approved override {override_id} (change: {change_percent:.2f}%)")
        
        self.overrides[override_id] = override
        self.override_history.append(override)
        
        logger.info(f"Created override request {override_id} for SKU {sku_id}, Store {store_id}")
        
        return override_id
    
    def approve_override(
        self,
        override_id: str,
        approved_by: str,
        notes: Optional[str] = None
    ) -> bool:
        """
        Approve an override request.
        
        Args:
            override_id: Override identifier
            approved_by: User who approved the override
            notes: Additional notes (optional)
        
        Returns:
            True if approved, False otherwise
        """
        if override_id not in self.overrides:
            logger.warning(f"Override {override_id} not found")
            return False
        
        override = self.overrides[override_id]
        
        if override.status != OverrideStatus.PENDING:
            logger.warning(f"Override {override_id} is not pending (status: {override.status})")
            return False
        
        override.status = OverrideStatus.APPROVED
        override.approved_by = approved_by
        override.approved_at = datetime.now()
        
        if notes:
            override.notes = (override.notes or "") + f"\nApproval notes: {notes}"
        
        logger.info(f"Approved override {override_id} by {approved_by}")
        
        return True
    
    def reject_override(
        self,
        override_id: str,
        rejected_by: str,
        reason: Optional[str] = None
    ) -> bool:
        """
        Reject an override request.
        
        Args:
            override_id: Override identifier
            rejected_by: User who rejected the override
            reason: Reason for rejection (optional)
        
        Returns:
            True if rejected, False otherwise
        """
        if override_id not in self.overrides:
            logger.warning(f"Override {override_id} not found")
            return False
        
        override = self.overrides[override_id]
        
        if override.status != OverrideStatus.PENDING:
            logger.warning(f"Override {override_id} is not pending (status: {override.status})")
            return False
        
        override.status = OverrideStatus.REJECTED
        override.approved_by = rejected_by
        override.approved_at = datetime.now()
        
        if reason:
            override.notes = (override.notes or "") + f"\nRejection reason: {reason}"
        
        logger.info(f"Rejected override {override_id} by {rejected_by}")
        
        return True
    
    def apply_override(self, override_id: str) -> bool:
        """
        Apply an approved override.
        
        Args:
            override_id: Override identifier
        
        Returns:
            True if applied, False otherwise
        """
        if override_id not in self.overrides:
            logger.warning(f"Override {override_id} not found")
            return False
        
        override = self.overrides[override_id]
        
        if override.status != OverrideStatus.APPROVED:
            logger.warning(f"Override {override_id} is not approved (status: {override.status})")
            return False
        
        # Check expiration
        if override.expires_at and datetime.now() > override.expires_at:
            override.status = OverrideStatus.EXPIRED
            logger.warning(f"Override {override_id} has expired")
            return False
        
        override.status = OverrideStatus.APPLIED
        logger.info(f"Applied override {override_id}")
        
        return True
    
    def get_override(self, override_id: str) -> Optional[OverrideRequest]:
        """
        Get override request by ID.
        
        Args:
            override_id: Override identifier
        
        Returns:
            OverrideRequest or None
        """
        return self.overrides.get(override_id)
    
    def get_active_overrides(
        self,
        sku_id: Optional[int] = None,
        store_id: Optional[int] = None,
        override_type: Optional[OverrideType] = None
    ) -> List[OverrideRequest]:
        """
        Get active override requests.
        
        Args:
            sku_id: Filter by SKU ID (optional)
            store_id: Filter by store ID (optional)
            override_type: Filter by override type (optional)
        
        Returns:
            List of active override requests
        """
        active = []
        
        for override in self.overrides.values():
            if override.status not in [OverrideStatus.PENDING, OverrideStatus.APPROVED]:
                continue
            
            if sku_id is not None and override.sku_id != sku_id:
                continue
            
            if store_id is not None and override.store_id != store_id:
                continue
            
            if override_type is not None and override.override_type != override_type:
                continue
            
            # Check expiration
            if override.expires_at and datetime.now() > override.expires_at:
                override.status = OverrideStatus.EXPIRED
                continue
            
            active.append(override)
        
        return active
    
    def get_override_value(
        self,
        sku_id: int,
        store_id: int,
        override_type: OverrideType,
        default_value: float
    ) -> float:
        """
        Get override value if exists, otherwise return default.
        
        Args:
            sku_id: SKU identifier
            store_id: Store identifier
            override_type: Type of override
            default_value: Default value if no override
        
        Returns:
            Override value or default value
        """
        active_overrides = self.get_active_overrides(
            sku_id=sku_id,
            store_id=store_id,
            override_type=override_type
        )
        
        if active_overrides:
            # Get most recent approved override
            approved = [o for o in active_overrides if o.status == OverrideStatus.APPROVED]
            if approved:
                latest = max(approved, key=lambda x: x.approved_at)
                return latest.override_value
        
        return default_value
    
    def get_override_history(
        self,
        sku_id: Optional[int] = None,
        store_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get override history with filters.
        
        Args:
            sku_id: Filter by SKU ID (optional)
            store_id: Filter by store ID (optional)
            start_date: Start date filter (optional)
            end_date: End date filter (optional)
        
        Returns:
            List of override history records
        """
        history = []
        
        for override in self.override_history:
            if sku_id is not None and override.sku_id != sku_id:
                continue
            
            if store_id is not None and override.store_id != store_id:
                continue
            
            if start_date is not None and override.requested_at < start_date:
                continue
            
            if end_date is not None and override.requested_at > end_date:
                continue
            
            # Convert to dict for serialization
            override_dict = asdict(override)
            override_dict['override_type'] = override.override_type.value
            override_dict['status'] = override.status.value
            override_dict['requested_at'] = override.requested_at.isoformat()
            
            if override.approved_at:
                override_dict['approved_at'] = override.approved_at.isoformat()
            
            if override.expires_at:
                override_dict['expires_at'] = override.expires_at.isoformat()
            
            history.append(override_dict)
        
        return history
    
    def save_overrides(self, filepath: Optional[str] = None):
        """
        Save overrides to file.
        
        Args:
            filepath: Path to output file (uses storage_path if not provided)
        """
        filepath = filepath or self.storage_path
        if not filepath:
            logger.warning("No storage path specified")
            return
        
        history = self.get_override_history()
        
        with open(filepath, 'w') as f:
            json.dump(history, f, indent=2)
        
        logger.info(f"Saved {len(history)} overrides to {filepath}")
    
    def load_overrides(self, filepath: Optional[str] = None):
        """
        Load overrides from file.
        
        Args:
            filepath: Path to input file (uses storage_path if not provided)
        """
        filepath = filepath or self.storage_path
        if not filepath:
            logger.warning("No storage path specified")
            return
        
        with open(filepath, 'r') as f:
            history = json.load(f)
        
        for override_dict in history:
            override = OverrideRequest(
                override_id=override_dict['override_id'],
                sku_id=override_dict['sku_id'],
                store_id=override_dict['store_id'],
                override_type=OverrideType(override_dict['override_type']),
                original_value=override_dict['original_value'],
                override_value=override_dict['override_value'],
                reason=override_dict['reason'],
                requested_by=override_dict['requested_by'],
                requested_at=datetime.fromisoformat(override_dict['requested_at']),
                status=OverrideStatus(override_dict['status']),
                approved_by=override_dict.get('approved_by'),
                approved_at=datetime.fromisoformat(override_dict['approved_at']) if override_dict.get('approved_at') else None,
                expires_at=datetime.fromisoformat(override_dict['expires_at']) if override_dict.get('expires_at') else None,
                notes=override_dict.get('notes')
            )
            
            self.overrides[override.override_id] = override
            self.override_history.append(override)
        
        logger.info(f"Loaded {len(history)} overrides from {filepath}")

