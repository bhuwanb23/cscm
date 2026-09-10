/**
 * Data Lineage Capture Module
 * Provides data lineage tracking for regulatory compliance and impact analysis
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class LineageCapture {
  constructor() {
    this.lineageRecords = new Map();
    this.dataSources = new Map();
    this.transformations = new Map();
  }

  /**
   * Generate unique lineage ID
   */
  generateId() {
    return `lineage_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Register a data source
   */
  registerDataSource(sourceId, sourceData) {
    const source = {
      sourceId,
      name: sourceData.name,
      type: sourceData.type || 'database',
      location: sourceData.location,
      schema: sourceData.schema || {},
      metadata: sourceData.metadata || {},
      registeredAt: new Date().toISOString()
    };

    this.dataSources.set(sourceId, source);
    
    logger.info(`Data source registered: ${sourceId}`);
    
    return source;
  }

  /**
   * Record a data transformation
   */
  recordTransformation(transformationId, transformationData) {
    const transformation = {
      transformationId,
      name: transformationData.name,
      type: transformationData.type || 'etl',
      description: transformationData.description,
      inputSources: transformationData.inputSources || [],
      outputSources: transformationData.outputSources || [],
      transformationLogic: transformationData.transformationLogic || {},
      createdAt: new Date().toISOString()
    };

    this.transformations.set(transformationId, transformation);
    
    logger.info(`Transformation recorded: ${transformationId}`);
    
    return transformation;
  }

  /**
   * Capture data lineage for a record
   */
  captureLineage(recordId, lineageData) {
    const lineage = {
      lineageId: this.generateId(),
      recordId,
      recordType: lineageData.recordType,
      sourceId: lineageData.sourceId,
      transformationId: lineageData.transformationId,
      parentRecordIds: lineageData.parentRecordIds || [],
      childRecordIds: lineageData.childRecordIds || [],
      attributes: lineageData.attributes || {},
      metadata: lineageData.metadata || {},
      capturedAt: new Date().toISOString(),
      capturedBy: lineageData.capturedBy || 'system'
    };

    this.lineageRecords.set(lineage.lineageId, lineage);
    
    logger.debug(`Lineage captured for record: ${recordId}`);
    
    return lineage;
  }

  /**
   * Get lineage for a record
   */
  getLineage(recordId) {
    const lineageRecords = [];
    
    for (const lineage of this.lineageRecords.values()) {
      if (lineage.recordId === recordId) {
        lineageRecords.push(lineage);
      }
    }

    return lineageRecords;
  }

  /**
   * Get upstream lineage (parents)
   */
  getUpstreamLineage(recordId, maxDepth = 5) {
    const visited = new Set();
    const results = [];

    const traverse = (currentRecordId, depth) => {
      if (depth > maxDepth || visited.has(currentRecordId)) {
        return;
      }

      visited.add(currentRecordId);

      const lineage = this.getLineage(currentRecordId);
      
      for (const record of lineage) {
        if (record.parentRecordIds && record.parentRecordIds.length > 0) {
          for (const parentId of record.parentRecordIds) {
            results.push({
              recordId: parentId,
              depth,
              sourceId: record.sourceId,
              transformationId: record.transformationId
            });
            
            traverse(parentId, depth + 1);
          }
        }
      }
    };

    traverse(recordId, 0);
    
    return results;
  }

  /**
   * Get downstream lineage (children)
   */
  getDownstreamLineage(recordId, maxDepth = 5) {
    const visited = new Set();
    const results = [];

    const traverse = (currentRecordId, depth) => {
      if (depth > maxDepth || visited.has(currentRecordId)) {
        return;
      }

      visited.add(currentRecordId);

      // Find records that have this as a parent
      for (const lineage of this.lineageRecords.values()) {
        if (lineage.parentRecordIds && lineage.parentRecordIds.includes(currentRecordId)) {
          results.push({
            recordId: lineage.recordId,
            depth,
            sourceId: lineage.sourceId,
            transformationId: lineage.transformationId
          });
          
          traverse(lineage.recordId, depth + 1);
        }
      }
    };

    traverse(recordId, 0);
    
    return results;
  }

  /**
   * Get full lineage graph
   */
  getLineageGraph(recordId) {
    const upstream = this.getUpstreamLineage(recordId);
    const downstream = this.getDownstreamLineage(recordId);
    const current = this.getLineage(recordId);

    return {
      recordId,
      current,
      upstream,
      downstream,
      totalUpstream: upstream.length,
      totalDownstream: downstream.length
    };
  }

  /**
   * Perform impact analysis
   */
  performImpactAnalysis(recordId) {
    const downstream = this.getDownstreamLineage(recordId);
    const impactedRecords = [];
    const impactedTransformations = new Set();

    for (const record of downstream) {
      impactedRecords.push(record);
      
      if (record.transformationId) {
        impactedTransformations.add(record.transformationId);
      }
    }

    const transformations = Array.from(impactedTransformations).map(id => 
      this.transformations.get(id)
    ).filter(t => t);

    return {
      recordId,
      impactedRecords: impactedRecords.length,
      impactedTransformations: transformations.length,
      impactLevel: this.getImpactLevel(impactedRecords.length),
      details: {
        records: impactedRecords,
        transformations
      }
    };
  }

  /**
   * Get impact level
   */
  getImpactLevel(count) {
    if (count === 0) return 'none';
    if (count < 10) return 'low';
    if (count < 100) return 'medium';
    if (count < 1000) return 'high';
    return 'critical';
  }

  /**
   * Get data flow path
   */
  getDataFlowPath(fromRecordId, toRecordId) {
    const visited = new Set();
    const path = [];

    const findPath = (currentId, targetId, currentPath) => {
      if (visited.has(currentId)) {
        return null;
      }

      visited.add(currentId);
      const newPath = [...currentPath, currentId];

      if (currentId === targetId) {
        return newPath;
      }

      const lineage = this.getLineage(currentId);
      
      for (const record of lineage) {
        if (record.childRecordIds && record.childRecordIds.length > 0) {
          for (const childId of record.childRecordIds) {
            const result = findPath(childId, targetId, newPath);
            if (result) {
              return result;
            }
          }
        }
      }

      return null;
    };

    return findPath(fromRecordId, toRecordId, []);
  }

  /**
   * Get lineage statistics
   */
  getStatistics() {
    const stats = {
      totalLineageRecords: this.lineageRecords.size,
      totalDataSources: this.dataSources.size,
      totalTransformations: this.transformations.size,
      recordsByType: {},
      recordsBySource: {}
    };

    for (const lineage of this.lineageRecords.values()) {
      // Count by record type
      if (!stats.recordsByType[lineage.recordType]) {
        stats.recordsByType[lineage.recordType] = 0;
      }
      stats.recordsByType[lineage.recordType]++;

      // Count by source
      if (!stats.recordsBySource[lineage.sourceId]) {
        stats.recordsBySource[lineage.sourceId] = 0;
      }
      stats.recordsBySource[lineage.sourceId]++;
    }

    return stats;
  }

  /**
   * Export lineage for regulatory reporting
   */
  exportLineage(recordId = null) {
    const records = recordId 
      ? this.getLineage(recordId)
      : Array.from(this.lineageRecords.values());

    return {
      exportedAt: new Date().toISOString(),
      recordId,
      records,
      statistics: this.getStatistics()
    };
  }

  /**
   * Clear old lineage records
   */
  clearOldLineage(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let clearedCount = 0;

    for (const [key, lineage] of this.lineageRecords) {
      if (new Date(lineage.capturedAt) < cutoffDate) {
        this.lineageRecords.delete(key);
        clearedCount++;
      }
    }

    logger.info(`Cleared ${clearedCount} old lineage records`);
    
    return clearedCount;
  }
}

// Singleton instance
let lineageCaptureInstance = null;

/**
 * Get the singleton lineage capture instance
 */
function getLineageCapture() {
  if (!lineageCaptureInstance) {
    lineageCaptureInstance = new LineageCapture();
  }
  return lineageCaptureInstance;
}

module.exports = {
  LineageCapture,
  getLineageCapture
};
