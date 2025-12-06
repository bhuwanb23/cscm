#!/usr/bin/env node

/**
 * Agent Verification Script
 * 
 * This script verifies that all agent modules can be imported and instantiated correctly.
 */

const { 
  StoreAgent, 
  WarehouseAgent, 
  TransportAgent, 
  CentralPlannerAgent, 
  SimulationAgent 
} = require('./index');

console.log('Verifying CSCM Agent Framework...\n');

try {
  // Test importing and instantiating each agent
  console.log('1. Testing Store Agent...');
  const storeAgent = new StoreAgent('VERIFICATION-STORE');
  console.log('   ✓ Store Agent imported and instantiated successfully\n');
  
  console.log('2. Testing Warehouse Agent...');
  const warehouseAgent = new WarehouseAgent('VERIFICATION-WAREHOUSE');
  console.log('   ✓ Warehouse Agent imported and instantiated successfully\n');
  
  console.log('3. Testing Transport Agent...');
  const transportAgent = new TransportAgent('VERIFICATION-TRANSPORT');
  console.log('   ✓ Transport Agent imported and instantiated successfully\n');
  
  console.log('4. Testing Central Planner Agent...');
  const centralPlannerAgent = new CentralPlannerAgent();
  console.log('   ✓ Central Planner Agent imported and instantiated successfully\n');
  
  console.log('5. Testing Simulation Agent...');
  const simulationAgent = new SimulationAgent();
  console.log('   ✓ Simulation Agent imported and instantiated successfully\n');
  
  console.log('🎉 All agents verified successfully!');
  console.log('\nSummary:');
  console.log('  - Store Agent: Ready');
  console.log('  - Warehouse Agent: Ready');
  console.log('  - Transport Agent: Ready');
  console.log('  - Central Planner Agent: Ready');
  console.log('  - Simulation Agent: Ready');
  console.log('\nThe agent framework is properly configured and ready for use.');
  
} catch (error) {
  console.error('❌ Agent verification failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}