# Classical Optimization for Routing & Logistics

## Overview

This module implements classical optimization algorithms for routing and logistics, including CVRPTW (Capacitated Vehicle Routing Problem with Time Windows) solvers and time window constraint handling.

## Phase 1: Classical Optimization ✅

### Components

1. **CVRPTW Solver** (`cvrptw_solver.py`)
   - Capacitated Vehicle Routing Problem with Time Windows
   - Uses Google OR-Tools constraint solver
   - Supports capacity constraints
   - Supports time window constraints
   - Distance and time matrix support

2. **Gurobi Routing Optimizer** (`gurobi_routing.py`)
   - MIP-based routing optimization using Gurobi
   - Handles capacity constraints
   - Handles time window constraints
   - Flow conservation constraints
   - Big-M formulation for time propagation

3. **Time Window Handler** (`time_windows.py`)
   - Time window validation
   - Arrival time calculation and adjustment
   - Soft and hard time window constraints
   - Penalty calculation for violations
   - Route feasibility checking
   - Time window merging

## Usage Examples

### CVRPTW Solver

```python
from models.routing_logistics.classical_optimization import CVRPTWSolver, Location, Vehicle, RoutingProblem

# Create solver
solver = CVRPTWSolver(time_limit=30)

# Create depot
depot = Location(location_id=0, x=0.0, y=0.0, demand=0.0)

# Create customers
customers = [
    Location(location_id=1, x=10.0, y=10.0, demand=10.0, 
             time_window_start=0.0, time_window_end=100.0, service_time=5.0),
    Location(location_id=2, x=20.0, y=20.0, demand=15.0,
             time_window_start=0.0, time_window_end=200.0, service_time=5.0),
    Location(location_id=3, x=30.0, y=30.0, demand=20.0,
             time_window_start=0.0, time_window_end=300.0, service_time=5.0)
]

locations = [depot] + customers

# Create vehicles
vehicles = [
    Vehicle(vehicle_id=0, capacity=50.0, start_location=0),
    Vehicle(vehicle_id=1, capacity=50.0, start_location=0)
]

# Create problem
problem = RoutingProblem(
    locations=locations,
    vehicles=vehicles,
    use_time_windows=True,
    use_capacity=True
)

# Solve
result = solver.solve(problem)

print(f"Status: {result['status']}")
print(f"Total Distance: {result['total_distance']}")
print(f"Vehicles Used: {result['num_vehicles_used']}")
for route in result['routes']:
    print(f"Vehicle {route['vehicle_id']}: {route['route']}")
```

### Gurobi Routing Optimizer

```python
from models.routing_logistics.classical_optimization import GurobiRoutingOptimizer

# Create optimizer
optimizer = GurobiRoutingOptimizer(
    time_limit=300,
    mip_gap=0.01
)

# Use same problem structure as CVRPTW
result = optimizer.solve(problem)

print(f"Status: {result['status']}")
print(f"Objective Value: {result['objective_value']}")
print(f"Total Distance: {result['total_distance']}")
```

### Time Window Handler

```python
from models.routing_logistics.classical_optimization import TimeWindowHandler, TimeWindow

# Create handler
handler = TimeWindowHandler()

# Create time window
time_window = TimeWindow(start=10.0, end=20.0, soft=False)

# Validate arrival time
is_valid, wait_time = handler.validate_time_window(15.0, time_window)
print(f"Valid: {is_valid}, Wait Time: {wait_time}")

# Check route feasibility
locations = [
    {'id': 0, 'time_window_start': 0.0, 'time_window_end': 1000.0, 'service_time': 0.0},
    {'id': 1, 'time_window_start': 0.0, 'time_window_end': 100.0, 'service_time': 5.0},
    {'id': 2, 'time_window_start': 0.0, 'time_window_end': 200.0, 'service_time': 5.0}
]

time_matrix = np.array([
    [0, 10, 20],
    [10, 0, 10],
    [20, 10, 0]
])

route = [1, 2]
is_feasible, arrival_times, penalty = handler.check_feasibility(
    route, locations, time_matrix, start_time=0.0
)

print(f"Feasible: {is_feasible}")
print(f"Arrival Times: {arrival_times}")
```

## File Structure

```
classical_optimization/
├── __init__.py
├── README.md
├── cvrptw_solver.py
├── gurobi_routing.py
└── time_windows.py
```

## Testing

All components are thoroughly tested. Run tests with:

```bash
# Run all Phase 1 tests
pytest tests/routing_logistics/phase1/ -v

# Run specific test file
pytest tests/routing_logistics/phase1/test_cvrptw_solver.py -v
pytest tests/routing_logistics/phase1/test_gurobi_routing.py -v
pytest tests/routing_logistics/phase1/test_time_windows.py -v
```

## Dependencies

- ortools.constraint_solver (required for CVRPTW)
- gurobipy (optional, for Gurobi routing)
- numpy
- pandas

## Key Features

- **CVRPTW**: Capacitated Vehicle Routing with Time Windows
- **Multiple Solvers**: OR-Tools and Gurobi support
- **Time Windows**: Hard and soft time window constraints
- **Capacity Constraints**: Vehicle capacity limits
- **Distance/Time Matrices**: Support for custom matrices
- **Route Optimization**: Minimize total distance or time

## Notes

- CVRPTW solver requires ortools.constraint_solver
- Gurobi optimizer requires gurobipy (optional)
- Time window handler works independently
- All solvers support both distance and time optimization
- Tests will skip if required libraries are not available

