# Deployment & Integration Module

## Overview

This module provides deployment and integration capabilities for inventory optimization, including human-in-the-loop interfaces, edge execution, central coordination, and comprehensive metrics tracking.

## Phase 4: Deployment & Integration ✅

### Components

1. **Metrics Tracker** (`metrics_tracker.py`)
   - Fill rate calculation
   - Days of supply calculation
   - Inventory turnover calculation
   - Period and aggregate metrics
   - Export/import functionality

2. **HITL Interface** (`hitl_interface.py`)
   - Manual override requests
   - Override approval/rejection workflow
   - Override application
   - Auto-approval thresholds
   - Override history tracking

3. **Edge Decision Executor** (`edge_executor.py`)
   - Local replenishment decision execution
   - Integration with HITL interface
   - Decision caching and history
   - Batch execution support
   - Store-level statistics

4. **Central Coordinator** (`central_coordinator.py`)
   - Multi-store coordination
   - Batch coordination
   - Aggregate metrics across stores
   - Edge synchronization
   - Centralized oversight

## Usage Examples

### Metrics Tracker

```python
from models.inventory_optimization.deployment_integration import InventoryMetricsTracker
from datetime import datetime

tracker = InventoryMetricsTracker()

# Track period metrics
metrics = tracker.track_period_metrics(
    sku_id=1,
    store_id=1,
    date=datetime.now(),
    current_inventory=100.0,
    demand=10.0,
    satisfied_demand=9.0,
    sales_quantity=9.0
)

print(f"Fill Rate: {metrics['fill_rate']:.2%}")
print(f"Days of Supply: {metrics['days_of_supply']:.2f}")

# Get aggregate metrics
aggregate = tracker.get_aggregate_metrics(sku_id=1, store_id=1)
print(f"Average Fill Rate: {aggregate['avg_fill_rate']:.2%}")
print(f"Inventory Turns: {aggregate['avg_inventory_turns']:.2f}")
```

### HITL Interface

```python
from models.inventory_optimization.deployment_integration import HITLInterface, OverrideType

hitl = HITLInterface()
hitl.auto_approve_threshold = 10.0  # Auto-approve changes < 10%

# Create override request
override_id = hitl.create_override(
    sku_id=1,
    store_id=1,
    override_type=OverrideType.ORDER_QUANTITY,
    original_value=50.0,
    override_value=75.0,
    reason="High demand expected",
    requested_by="operator1"
)

# Approve override
hitl.approve_override(override_id, approved_by="manager1")

# Apply override
hitl.apply_override(override_id)

# Get override value
order_qty = hitl.get_override_value(
    sku_id=1,
    store_id=1,
    override_type=OverrideType.ORDER_QUANTITY,
    default_value=50.0
)
```

### Edge Decision Executor

```python
from models.inventory_optimization.deployment_integration import EdgeDecisionExecutor, HITLInterface

hitl = HITLInterface()
executor = EdgeDecisionExecutor(store_id=1, hitl_interface=hitl)

# Make replenishment decision
decision = executor.make_replenishment_decision(
    sku_id=1,
    current_inventory=50.0,
    demand_forecast=10.0,
    reorder_point=100.0,
    order_up_to_level=200.0
)

print(f"Order Quantity: {decision.order_quantity}")
print(f"Decision Source: {decision.decision_source}")

# Execute decision
executor.execute_decision(decision.decision_id)

# Get store statistics
stats = executor.get_store_statistics()
print(f"Total Decisions: {stats['total_decisions']}")
print(f"Execution Rate: {stats['execution_rate']:.2%}")
```

### Central Coordinator

```python
from models.inventory_optimization.deployment_integration import (
    CentralCoordinator,
    EdgeDecisionExecutor,
    InventoryMetricsTracker
)

# Initialize components
metrics_tracker = InventoryMetricsTracker()
coordinator = CentralCoordinator(metrics_tracker=metrics_tracker)

# Register stores
coordinator.register_store(store_id=1)
coordinator.register_store(store_id=2)

# Coordinate replenishment
result = coordinator.coordinate_replenishment(
    store_id=1,
    sku_id=1,
    current_inventory=50.0,
    demand_forecast=10.0,
    reorder_point=100.0,
    order_up_to_level=200.0
)

# Batch coordination
store_sku_data = [
    {'store_id': 1, 'sku_id': 1, 'current_inventory': 50.0, 'demand_forecast': 10.0,
     'reorder_point': 100.0, 'order_up_to_level': 200.0},
    {'store_id': 1, 'sku_id': 2, 'current_inventory': 80.0, 'demand_forecast': 8.0,
     'reorder_point': 100.0, 'order_up_to_level': 200.0}
]

batch_result = coordinator.batch_coordinate_replenishment(store_sku_data)

# Get aggregate metrics
aggregate = coordinator.get_aggregate_metrics()
print(f"Total Stores: {aggregate['total_stores']}")
print(f"Overall Execution Rate: {aggregate['overall_execution_rate']:.2%}")

# Sync with all stores
sync_result = coordinator.sync_all_stores()
```

## File Structure

```
deployment_integration/
├── __init__.py
├── README.md
├── metrics_tracker.py
├── hitl_interface.py
├── edge_executor.py
└── central_coordinator.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all Phase 4 tests
pytest tests/inventory_optimization/phase4/ -v

# Run specific test file
pytest tests/inventory_optimization/phase4/test_metrics_tracker.py -v
pytest tests/inventory_optimization/phase4/test_hitl_interface.py -v
pytest tests/inventory_optimization/phase4/test_edge_executor.py -v
pytest tests/inventory_optimization/phase4/test_central_coordinator.py -v
```

## Dependencies

- pandas
- numpy
- datetime
- json

## Key Features

- **Comprehensive Metrics**: Fill rate, days of supply, inventory turns
- **Human Override**: Manual override requests with approval workflow
- **Edge Execution**: Local decision execution at store/DC level
- **Central Coordination**: Multi-store coordination and oversight
- **Audit Trail**: Complete history of decisions and overrides
- **Export/Import**: Metrics and override data persistence

