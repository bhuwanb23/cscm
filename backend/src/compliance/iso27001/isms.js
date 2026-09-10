/**
 * ISO 27001 ISMS Module
 * Implements Information Security Management System for ISO 27001 compliance
 */

const logger = require('../../utils/logger');

class ISO27001ISMS {
  constructor() {
    this.policies = new Map();
    this.risks = new Map();
    this.controls = new Map();
    this.incidents = new Map();
    this.initializeISMS();
  }

  /**
   * Initialize ISMS with default policies and controls
   */
  initializeISMS() {
    // Information Security Policy
    this.addPolicy('infosec_policy', {
      name: 'Information Security Policy',
      version: '1.0',
      description: 'High-level information security policy',
      status: 'active',
      approvedBy: 'CISO',
      approvedAt: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Access Control Policy
    this.addPolicy('access_control_policy', {
      name: 'Access Control Policy',
      version: '1.0',
      description: 'Policy for managing access to information assets',
      status: 'active',
      approvedBy: 'CISO',
      approvedAt: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Asset Management Policy
    this.addPolicy('asset_management_policy', {
      name: 'Asset Management Policy',
      version: '1.0',
      description: 'Policy for managing information assets',
      status: 'active',
      approvedBy: 'CISO',
      approvedAt: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Initialize controls based on ISO 27001 Annex A
    this.addControl('A.5.1', {
      name: 'Policies for Information Security',
      category: 'Organizational',
      description: 'A policy for information security shall be defined',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.6.1', {
      name: 'Screening',
      category: 'Human Resources',
      description: 'Background verification checks on all candidates',
      implemented: false,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.8.1', {
      name: 'Inventory of Assets',
      category: 'Asset Management',
      description: 'Assets associated with information and information processing facilities shall be identified',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.9.1', {
      name: 'Access Control Policy',
      category: 'Access Control',
      description: 'An access control policy shall be established',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.10.1', {
      name: 'Cryptographic Controls',
      category: 'Cryptography',
      description: 'Policy on the use of cryptographic controls',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.12.1', {
      name: 'Operational Procedures and Responsibilities',
      category: 'Operations Security',
      description: 'Documented operating procedures shall be maintained',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.13.1', {
      name: 'Network Security Management',
      category: 'Communications Security',
      description: 'Networks shall be managed and controlled',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.14.1', {
      name: 'Security Requirements Analysis',
      category: 'System Acquisition',
      description: 'Requirements for information security shall be analyzed',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.15.1', {
      name: 'Supplier Relationships',
      category: 'Supplier Relationships',
      description: 'Information security shall be addressed in supplier agreements',
      implemented: false,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.16.1', {
      name: 'Management of Information Security Incidents',
      category: 'Incident Management',
      description: 'Incidents shall be reported and managed',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.17.1', {
      name: 'Information Security Continuity',
      category: 'Continuity',
      description: 'Information security continuity shall be embedded',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });

    this.addControl('A.18.1', {
      name: 'Compliance with Requirements',
      category: 'Compliance',
      description: 'Requirements for compliance shall be identified',
      implemented: true,
      lastAssessed: new Date().toISOString()
    });
  }

  /**
   * Add an ISMS policy
   */
  addPolicy(policyId, policyData) {
    const policy = {
      policyId,
      name: policyData.name,
      version: policyData.version || '1.0',
      description: policyData.description,
      status: policyData.status || 'draft',
      approvedBy: policyData.approvedBy,
      approvedAt: policyData.approvedAt,
      reviewDate: policyData.reviewDate,
      createdAt: new Date().toISOString()
    };

    this.policies.set(policyId, policy);
    
    logger.info(`ISMS policy added: ${policyId}`);
    
    return policy;
  }

  /**
   * Add a security risk
   */
  addRisk(riskId, riskData) {
    const risk = {
      riskId,
      title: riskData.title,
      description: riskData.description,
      category: riskData.category || 'general',
      likelihood: riskData.likelihood || 'medium', // very_low, low, medium, high, very_high
      impact: riskData.impact || 'medium', // very_low, low, medium, high, very_high
      riskScore: this.calculateRiskScore(riskData.likelihood, riskData.impact),
      treatment: riskData.treatment || 'mitigate', // accept, avoid, transfer, mitigate
      treatmentPlan: riskData.treatmentPlan || [],
      owner: riskData.owner || 'unassigned',
      status: riskData.status || 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.risks.set(riskId, risk);
    
    logger.info(`Security risk added: ${riskId} - Score: ${risk.riskScore}`);
    
    return risk;
  }

  /**
   * Calculate risk score
   */
  calculateRiskScore(likelihood, impact) {
    const likelihoodScore = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5
    };

    const impactScore = {
      very_low: 1,
      low: 2,
      medium: 3,
      high: 4,
      very_high: 5
    };

    const lScore = likelihoodScore[likelihood] || 3;
    const iScore = impactScore[impact] || 3;

    return lScore * iScore;
  }

  /**
   * Add an ISMS control
   */
  addControl(controlId, controlData) {
    const control = {
      controlId,
      name: controlData.name,
      category: controlData.category,
      description: controlData.description,
      implemented: controlData.implemented || false,
      lastAssessed: controlData.lastAssessed || new Date().toISOString(),
      assessor: controlData.assessor || 'system',
      findings: controlData.findings || []
    };

    this.controls.set(controlId, control);
    
    logger.info(`ISMS control added: ${controlId}`);
    
    return control;
  }

  /**
   * Record a security incident
   */
  recordIncident(incidentId, incidentData) {
    const incident = {
      incidentId,
      title: incidentData.title,
      description: incidentData.description,
      type: incidentData.type || 'security',
      severity: incidentData.severity || 'medium',
      status: incidentData.status || 'open',
      detectedAt: incidentData.detectedAt || new Date().toISOString(),
      resolvedAt: null,
      rootCause: incidentData.rootCause || null,
      impact: incidentData.impact || null,
      remediation: incidentData.remediation || [],
      lessonsLearned: incidentData.lessonsLearned || []
    };

    this.incidents.set(incidentId, incident);
    
    logger.warn(`Security incident recorded: ${incidentId} - ${incident.title}`);
    
    return incident;
  }

  /**
   * Resolve an incident
   */
  resolveIncident(incidentId, resolutionData) {
    const incident = this.incidents.get(incidentId);
    
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date().toISOString();
    incident.rootCause = resolutionData.rootCause || incident.rootCause;
    incident.impact = resolutionData.impact || incident.impact;
    incident.remediation = resolutionData.remediation || incident.remediation;
    incident.lessonsLearned = resolutionData.lessonsLearned || incident.lessonsLearned;
    
    logger.info(`Security incident resolved: ${incidentId}`);
    
    return incident;
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  /**
   * Get all risks
   */
  getAllRisks() {
    return Array.from(this.risks.values());
  }

  /**
   * Get high-risk items
   */
  getHighRisks() {
    return Array.from(this.risks.values()).filter(r => r.riskScore >= 12);
  }

  /**
   * Get all controls
   */
  getAllControls() {
    return Array.from(this.controls.values());
  }

  /**
   * Get controls by category
   */
  getControlsByCategory(category) {
    return Array.from(this.controls.values()).filter(c => c.category === category);
  }

  /**
   * Get all incidents
   */
  getAllIncidents() {
    return Array.from(this.incidents.values());
  }

  /**
   * Get open incidents
   */
  getOpenIncidents() {
    return Array.from(this.incidents.values()).filter(i => i.status === 'open');
  }

  /**
   * Get ISMS status
   */
  getISMSStatus() {
    const status = {
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter(p => p.status === 'active').length,
      totalRisks: this.risks.size,
      highRisks: this.getHighRisks().length,
      totalControls: this.controls.size,
      implementedControls: Array.from(this.controls.values()).filter(c => c.implemented).length,
      openIncidents: this.getOpenIncidents().length,
      complianceRate: 0
    };

    if (status.totalControls > 0) {
      status.complianceRate = (status.implementedControls / status.totalControls) * 100;
    }

    return status;
  }

  /**
   * Generate ISMS report
   */
  generateReport() {
    const status = this.getISMSStatus();

    return {
      reportType: 'ISO 27001 ISMS Status',
      generatedAt: new Date().toISOString(),
      status,
      policies: this.getAllPolicies(),
      highRisks: this.getHighRisks(),
      controls: this.getAllControls(),
      recentIncidents: this.getAllIncidents().slice(-5),
      recommendations: this.generateRecommendations(status)
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(status) {
    const recommendations = [];

    if (status.complianceRate < 100) {
      recommendations.push({
        priority: 'high',
        area: 'Controls',
        recommendation: `Implement remaining ${status.totalControls - status.implementedControls} controls`
      });
    }

    if (status.highRisks > 0) {
      recommendations.push({
        priority: 'high',
        area: 'Risk Management',
        recommendation: `Address ${status.highRisks} high-risk items`
      });
    }

    if (status.openIncidents > 0) {
      recommendations.push({
        priority: 'medium',
        area: 'Incident Management',
        recommendation: `Resolve ${status.openIncidents} open incidents`
      });
    }

    return recommendations;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `isms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let iso27001ISMSInstance = null;

/**
 * Get the singleton ISO 27001 ISMS instance
 */
function getISO27001ISMS() {
  if (!iso27001ISMSInstance) {
    iso27001ISMSInstance = new ISO27001ISMS();
  }
  return iso27001ISMSInstance;
}

module.exports = {
  ISO27001ISMS,
  getISO27001ISMS
};
