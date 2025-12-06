const processManager = require('./processManager');
const logger = require('../utils/logger');

/**
 * Health Monitor
 * 
 * This module monitors the health of agent processes and reports status.
 */

class HealthMonitor {
  constructor() {
    this.monitoringInterval = null;
    this.checkIntervalMs = 30000; // 30 seconds
  }

  /**
   * Start health monitoring
   */
  startMonitoring() {
    try {
      if (this.monitoringInterval) {
        logger.warn('Health monitoring already started');
        return;
      }

      logger.info('Starting health monitoring');
      
      // Perform initial check
      this._performHealthCheck();
      
      // Set up periodic checks
      this.monitoringInterval = setInterval(() => {
        this._performHealthCheck();
      }, this.checkIntervalMs);
      
      logger.info(`Health monitoring started with ${this.checkIntervalMs}ms interval`);
    } catch (error) {
      logger.error('Failed to start health monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring() {
    try {
      if (!this.monitoringInterval) {
        logger.warn('Health monitoring not started');
        return;
      }

      logger.info('Stopping health monitoring');
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Health monitoring stopped');
    } catch (error) {
      logger.error('Failed to stop health monitoring:', error.message);
      throw error;
    }
  }

  /**
   * Perform a health check
   * @private
   */
  async _performHealthCheck() {
    try {
      logger.debug('Performing health check');
      
      // Get health status from process manager
      const healthReport = await processManager.healthCheck();
      
      // Log any issues
      if (healthReport.overallStatus === 'unhealthy') {
        logger.warn('System health is unhealthy:', JSON.stringify(healthReport, null, 2));
      } else {
        logger.debug('System health is healthy');
      }
      
      // Check for agents that need restart
      for (const [agentName, agentStatus] of Object.entries(healthReport.agents)) {
        if (agentStatus.status === 'error' || agentStatus.status === 'failed') {
          logger.warn(`Agent ${agentName} is in ${agentStatus.status} state, attempting restart`);
          
          // Try to restart the agent
          processManager.restartAgent(agentName).catch(error => {
            logger.error(`Failed to restart agent ${agentName}:`, error.message);
          });
        }
      }
      
      return healthReport;
    } catch (error) {
      logger.error('Health check failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current health status
   * @returns {Object} Current health status
   */
  async getHealthStatus() {
    try {
      return await processManager.healthCheck();
    } catch (error) {
      logger.error('Failed to get health status:', error.message);
      throw error;
    }
  }

  /**
   * Get agent-specific health status
   * @param {string} agentName - Name of the agent
   * @returns {Object} Agent health status
   */
  async getAgentHealth(agentName) {
    try {
      const status = processManager.getAgentStatus(agentName);
      return {
        agent: agentName,
        status: status ? status.status : 'unknown',
        lastStarted: status ? status.lastStarted : null,
        lastStopped: status ? status.lastStopped : null,
        error: status ? status.error : null
      };
    } catch (error) {
      logger.error(`Failed to get health status for agent ${agentName}:`, error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new HealthMonitor();