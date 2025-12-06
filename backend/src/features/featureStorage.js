/**
 * Feature Storage
 * 
 * This module provides in-memory feature storage for the CSCM backend.
 * It manages feature data, transformations, and versioning.
 */

const logger = require('../utils/logger');

class FeatureStorage {
  constructor() {
    // In-memory storage for features
    this.features = new Map();
    this.featureVersions = new Map();
    this.transformations = new Map();
  }

  /**
   * Store a feature in memory
   * @param {string} featureName - Name of the feature
   * @param {any} data - Feature data
   * @param {Object} metadata - Optional metadata
   */
  storeFeature(featureName, data, metadata = {}) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      // Create feature entry
      const featureEntry = {
        name: featureName,
        data: data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: metadata
      };

      // Store feature
      this.features.set(featureName, featureEntry);

      // Initialize version tracking if not exists
      if (!this.featureVersions.has(featureName)) {
        this.featureVersions.set(featureName, []);
      }

      // Add to version history
      const versions = this.featureVersions.get(featureName);
      const version = {
        version: versions.length + 1,
        data: data,
        timestamp: featureEntry.createdAt,
        metadata: metadata
      };
      versions.push(version);

      logger.debug(`Stored feature: ${featureName} (version ${version.version})`);
      return featureEntry;
    } catch (error) {
      logger.error(`Failed to store feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Retrieve a feature from memory
   * @param {string} featureName - Name of the feature
   * @returns {Object|null} Feature data or null if not found
   */
  getFeature(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const feature = this.features.get(featureName);
      if (!feature) {
        logger.debug(`Feature not found: ${featureName}`);
        return null;
      }

      logger.debug(`Retrieved feature: ${featureName}`);
      return feature;
    } catch (error) {
      logger.error(`Failed to retrieve feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Update an existing feature
   * @param {string} featureName - Name of the feature
   * @param {any} data - Updated feature data
   * @param {Object} metadata - Optional metadata
   */
  updateFeature(featureName, data, metadata = {}) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const existingFeature = this.features.get(featureName);
      if (!existingFeature) {
        throw new Error(`Feature not found: ${featureName}`);
      }

      // Update feature entry
      const updatedFeature = {
        ...existingFeature,
        data: data,
        updatedAt: new Date().toISOString(),
        metadata: { ...existingFeature.metadata, ...metadata }
      };

      // Store updated feature
      this.features.set(featureName, updatedFeature);

      // Add to version history
      const versions = this.featureVersions.get(featureName);
      const version = {
        version: versions.length + 1,
        data: data,
        timestamp: updatedFeature.updatedAt,
        metadata: updatedFeature.metadata
      };
      versions.push(version);

      logger.debug(`Updated feature: ${featureName} (version ${version.version})`);
      return updatedFeature;
    } catch (error) {
      logger.error(`Failed to update feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a feature from memory
   * @param {string} featureName - Name of the feature
   */
  deleteFeature(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const result = this.features.delete(featureName);
      if (result) {
        logger.debug(`Deleted feature: ${featureName}`);
      } else {
        logger.debug(`Feature not found for deletion: ${featureName}`);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to delete feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * List all features
   * @returns {Array} Array of feature names
   */
  listFeatures() {
    return Array.from(this.features.keys());
  }

  /**
   * Get feature version history
   * @param {string} featureName - Name of the feature
   * @returns {Array} Array of version history
   */
  getFeatureVersionHistory(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const versions = this.featureVersions.get(featureName);
      if (!versions) {
        logger.debug(`No version history found for feature: ${featureName}`);
        return [];
      }

      return [...versions]; // Return a copy
    } catch (error) {
      logger.error(`Failed to get version history for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a specific version of a feature
   * @param {string} featureName - Name of the feature
   * @param {number} version - Version number
   * @returns {Object|null} Feature version data or null if not found
   */
  getFeatureByVersion(featureName, version) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      if (!version || version <= 0) {
        throw new Error('Valid version number is required');
      }

      const versions = this.featureVersions.get(featureName);
      if (!versions) {
        logger.debug(`No versions found for feature: ${featureName}`);
        return null;
      }

      const featureVersion = versions.find(v => v.version === version);
      if (!featureVersion) {
        logger.debug(`Version ${version} not found for feature: ${featureName}`);
        return null;
      }

      return featureVersion;
    } catch (error) {
      logger.error(`Failed to get version ${version} for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Register a feature transformation function
   * @param {string} transformName - Name of the transformation
   * @param {Function} transformFn - Transformation function
   */
  registerTransformation(transformName, transformFn) {
    try {
      if (!transformName) {
        throw new Error('Transformation name is required');
      }

      if (typeof transformFn !== 'function') {
        throw new Error('Transformation must be a function');
      }

      this.transformations.set(transformName, transformFn);
      logger.debug(`Registered transformation: ${transformName}`);
    } catch (error) {
      logger.error(`Failed to register transformation ${transformName}:`, error.message);
      throw error;
    }
  }

  /**
   * Apply a transformation to a feature
   * @param {string} featureName - Name of the feature
   * @param {string} transformName - Name of the transformation
   * @param {Object} params - Optional parameters for the transformation
   * @returns {any} Transformed feature data
   */
  applyTransformation(featureName, transformName, params = {}) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      if (!transformName) {
        throw new Error('Transformation name is required');
      }

      // Get the feature
      const feature = this.getFeature(featureName);
      if (!feature) {
        throw new Error(`Feature not found: ${featureName}`);
      }

      // Get the transformation function
      const transformFn = this.transformations.get(transformName);
      if (!transformFn) {
        throw new Error(`Transformation not found: ${transformName}`);
      }

      // Apply transformation
      const transformedData = transformFn(feature.data, params);
      
      logger.debug(`Applied transformation ${transformName} to feature ${featureName}`);
      return transformedData;
    } catch (error) {
      logger.error(`Failed to apply transformation ${transformName} to feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get all registered transformations
   * @returns {Array} Array of transformation names
   */
  listTransformations() {
    return Array.from(this.transformations.keys());
  }

  /**
   * Clear all features and transformations
   */
  clear() {
    this.features.clear();
    this.featureVersions.clear();
    this.transformations.clear();
    logger.info('Feature storage cleared');
  }

  /**
   * Get storage statistics
   * @returns {Object} Storage statistics
   */
  getStats() {
    return {
      featureCount: this.features.size,
      transformationCount: this.transformations.size,
      totalVersions: Array.from(this.featureVersions.values()).reduce((sum, versions) => sum + versions.length, 0)
    };
  }
}

// Export singleton instance
module.exports = new FeatureStorage();