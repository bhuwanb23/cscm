/**
 * Consent Management Module
 * Provides granular consent tracking, revocation, and audit logging
 */

const logger = require('../../utils/logger');

class ConsentManager {
  constructor(options = {}) {
    this.consentRecords = new Map();
    this.consentTemplates = new Map();
    this.defaultTemplates();
  }

  /**
   * Create default consent templates
   */
  defaultTemplates() {
    this.consentTemplates.set('marketing', {
      name: 'Marketing Communications',
      description: 'Receive marketing emails, newsletters, and promotional content',
      version: '1.0',
      required: false
    });

    this.consentTemplates.set('analytics', {
      name: 'Analytics and Tracking',
      description: 'Allow usage data collection for analytics and improvement',
      version: '1.0',
      required: true
    });

    this.consentTemplates.set('personalization', {
      name: 'Personalization',
      description: 'Receive personalized recommendations and content',
      version: '1.0',
      required: false
    });

    this.consentTemplates.set('data_sharing', {
      name: 'Data Sharing',
      description: 'Allow sharing of anonymized data with partners',
      version: '1.0',
      required: false
    });
  }

  /**
   * Create consent record
   */
  createConsent(userId, consentType, consentGiven, metadata = {}) {
    const template = this.consentTemplates.get(consentType);
    
    const consent = {
      consentId: this.generateId(),
      userId,
      consentType,
      consentGiven,
      template,
      timestamp: new Date().toISOString(),
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      metadata: metadata.additional || {},
      version: template ? template.version : '1.0',
      expiresAt: null
    };

    this.consentRecords.set(consent.consentId, consent);
    
    logger.info(`Consent recorded: ${consentType} for user ${userId} - ${consentGiven ? 'granted' : 'denied'}`);
    
    return consent;
  }

  /**
   * Get user consents
   */
  getUserConsents(userId) {
    const userConsents = [];
    
    for (const consent of this.consentRecords.values()) {
      if (consent.userId === userId) {
        userConsents.push(consent);
      }
    }

    return userConsents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Check if user has granted specific consent
   */
  hasConsent(userId, consentType) {
    const userConsents = this.getUserConsents(userId);
    
    // Check if there's a granted consent for this type
    for (const consent of userConsents) {
      if (consent.consentType === consentType && consent.consentGiven) {
        // Check if consent hasn't been revoked
        if (!consent.revokedAt) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Revoke consent
   */
  revokeConsent(consentId, reason = null) {
    const consent = this.consentRecords.get(consentId);
    
    if (!consent) {
      throw new Error('Consent not found');
    }

    consent.consentGiven = false;
    consent.revokedAt = new Date().toISOString();
    consent.revocationReason = reason;
    
    logger.info(`Consent revoked: ${consentId} - Reason: ${reason}`);
    
    return consent;
  }

  /**
   * Revoke all consents for a user
   */
  revokeAllUserConsents(userId, reason = null) {
    const userConsents = this.getUserConsents(userId);
    const revokedConsents = [];
    
    for (const consent of userConsents) {
      if (consent.consentGiven && !consent.revokedAt) {
        const revoked = this.revokeConsent(consent.consentId, reason);
        revokedConsents.push(revoked);
      }
    }

    logger.info(`Revoked ${revokedConsents.length} consents for user ${userId}`);
    
    return revokedConsents;
  }

  /**
   * Add consent template
   */
  addConsentTemplate(consentType, template) {
    this.consentTemplates.set(consentType, {
      name: template.name,
      description: template.description,
      version: template.version || '1.0',
      required: template.required || false
    });
    
    logger.info(`Consent template added: ${consentType}`);
  }

  /**
   * Get consent template
   */
  getConsentTemplate(consentType) {
    return this.consentTemplates.get(consentType);
  }

  /**
   * Get all consent templates
   */
  getAllTemplates() {
    return Array.from(this.consentTemplates.entries()).map(([type, template]) => ({
      type,
      ...template
    }));
  }

  /**
   * Get consent audit trail
   */
  getConsentAuditTrail(userId, consentType = null) {
    const userConsents = this.getUserConsents(userId);
    
    if (consentType) {
      return userConsents.filter(c => c.consentType === consentType);
    }
    
    return userConsents;
  }

  /**
   * Get consent statistics
   */
  getConsentStatistics() {
    const stats = {
      totalConsents: this.consentRecords.size,
      activeConsents: 0,
      revokedConsents: 0,
      byType: {},
      byUser: {}
    };

    for (const consent of this.consentRecords.values()) {
      if (consent.consentGiven && !consent.revokedAt) {
        stats.activeConsents++;
      } else {
        stats.revokedConsents++;
      }

      // Count by type
      if (!stats.byType[consent.consentType]) {
        stats.byType[consent.consentType] = { granted: 0, denied: 0 };
      }
      
      if (consent.consentGiven) {
        stats.byType[consent.consentType].granted++;
      } else {
        stats.byType[consent.consentType].denied++;
      }

      // Count by user
      if (!stats.byUser[consent.userId]) {
        stats.byUser[consent.userId] = { total: 0, active: 0 };
      }
      
      stats.byUser[consent.userId].total++;
      if (consent.consentGiven && !consent.revokedAt) {
        stats.byUser[consent.userId].active++;
      }
    }

    return stats;
  }

  /**
   * Check if consent is required
   */
  isConsentRequired(consentType) {
    const template = this.consentTemplates.get(consentType);
    return template ? template.required : false;
  }

  /**
   * Get missing required consents for a user
   */
  getMissingRequiredConsents(userId) {
    const userConsents = this.getUserConsents(userId);
    const userConsentTypes = new Set(userConsents.map(c => c.consentType));
    const missing = [];

    for (const [consentType, template] of this.consentTemplates) {
      if (template.required && !userConsentTypes.has(consentType)) {
        missing.push({
          consentType,
          template
        });
      }
    }

    return missing;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export consent records for compliance
   */
  exportConsentRecords() {
    return {
      exportedAt: new Date().toISOString(),
      records: Array.from(this.consentRecords.values()),
      statistics: this.getConsentStatistics()
    };
  }
}

// Singleton instance
let consentManagerInstance = null;

/**
 * Get the singleton consent manager instance
 */
function getConsentManager() {
  if (!consentManagerInstance) {
    consentManagerInstance = new ConsentManager();
  }
  return consentManagerInstance;
}

module.exports = {
  ConsentManager,
  getConsentManager
};
