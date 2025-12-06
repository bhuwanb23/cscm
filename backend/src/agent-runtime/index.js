const processManager = require('./processManager');
const healthMonitor = require('./healthMonitor');
const logger = require('../utils/logger');

/**
 * Agent Runtime Entry Point
 * 
 * This module provides the main interface for managing agent processes.
 */

class AgentRuntime {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Initialize the agent runtime
   */
  async initialize() {
    try {
      logger.info('Initializing agent runtime');
      
      // Initialize process manager
      await processManager.initialize();
      
      this.isRunning = true;
      logger.info('Agent runtime initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize agent runtime:', error.message);
      throw error;
    }
  }

  /**
   * Start all agents
   */
  async startAllAgents() {
    try {
      if (!this.isRunning) {
        await this.initialize();
      }
      
      logger.info('Starting all agents');
      await processManager.startAllAgents();
      
      // Start health monitoring
      healthMonitor.startMonitoring();
      
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
      
      // Stop health monitoring
      healthMonitor.stopMonitoring();
      
      await processManager.stopAllAgents();
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
      if (!this.isRunning) {
        await this.initialize();
      }
      
      await processManager.startAgent(agentName);
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
      await processManager.stopAgent(agentName);
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
      await processManager.restartAgent(agentName);
    } catch (error) {
      logger.error(`Failed to restart agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get status of all agents
   * @returns {Object} Status of all agents
   */
  getAllAgentsStatus() {
    return processManager.getAllAgentsStatus();
  }

  /**
   * Get status of a specific agent
   * @param {string} agentName - Name of the agent
   * @returns {Object} Status of the agent
   */
  getAgentStatus(agentName) {
    return processManager.getAgentStatus(agentName);
  }

  /**
   * Get health status of all agents
   * @returns {Object} Health status of all agents
   */
  async getHealthStatus() {
    return await healthMonitor.getHealthStatus();
  }

  /**
   * Get health status of a specific agent
   * @param {string} agentName - Name of the agent
   * @returns {Object} Health status of the agent
   */
  async getAgentHealth(agentName) {
    return await healthMonitor.getAgentHealth(agentName);
  }
}

// Export singleton instance
module.exports = new AgentRuntime();