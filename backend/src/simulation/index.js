/**
 * User Simulation Entry Point
 * Main entry point for autonomous user simulation
 */

const UserSimulator = require('./userSimulator');
const shopkeeperBehavior = require('./behaviors/shopkeeper');
const transporterBehavior = require('./behaviors/transporter');
const wholesalerBehavior = require('./behaviors/wholesaler');
const adminBehavior = require('./behaviors/admin');

// Create simulator instance
const simulator = new UserSimulator();

// Load behavior scripts
const behaviorScripts = {
  shopkeeper: shopkeeperBehavior,
  transporter: transporterBehavior,
  wholesaler: wholesalerBehavior,
  admin: adminBehavior
};

/**
 * Initialize and run simulation
 */
async function runSimulation() {
  try {
    console.log('=== CSCM User Simulation ===');
    console.log('Initializing simulated users...');
    
    // Initialize users
    simulator.initializeUsers();
    
    // Register all users (first time only)
    console.log('Registering users...');
    const allUsers = Object.values(simulator.users).flat();
    
    for (const user of allUsers) {
      await simulator.registerUser(user);
      await simulator.randomDelay();
    }
    
    console.log('User registration completed');
    
    // Run simulation cycle
    console.log('Starting simulation cycle...');
    await simulator.runSimulation(behaviorScripts);
    
    // Generate report
    console.log('Generating simulation report...');
    const report = simulator.getReport();
    console.log('Simulation Report:', JSON.stringify(report, null, 2));
    
    // Export logs
    const csvLogs = simulator.exportLogs();
    console.log('Audit logs exported (CSV format)');
    
    console.log('Simulation completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

/**
 * Run continuous simulation (for scheduled execution)
 */
async function runContinuousSimulation() {
  console.log('=== CSCM Continuous User Simulation ===');
  
  simulator.initializeUsers();
  
  // Users should already be registered, just login
  const allUsers = Object.values(simulator.users).flat();
  for (const user of allUsers) {
    await simulator.loginUser(user);
    await simulator.randomDelay();
  }
  
  // Run simulation
  await simulator.runSimulation(behaviorScripts);
  
  const report = simulator.getReport();
  console.log('Simulation cycle completed:', JSON.stringify(report.summary, null, 2));
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    runContinuousSimulation();
  } else {
    runSimulation();
  }
}

module.exports = { simulator, behaviorScripts, runSimulation, runContinuousSimulation };
