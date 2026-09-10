/**
 * Data Governance Engine
 * Provides governance policy enforcement, workflow management, and automation
 */

const logger = require('../../utils/logger');

class GovernanceEngine {
  constructor(options = {}) {
    this.policies = new Map();
    this.workflows = new Map();
    this.stewardship = new Map();
    this.metrics = {
      policyEnforcements: 0,
      policyViolations: 0,
      workflowExecutions: 0,
      lastRun: null
    };
  }

  /**
   * Create a governance policy
   */
  createPolicy(policyId, policyData) {
    const policy = {
      policyId,
      name: policyData.name,
      description: policyData.description,
      category: policyData.category || 'general',
      severity: policyData.severity || 'medium',
      enabled: policyData.enabled !== false,
      rules: policyData.rules || [],
      conditions: policyData.conditions || [],
      actions: policyData.actions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    this.policies.set(policyId, policy);
    
    logger.info(`Governance policy created: ${policyId}`);
    
    return policy;
  }

  /**
   * Enable or disable a policy
   */
  setPolicyStatus(policyId, enabled) {
    const policy = this.policies.get(policyId);
    
    if (!policy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    policy.enabled = enabled;
    policy.updatedAt = new Date().toISOString();
    
    logger.info(`Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`);
    
    return policy;
  }

  /**
   * Evaluate a policy against data
   */
  evaluatePolicy(policyId, data) {
    const policy = this.policies.get(policyId);
    
    if (!policy) {
      return {
        compliant: true,
        reason: 'Policy not found'
      };
    }

    if (!policy.enabled) {
      return {
        compliant: true,
        reason: 'Policy disabled'
      };
    }

    // Check conditions
    for (const condition of policy.conditions) {
      if (!this.evaluateCondition(condition, data)) {
        return {
          compliant: true,
          reason: 'Condition not met'
        };
      }
    }

    // Check rules
    const violations = [];
    
    for (const rule of policy.rules) {
      const result = this.evaluateRule(rule, data);
      
      if (!result.passed) {
        violations.push({
          rule: rule,
          result
        });
      }
    }

    if (violations.length > 0) {
      this.metrics.policyViolations++;
      
      // Execute actions for violations
      for (const action of policy.actions) {
        this.executeAction(action, data, violations);
      }
      
      return {
        compliant: false,
        violations,
        severity: policy.severity
      };
    }

    this.metrics.policyEnforcements++;
    
    return {
      compliant: true,
      reason: 'All rules passed'
    };
  }

  /**
   * Evaluate a policy condition
   */
  evaluateCondition(condition, data) {
    try {
      switch (condition.type) {
        case 'field_exists':
          return condition.field in data;
        case 'field_value':
          return data[condition.field] === condition.value;
        case 'field_greater_than':
          return data[condition.field] > condition.value;
        case 'field_less_than':
          return data[condition.field] < condition.value;
        case 'field_contains':
          return String(data[condition.field]).includes(condition.value);
        case 'custom':
          // For custom conditions, evaluate the provided function
          if (condition.evaluator && typeof condition.evaluator === 'function') {
            return condition.evaluator(data);
          }
          return true;
        default:
          return true;
      }
    } catch (error) {
      logger.error(`Condition evaluation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Evaluate a policy rule
   */
  evaluateRule(rule, data) {
    try {
      switch (rule.type) {
        case 'required_field':
          return {
            passed: rule.field in data && data[rule.field] !== null && data[rule.field] !== undefined,
            message: rule.field in data ? 'Field present' : 'Field missing'
          };
        case 'data_type':
          return {
            passed: typeof data[rule.field] === rule.expectedType,
            message: typeof data[rule.field] === rule.expectedType ? 'Type matches' : 'Type mismatch'
          };
        case 'value_range':
          const value = data[rule.field];
          return {
            passed: value >= rule.min && value <= rule.max,
            message: value >= rule.min && value <= rule.max ? 'Value in range' : 'Value out of range'
          };
        case 'pattern':
          const regex = new RegExp(rule.pattern);
          return {
            passed: regex.test(String(data[rule.field])),
            message: regex.test(String(data[rule.field])) ? 'Pattern matches' : 'Pattern mismatch'
          };
        case 'custom':
          if (rule.evaluator && typeof rule.evaluator === 'function') {
            const result = rule.evaluator(data);
            return {
              passed: result.passed,
              message: result.message || 'Custom rule evaluated'
            };
          }
          return { passed: true, message: 'Custom rule skipped' };
        default:
          return { passed: true, message: 'Unknown rule type' };
      }
    } catch (error) {
      logger.error(`Rule evaluation failed: ${error.message}`);
      return {
        passed: false,
        message: `Rule evaluation error: ${error.message}`
      };
    }
  }

  /**
   * Execute a policy action
   */
  executeAction(action, data, violations) {
    try {
      switch (action.type) {
        case 'log':
          logger.warn(`Policy violation logged: ${action.message}`);
          break;
        case 'block':
          throw new Error(`Policy violation: ${action.message}`);
        case 'alert':
          // Would trigger alert to administrators
          logger.warn(`Alert triggered: ${action.message}`);
          break;
        case 'remediate':
          // Would attempt automatic remediation
          logger.info(`Remediation action: ${action.remediation}`);
          break;
        case 'transform':
          // Would transform data to comply
          logger.info(`Data transformation: ${action.transformation}`);
          break;
        default:
          logger.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      logger.error(`Action execution failed: ${error.message}`);
    }
  }

  /**
   * Create a governance workflow
   */
  createWorkflow(workflowId, workflowData) {
    const workflow = {
      workflowId,
      name: workflowData.name,
      description: workflowData.description,
      steps: workflowData.steps || [],
      status: 'pending',
      currentStep: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null
    };

    this.workflows.set(workflowId, workflow);
    
    logger.info(`Governance workflow created: ${workflowId}`);
    
    return workflow;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, context = {}) {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    workflow.status = 'in_progress';
    workflow.startedAt = new Date().toISOString();
    this.metrics.workflowExecutions++;

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        workflow.currentStep = i;
        
        const step = workflow.steps[i];
        logger.info(`Executing workflow step ${i + 1}/${workflow.steps.length}: ${step.name}`);
        
        const result = await this.executeStep(step, context);
        
        workflow.steps[i].result = result;
        workflow.steps[i].completedAt = new Date().toISOString();
      }

      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      
      logger.info(`Workflow completed: ${workflowId}`);
      
      return workflow;
    } catch (error) {
      workflow.status = 'failed';
      workflow.failedAt = new Date().toISOString();
      workflow.error = error.message;
      
      logger.error(`Workflow failed: ${workflowId} - ${error.message}`);
      
      throw error;
    }
  }

  /**
   * Execute a workflow step
   */
  async executeStep(step, context) {
    try {
      switch (step.type) {
        case 'validation':
          return await this.executeValidationStep(step, context);
        case 'approval':
          return await this.executeApprovalStep(step, context);
        case 'transformation':
          return await this.executeTransformationStep(step, context);
        case 'notification':
          return await this.executeNotificationStep(step, context);
        case 'custom':
          if (step.executor && typeof step.executor === 'function') {
            return await step.executor(context);
          }
          return { success: true, message: 'Custom step skipped' };
        default:
          return { success: true, message: 'Unknown step type' };
      }
    } catch (error) {
      logger.error(`Step execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute validation step
   */
  async executeValidationStep(step, context) {
    if (step.validator && typeof step.validator === 'function') {
      const result = await step.validator(context);
      return {
        success: result.passed,
        message: result.message || 'Validation completed'
      };
    }
    return { success: true, message: 'Validation skipped' };
  }

  /**
   * Execute approval step
   */
  async executeApprovalStep(step, context) {
    // In a real implementation, this would integrate with approval workflow
    logger.info(`Approval required: ${step.description}`);
    return {
      success: true,
      message: 'Approval step completed',
      requiresManualApproval: true
    };
  }

  /**
   * Execute transformation step
   */
  async executeTransformationStep(step, context) {
    if (step.transformer && typeof step.transformer === 'function') {
      const result = await step.transformer(context);
      return {
        success: true,
        message: 'Transformation completed',
        transformedData: result
      };
    }
    return { success: true, message: 'Transformation skipped' };
  }

  /**
   * Execute notification step
   */
  async executeNotificationStep(step, context) {
    // In a real implementation, this would send notifications
    logger.info(`Notification sent: ${step.description}`);
    return {
      success: true,
      message: 'Notification sent'
    };
  }

  /**
   * Add data stewardship role
   */
  addStewardship(stewardId, stewardData) {
    const stewardship = {
      stewardId,
      name: stewardData.name,
      role: stewardData.role || 'data_steward',
      responsibilities: stewardData.responsibilities || [],
      dataDomains: stewardData.dataDomains || [],
      createdAt: new Date().toISOString()
    };

    this.stewardship.set(stewardId, stewardship);
    
    logger.info(`Data stewardship added: ${stewardId}`);
    
    return stewardship;
  }

  /**
   * Get governance metrics
   */
  getMetrics() {
    this.metrics.lastRun = new Date().toISOString();
    
    return {
      ...this.metrics,
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter(p => p.enabled).length,
      totalWorkflows: this.workflows.size,
      activeWorkflows: Array.from(this.workflows.values()).filter(w => w.status === 'in_progress').length,
      totalStewardships: this.stewardship.size
    };
  }

  /**
   * Get all policies
   */
  getAllPolicies() {
    return Array.from(this.policies.values());
  }

  /**
   * Get all workflows
   */
  getAllWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Get all stewardships
   */
  getAllStewardships() {
    return Array.from(this.stewardship.values());
  }
}

// Singleton instance
let governanceEngineInstance = null;

/**
 * Get the singleton governance engine instance
 */
function getGovernanceEngine() {
  if (!governanceEngineInstance) {
    governanceEngineInstance = new GovernanceEngine();
  }
  return governanceEngineInstance;
}

module.exports = {
  GovernanceEngine,
  getGovernanceEngine
};
