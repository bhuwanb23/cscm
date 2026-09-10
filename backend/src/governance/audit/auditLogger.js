/**
 * Comprehensive Audit Logging Module
 * Provides security-focused audit logging with tamper detection and regulatory reporting
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class AuditLogger {
  constructor(options = {}) {
    this.auditLogPath = options.auditLogPath || path.join(process.cwd(), '.audit', 'audit.log');
    this.encryptionKey = options.encryptionKey || process.env.AUDIT_LOG_KEY || 'default-audit-key';
    this.maxLogSize = options.maxLogSize || 100 * 1024 * 1024; // 100MB
    this.maxLogFiles = options.maxLogFiles || 10;
    this.tamperDetection = options.tamperDetection !== false;
    this.ensureAuditDirectory();
  }

  /**
   * Ensure audit directory exists
   */
  ensureAuditDirectory() {
    const auditDir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
      logger.info('Created audit log directory');
    }
  }

  /**
   * Generate audit event ID
   */
  generateEventId() {
    return crypto.randomUUID();
  }

  /**
   * Calculate hash for tamper detection
   */
  calculateHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create audit event
   */
  createEvent(eventType, data) {
    const event = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
      hash: null // Will be calculated after serialization
    };

    return event;
  }

  /**
   * Sanitize sensitive data from audit logs
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'apiKey', 'creditCard', 
      'ssn', 'socialSecurityNumber', 'bankAccount', 'pin'
    ];

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = sensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitive && value) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Write audit event to log
   */
  async writeEvent(event) {
    try {
      const eventString = JSON.stringify(event);
      
      // Calculate hash for tamper detection
      if (this.tamperDetection) {
        event.hash = this.calculateHash(eventString);
      }

      const logEntry = JSON.stringify(event) + '\n';
      
      // Check log rotation
      await this.rotateIfNeeded();

      // Write to audit log
      fs.appendFileSync(this.auditLogPath, logEntry, 'utf8');
      
      logger.debug(`Audit event logged: ${event.eventType}`);
      return event.eventId;
    } catch (error) {
      logger.error('Failed to write audit event:', error);
      throw new Error('Failed to write audit event');
    }
  }

  /**
   * Rotate audit log if needed
   */
  async rotateIfNeeded() {
    try {
      if (!fs.existsSync(this.auditLogPath)) {
        return;
      }

      const stats = fs.statSync(this.auditLogPath);
      
      if (stats.size >= this.maxLogSize) {
        await this.rotateLog();
      }
    } catch (error) {
      logger.error('Failed to check log rotation:', error);
    }
  }

  /**
   * Rotate audit log
   */
  async rotateLog() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = `${this.auditLogPath}.${timestamp}`;
      
      fs.renameSync(this.auditLogPath, rotatedPath);
      
      // Clean up old log files
      await this.cleanupOldLogs();
      
      logger.info(`Audit log rotated: ${rotatedPath}`);
    } catch (error) {
      logger.error('Failed to rotate audit log:', error);
      throw new Error('Failed to rotate audit log');
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs() {
    try {
      const auditDir = path.dirname(this.auditLogPath);
      const files = fs.readdirSync(auditDir)
        .filter(file => file.startsWith(path.basename(this.auditLogPath)) && file.includes('.'))
        .map(file => ({
          file,
          path: path.join(auditDir, file),
          mtime: fs.statSync(path.join(auditDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

      // Keep only the most recent files
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles);
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path);
          logger.debug(`Deleted old audit log: ${file.file}`);
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old logs:', error);
    }
  }

  /**
   * Read audit events with filtering
   */
  readEvents(options = {}) {
    try {
      const {
        eventType,
        startDate,
        endDate,
        limit = 100,
        offset = 0
      } = options;

      let events = [];
      
      // Read all rotated logs
      const auditDir = path.dirname(this.auditLogPath);
      const logFiles = fs.readdirSync(auditDir)
        .filter(file => file.startsWith(path.basename(this.auditLogPath)))
        .map(file => path.join(auditDir, file))
        .sort((a, b) => {
          // Sort by modification time, newest first
          return fs.statSync(b).mtime - fs.statSync(a).mtime;
        });

      for (const logFile of logFiles) {
        if (!fs.existsSync(logFile)) continue;
        
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            
            // Verify hash for tamper detection
            if (this.tamperDetection && event.hash) {
              const recalculatedHash = this.calculateHash(JSON.stringify({ ...event, hash: null }));
              if (recalculatedHash !== event.hash) {
                logger.warn(`Tamper detection failed for event ${event.eventId}`);
                event.tampered = true;
              }
            }

            // Apply filters
            if (eventType && event.eventType !== eventType) continue;
            if (startDate && new Date(event.timestamp) < new Date(startDate)) continue;
            if (endDate && new Date(event.timestamp) > new Date(endDate)) continue;

            events.push(event);
          } catch (error) {
            logger.error('Failed to parse audit event:', error);
          }
        }
      }

      // Sort by timestamp (newest first)
      events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const paginatedEvents = events.slice(offset, offset + limit);

      return {
        events: paginatedEvents,
        total: events.length,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Failed to read audit events:', error);
      return {
        events: [],
        total: 0,
        limit,
        offset,
        error: error.message
      };
    }
  }

  /**
   * Generate audit report
   */
  generateReport(options = {}) {
    const {
      eventType,
      startDate,
      endDate,
      groupBy = 'eventType'
    } = options;

    const { events } = this.readEvents({ eventType, startDate, endDate, limit: 10000 });

    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all'
      },
      summary: {
        totalEvents: events.length,
        eventTypes: {}
      },
      details: {}
    };

    // Group events
    for (const event of events) {
      if (!report.summary.eventTypes[event.eventType]) {
        report.summary.eventTypes[event.eventType] = 0;
      }
      report.summary.eventTypes[event.eventType]++;
    }

    // Add detailed grouping
    if (groupBy === 'eventType') {
      for (const [eventType, count] of Object.entries(report.summary.eventTypes)) {
        report.details[eventType] = {
          count,
          events: events.filter(e => e.eventType === eventType)
        };
      }
    } else if (groupBy === 'timestamp') {
      const eventsByDate = {};
      for (const event of events) {
        const date = event.timestamp.split('T')[0];
        if (!eventsByDate[date]) {
          eventsByDate[date] = [];
        }
        eventsByDate[date].push(event);
      }
      report.details = eventsByDate;
    }

    return report;
  }

  /**
   * Get audit statistics
   */
  getStatistics() {
    const { events, total } = this.readEvents({ limit: 10000 });

    const stats = {
      totalEvents: total,
      eventTypeCounts: {},
      recentActivity: {
        last24Hours: 0,
        last7Days: 0,
        last30Days: 0
      },
      tamperedEvents: 0
    };

    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    for (const event of events) {
      const eventDate = new Date(event.timestamp);

      // Count by event type
      if (!stats.eventTypeCounts[event.eventType]) {
        stats.eventTypeCounts[event.eventType] = 0;
      }
      stats.eventTypeCounts[event.eventType]++;

      // Count by time period
      if (eventDate >= last24Hours) {
        stats.recentActivity.last24Hours++;
      }
      if (eventDate >= last7Days) {
        stats.recentActivity.last7Days++;
      }
      if (eventDate >= last30Days) {
        stats.recentActivity.last30Days++;
      }

      // Count tampered events
      if (event.tampered) {
        stats.tamperedEvents++;
      }
    }

    return stats;
  }

  /**
   * Archive audit logs to long-term storage
   */
  async archiveLogs(targetPath) {
    try {
      const archiveDir = path.dirname(this.auditLogPath);
      const files = fs.readdirSync(archiveDir)
        .filter(file => file.startsWith(path.basename(this.auditLogPath)))
        .map(file => path.join(archiveDir, file));

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archivePath = path.join(targetPath, `audit-archive-${timestamp}.tar.gz`);

      // Create archive
      const { execSync } = require('child_process');
      execSync(`tar -czf ${archivePath} ${files.join(' ')}`);

      logger.info(`Audit logs archived: ${archivePath}`);
      return archivePath;
    } catch (error) {
      logger.error('Failed to archive audit logs:', error);
      throw new Error('Failed to archive audit logs');
    }
  }

  /**
   * Clear all audit logs (use with caution)
   */
  clearLogs() {
    try {
      const auditDir = path.dirname(this.auditLogPath);
      const files = fs.readdirSync(auditDir)
        .filter(file => file.startsWith(path.basename(this.auditLogPath)))
        .map(file => path.join(auditDir, file));

      for (const file of files) {
        fs.unlinkSync(file);
      }

      logger.info('All audit logs cleared');
    } catch (error) {
      logger.error('Failed to clear audit logs:', error);
      throw new Error('Failed to clear audit logs');
    }
  }
}

// Singleton instance
let auditLoggerInstance = null;

/**
 * Get the singleton audit logger instance
 */
function getAuditLogger() {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

module.exports = {
  AuditLogger,
  getAuditLogger
};
