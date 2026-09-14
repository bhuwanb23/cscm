/**
 * Base User Simulator Framework
 * Provides the foundation for simulating realistic user behavior
 */

const axios = require('axios');
const config = require('./config');
const AuditLog = require('./auditLog');
const SimulationAnalytics = require('./analytics');

class UserSimulator {
  constructor() {
    this.config = config;
    this.auditLog = new AuditLog(config);
    this.analytics = new SimulationAnalytics(this.auditLog);
    this.users = {};
    this.isRunning = false;
  }

  /**
   * Initialize simulated users
   */
  initializeUsers() {
    const { counts, namePattern } = this.config.users;
    const roles = ['shopkeeper', 'transporter', 'wholesaler', 'admin'];

    roles.forEach(role => {
      this.users[role] = [];
      for (let i = 1; i <= counts[role]; i++) {
        const userId = `${namePattern[role]}${String(i).padStart(3, '0')}`;
        this.users[role].push({
          id: userId,
          username: userId,
          password: this.generatePassword(),
          role: role,
          token: null
        });
      }
    });

    console.log(`Initialized ${Object.values(this.users).flat().length} simulated users`);
  }

  /**
   * Generate a random password
   */
  generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Random delay between actions
   */
  async randomDelay() {
    const { actionDelayMin, actionDelayMax } = this.config.behavior;
    const delay = Math.random() * (actionDelayMax - actionDelayMin) + actionDelayMin;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Random delay between user cycles
   */
  async randomCycleDelay() {
    const { cycleDelayMin, cycleDelayMax } = this.config.behavior;
    const delay = Math.random() * (cycleDelayMax - cycleDelayMin) + cycleDelayMin;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(method, endpoint, data = null, token = null, headers = {}) {
    const url = `${this.config.api.backendUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const { maxAttempts, initialDelay, backoffMultiplier } = this.config.retry;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios({
          method,
          url,
          headers: requestHeaders,
          data,
          timeout: 10000
        });
        return { success: true, data: response.data, status: response.status };
      } catch (error) {
        if (attempt === maxAttempts) {
          return { success: false, error: error.message };
        }
        
        const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Register a user
   */
  async registerUser(user) {
    const response = await this.makeRequest('POST', '/api/v1/auth/register', {
      username: user.username,
      email: `${user.username}@cscm-sim.local`,
      password: user.password
    });

    this.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'register',
      endpoint: '/api/v1/auth/register',
      result: response.success ? 'success' : 'failed',
      business_context: `User registration for ${user.role} role`
    });

    if (response.success) {
      user.token = response.data.token;
    }

    return response;
  }

  /**
   * Login a user
   */
  async loginUser(user) {
    const response = await this.makeRequest('POST', '/api/v1/auth/login', {
      username: user.username,
      password: user.password
    });

    this.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'login',
      endpoint: '/api/v1/auth/login',
      result: response.success ? 'success' : 'failed',
      business_context: `User login for ${user.role} role`
    });

    if (response.success) {
      user.token = response.data.token;
    }

    return response;
  }

  /**
   * Check if within business hours
   */
  isBusinessHours() {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const { start, end } = this.config.schedule.businessHours;
    return utcHour >= start && utcHour < end;
  }

  /**
   * Run simulation for a specific user
   */
  async simulateUser(user, behaviorScript) {
    if (!this.isBusinessHours()) {
      console.log(`Outside business hours, skipping ${user.id}`);
      return;
    }

    // Login if not authenticated
    if (!user.token) {
      const loginResult = await this.loginUser(user);
      if (!loginResult.success) {
        console.log(`Failed to login ${user.id}, skipping simulation`);
        return;
      }
    }

    // Execute behavior script
    await behaviorScript(user, this);
  }

  /**
   * Run simulation for all users
   */
  async runSimulation(behaviorScripts) {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting user simulation...');

    try {
      const roles = Object.keys(this.users);
      
      for (const role of roles) {
        for (const user of this.users[role]) {
          if (behaviorScripts[role]) {
            await this.simulateUser(user, behaviorScripts[role]);
            await this.randomCycleDelay();
          }
        }
      }

      console.log('Simulation cycle completed');
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get simulation report
   */
  getReport() {
    return this.analytics.generateReport();
  }

  /**
   * Get dashboard data
   */
  getDashboardData() {
    return this.analytics.getDashboardData();
  }

  /**
   * Export audit logs
   */
  exportLogs() {
    return this.auditLog.exportToCSV();
  }

  /**
   * Stop simulation
   */
  stop() {
    this.isRunning = false;
    console.log('Simulation stopped');
  }
}

module.exports = UserSimulator;
