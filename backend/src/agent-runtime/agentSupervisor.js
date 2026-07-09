const { spawn } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Agent Supervisor
 * 
 * This module manages agent processes, monitors their health,
 * and provides restart capabilities.
 */

class AgentSupervisor {
  constructor() {
    this.agents = new Map(); // Store agent processes
    this.agentStatus = new Map(); // Store agent status information
    this.restartAttempts = new Map(); // Track restart attempts
    this.maxRestartAttempts = 3; // Maximum restart attempts before giving up
  }

  /**
   * Register an agent for supervision
   * @param {string} agentName - Name of the agent
   * @param {string} scriptPath - Path to the agent script
   * @param {Object} options - Agent options
   */
  registerAgent(agentName, scriptPath, options = {}) {
    try {
      this.agents.set(agentName, {
        scriptPath,
        options,
        process: null,
        status: 'stopped'
      });
      
      this.agentStatus.set(agentName, {
        status: 'stopped',
        lastStarted: null,
        lastStopped: null,
        restartCount: 0,
        error: null
      });
      
      logger.info(`Registered agent ${agentName} for supervision`);
    } catch (error) {
      logger.error(`Failed to register agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Start an agent
   * @param {string} agentName - Name of the agent to start
   */
  async startAgent(agentName) {
    try {
      const agent = this.agents.get(agentName);
      if (!agent) {
        throw new Error(`Agent ${agentName} not registered`);
      }

      // If agent is already running, stop it first
      if (agent.process) {
        await this.stopAgent(agentName);
      }

      // Spawn the agent process
      logger.info(`Starting agent ${agentName} with script ${agent.scriptPath}`);
      
      const agentProcess = spawn('node', [agent.scriptPath], {
        cwd: process.cwd(),
        env: process.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Update agent info
      agent.process = agentProcess;
      agent.status = 'running';
      
      // Update status
      const status = this.agentStatus.get(agentName);
      status.status = 'running';
      status.lastStarted = new Date();
      status.error = null;
      
      this.agentStatus.set(agentName, status);

      // Handle process events
      agentProcess.on('exit', (code, signal) => {
        this._handleAgentExit(agentName, code, signal);
      });

      agentProcess.on('error', (error) => {
        this._handleAgentError(agentName, error);
      });

      // Log stdout and stderr
      agentProcess.stdout.on('data', (data) => {
        logger.debug(`[${agentName} STDOUT]: ${data.toString().trim()}`);
      });

      agentProcess.stderr.on('data', (data) => {
        logger.warn(`[${agentName} STDERR]: ${data.toString().trim()}`);
      });

      logger.info(`Agent ${agentName} started successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to start agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Stop an agent
   * @param {string} agentName - Name of the agent to stop
   */
  async stopAgent(agentName) {
    try {
      const agent = this.agents.get(agentName);
      if (!agent || !agent.process) {
        logger.warn(`Agent ${agentName} is not running`);
        return false;
      }

      logger.info(`Stopping agent ${agentName}`);
      
      // Update status
      const status = this.agentStatus.get(agentName);
      status.status = 'stopping';
      this.agentStatus.set(agentName, status);

      // Mark as intentionally stopping to prevent auto-restart
      agent.intentionallyStopping = true;
      
      // Kill the process
      agent.process.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise((resolve) => {
        setTimeout(() => {
          if (agent.process && !agent.process.killed) {
            agent.process.kill('SIGKILL');
          }
          resolve();
        }, 5000); // Wait 5 seconds for graceful shutdown
      });

      // Clean up
      agent.process = null;
      agent.status = 'stopped';
      delete agent.intentionallyStopping;
      
      // Update status
      status.status = 'stopped';
      status.lastStopped = new Date();
      this.agentStatus.set(agentName, status);

      logger.info(`Agent ${agentName} stopped successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to stop agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Restart an agent
   * @param {string} agentName - Name of the agent to restart
   */
  async restartAgent(agentName) {
    try {
      logger.info(`Restarting agent ${agentName}`);
      
      // Increment restart count
      const status = this.agentStatus.get(agentName);
      status.restartCount = (status.restartCount || 0) + 1;
      this.agentStatus.set(agentName, status);
      
      // Check if we've exceeded max restart attempts
      if (status.restartCount > this.maxRestartAttempts) {
        logger.error(`Agent ${agentName} has exceeded maximum restart attempts (${this.maxRestartAttempts})`);
        status.status = 'failed';
        status.error = 'Max restart attempts exceeded';
        this.agentStatus.set(agentName, status);
        return false;
      }
      
      // Stop and start the agent
      await this.stopAgent(agentName);
      await this.startAgent(agentName);
      
      logger.info(`Agent ${agentName} restarted successfully`);
      return true;
    } catch (error) {
      logger.error(`Failed to restart agent ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get agent status
   * @param {string} agentName - Name of the agent
   * @returns {Object} Agent status information
   */
  getAgentStatus(agentName) {
    return this.agentStatus.get(agentName) || null;
  }

  /**
   * Get status of all agents
   * @returns {Object} Status of all agents
   */
  getAllAgentsStatus() {
    const status = {};
    for (const [agentName, agentStatus] of this.agentStatus.entries()) {
      status[agentName] = agentStatus;
    }
    return status;
  }

  /**
   * Handle agent process exit
   * @private
   */
  _handleAgentExit(agentName, code, signal) {
    try {
      const agent = this.agents.get(agentName);
      const status = this.agentStatus.get(agentName);
      
      logger.info(`Agent ${agentName} exited with code ${code} and signal ${signal}`);
      
      // Update agent info
      if (agent) {
        agent.process = null;
        agent.status = 'stopped';
      }
      
      // Update status
      if (status) {
        status.status = 'stopped';
        status.lastStopped = new Date();
        
        if (code !== 0) {
          status.error = `Exited with code ${code}`;
        }
        
        this.agentStatus.set(agentName, status);
      }
      
      // Attempt restart if the agent exited unexpectedly
      // Skip restart if the agent was intentionally stopped
      if (!agent || !agent.intentionallyStopping) {
        if (code !== 0 && status && status.restartCount < this.maxRestartAttempts) {
          logger.info(`Attempting to restart agent ${agentName} after unexpected exit`);
          setTimeout(() => {
            this.restartAgent(agentName).catch(error => {
              logger.error(`Failed to restart agent ${agentName}:`, error.message);
            });
          }, 1000); // Wait 1 second before restart
        }
      } else {
        logger.debug(`Skipping restart for agent ${agentName} as it was intentionally stopped`);
      }
    } catch (error) {
      logger.error(`Error handling agent ${agentName} exit:`, error.message);
    }
  }

  /**
   * Handle agent process error
   * @private
   */
  _handleAgentError(agentName, error) {
    try {
      const status = this.agentStatus.get(agentName);
      
      logger.error(`Agent ${agentName} encountered an error:`, error.message);
      
      // Update status
      if (status) {
        status.status = 'error';
        status.error = error.message;
        this.agentStatus.set(agentName, status);
      }
      
      // Attempt restart if we haven't exceeded max attempts
      if (status && status.restartCount < this.maxRestartAttempts) {
        logger.info(`Attempting to restart agent ${agentName} after error`);
        setTimeout(() => {
          this.restartAgent(agentName).catch(restartError => {
            logger.error(`Failed to restart agent ${agentName}:`, restartError.message);
          });
        }, 1000); // Wait 1 second before restart
      }
    } catch (handleError) {
      logger.error(`Error handling agent ${agentName} error:`, handleError.message);
    }
  }

  /**
   * Start all registered agents
   */
  async startAllAgents() {
    try {
      logger.info('Starting all registered agents');
      
      const promises = [];
      for (const [agentName, agent] of this.agents.entries()) {
        promises.push(this.startAgent(agentName));
      }
      
      await Promise.all(promises);
      logger.info('All agents started successfully');
    } catch (error) {
      logger.error('Failed to start all agents:', error.message);
      throw error;
    }
  }

  /**
   * Stop all registered agents
   */
  async stopAllAgents() {
    try {
      logger.info('Stopping all registered agents');
      
      const promises = [];
      for (const [agentName, agent] of this.agents.entries()) {
        if (agent.status === 'running') {
          promises.push(this.stopAgent(agentName));
        }
      }
      
      await Promise.all(promises);
      logger.info('All agents stopped successfully');
    } catch (error) {
      logger.error('Failed to stop all agents:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new AgentSupervisor();