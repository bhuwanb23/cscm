/**
 * Attribute-Based Access Control (ABAC) Module
 * Provides dynamic, attribute-based access control beyond static RBAC
 */

const logger = require('../../utils/logger');

class ABAC {
  constructor() {
    this.policies = new Map();
    this.attributes = new Map();
    this.accessLogs = new Map();
    this.defaultPolicies();
  }

  /**
   * Create default ABAC policies
   */
  defaultPolicies() {
    this.addPolicy('data_access_based_on_sensitivity', {
      name: 'Data Access Based on Sensitivity',
      description: 'Grant access based on data sensitivity and user clearance',
      enabled: true,
      rules: [
        {
          condition: (context) => context.dataSensitivity === 'low',
          action: 'allow',
          requiredAttributes: ['authenticated']
        },
        {
          condition: (context) => context.dataSensitivity === 'medium',
          action: 'allow',
          requiredAttributes: ['authenticated', 'verified']
        },
        {
          condition: (context) => context.dataSensitivity === 'high',
          action: 'allow',
          requiredAttributes: ['authenticated', 'verified', 'authorized']
        }
      ]
    });

    this.addPolicy('time_based_access', {
      name: 'Time-Based Access',
      description: 'Restrict access based on time of day',
      enabled: true,
      rules: [
        {
          condition: (context) => {
            const hour = new Date().getHours();
            return hour >= 9 && hour < 17; // Business hours
          },
          action: 'allow',
          requiredAttributes: ['employee']
        },
        {
          condition: (context) => {
            const hour = new Date().getHours();
            return hour < 9 || hour >= 17; // After hours
          },
          action: 'deny',
          requiredAttributes: ['employee']
        }
      ]
    });

    this.addPolicy('location_based_access', {
      name: 'Location-Based Access',
      description: 'Restrict access based on user location',
      enabled: true,
      rules: [
        {
          condition: (context) => context.location === 'office',
          action: 'allow',
          requiredAttributes: ['office_network']
        },
        {
          condition: (context) => context.location === 'remote',
          action: 'allow',
          requiredAttributes: ['vpn', 'mfa']
        }
      ]
    });
  }

  /**
   * Add an ABAC policy
   */
  addPolicy(policyId, policyData) {
    const policy = {
      policyId,
      name: policyData.name,
      description: policyData.description,
      enabled: policyData.enabled !== false,
      rules: policyData.rules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.policies.set(policyId, policy);
    
    logger.info(`ABAC policy added: ${policyId}`);
    
    return policy;
  }

  /**
   * Set user attributes
   */
  setUserAttributes(userId, attributes) {
    const userAttrs = {
      userId,
      attributes: {
        ...attributes,
        updatedAt: new Date().toISOString()
      }
    };

    this.attributes.set(userId, userAttrs);
    
    logger.debug(`User attributes set for: ${userId}`);
    
    return userAttrs;
  }

  /**
   * Get user attributes
   */
  getUserAttributes(userId) {
    return this.attributes.get(userId);
  }

  /**
   * Evaluate access request
   */
  evaluateAccess(userId, resource, action, context = {}) {
    const userAttrs = this.getUserAttributes(userId);
    
    if (!userAttrs) {
      return {
        allowed: false,
        reason: 'User attributes not found'
      };
    }

    const evaluationContext = {
      userId,
      resource,
      action,
      ...userAttrs.attributes,
      ...context
    };

    let allowed = false;
    let denied = false;
    const appliedPolicies = [];

    for (const policy of this.policies.values()) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        try {
          const conditionMet = rule.condition(evaluationContext);
          
          if (conditionMet) {
            // Check if user has required attributes
            const hasRequiredAttributes = this.checkRequiredAttributes(
              userAttrs.attributes,
              rule.requiredAttributes
            );

            if (hasRequiredAttributes) {
              if (rule.action === 'allow') {
                allowed = true;
              } else if (rule.action === 'deny') {
                denied = true;
              }

              appliedPolicies.push({
                policyId: policy.policyId,
                policyName: policy.name,
                action: rule.action
              });
            }
          }
        } catch (error) {
          logger.error(`Policy evaluation error: ${error.message}`);
        }
      }
    }

    const result = {
      allowed: allowed && !denied,
      reason: denied ? 'Explicitly denied by policy' : allowed ? 'Allowed by policy' : 'No matching policy',
      appliedPolicies
    };

    // Log access decision
    this.logAccessDecision(userId, resource, action, result);

    return result;
  }

  /**
   * Check if user has required attributes
   */
  checkRequiredAttributes(userAttributes, requiredAttributes) {
    if (!requiredAttributes || requiredAttributes.length === 0) {
      return true;
    }

    for (const attr of requiredAttributes) {
      if (!userAttributes[attr]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Log access decision
   */
  logAccessDecision(userId, resource, action, result) {
    const logEntry = {
      accessId: this.generateId(),
      userId,
      resource,
      action,
      allowed: result.allowed,
      reason: result.reason,
      appliedPolicies: result.appliedPolicies,
      timestamp: new Date().toISOString()
    };

    this.accessLogs.set(logEntry.accessId, logEntry);
    
    logger.debug(`Access decision logged: ${userId} - ${resource} - ${action} - ${result.allowed}`);
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get access logs for a user
   */
  getUserAccessLogs(userId, limit = 100) {
    const logs = [];
    
    for (const log of this.accessLogs.values()) {
      if (log.userId === userId) {
        logs.push(log);
      }
    }

    return logs.slice(-limit);
  }

  /**
   * Get access statistics
   */
  getAccessStatistics() {
    const stats = {
      totalRequests: this.accessLogs.size,
      allowed: 0,
      denied: 0,
      byResource: {},
      byAction: {},
      byUser: {}
    };

    for (const log of this.accessLogs.values()) {
      if (log.allowed) {
        stats.allowed++;
      } else {
        stats.denied++;
      }

      // Count by resource
      if (!stats.byResource[log.resource]) {
        stats.byResource[log.resource] = { allowed: 0, denied: 0 };
      }
      if (log.allowed) {
        stats.byResource[log.resource].allowed++;
      } else {
        stats.byResource[log.resource].denied++;
      }

      // Count by action
      if (!stats.byAction[log.action]) {
        stats.byAction[log.action] = { allowed: 0, denied: 0 };
      }
      if (log.allowed) {
        stats.byAction[log.action].allowed++;
      } else {
        stats.byAction[log.action].denied++;
      }

      // Count by user
      if (!stats.byUser[log.userId]) {
        stats.byUser[log.userId] = { allowed: 0, denied: 0 };
      }
      if (log.allowed) {
        stats.byUser[log.userId].allowed++;
      } else {
        stats.byUser[log.userId].denied++;
      }
    }

    return stats;
  }

  /**
   * Enable or disable a policy
   */
  setPolicyStatus(policyId, enabled) {
    const policy = this.policies.get(policyId);
    
    if (policy) {
      policy.enabled = enabled;
      policy.updatedAt = new Date().toISOString();
      logger.info(`Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  /**
   * Clear old access logs
   */
  clearOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let clearedCount = 0;

    for (const [key, log] of this.accessLogs) {
      if (new Date(log.timestamp) < cutoffDate) {
        this.accessLogs.delete(key);
        clearedCount++;
      }
    }

    logger.info(`Cleared ${clearedCount} old access logs`);
    
    return clearedCount;
  }
}

// Singleton instance
let abacInstance = null;

/**
 * Get the singleton ABAC instance
 */
function getABAC() {
  if (!abacInstance) {
    abacInstance = new ABAC();
  }
  return abacInstance;
}

module.exports = {
  ABAC,
  getABAC
};
