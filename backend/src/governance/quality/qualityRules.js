/**
 * Data Quality Rules Module
 * Provides data quality validation rules and enforcement
 */

const logger = require('../../utils/logger');

class QualityRules {
  constructor() {
    this.rules = new Map();
    this.defaultRules();
  }

  /**
   * Create default quality rules
   */
  defaultRules() {
    // Required field rules
    this.addRule('order_required_fields', {
      name: 'Order Required Fields',
      category: 'completeness',
      severity: 'high',
      validator: (data) => {
        const required = ['orderId', 'storeId', 'productId', 'quantity'];
        return required.every(field => field in data && data[field] !== null);
      }
    });

    // Data type rules
    this.addRule('order_quantity_numeric', {
      name: 'Order Quantity Must Be Numeric',
      category: 'validity',
      severity: 'high',
      validator: (data) => {
        return typeof data.quantity === 'number' && data.quantity > 0;
      }
    });

    // Range rules
    this.addRule('inventory_quantity_range', {
      name: 'Inventory Quantity Range',
      category: 'validity',
      severity: 'medium',
      validator: (data) => {
        return data.quantity >= 0 && data.quantity <= 1000000;
      }
    });

    // Format rules
    this.addRule('email_format', {
      name: 'Email Format Validation',
      category: 'validity',
      severity: 'medium',
      validator: (data) => {
        if (!data.email) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(data.email);
      }
    });

    // Consistency rules
    this.addRule('store_id_consistency', {
      name: 'Store ID Consistency',
      category: 'consistency',
      severity: 'high',
      validator: (data) => {
        return data.storeId && data.storeId.length > 0;
      }
    });

    // Uniqueness rules
    this.addRule('order_id_unique', {
      name: 'Order ID Uniqueness',
      category: 'uniqueness',
      severity: 'high',
      validator: (data, context) => {
        // In a real implementation, this would check against database
        return data.orderId && data.orderId.length > 0;
      }
    });
  }

  /**
   * Add a quality rule
   */
  addRule(ruleId, ruleData) {
    const rule = {
      ruleId,
      name: ruleData.name,
      category: ruleData.category || 'general',
      severity: ruleData.severity || 'medium',
      validator: ruleData.validator,
      description: ruleData.description || '',
      enabled: ruleData.enabled !== false,
      createdAt: new Date().toISOString()
    };

    this.rules.set(ruleId, rule);
    
    logger.info(`Quality rule added: ${ruleId}`);
    
    return rule;
  }

  /**
   * Validate data against rules
   */
  validate(data, ruleIds = null, context = {}) {
    const rulesToApply = ruleIds 
      ? ruleIds.map(id => this.rules.get(id)).filter(r => r)
      : Array.from(this.rules.values()).filter(r => r.enabled);

    const results = {
      valid: true,
      passed: [],
      failed: [],
      skipped: []
    };

    for (const rule of rulesToApply) {
      try {
        const passed = rule.validator(data, context);
        
        if (passed) {
          results.passed.push({
            ruleId: rule.ruleId,
            ruleName: rule.name,
            category: rule.category
          });
        } else {
          results.valid = false;
          results.failed.push({
            ruleId: rule.ruleId,
            ruleName: rule.name,
            category: rule.category,
            severity: rule.severity
          });
        }
      } catch (error) {
        logger.error(`Rule validation error: ${error.message}`);
        results.skipped.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get all rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category) {
    return Array.from(this.rules.values()).filter(r => r.category === category);
  }

  /**
   * Enable or disable a rule
   */
  setRuleStatus(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    
    if (rule) {
      rule.enabled = enabled;
      logger.info(`Rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get quality score
   */
  getQualityScore(data, ruleIds = null, context = {}) {
    const results = this.validate(data, ruleIds, context);
    
    const total = results.passed.length + results.failed.length;
    const score = total > 0 ? (results.passed.length / total) * 100 : 100;
    
    return {
      score: Math.round(score),
      passed: results.passed.length,
      failed: results.failed.length,
      total,
      grade: this.getGrade(score)
    };
  }

  /**
   * Get quality grade
   */
  getGrade(score) {
    if (score >= 95) return 'A';
    if (score >= 85) return 'B';
    if (score >= 70) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }
}

// Singleton instance
let qualityRulesInstance = null;

/**
 * Get the singleton quality rules instance
 */
function getQualityRules() {
  if (!qualityRulesInstance) {
    qualityRulesInstance = new QualityRules();
  }
  return qualityRulesInstance;
}

module.exports = {
  QualityRules,
  getQualityRules
};
