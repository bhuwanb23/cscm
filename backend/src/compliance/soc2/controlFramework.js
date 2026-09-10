/**
 * SOC 2 Control Framework Module
 * Implements SOC 2 Type II compliance controls for security, availability, processing integrity, confidentiality, and privacy
 */

const logger = require('../../utils/logger');

class SOC2ControlFramework {
  constructor() {
    this.controls = new Map();
    this.controlEvaluations = new Map();
    this.initializeControls();
  }

  /**
   * Initialize SOC 2 controls
   */
  initializeControls() {
    // Security Criteria (CC)
    this.addControl('CC1.1', {
      name: 'Governance',
      category: 'Security',
      description: 'Management implements governance structure',
      criteria: ['board_oversight', 'management_commitment', 'policies_procedures'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('CC2.1', {
      name: 'Risk Assessment',
      category: 'Security',
      description: 'Management identifies and manages risks',
      criteria: ['risk_identification', 'risk_analysis', 'risk_mitigation'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('CC3.1', {
      name: 'System Monitoring',
      category: 'Security',
      description: 'System monitoring is implemented',
      criteria: ['performance_monitoring', 'security_monitoring', 'alerting'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('CC6.1', {
      name: 'Logical Access',
      category: 'Security',
      description: 'Logical access controls are implemented',
      criteria: ['authentication', 'authorization', 'access_review'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('CC6.2', {
      name: 'Physical Access',
      category: 'Security',
      description: 'Physical access controls are implemented',
      criteria: ['facility_access', 'equipment_security', 'visitor_logs'],
      implemented: false,
      lastEvaluated: new Date().toISOString()
    });

    // Availability Criteria
    this.addControl('A1.1', {
      name: 'Availability Monitoring',
      category: 'Availability',
      description: 'System availability is monitored',
      criteria: ['uptime_monitoring', 'performance_metrics', 'capacity_planning'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('A1.2', {
      name: 'Disaster Recovery',
      category: 'Availability',
      description: 'Disaster recovery procedures are in place',
      criteria: ['backup_procedures', 'recovery_testing', 'failover_procedures'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    // Processing Integrity Criteria
    this.addControl('PI1.1', {
      name: 'Data Processing',
      category: 'Processing Integrity',
      description: 'Data processing is complete and accurate',
      criteria: ['input_validation', 'output_verification', 'error_handling'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    // Confidentiality Criteria
    this.addControl('C1.1', {
      name: 'Data Encryption',
      category: 'Confidentiality',
      description: 'Confidential data is encrypted',
      criteria: ['encryption_at_rest', 'encryption_in_transit', 'key_management'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    this.addControl('C1.2', {
      name: 'Data Retention',
      category: 'Confidentiality',
      description: 'Data retention policies are enforced',
      criteria: ['retention_policies', 'secure_deletion', 'data_disposal'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });

    // Privacy Criteria
    this.addControl('P1.1', {
      name: 'Privacy Policy',
      category: 'Privacy',
      description: 'Privacy policy is communicated',
      criteria: ['privacy_notice', 'consent_management', 'data_subject_rights'],
      implemented: true,
      lastEvaluated: new Date().toISOString()
    });
  }

  /**
   * Add a SOC 2 control
   */
  addControl(controlId, controlData) {
    const control = {
      controlId,
      name: controlData.name,
      category: controlData.category,
      description: controlData.description,
      criteria: controlData.criteria || [],
      implemented: controlData.implemented || false,
      lastEvaluated: controlData.lastEvaluated || new Date().toISOString(),
      evidence: controlData.evidence || [],
      findings: controlData.findings || []
    };

    this.controls.set(controlId, control);
    
    logger.info(`SOC 2 control added: ${controlId}`);
    
    return control;
  }

  /**
   * Evaluate a control
   */
  evaluateControl(controlId, evaluationData) {
    const control = this.controls.get(controlId);
    
    if (!control) {
      throw new Error(`Control not found: ${controlId}`);
    }

    const evaluation = {
      evaluationId: this.generateId(),
      controlId,
      evaluatedBy: evaluationData.evaluatedBy || 'system',
      evaluationDate: new Date().toISOString(),
      status: evaluationData.status || 'compliant',
      findings: evaluationData.findings || [],
      evidence: evaluationData.evidence || [],
      recommendations: evaluationData.recommendations || []
    };

    this.controlEvaluations.set(evaluation.evaluationId, evaluation);
    
    // Update control status
    control.lastEvaluated = evaluation.evaluationDate;
    control.implemented = evaluation.status === 'compliant';
    control.findings = evaluation.findings;
    control.evidence = evaluation.evidence;
    
    logger.info(`SOC 2 control evaluated: ${controlId} - ${evaluation.status}`);
    
    return evaluation;
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
   * Get compliance status
   */
  getComplianceStatus() {
    const status = {
      overall: 'compliant',
      byCategory: {},
      totalControls: this.controls.size,
      implementedControls: 0,
      nonCompliantControls: []
    };

    for (const control of this.controls.values()) {
      if (control.implemented) {
        status.implementedControls++;
      } else {
        status.nonCompliantControls.push(control.controlId);
      }

      if (!status.byCategory[control.category]) {
        status.byCategory[control.category] = { total: 0, implemented: 0 };
      }
      
      status.byCategory[control.category].total++;
      if (control.implemented) {
        status.byCategory[control.category].implemented++;
      }
    }

    // Determine overall status
    const complianceRate = status.implementedControls / status.totalControls;
    
    if (complianceRate >= 0.95) {
      status.overall = 'compliant';
    } else if (complianceRate >= 0.80) {
      status.overall = 'substantially_compliant';
    } else if (complianceRate >= 0.50) {
      status.overall = 'partially_compliant';
    } else {
      status.overall = 'non_compliant';
    }

    return status;
  }

  /**
   * Generate SOC 2 report
   */
  generateReport() {
    const status = this.getComplianceStatus();
    const evaluations = Array.from(this.controlEvaluations.values());

    return {
      reportType: 'SOC 2 Type II',
      generatedAt: new Date().toISOString(),
      reportingPeriod: {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },
      complianceStatus: status,
      controls: this.getAllControls(),
      recentEvaluations: evaluations.slice(-10),
      recommendations: this.generateRecommendations(status)
    };
  }

  /**
   * Generate remediation recommendations
   */
  generateRecommendations(status) {
    const recommendations = [];

    for (const controlId of status.nonCompliantControls) {
      const control = this.controls.get(controlId);
      
      recommendations.push({
        controlId,
        controlName: control.name,
        priority: 'high',
        recommendation: `Implement control ${controlId}: ${control.name}`,
        estimatedEffort: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Get control evaluations
   */
  getControlEvaluations(controlId = null) {
    if (controlId) {
      return Array.from(this.controlEvaluations.values())
        .filter(e => e.controlId === controlId);
    }
    
    return Array.from(this.controlEvaluations.values());
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `soc2_eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let soc2ControlFrameworkInstance = null;

/**
 * Get the singleton SOC 2 control framework instance
 */
function getSOC2ControlFramework() {
  if (!soc2ControlFrameworkInstance) {
    soc2ControlFrameworkInstance = new SOC2ControlFramework();
  }
  return soc2ControlFrameworkInstance;
}

module.exports = {
  SOC2ControlFramework,
  getSOC2ControlFramework
};
