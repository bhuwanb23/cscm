/**
 * Data Anonymization Module
 * Provides data anonymization algorithms including k-anonymity, l-diversity, and differential privacy
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class DataAnonymizer {
  constructor(options = {}) {
    this.defaultK = options.defaultK || 3; // k-anonymity parameter
    this.defaultL = options.defaultL || 2; // l-diversity parameter
    this.epsilon = options.epsilon || 1.0; // differential privacy parameter
  }

  /**
   * Anonymize a value using masking
   */
  maskValue(value, maskChar = '*', visibleChars = 2) {
    if (!value || typeof value !== 'string') {
      return value;
    }

    if (value.length <= visibleChars) {
      return maskChar.repeat(value.length);
    }

    const visible = value.substring(0, visibleChars);
    const masked = maskChar.repeat(value.length - visibleChars);
    
    return visible + masked;
  }

  /**
   * Anonymize email address
   */
  anonymizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return email;
    }

    const [localPart, domain] = email.split('@');
    
    if (!domain) {
      return this.maskValue(email);
    }

    const maskedLocal = this.maskValue(localPart, '*', 2);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Anonymize phone number
   */
  anonymizePhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return phone;
    }

    // Remove non-numeric characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 4) {
      return this.maskValue(phone);
    }

    const visible = cleanPhone.substring(0, 3);
    const masked = '*'.repeat(cleanPhone.length - 3);
    
    return visible + masked;
  }

  /**
   * Anonymize credit card number
   */
  anonymizeCreditCard(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') {
      return cardNumber;
    }

    const cleanCard = cardNumber.replace(/\D/g, '');
    
    if (cleanCard.length < 6) {
      return this.maskValue(cardNumber);
    }

    const visible = cleanCard.substring(0, 4);
    const masked = '*'.repeat(cleanCard.length - 4);
    
    return visible + masked;
  }

  /**
   * Generalize date to less specific level
   */
  generalizeDate(date, level = 'month') {
    if (!date) return date;

    const dateObj = new Date(date);
    
    switch (level) {
      case 'year':
        return dateObj.getFullYear().toString();
      case 'month':
        return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      case 'day':
        return dateObj.toISOString().split('T')[0];
      default:
        return date;
    }
  }

  /**
   * Generalize numeric value to range
 */
  generalizeNumber(value, ranges) {
    if (typeof value !== 'number') {
      return value;
    }

    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        return range.label;
      }
    }

    return value;
  }

  /**
   * Generalize geographic location
   */
  generalizeLocation(location, level = 'city') {
    if (!location || typeof location !== 'string') {
      return location;
    }

    const parts = location.split(',').map(p => p.trim());
    
    switch (level) {
      case 'country':
        return parts[parts.length - 1] || location;
      case 'region':
        return parts[Math.max(0, parts.length - 2)] || location;
      case 'city':
        return parts[Math.max(0, parts.length - 3)] || location;
      default:
        return location;
    }
  }

  /**
   * Check k-anonymity for a dataset
   */
  checkKAnonymity(data, quasiIdentifiers, k = this.defaultK) {
    const groups = new Map();
    
    for (const record of data) {
      const key = quasiIdentifiers.map(id => record[id]).join('|');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key).push(record);
    }

    const violations = [];
    
    for (const [key, records] of groups) {
      if (records.length < k) {
        violations.push({
          key,
          count: records.length,
          required: k
        });
      }
    }

    return {
      kAnonymity: violations.length === 0,
      violations,
      groups: groups.size
    };
  }

  /**
   * Achieve k-anonymity by generalization
   */
  achieveKAnonymity(data, quasiIdentifiers, k = this.defaultK) {
    let currentData = [...data];
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      const check = this.checkKAnonymity(currentData, quasiIdentifiers, k);
      
      if (check.kAnonymity) {
        break;
      }

      // Generalize smallest violating groups
      for (const violation of check.violations) {
        const keyParts = violation.key.split('|');
        
        // Generalize one quasi-identifier
        for (let i = 0; i < keyParts.length; i++) {
          const identifier = quasiIdentifiers[i];
          
          // Apply generalization to this identifier
          currentData = currentData.map(record => {
            const value = record[identifier];
            
            // Simple generalization strategy
            if (typeof value === 'string' && value.includes('-')) {
              // Generalize date-like values
              const generalized = this.generalizeDate(value, 'month');
              return { ...record, [identifier]: generalized };
            } else if (typeof value === 'number') {
              // Generalize numeric values
              const generalized = Math.floor(value / 10) * 10;
              return { ...record, [identifier]: generalized };
            }
            
            return record;
          });
        }
      }

      iterations++;
    }

    return {
      data: currentData,
      kAnonymity: this.checkKAnonymity(currentData, quasiIdentifiers, k).kAnonymity,
      iterations
    };
  }

  /**
   * Add Laplace noise for differential privacy
   */
  addLaplaceNoise(value, sensitivity, epsilon = this.epsilon) {
    const scale = sensitivity / epsilon;
    const noise = this.laplaceSample(0, scale);
    
    return value + noise;
  }

  /**
   * Sample from Laplace distribution
   */
  laplaceSample(location, scale) {
    const u = Math.random() - 0.5;
    return location - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Anonymize dataset with differential privacy
   */
  anonymizeWithDP(data, sensitiveAttributes, sensitivity = 1.0) {
    const anonymizedData = data.map(record => {
      const anonymizedRecord = { ...record };
      
      for (const attribute of sensitiveAttributes) {
        const value = record[attribute];
        
        if (typeof value === 'number') {
          anonymizedRecord[attribute] = this.addLaplaceNoise(value, sensitivity, this.epsilon);
        }
      }
      
      return anonymizedRecord;
    });

    return anonymizedData;
  }

  /**
   * Hash-based anonymization (one-way)
   */
  hashAnonymize(value, salt = 'default-salt') {
    if (!value) {
      return value;
    }

    const hash = crypto
      .createHash('sha256')
      .update(salt + value.toString())
      .digest('hex');

    return hash.substring(0, 16); // Return first 16 characters
  }

  /**
   * Perturb numerical data for privacy
   */
  perturbNumber(value, noiseLevel = 0.1) {
    if (typeof value !== 'number') {
      return value;
    }

    const noise = (Math.random() - 0.5) * 2 * noiseLevel * value;
    return value + noise;
  }

  /**
   * Tokenize text data
   */
  tokenizeText(text, preserveTokens = 3) {
    if (!text || typeof text !== 'string') {
      return text;
    }

    const words = text.split(/\s+/);
    
    if (words.length <= preserveTokens) {
      return this.hashAnonymize(text);
    }

    const visible = words.slice(0, preserveTokens).join(' ');
    const tokens = words.slice(preserveTokens).map(word => this.hashAnonymize(word));
    
    return visible + ' ' + tokens.join(' ');
  }

  /**
   * Apply anonymization based on data type
   */
  anonymizeByType(value, dataType) {
    switch (dataType) {
      case 'email':
        return this.anonymizeEmail(value);
      case 'phone':
        return this.anonymizePhone(value);
      case 'credit_card':
        return this.anonymizeCreditCard(value);
      case 'date':
        return this.generalizeDate(value, 'month');
      case 'location':
        return this.generalizeLocation(value, 'region');
      case 'name':
        return this.maskValue(value, '*', 1);
      case 'hash':
        return this.hashAnonymize(value);
      default:
        return value;
    }
  }

  /**
   * Batch anonymize an object
   */
  anonymizeObject(obj, fieldMappings) {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const anonymized = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const mapping = fieldMappings[key];
      
      if (mapping) {
        anonymized[key] = this.anonymizeByType(value, mapping);
      } else if (typeof value === 'object' && value !== null) {
        anonymized[key] = this.anonymizeObject(value, fieldMappings);
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  /**
   * Calculate re-identification risk
   */
  calculateReidentificationRisk(data, quasiIdentifiers) {
    const groups = new Map();
    
    for (const record of data) {
      const key = quasiIdentifiers.map(id => record[id]).join('|');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key).push(record);
    }

    const groupSizes = Array.from(groups.values()).map(g => g.length);
    const averageGroupSize = groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length;
    const maxGroupSize = Math.max(...groupSizes);
    const minGroupSize = Math.min(...groupSizes);

    // Calculate risk score (lower is better)
    const riskScore = 1 - (minGroupSize / data.length);

    return {
      riskScore,
      averageGroupSize,
      maxGroupSize,
      minGroupSize,
      totalGroups: groups.size,
      riskLevel: this.getRiskLevel(riskScore)
    };
  }

  /**
   * Get risk level based on score
   */
  getRiskLevel(riskScore) {
    if (riskScore < 0.1) return 'very_low';
    if (riskScore < 0.3) return 'low';
    if (riskScore < 0.5) return 'medium';
    if (riskScore < 0.7) return 'high';
    return 'very_high';
  }
}

// Singleton instance
let anonymizerInstance = null;

/**
 * Get the singleton anonymizer instance
 */
function getAnonymizer() {
  if (!anonymizerInstance) {
    anonymizerInstance = new DataAnonymizer();
  }
  return anonymizerInstance;
}

module.exports = {
  DataAnonymizer,
  getAnonymizer
};
