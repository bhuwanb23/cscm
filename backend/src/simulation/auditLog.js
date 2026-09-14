/**
 * Audit Log for User Simulation
 * Logs all simulation activities for hackathon validation
 */

const fs = require('fs');
const path = require('path');

class AuditLog {
  constructor(config) {
    this.config = config;
    this.logPath = config.logging.auditLogPath;
    this.enableAuditLog = config.logging.enableAuditLog;
    this.logs = [];
    
    // Ensure log directory exists
    if (this.enableAuditLog) {
      const logDir = path.dirname(this.logPath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Log a simulation activity
   */
  log(activity) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...activity
    };

    this.logs.push(logEntry);

    // Write to file if enabled
    if (this.enableAuditLog) {
      fs.appendFileSync(this.logPath, JSON.stringify(logEntry) + '\n');
    }

    // Console log for visibility
    console.log(`[SIMULATION] ${logEntry.user_role} - ${logEntry.action}: ${logEntry.result}`);
  }

  /**
   * Get all logs
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Get logs by role
   */
  getLogsByRole(role) {
    return this.logs.filter(log => log.user_role === role);
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action) {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get success rate
   */
  getSuccessRate() {
    if (this.logs.length === 0) return 0;
    const successCount = this.logs.filter(log => log.result === 'success').length;
    return (successCount / this.logs.length * 100).toFixed(2);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      total: this.logs.length,
      success: 0,
      failed: 0,
      byRole: {},
      byAction: {},
      byEndpoint: {}
    };

    this.logs.forEach(log => {
      // Count success/failed
      if (log.result === 'success') {
        stats.success++;
      } else {
        stats.failed++;
      }

      // Count by role
      if (!stats.byRole[log.user_role]) {
        stats.byRole[log.user_role] = 0;
      }
      stats.byRole[log.user_role]++;

      // Count by action
      if (!stats.byAction[log.action]) {
        stats.byAction[log.action] = 0;
      }
      stats.byAction[log.action]++;

      // Count by endpoint
      if (log.endpoint) {
        if (!stats.byEndpoint[log.endpoint]) {
          stats.byEndpoint[log.endpoint] = 0;
        }
        stats.byEndpoint[log.endpoint]++;
      }
    });

    return stats;
  }

  /**
   * Export logs to CSV
   */
  exportToCSV() {
    if (this.logs.length === 0) return '';

    const headers = ['timestamp', 'user_role', 'user_id', 'action', 'endpoint', 'result', 'business_context'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.user_role,
      log.user_id,
      log.action,
      log.endpoint || '',
      log.result,
      log.business_context || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = [];
    if (this.enableAuditLog && fs.existsSync(this.logPath)) {
      fs.unlinkSync(this.logPath);
    }
  }
}

module.exports = AuditLog;
