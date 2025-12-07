const agentSupervisor = require('./agentSupervisor');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Agent Process Manager
 * 
 * This module manages the lifecycle of agent processes, including
 * registration, startup, shutdown, and health monitoring.
 */

class ProcessManager {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Initialize the process manager
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        logger.warn('Process manager already initialized');
        return;
      }

      logger.info('Initializing process manager');
      
      // Register all agents
      this._registerAgents();
      
      this.isInitialized = true;
      logger.info('Process manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize process manager:', error.message);
      throw error;
    }
  }

  /**
   * Register all agents for supervision
   * @private
   */
  _registerAgents() {
    try {
      logger.info('Registering agents for supervision');
      
      // Register store agents
      agentSupervisor.registerAgent(
        'StoreAgent1', 
        path.join(__dirname, '..', 'agents', 'store', 'store.js'),
        { storeId: 'STORE-1' }
      );
      
      agentSupervisor.registerAgent(
        'StoreAgent2', 
        path.join(__dirname, '..', 'agents', 'store', 'store.js'),
        { storeId: 'STORE-2' }
      );
      
      // Register warehouse agents
      agentSupervisor.registerAgent(
        'WarehouseAgent1', 
        path.join(__dirname, '..', 'agents', 'warehouse', 'warehouse.js'),
        { warehouseId: 'WAREHOUSE-1' }
      );
      
      // Register transport agents
      agentSupervisor.registerAgent(
        'TransportAgent1', 
        path.join(__dirname, '..', 'agents', 'transport', 'transport.js'),
        { transportId: 'TRANSPORT-1' }
      );
      
      // Register supplier agents
      agentSupervisor.registerAgent(
        'SupplierAgent1', 
        path.join(__dirname, '..', 'agents', 'supplier', 'supplier.js'),
        { supplierId: 'SUPPLIER-1' }
      );
      
      // Register customer demand agents
      agentSupervisor.registerAgent(
        'CustomerDemandAgent', 
        path.join(__dirname, '..', 'agents', 'customer-demand', 'customer-demand.js')
      );
      
      // Register central planner agent
      agentSupervisor.registerAgent(
        'CentralPlannerAgent', 
        path.join(__dirname, '..', 'agents', 'central-planner', 'central-planner.js')
      );
      
      // Register simulation agent
      agentSupervisor.registerAgent(
        'SimulationAgent', 
        path.join(__dirname, '..', 'agents', 'simulation', 'simulation.js')
      );
      
      logger.info('All agents registered successfully');
    } catch (error) {
      logger.error('Failed to register agents:', error.message);
      throw error;
    }
  }

  /**
   * Start all agents
   */
  async startAllAgents() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      logger.info('Starting all agents');
      await agentSupervisor.startAllAgents();
      logger.info('All agents started successfully');
    } catch (error) {
      logger.error('Failed to start all agents:', error.message);
      throw error;
    }
  }

  /**
   * Stop all agents
   */
  async stopAllAgents() {
    try {
      logger.info('Stopping all agents');
      await agentSupervisor.stopAllAgents();
      logger.info('All agents stopped successfully');
    } catch (error) {
      logger.error('Failed to stop all agents:', error.message);
      throw error;
    }
  }

  /**
   * Start a specific agent
   * @param {string} agentName - Name of the agent to start
   */
  async startAgent(agentName) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      logger.info(`Starting agent ${agentName}`);
      await agentSupervisor.startAgent(agentName);
      logger.info(`Agent ${agentName} started successfully`);
    } catch (error) {
      logger.error(`Failed to start agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop a specific agent
   * @param {string} agentName - Name of the agent to stop
   */
  async stopAgent(agentName) {
    try {
      logger.info(`Stopping agent ${agentName}`);
      await agentSupervisor.stopAgent(agentName);
      logger.info(`Agent ${agentName} stopped successfully`);
    } catch (error) {
      logger.error(`Failed to stop agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Restart a specific agent
   * @param {string} agentName - Name of the agent to restart
   */
  async restartAgent(agentName) {
    try {
      logger.info(`Restarting agent ${agentName}`);
      await agentSupervisor.restartAgent(agentName);
      logger.info(`Agent ${agentName} restarted successfully`);
    } catch (error) {
      logger.error(`Failed to restart agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get status of a specific agent
   * @param {string} agentName - Name of the agent
   * @returns {Object} Agent status information
   */
  getAgentStatus(agentName) {
    return agentSupervisor.getAgentStatus(agentName);
  }

  /**
   * Get status of all agents
   * @returns {Object} Status of all agents
   */
  getAllAgentsStatus() {
    return agentSupervisor.getAllAgentsStatus();
  }

  /**
   * Health check for all agents
   * @returns {Object} Health status of all agents
   */
  async healthCheck() {
    try {
      const statuses = this.getAllAgentsStatus();
      const healthReport = {
        timestamp: new Date().toISOString(),
        overallStatus: 'healthy',
        agents: {}
      };
      
      for (const [agentName, status] of Object.entries(statuses)) {
        healthReport.agents[agentName] = {
          status: status.status,
          lastStarted: status.lastStarted,
          lastStopped: status.lastStopped,
          error: status.error
        };
        
        // If any agent is in error state, mark overall as unhealthy
        if (status.status === 'error' || status.status === 'failed') {
          healthReport.overallStatus = 'unhealthy';
        }
      }
      
      return healthReport;
    } catch (error) {
      logger.error('Health check failed:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProcessManager();