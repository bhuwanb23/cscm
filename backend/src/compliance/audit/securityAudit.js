/**
 * Security Audit Module
 * Provides automated security audit generation and reporting
 */

const logger = require('../../utils/logger');

class SecurityAudit {
  constructor() {
    this.audits = new Map();
    this.auditTemplates = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize audit templates
   */
  initializeTemplates() {
    this.addAuditTemplate('full_security_audit', {
      name: 'Full Security Audit',
      description: 'Comprehensive security audit covering all areas',
      categories: [
        'access_control',
        'data_protection',
        'network_security',
        'application_security',
        'infrastructure_security',
        'compliance'
      ],
      frequency: 'quarterly'
    });

    this.addAuditTemplate('access_control_audit', {
      name: 'Access Control Audit',
      description: 'Audit of access control mechanisms',
      categories: ['access_control'],
      frequency: 'monthly'
    });

    this.addAuditTemplate('data_protection_audit', {
      name: 'Data Protection Audit',
      description: 'Audit of data protection measures',
      categories: ['data_protection'],
      frequency: 'monthly'
    });

    this.addAuditTemplate('compliance_audit', {
      name: 'Compliance Audit',
      description: 'Audit of regulatory compliance',
      categories: ['compliance'],
      frequency: 'quarterly'
    });
  }

  /**
   * Add an audit template
   */
  addAuditTemplate(templateId, templateData) {
    const template = {
      templateId,
      name: templateData.name,
      description: templateData.description,
      categories: templateData.categories || [],
      frequency: templateData.frequency || 'annual',
      createdAt: new Date().toISOString()
    };

    this.auditTemplates.set(templateId, template);
    
    logger.info(`Audit template added: ${templateId}`);
    
    return template;
  }

  /**
   * Create a security audit
   */
  createAudit(auditData) {
    const audit = {
      auditId: this.generateId(),
      templateId: auditData.templateId,
      name: auditData.name,
      description: auditData.description,
      categories: auditData.categories || [],
      auditor: auditData.auditor || 'system',
      startDate: auditData.startDate || new Date().toISOString(),
      endDate: null,
      status: 'in_progress',
      findings: [],
      risks: [],
      recommendations: [],
      score: null,
      overallAssessment: null
    };

    this.audits.set(audit.auditId, audit);
    
    logger.info(`Security audit created: ${audit.auditId}`);
    
    return audit;
  }

  /**
   * Complete an audit
   */
  completeAudit(auditId, completionData) {
    const audit = this.audits.get(auditId);
    
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    audit.status = 'completed';
    audit.endDate = new Date().toISOString();
    audit.findings = completionData.findings || [];
    audit.risks = completionData.risks || [];
    audit.recommendations = completionData.recommendations || [];
    audit.score = completionData.score || this.calculateAuditScore(completionData.findings);
    audit.overallAssessment = completionData.overallAssessment || this.getOverallAssessment(audit.score);
    
    logger.info(`Security audit completed: ${auditId} - Score: ${audit.score}`);
    
    return audit;
  }

  /**
   * Calculate audit score
   */
  calculateAuditScore(findings) {
    if (!findings || findings.length === 0) {
      return 100;
    }

    const totalFindings = findings.length;
    const criticalFindings = findings.filter(f => f.severity === 'critical').length;
    const highFindings = findings.filter(f => f.severity === 'high').length;
    const mediumFindings = findings.filter(f => f.severity === 'medium').length;

    // Score calculation: each finding reduces score
    let score = 100;
    score -= criticalFindings * 25;
    score -= highFindings * 15;
    score -= mediumFindings * 5;

    return Math.max(0, score);
  }

  /**
   * Get overall assessment based on score
   */
  getOverallAssessment(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'satisfactory';
    if (score >= 40) return 'needs_improvement';
    return 'critical';
  }

  /**
   * Add a finding to an audit
   */
  addFinding(auditId, findingData) {
    const audit = this.audits.get(auditId);
    
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    const finding = {
      findingId: this.generateId(),
      category: findingData.category,
      title: findingData.title,
      description: findingData.description,
      severity: findingData.severity || 'medium', // low, medium, high, critical
      evidence: findingData.evidence || [],
      recommendation: findingData.recommendation || '',
      status: 'open',
      createdAt: new Date().toISOString()
    };

    audit.findings.push(finding);
    
    logger.info(`Finding added to audit ${auditId}: ${finding.title}`);
    
    return finding;
  }

  /**
   * Add a risk to an audit
   */
  addRisk(auditId, riskData) {
    const audit = this.audits.get(auditId);
    
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    const risk = {
      riskId: this.generateId(),
      title: riskData.title,
      description: riskData.description,
      category: riskData.category,
      likelihood: riskData.likelihood || 'medium',
      impact: riskData.impact || 'medium',
      mitigation: riskData.mitigation || '',
      status: 'open',
      createdAt: new Date().toISOString()
    };

    audit.risks.push(risk);
    
    logger.info(`Risk added to audit ${auditId}: ${risk.title}`);
    
    return risk;
  }

  /**
   * Get all audits
   */
  getAllAudits() {
    return Array.from(this.audits.values());
  }

  /**
   * Get audit by ID
   */
  getAudit(auditId) {
    return this.audits.get(auditId);
  }

  /**
   * Get audits by status
   */
  getAuditsByStatus(status) {
    return Array.from(this.audits.values()).filter(a => a.status === status);
  }

  /**
   * Get recent audits
   */
  getRecentAudits(limit = 10) {
    return Array.from(this.audits.values())
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .slice(0, limit);
  }

  /**
   * Generate audit report
   */
  generateAuditReport(auditId) {
    const audit = this.audits.get(auditId);
    
    if (!audit) {
      throw new Error(`Audit not found: ${auditId}`);
    }

    const report = {
      reportType: 'Security Audit Report',
      generatedAt: new Date().toISOString(),
      audit: {
        auditId: audit.auditId,
        name: audit.name,
        description: audit.description,
        auditor: audit.auditor,
        period: {
          start: audit.startDate,
          end: audit.endDate
        },
        status: audit.status,
        score: audit.score,
        overallAssessment: audit.overallAssessment
      },
      summary: {
        totalFindings: audit.findings.length,
        bySeverity: this.groupFindingsBySeverity(audit.findings),
        totalRisks: audit.risks.length,
        totalRecommendations: audit.recommendations.length
      },
      findings: audit.findings,
      risks: audit.risks,
      recommendations: audit.recommendations,
      trends: this.getAuditTrends()
    };

    return report;
  }

  /**
   * Group findings by severity
   */
  groupFindingsBySeverity(findings) {
    const grouped = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const finding of findings) {
      if (grouped[finding.severity] !== undefined) {
        grouped[finding.severity]++;
      }
    }

    return grouped;
  }

  /**
   * Get audit trends
   */
  getAuditTrends() {
    const completedAudits = this.getAuditsByStatus('completed')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    if (completedAudits.length < 2) {
      return null;
    }

    const latest = completedAudits[completedAudits.length - 1];
    const previous = completedAudits[completedAudits.length - 2];

    return {
      scoreChange: latest.score - previous.score,
      findingCountChange: latest.findings.length - previous.findings.length,
      riskCountChange: latest.risks.length - previous.risks.length,
      trend: latest.score >= previous.score ? 'improving' : 'declining'
    };
  }

  /**
   * Generate compliance summary
   */
  generateComplianceSummary() {
    const completedAudits = this.getAuditsByStatus('completed');
    const recentAudits = this.getRecentAudits(5);

    const summary = {
      totalAudits: this.audits.size,
      completedAudits: completedAudits.length,
      inProgressAudits: this.getAuditsByStatus('in_progress').length,
      averageScore: this.calculateAverageScore(completedAudits),
      recentAudits: recentAudits.map(a => ({
        auditId: a.auditId,
        name: a.name,
        score: a.score,
        status: a.status,
        completedAt: a.endDate
      })),
      criticalFindings: this.getCriticalFindings(completedAudits),
      highRisks: this.getHighRisks(completedAudits)
    };

    return summary;
  }

  /**
   * Calculate average audit score
   */
  calculateAverageScore(audits) {
    if (audits.length === 0) return 0;

    const totalScore = audits.reduce((sum, audit) => sum + (audit.score || 0), 0);
    return Math.round(totalScore / audits.length);
  }

  /**
   * Get critical findings from audits
   */
  getCriticalFindings(audits) {
    const criticalFindings = [];

    for (const audit of audits) {
      for (const finding of audit.findings) {
        if (finding.severity === 'critical' && finding.status === 'open') {
          criticalFindings.push({
            auditId: audit.auditId,
            finding
          });
        }
      }
    }

    return criticalFindings;
  }

  /**
   * Get high risks from audits
   */
  getHighRisks(audits) {
    const highRisks = [];

    for (const audit of audits) {
      for (const risk of audit.risks) {
        if ((risk.likelihood === 'high' || risk.likelihood === 'very_high') &&
            (risk.impact === 'high' || risk.impact === 'very_high') &&
            risk.status === 'open') {
          highRisks.push({
            auditId: audit.auditId,
            risk
          });
        }
      }
    }

    return highRisks;
  }

  /**
   * Get all audit templates
   */
  getAllTemplates() {
    return Array.from(this.auditTemplates.values());
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let securityAuditInstance = null;

/**
 * Get the singleton security audit instance
 */
function getSecurityAudit() {
  if (!securityAuditInstance) {
    securityAuditInstance = new SecurityAudit();
  }
  return securityAuditInstance;
}

module.exports = {
  SecurityAudit,
  getSecurityAudit
};
