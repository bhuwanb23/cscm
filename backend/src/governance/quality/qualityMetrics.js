/**
 * Data Quality Metrics Module
 * Provides data quality metrics collection and monitoring
 */

const logger = require('../../utils/logger');

class QualityMetrics {
  constructor() {
    this.metrics = new Map();
    this.thresholds = {
      completeness: 95,
      validity: 90,
      consistency: 90,
      timeliness: 85,
      uniqueness: 95
    };
  }

  /**
   * Calculate completeness metric
   */
  calculateCompleteness(data, requiredFields) {
    if (!data || !requiredFields || requiredFields.length === 0) {
      return 100;
    }

    let presentCount = 0;
    
    for (const field of requiredFields) {
      if (field in data && data[field] !== null && data[field] !== undefined && data[field] !== '') {
        presentCount++;
      }
    }

    return (presentCount / requiredFields.length) * 100;
  }

  /**
   * Calculate validity metric
   */
  calculateValidity(data, rules) {
    if (!data || !rules || rules.length === 0) {
      return 100;
    }

    let validCount = 0;
    
    for (const rule of rules) {
      try {
        if (rule.validator && rule.validator(data)) {
          validCount++;
        }
      } catch (error) {
        logger.error(`Validity check error: ${error.message}`);
      }
    }

    return (validCount / rules.length) * 100;
  }

  /**
   * Calculate consistency metric
   */
  calculateConsistency(data, referenceData, keyField) {
    if (!data || !referenceData || !keyField) {
      return 100;
    }

    let consistentCount = 0;
    let total = 0;

    for (const record of data) {
      const keyValue = record[keyField];
      const reference = referenceData.find(r => r[keyField] === keyValue);
      
      if (reference) {
        total++;
        let isConsistent = true;
        
        for (const field of Object.keys(record)) {
          if (field in reference && record[field] !== reference[field]) {
            isConsistent = false;
            break;
          }
        }
        
        if (isConsistent) {
          consistentCount++;
        }
      }
    }

    return total > 0 ? (consistentCount / total) * 100 : 100;
  }

  /**
   * Calculate timeliness metric
   */
  calculateTimeliness(data, dateField, maxAgeDays = 30) {
    if (!data || !dateField) {
      return 100;
    }

    let timelyCount = 0;
    const now = new Date();
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const record of data) {
      if (record[dateField]) {
        const recordDate = new Date(record[dateField]);
        const age = now - recordDate;
        
        if (age <= maxAge) {
          timelyCount++;
        }
      }
    }

    return data.length > 0 ? (timelyCount / data.length) * 100 : 100;
  }

  /**
   * Calculate uniqueness metric
   */
  calculateUniqueness(data, keyField) {
    if (!data || !keyField) {
      return 100;
    }

    const uniqueValues = new Set();
    let duplicateCount = 0;

    for (const record of data) {
      const value = record[keyField];
      
      if (uniqueValues.has(value)) {
        duplicateCount++;
      } else {
        uniqueValues.add(value);
      }
    }

    return data.length > 0 ? ((data.length - duplicateCount) / data.length) * 100 : 100;
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallScore(metrics) {
    const weights = {
      completeness: 0.25,
      validity: 0.25,
      consistency: 0.20,
      timeliness: 0.15,
      uniqueness: 0.15
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, value] of Object.entries(metrics)) {
      if (weights[metric]) {
        totalScore += value * weights[metric];
        totalWeight += weights[metric];
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Record quality metrics
   */
  recordMetrics(datasetId, metrics) {
    const record = {
      datasetId,
      metrics,
      overallScore: this.calculateOverallScore(metrics),
      timestamp: new Date().toISOString(),
      grade: this.getGrade(this.calculateOverallScore(metrics))
    };

    this.metrics.set(`${datasetId}_${Date.now()}`, record);
    
    logger.info(`Quality metrics recorded for ${datasetId}: ${record.overallScore.toFixed(2)}%`);
    
    return record;
  }

  /**
   * Get metrics for a dataset
   */
  getDatasetMetrics(datasetId) {
    const datasetMetrics = [];
    
    for (const [key, record] of this.metrics) {
      if (record.datasetId === datasetId) {
        datasetMetrics.push(record);
      }
    }

    return datasetMetrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Get latest metrics for a dataset
   */
  getLatestMetrics(datasetId) {
    const metrics = this.getDatasetMetrics(datasetId);
    return metrics.length > 0 ? metrics[0] : null;
  }

  /**
   * Check if metrics meet thresholds
   */
  checkThresholds(metrics) {
    const issues = [];

    for (const [metric, value] of Object.entries(metrics)) {
      const threshold = this.thresholds[metric];
      
      if (threshold && value < threshold) {
        issues.push({
          metric,
          value,
          threshold,
          severity: this.getSeverity(value, threshold)
        });
      }
    }

    return {
      passed: issues.length === 0,
      issues
    };
  }

  /**
   * Get severity level for threshold violation
   */
  getSeverity(value, threshold) {
    const gap = threshold - value;
    
    if (gap > 20) return 'critical';
    if (gap > 10) return 'high';
    if (gap > 5) return 'medium';
    return 'low';
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

  /**
   * Set quality thresholds
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Quality thresholds updated');
  }

  /**
   * Get quality trends
   */
  getTrends(datasetId, days = 30) {
    const metrics = this.getDatasetMetrics(datasetId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = metrics.filter(m => new Date(m.timestamp) >= cutoffDate);

    if (recentMetrics.length < 2) {
      return null;
    }

    const latest = recentMetrics[0];
    const previous = recentMetrics[recentMetrics.length - 1];

    const trends = {};

    for (const metric of Object.keys(latest.metrics)) {
      const latestValue = latest.metrics[metric];
      const previousValue = previous.metrics[metric];
      const change = latestValue - previousValue;
      const percentChange = previousValue > 0 ? (change / previousValue) * 100 : 0;

      trends[metric] = {
        current: latestValue,
        previous: previousValue,
        change,
        percentChange,
        direction: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
      };
    }

    return {
      overall: {
        current: latest.overallScore,
        previous: previous.overallScore,
        change: latest.overallScore - previous.overallScore,
        direction: latest.overallScore > previous.overallScore ? 'improving' : 'declining'
      },
      byMetric: trends
    };
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const datasets = new Set();
    
    for (const record of this.metrics.values()) {
      datasets.add(record.datasetId);
    }

    const summary = {
      totalDatasets: datasets.size,
      totalRecords: this.metrics.size,
      datasets: {}
    };

    for (const datasetId of datasets) {
      const metrics = this.getDatasetMetrics(datasetId);
      const latest = metrics.length > 0 ? metrics[0] : null;
      
      summary.datasets[datasetId] = {
        recordCount: metrics.length,
        latestScore: latest ? latest.overallScore : null,
        latestGrade: latest ? latest.grade : null,
        lastMeasured: latest ? latest.timestamp : null
      };
    }

    return summary;
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let clearedCount = 0;

    for (const [key, record] of this.metrics) {
      if (new Date(record.timestamp) < cutoffDate) {
        this.metrics.delete(key);
        clearedCount++;
      }
    }

    logger.info(`Cleared ${clearedCount} old metric records`);
    
    return clearedCount;
  }
}

// Singleton instance
let qualityMetricsInstance = null;

/**
 * Get the singleton quality metrics instance
 */
function getQualityMetrics() {
  if (!qualityMetricsInstance) {
    qualityMetricsInstance = new QualityMetrics();
  }
  return qualityMetricsInstance;
}

module.exports = {
  QualityMetrics,
  getQualityMetrics
};
