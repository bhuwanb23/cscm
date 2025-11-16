# Deployment Infrastructure for Routing & Logistics

## Overview

This module provides deployment infrastructure for routing optimization, including simulator environments, traffic simulation, edge deployment, and metrics tracking.

## Phase 4: Deployment Infrastructure ✅

### Components

1. **RL Simulator Environment** (`rl_simulator.py`)
   - Comprehensive simulator for training RL routing agents
   - Realistic routing environment with time windows and capacity constraints
   - State representation for RL agents
   - Reward functions for route optimization
   - Integration with traffic simulation

2. **Traffic Pattern Simulation** (`traffic_simulation.py`)
   - Realistic traffic pattern simulation
   - Time-of-day and day-of-week patterns
   - Rush hour modeling
   - Custom traffic patterns
   - Historical data integration

3. **Edge ETA Deployment** (`edge_deployment.py`)
   - Lightweight model deployment for edge/near-edge computing
   - Model quantization and optimization
   - Prediction caching
   - Batch prediction support
   - ONNX model support

4. **Metrics Tracking** (`metrics_tracker.py`)
   - Route efficiency metrics
   - On-time delivery tracking
   - Time window compliance
   - Capacity utilization
   - Dashboard data generation
   - Export capabilities (CSV, JSON)

## Usage Examples

### RL Simulator Environment

```python
from models.routing_logistics.deployment_infrastructure import RLSimulatorEnvironment

# Create locations
locations = [
    {'x': 0.0, 'y': 0.0, 'demand': 0.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
    {'x': 10.0, 'y': 10.0, 'demand': 10.0, 'time_window_start': 0.0, 'time_window_end': 100.0},
    {'x': 20.0, 'y': 20.0, 'demand': 15.0, 'time_window_start': 0.0, 'time_window_end': 100.0}
]

# Create vehicles
vehicles = [
    {'id': 0, 'capacity': 50.0, 'start_location': 0, 'start_time': 0.0}
]

# Create simulator
env = RLSimulatorEnvironment(locations, vehicles)

# Reset environment
state = env.reset()

# Training loop
for step in range(100):
    action = agent.select_action(state)  # Your RL agent
    next_state, reward, done, info = env.step(action)
    
    if done:
        state = env.reset()
    else:
        state = next_state
```

### Traffic Pattern Simulation

```python
from models.routing_logistics.deployment_infrastructure import TrafficPatternSimulator

# Create traffic simulator
traffic_sim = TrafficPatternSimulator(base_speed=50.0)

# Get traffic multiplier
multiplier = traffic_sim.get_traffic_multiplier(
    current_time=8.0,
    hour=8,
    day_of_week=0  # Monday
)

# Get traffic condition
condition = traffic_sim.get_traffic_condition(8.0, hour=8, day_of_week=0)

# Add custom pattern
traffic_sim.add_custom_pattern(
    hour=12,
    day_of_week=0,
    condition=TrafficCondition.LIGHT,
    multiplier=1.0
)
```

### Edge ETA Deployment

```python
from models.routing_logistics.deployment_infrastructure import EdgeETADeployment
import numpy as np

# Create edge deployment
deployment = EdgeETADeployment(
    model_type='lightweight',
    cache_size=1000
)

# Load model
deployment.load_model('path/to/model.pth')

# Predict
features = np.array([10.0, 20.0, 8.0, 0.0, 5.0])
eta = deployment.predict(features)

# Batch prediction
features_list = [np.array([10.0, 20.0, 8.0, 0.0, 5.0]) for _ in range(10)]
predictions = deployment.batch_predict(features_list)
```

### Metrics Tracking

```python
from models.routing_logistics.deployment_infrastructure import RoutingMetricsTracker
from datetime import datetime, timedelta

# Create tracker
tracker = RoutingMetricsTracker()

# Record route
tracker.record_route(
    route_id='R1',
    vehicle_id=1,
    total_distance=100.0,
    total_time=120.0,
    planned_time=100.0,
    time_window_violations=0,
    capacity_utilization=0.8,
    num_stops=5
)

# Record delivery
now = datetime.now()
tracker.record_delivery(
    delivery_id='D1',
    route_id='R1',
    location_id=1,
    planned_arrival=now,
    actual_arrival=now + timedelta(minutes=5),
    time_window_start=now - timedelta(minutes=10),
    time_window_end=now + timedelta(minutes=10)
)

# Calculate metrics
efficiency = tracker.calculate_route_efficiency()
on_time = tracker.calculate_on_time_delivery()

# Get dashboard data
dashboard_data = tracker.get_dashboard_data()

# Export metrics
tracker.export_metrics('metrics.csv', format='csv')
```

## Dependencies

- numpy
- pandas
- torch (optional, for edge deployment)
- onnxruntime (optional, for ONNX models)

## Notes

- Simulator provides realistic environment for RL training
- Traffic simulation supports custom patterns and historical data
- Edge deployment supports multiple model formats
- Metrics tracking provides comprehensive performance monitoring
- All components are tested and production-ready

