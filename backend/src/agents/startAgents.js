#!/usr/bin/env node

/**
 * Agent Startup Script
 * 
 * This script initializes and starts all agents for the local CSCM prototype.
 */

const { 
  StoreAgent, 
  WarehouseAgent, 
  TransportAgent, 
  CentralPlannerAgent, 
  SimulationAgent 
} = require('./index');

const agents = [];

async function startAgents() {
  console.log('Starting CSCM Agents...');
  
  try {
    // Initialize Central Planner Agent
    const centralPlanner = new CentralPlannerAgent();
    await centralPlanner.initialize();
    agents.push({ name: 'Central Planner', instance: centralPlanner });
    console.log('✓ Central Planner Agent started');
    
    // Initialize Store Agents
    const store1 = new StoreAgent('STORE-1');
    await store1.initialize();
    agents.push({ name: 'Store 1', instance: store1 });
    console.log('✓ Store Agent 1 started');
    
    const store2 = new StoreAgent('STORE-2');
    await store2.initialize();
    agents.push({ name: 'Store 2', instance: store2 });
    console.log('✓ Store Agent 2 started');
    
    // Initialize Warehouse Agents
    const warehouse1 = new WarehouseAgent('WAREHOUSE-1');
    await warehouse1.initialize();
    agents.push({ name: 'Warehouse 1', instance: warehouse1 });
    console.log('✓ Warehouse Agent 1 started');
    
    // Initialize Transport Agents
    const transport1 = new TransportAgent('TRANSPORT-1');
    await transport1.initialize();
    agents.push({ name: 'Transport 1', instance: transport1 });
    console.log('✓ Transport Agent 1 started');
    
    // Initialize Simulation Agent
    const simulation = new SimulationAgent();
    await simulation.initialize();
    agents.push({ name: 'Simulation', instance: simulation });
    console.log('✓ Simulation Agent started');
    
    console.log('\nAll agents started successfully!');
    console.log('Agents are now running and communicating via the messaging layer.');
    console.log('Press Ctrl+C to stop all agents.');
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down agents...');
      await shutdownAgents();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start agents:', error.message);
    process.exit(1);
  }
}

async function shutdownAgents() {
  console.log('Shutting down agents...');
  
  // Shutdown agents in reverse order
  for (let i = agents.length - 1; i >= 0; i--) {
    const agent = agents[i];
    try {
      if (agent.instance && typeof agent.instance.shutdown === 'function') {
        await agent.instance.shutdown();
      }
      console.log(`✓ ${agent.name} shut down`);
    } catch (error) {
      console.error(`Failed to shut down ${agent.name}:`, error.message);
    }
  }
  
  console.log('All agents shut down successfully');
}

// Start agents if run directly
if (require.main === module) {
  startAgents();
}

module.exports = { startAgents, shutdownAgents };