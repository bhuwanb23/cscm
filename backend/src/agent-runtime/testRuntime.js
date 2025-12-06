#!/usr/bin/env node

/**
 * Agent Runtime Test Script
 * 
 * This script tests the agent runtime functionality.
 */

const agentRuntime = require('./index');
const logger = require('../utils/logger');

async function testAgentRuntime() {
  console.log('🧪 Testing Agent Runtime...\n');
  
  try {
    // Initialize agent runtime
    console.log('🔧 Initializing agent runtime...');
    await agentRuntime.initialize();
    console.log('✅ Agent runtime initialized\n');
    
    // Test starting individual agents
    console.log('🚀 Testing individual agent startup...');
    
    // Start Central Planner Agent
    console.log('  Starting Central Planner Agent...');
    await agentRuntime.startAgent('CentralPlannerAgent');
    console.log('  ✅ Central Planner Agent started');
    
    // Start one Store Agent
    console.log('  Starting Store Agent 1...');
    await agentRuntime.startAgent('StoreAgent1');
    console.log('  ✅ Store Agent 1 started\n');
    
    // Check agent statuses
    console.log('📋 Checking agent statuses...');
    const statuses = agentRuntime.getAllAgentsStatus();
    for (const [agentName, status] of Object.entries(statuses)) {
      console.log(`  ${agentName}: ${status.status}`);
    }
    console.log();
    
    // Test health monitoring
    console.log('❤️  Testing health monitoring...');
    const healthStatus = await agentRuntime.getHealthStatus();
    console.log(`  Overall system health: ${healthStatus.overallStatus}`);
    console.log();
    
    // Test stopping individual agents
    console.log('🛑 Testing individual agent shutdown...');
    await agentRuntime.stopAgent('StoreAgent1');
    console.log('  ✅ Store Agent 1 stopped\n');
    
    // Check updated statuses
    console.log('📋 Checking updated agent statuses...');
    const updatedStatuses = agentRuntime.getAllAgentsStatus();
    for (const [agentName, status] of Object.entries(updatedStatuses)) {
      console.log(`  ${agentName}: ${status.status}`);
    }
    console.log();
    
    console.log('🎉 All agent runtime tests completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Agent runtime test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testAgentRuntime();
}

module.exports = { testAgentRuntime };