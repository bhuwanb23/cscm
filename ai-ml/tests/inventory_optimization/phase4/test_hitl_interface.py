"""
Tests for HITL Interface
"""

import pytest
import sys
import os
from datetime import datetime, timedelta

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

from legacy_models.inventory_optimization.deployment_integration.hitl_interface import (
    HITLInterface,
    OverrideType,
    OverrideStatus
)


class TestHITLInterface:
    """Test cases for HITLInterface."""
    
    def test_initialization(self):
        """Test interface initialization."""
        interface = HITLInterface()
        
        assert len(interface.overrides) == 0
        assert len(interface.override_history) == 0
    
    def test_create_override(self):
        """Test override creation."""
        interface = HITLInterface()
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=75.0,
            reason="High demand expected",
            requested_by="operator1"
        )
        
        assert override_id is not None
        assert override_id in interface.overrides
        assert interface.overrides[override_id].status == OverrideStatus.PENDING
    
    def test_approve_override(self):
        """Test override approval."""
        interface = HITLInterface()
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=75.0,
            reason="High demand expected",
            requested_by="operator1"
        )
        
        result = interface.approve_override(override_id, approved_by="manager1")
        
        assert result is True
        assert interface.overrides[override_id].status == OverrideStatus.APPROVED
        assert interface.overrides[override_id].approved_by == "manager1"
    
    def test_reject_override(self):
        """Test override rejection."""
        interface = HITLInterface()
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=75.0,
            reason="High demand expected",
            requested_by="operator1"
        )
        
        result = interface.reject_override(override_id, rejected_by="manager1", reason="Budget constraint")
        
        assert result is True
        assert interface.overrides[override_id].status == OverrideStatus.REJECTED
    
    def test_apply_override(self):
        """Test override application."""
        interface = HITLInterface()
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=75.0,
            reason="High demand expected",
            requested_by="operator1"
        )
        
        interface.approve_override(override_id, approved_by="manager1")
        result = interface.apply_override(override_id)
        
        assert result is True
        assert interface.overrides[override_id].status == OverrideStatus.APPLIED
    
    def test_get_override_value(self):
        """Test getting override value."""
        interface = HITLInterface()
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=75.0,
            reason="High demand expected",
            requested_by="operator1"
        )
        
        interface.approve_override(override_id, approved_by="manager1")
        
        value = interface.get_override_value(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            default_value=50.0
        )
        
        assert value == 75.0
    
    def test_get_active_overrides(self):
        """Test getting active overrides."""
        interface = HITLInterface()
        
        # Create multiple overrides
        override1 = interface.create_override(
            sku_id=1, store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0, override_value=75.0,
            reason="Test", requested_by="op1"
        )
        
        override2 = interface.create_override(
            sku_id=2, store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=30.0, override_value=40.0,
            reason="Test", requested_by="op1"
        )
        
        interface.approve_override(override1, approved_by="mgr1")
        interface.reject_override(override2, rejected_by="mgr1")
        
        active = interface.get_active_overrides()
        
        assert len(active) == 1
        assert active[0].override_id == override1
    
    def test_auto_approve_threshold(self):
        """Test auto-approve threshold."""
        interface = HITLInterface()
        interface.auto_approve_threshold = 10.0  # 10% threshold
        
        override_id = interface.create_override(
            sku_id=1,
            store_id=1,
            override_type=OverrideType.ORDER_QUANTITY,
            original_value=50.0,
            override_value=54.0,  # 8% change - should auto-approve
            reason="Small adjustment",
            requested_by="operator1"
        )
        
        assert interface.overrides[override_id].status == OverrideStatus.APPROVED


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

