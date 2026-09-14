/**
 * Admin Behavior Script
 * Simulates realistic admin actions in the CSCM system
 */

const config = require('../config');

/**
 * Admin behavior: Check health, review users, generate reports
 */
async function adminBehavior(user, simulator) {
  const { probabilities } = config.behavior.probabilities.admin;

  // Action 1: Check system health (always execute)
  if (Math.random() < probabilities.checkHealth) {
    const response = await simulator.makeRequest(
      'GET',
      '/health',
      null,
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'check_health',
      endpoint: '/health',
      result: response.success ? 'success' : 'failed',
      business_context: 'Checking overall system health and status'
    });

    if (response.success) {
      console.log(`${user.id}: System health check passed`);
    }
  }

  await simulator.randomDelay();

  // Action 2: Review active users
  if (Math.random() < probabilities.reviewUsers) {
    const response = await simulator.makeRequest(
      'GET',
      '/api/v1/auth/profile',
      null,
      user.token
    );

    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'review_users',
      endpoint: '/api/v1/auth/profile',
      result: response.success ? 'success' : 'failed',
      business_context: 'Reviewing active user accounts and profiles'
    });

    if (response.success) {
      console.log(`${user.id}: Reviewed user profiles`);
    }
  }

  await simulator.randomDelay();

  // Action 3: Generate daily summary report
  if (Math.random() < probabilities.generateReports) {
    const report = simulator.getReport();
    
    simulator.auditLog.log({
      user_role: user.role,
      user_id: user.id,
      action: 'generate_reports',
      endpoint: 'internal',
      result: 'success',
      business_context: `Generated daily summary: ${report.summary.totalActions} actions, ${report.summary.successRate}% success rate`
    });

    console.log(`${user.id}: Generated daily summary report`);
  }
}

module.exports = adminBehavior;
