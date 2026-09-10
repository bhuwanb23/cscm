/**
 * GDPR Compliance Manager
 * Implements GDPR compliance framework with consent management, data subject rights, and breach notification
 */

const logger = require('../../utils/logger');

class GDPRComplianceManager {
  constructor(options = {}) {
    this.dataController = options.dataController || 'CSCM Organization';
    this.contactEmail = options.contactEmail || 'privacy@cscm.example.com';
    this.consentRecords = new Map();
    this.dataSubjectRequests = new Map();
    this.lawfulBasisTracker = new Map();
    this.breachRecords = [];
  }

  /**
   * Create a consent record
   */
  createConsent(userId, consentType, consentGiven, purpose = null) {
    const consent = {
      consentId: this.generateId(),
      userId,
      consentType,
      consentGiven,
      purpose,
      timestamp: new Date().toISOString(),
      ipAddress: null, // Will be set from request
      userAgent: null
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

    return userConsents;
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
   * Track lawful basis for data processing
   */
  trackLawfulBasis(dataType, lawfulBasis, userId = null) {
    const basis = {
      basisId: this.generateId(),
      dataType,
      lawfulBasis, // consent, contract, legal obligation, vital interests, public task, legitimate interests
      userId,
      timestamp: new Date().toISOString(),
      expiresAt: null
    };

    this.lawfulBasisTracker.set(basis.basisId, basis);
    
    logger.info(`Lawful basis tracked: ${dataType} - ${lawfulBasis}`);
    
    return basis;
  }

  /**
   * Check if processing has lawful basis
   */
  hasLawfulBasis(dataType, userId = null) {
    for (const basis of this.lawfulBasisTracker.values()) {
      if (basis.dataType === dataType) {
        if (userId && basis.userId && basis.userId !== userId) {
          continue;
        }
        
        // Check if basis is still valid
        if (basis.expiresAt && new Date(basis.expiresAt) < new Date()) {
          continue;
        }
        
        return true;
      }
    }
    
    return false;
  }

  /**
   * Handle data subject access request (DSAR)
   */
  handleAccessRequest(userId, requestType = 'access') {
    const request = {
      requestId: this.generateId(),
      userId,
      requestType, // access, rectification, erasure, portability, restriction
      status: 'pending',
      requestedAt: new Date().toISOString(),
      respondedAt: null,
      response: null
    };

    this.dataSubjectRequests.set(request.requestId, request);
    
    logger.info(`Data subject request created: ${requestType} for user ${userId}`);
    
    return request;
  }

  /**
   * Process data subject request
   */
  processSubjectRequest(requestId, responseData = null) {
    const request = this.dataSubjectRequests.get(requestId);
    
    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'completed';
    request.respondedAt = new Date().toISOString();
    request.response = responseData;
    
    logger.info(`Data subject request processed: ${requestId}`);
    
    return request;
  }

  /**
   * Report data breach
   */
  reportBreach(breachData) {
    const breach = {
      breachId: this.generateId(),
      ...breachData,
      reportedAt: new Date().toISOString(),
      status: 'investigating',
      notifiedAuthorities: false,
      notifiedDataSubjects: false
    };

    this.breachRecords.push(breach);
    
    logger.error(`Data breach reported: ${breach.breachId} - ${breach.description}`);
    
    return breach;
  }

  /**
   * Check if breach notification is required
   */
  requiresBreachNotification(breachId) {
    const breach = this.breachRecords.find(b => b.breachId === breachId);
    
    if (!breach) {
      return false;
    }

    // GDPR requires notification within 72 hours if risk to individuals is high
    const timeSinceBreach = Date.now() - new Date(breach.reportedAt).getTime();
    const hoursSinceBreach = timeSinceBreach / (1000 * 60 * 60);
    
    return (
      breach.affectedCount >= 100 || // Affects 100+ individuals
      breach.riskLevel === 'high' || // High risk to individuals
      hoursSinceBreach >= 72 // 72 hours since reporting
    );
  }

  /**
   * Get compliance status
   */
  getComplianceStatus() {
    const status = {
      dataController: this.dataController,
      contactEmail: this.contactEmail,
      totalConsents: this.consentRecords.size,
      activeConsents: Array.from(this.consentRecords.values()).filter(c => c.consentGiven).length,
      pendingRequests: Array.from(this.dataSubjectRequests.values()).filter(r => r.status === 'pending').length,
      activeBreachReports: this.breachRecords.filter(b => b.status !== 'resolved').length,
      lawfulBasisRecords: this.lawfulBasisTracker.size
    };

    return status;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export consent records for compliance
   */
  exportConsentRecords() {
    return {
      exportedAt: new Date().toISOString(),
      dataController: this.dataController,
      records: Array.from(this.consentRecords.values())
    };
  }

  /**
   * Get DPIA (Data Protection Impact Assessment) template
   */
  getDPIATemplate() {
    return {
      projectId: '',
      projectName: '',
      projectOwner: '',
      dataTypes: [],
      processingActivities: [],
      purpose: '',
      lawfulBasis: '',
      privacyImpact: '',
      securityMeasures: [],
      riskAssessment: '',
      mitigationStrategies: [],
      status: 'pending',
      createdAt: null,
      reviewedAt: null,
      approvedAt: null
    };
  }
}

// Singleton instance
let gdprComplianceManagerInstance = null;

/**
 * Get the singleton GDPR compliance manager instance
 */
function getGDPRComplianceManager() {
  if (!gdprComplianceManagerInstance) {
    gdprComplianceManagerInstance = new GDPRComplianceManager();
  }
  return gdprComplianceManagerInstance;
}

module.exports = {
  GDPRComplianceManager,
  getGDPRComplianceManager
};
