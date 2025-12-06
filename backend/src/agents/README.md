# CSCM Local Agent Framework

This directory contains the local agent implementations for the Cognitive Supply Chain Mesh prototype.

## Overview

The agent framework consists of five specialized agents that work together to simulate a complete supply chain:

1. **Store Agent** - Manages store-level inventory and demand forecasting
2. **Warehouse Agent** - Handles warehouse operations including picking, packing, and shipping
3. **Transport Agent** - Manages transportation logistics including route optimization and delivery tracking
4. **Central Planner Agent** - Coordinates between different agents and makes high-level decisions
5. **Simulation Agent** - Generates simulated data for testing and demonstration

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Starting All Agents

To start all agents at once, run:

```bash
npm run agents
```

This will start all agents with appropriate connections and begin simulating supply chain operations.

### Starting Individual Agents

Each agent can also be started individually for testing:

```bash
# Start store agent
node src/agents/store_agent.js STORE-1

# Start warehouse agent
node src/agents/warehouse_agent.js WAREHOUSE-1

# Start transport agent
node src/agents/transport_agent.js TRANSPORT-1

# Start central planner agent
node src/agents/central_planner_agent.js

# Start simulation agent
node src/agents/simulation_agent.js
```

## Architecture

### Communication

Agents communicate through the messaging layer using Kafka-style topics:

- `inventory.update.{storeId}` - Inventory updates from stores
- `demand.forecast.{storeId}` - Demand forecasts for stores
- `inventory.restock.request` - Restock requests from stores
- `shipment.request.{warehouseId}` - Shipment requests to warehouses
- `shipment.ready.{warehouseId}` - Shipment ready notifications from warehouses
- `delivery.assignment.{transportId}` - Delivery assignments to transporters
- `delivery.assigned.{transportId}` - Delivery confirmation from transporters
- `simulation.control` - Control messages for the simulation agent
- `simulation.status` - Status updates from the simulation agent
- `alerts` - System alerts and notifications

### State Management

Each agent maintains its state in JSON files located in the `data` directory:

- Store agents: `data/store_{storeId}_state.json`
- Warehouse agents: `data/warehouse_{warehouseId}_state.json`
- Transport agents: `data/transport_{transportId}_state.json`
- Central planner agent: `data/central_planner_state.json`
- Simulation agent: `data/simulation_state.json`

### Data Storage

The framework uses a simple local storage system based on JSON files. For more complex scenarios, this can be extended to use SQLite or other databases.

## Customization

### Adding New Agents

To add a new agent type:

1. Create a new agent file in `src/agents/` (e.g., `supplier_agent.js`)
2. Implement the required methods (`initialize`, message handlers, etc.)
3. Add the agent to `src/agents/index.js`
4. Update `src/agents/startAgents.js` to include the new agent

### Modifying Behavior

Each agent can be customized by modifying its respective file. Common customizations include:

- Adjusting decision-making logic
- Adding new message handlers
- Modifying state management
- Changing communication patterns

## Testing

Run the test suite with:

```bash
npm test
```

Individual agent tests can be found in `src/tests/agents/`.

## Troubleshooting

### Agents Not Communicating

1. Ensure all agents are running
2. Check that the messaging layer is properly configured
3. Verify that agents are subscribed to the correct topics

### State Not Persisting

1. Check that the `data` directory has write permissions
2. Verify that the storage path is correct in each agent

### Performance Issues

1. Reduce the simulation speed in the simulation agent
2. Limit the number of concurrent agents
3. Optimize message processing logic in handlers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.