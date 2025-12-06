#!/usr/bin/env node

/**
 * Agent Runtime Startup Script
 * 
 * This script initializes and starts the agent runtime environment.
 */

const agentRuntime = require('./index');
const logger = require('../utils/logger');

async function startAgentRuntime() {
  console.log('Starting CSCM Agent Runtime...');
  
  try {
    // Initialize and start all agents
    await agentRuntime.startAllAgents();
    
    console.log('\nAll agents started successfully!');
    console.log('Agent runtime is now running.');
    console.log('Press Ctrl+C to stop all agents.');
    
    // Display agent statuses
    const statuses = agentRuntime.getAllAgentsStatus();
    console.log('\nAgent Statuses:');
    for (const [agentName, status] of Object.entries(statuses)) {
      console.log(`  ${agentName}: ${status.status}`);
    }
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n\nShutting down agent runtime...');
      await agentRuntime.stopAllAgents();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start agent runtime:', error.message);
    process.exit(1);
  }
}

// Start agent runtime if run directly
if (require.main === module) {
  startAgentRuntime();
}

module.exports = { startAgentRuntime };