/**
 * Data Retention Policy Manager
 * Implements configurable data retention policies with automated enforcement
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class RetentionPolicyManager {
  constructor(options = {}) {
    this.policyPath = options.policyPath || path.join(process.cwd(), '.policies', 'retention.json');
    this.policies = {};
    this.ensurePolicyDirectory();
    this.loadPolicies();
  }

  /**
   * Ensure policy directory exists
   */
  ensurePolicyDirectory() {
    const policyDir = path.dirname(this.policyPath);
    if (!fs.existsSync(policyDir)) {
      fs.mkdirSync(policyDir, { recursive: true });
      logger.info('Created retention policy directory');
    }
  }

  /**
   * Load retention policies from file
   */
  loadPolicies() {
    try {
      if (fs.existsSync(this.policyPath)) {
        const data = fs.readFileSync(this.policyPath, 'utf8');
        this.policies = JSON.parse(data);
        logger.info('Retention policies loaded successfully');
      } else {
        this.policies = this.getDefaultPolicies();
        this.savePolicies();
        logger.info('Created default retention policies');
      }
    } catch (error) {
      logger.error('Failed to load retention policies:', error);
      this.policies = this.getDefaultPolicies();
    }
  }

  /**
   * Save retention policies to file
   */
  savePolicies() {
    try {
      fs.writeFileSync(this.policyPath, JSON.stringify(this.policies, null, 2), 'utf8');
      logger.info('Retention policies saved successfully');
    } catch (error) {
      logger.error('Failed to save retention policies:', error);
      throw new Error('Failed to save retention policies');
    }
  }

  /**
   * Get default retention policies
   */
  getDefaultPolicies() {
    return {
      orders: {
        retentionPeriod: 365, // days
        retentionPeriodType: 'years',
        archivingEnabled: true,
        archivingDelay: 90, // days before archiving
        secureDeletion: true
      },
      inventory: {
        retentionPeriod: 1825, // 5 years
        retentionPeriodType: 'days',
        archivingEnabled: true,
        archivingDelay: 365, // days before archiving
        secureDeletion: true
      },
      shipments: {
        retentionPeriod: 1825, // 5 years
        retentionPeriodType: 'days',
        archivingEnabled: true,
        archivingDelay: 365,
        secureDeletion: true
      },
      events: {
        retentionPeriod: 365, // 1 year
        retentionPeriodType: 'days',
        archivingEnabled: true,
        archivingDelay: 30,
        secureDeletion: true
      },
      auditLogs: {
        retentionPeriod: 2555, // 7 years
        retentionPeriodType: 'days',
        archivingEnabled: true,
        archivingDelay: 365,
        secureDeletion: true
      },
      userAccounts: {
        retentionPeriod: 2555, // 7 years after account closure
        retentionPeriodType: 'days',
        archivingEnabled: true,
        archivingDelay: 0,
        secureDeletion: true
      },
      piiData: {
        retentionPeriod: 365, // 1 year
        retentionPeriodType: 'days',
        archivingEnabled: false,
        archivingDelay: 0,
        secureDeletion: true
      }
    };
  }

  /**
   * Add or update a retention policy
   */
  setPolicy(dataType, policy) {
    const defaultPolicy = {
      retentionPeriod: 365,
      retentionPeriodType: 'days',
      archivingEnabled: true,
      archivingDelay: 30,
      secureDeletion: true
    };

    this.policies[dataType] = { ...defaultPolicy, ...policy };
    this.savePolicies();
    
    logger.info(`Retention policy set for ${dataType}`);
  }

  /**
   * Get retention policy for a data type
   */
  getPolicy(dataType) {
    return this.policies[dataType] || this.getDefaultPolicies()[dataType];
  }

  /**
   * Check if data should be archived
   */
  shouldArchive(dataType, dataDate) {
    const policy = this.getPolicy(dataType);
    
    if (!policy || !policy.archivingEnabled) {
      return false;
    }

    const now = new Date();
    const dataDateObj = new Date(dataDate);
    const ageInDays = Math.floor((now - dataDateObj) / (1000 * 60 * 60 * 24));
    
    return ageInDays >= policy.archivingDelay;
  }

  /**
   * Check if data should be deleted
   */
  shouldDelete(dataType, dataDate) {
    const policy = this.getPolicy(dataType);
    
    if (!policy) {
      return false;
    }

    const now = new Date();
    const dataDateObj = new Date(dataDate);
    const ageInDays = Math.floor((now - dataDateObj) / (1000 * 60 * 60 * 24));
    
    const retentionDays = this.convertToDays(policy.retentionPeriod, policy.retentionPeriodType);
    
    return ageInDays >= retentionDays;
  }

  /**
   * Convert retention period to days
   */
  convertToDays(period, type) {
    switch (type) {
      case 'days':
        return period;
      case 'weeks':
        return period * 7;
      case 'months':
        return period * 30;
      case 'years':
        return period * 365;
      default:
        return period;
    }
  }

  /**
   * Get deletion date for a data type
   */
  getDeletionDate(dataType, dataDate) {
    const policy = this.getPolicy(dataType);
    
    if (!policy) {
      return null;
    }

    const retentionDays = this.convertToDays(policy.retentionPeriod, policy.retentionPeriodType);
    const deletionDate = new Date(dataDate);
    deletionDate.setDate(deletionDate.getDate() + retentionDays);
    
    return deletionDate;
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    return this.policies;
  }

  /**
   * Delete a policy
   */
  deletePolicy(dataType) {
    if (this.policies[dataType]) {
      delete this.policies[dataType];
      this.savePolicies();
      logger.info(`Deleted retention policy for ${dataType}`);
    }
  }

  /**
   * Get data retention summary
   */
  getRetentionSummary() {
    const summary = {
      totalDataTypes: Object.keys(this.policies).length,
      policies: {}
    };

    for (const [dataType, policy] of Object.entries(this.policies)) {
      const retentionDays = this.convertToDays(policy.retentionPeriod, policy.retentionPeriodType);
      
      summary.policies[dataType] = {
        retentionPeriod: policy.retentionPeriod,
        retentionPeriodType: policy.retentionPeriodType,
        retentionDays,
        archivingEnabled: policy.archivingEnabled,
        archivingDelay: policy.archivingDelay,
        secureDeletion: policy.secureDeletion
      };
    }

    return summary;
  }

  /**
   * Validate retention policies
   */
  validatePolicies() {
    const issues = [];

    for (const [dataType, policy] of Object.entries(this.policies)) {
      if (!policy.retentionPeriod || policy.retentionPeriod <= 0) {
        issues.push(`${dataType}: Invalid retention period`);
      }

      if (!policy.retentionPeriodType) {
        issues.push(`${dataType}: Missing retention period type`);
      }

      if (policy.archivingDelay && policy.archivingDelay < 0) {
        issues.push(`${dataType}: Invalid archiving delay`);
      }

      const retentionDays = this.convertToDays(policy.retentionPeriod, policy.retentionPeriodType);
      if (policy.archivingDelay >= retentionDays) {
        issues.push(`${dataType}: Archiving delay exceeds retention period`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Export policies for compliance reporting
   */
  exportPolicies() {
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      policies: this.policies,
      validation: this.validatePolicies()
    };
  }
}

// Singleton instance
let retentionPolicyManagerInstance = null;

/**
 * Get the singleton retention policy manager instance
 */
function getRetentionPolicyManager() {
  if (!retentionPolicyManagerInstance) {
    retentionPolicyManagerInstance = new RetentionPolicyManager();
  }
  return retentionPolicyManagerInstance;
}

module.exports = {
  RetentionPolicyManager,
  getRetentionPolicyManager
};
