/**
 * Feature Versioning
 * 
 * This module provides basic feature versioning capabilities for the CSCM backend.
 * It manages feature versions, metadata, and version comparison.
 */

const logger = require('../utils/logger');

class FeatureVersioning {
  constructor() {
    // Version metadata storage
    this.versionMetadata = new Map();
  }

  /**
   * Create a new version of a feature
   * @param {string} featureName - Name of the feature
   * @param {any} data - Feature data
   * @param {Object} metadata - Version metadata
   * @returns {Object} Version information
   */
  createVersion(featureName, data, metadata = {}) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      // Initialize version tracking if not exists
      if (!this.versionMetadata.has(featureName)) {
        this.versionMetadata.set(featureName, {
          versions: [],
          currentVersion: 0,
          createdAt: new Date().toISOString()
        });
      }

      const featureVersions = this.versionMetadata.get(featureName);
      
      // Create new version
      const newVersionNumber = featureVersions.currentVersion + 1;
      const versionInfo = {
        version: newVersionNumber,
        data: data,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          createdBy: metadata.createdBy || 'system',
          description: metadata.description || `Version ${newVersionNumber} of ${featureName}`
        }
      };

      // Add to version history
      featureVersions.versions.push(versionInfo);
      featureVersions.currentVersion = newVersionNumber;

      logger.debug(`Created version ${newVersionNumber} for feature: ${featureName}`);
      return versionInfo;
    } catch (error) {
      logger.error(`Failed to create version for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get a specific version of a feature
   * @param {string} featureName - Name of the feature
   * @param {number} version - Version number
   * @returns {Object|null} Version information or null if not found
   */
  getVersion(featureName, version) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      if (!version || version <= 0) {
        throw new Error('Valid version number is required');
      }

      const featureVersions = this.versionMetadata.get(featureName);
      if (!featureVersions) {
        logger.debug(`No versions found for feature: ${featureName}`);
        return null;
      }

      const versionInfo = featureVersions.versions.find(v => v.version === version);
      if (!versionInfo) {
        logger.debug(`Version ${version} not found for feature: ${featureName}`);
        return null;
      }

      return versionInfo;
    } catch (error) {
      logger.error(`Failed to get version ${version} for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get the latest version of a feature
   * @param {string} featureName - Name of the feature
   * @returns {Object|null} Latest version information or null if not found
   */
  getLatestVersion(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const featureVersions = this.versionMetadata.get(featureName);
      if (!featureVersions || featureVersions.versions.length === 0) {
        logger.debug(`No versions found for feature: ${featureName}`);
        return null;
      }

      // Return the latest version (highest version number)
      const latestVersion = Math.max(...featureVersions.versions.map(v => v.version));
      return this.getVersion(featureName, latestVersion);
    } catch (error) {
      logger.error(`Failed to get latest version for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * List all versions of a feature
   * @param {string} featureName - Name of the feature
   * @returns {Array} Array of version information
   */
  listVersions(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const featureVersions = this.versionMetadata.get(featureName);
      if (!featureVersions) {
        logger.debug(`No versions found for feature: ${featureName}`);
        return [];
      }

      // Return a copy of versions sorted by version number
      return [...featureVersions.versions].sort((a, b) => a.version - b.version);
    } catch (error) {
      logger.error(`Failed to list versions for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Compare two versions of a feature
   * @param {string} featureName - Name of the feature
   * @param {number} version1 - First version number
   * @param {number} version2 - Second version number
   * @returns {Object} Comparison result
   */
  compareVersions(featureName, version1, version2) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      if (!version1 || !version2 || version1 <= 0 || version2 <= 0) {
        throw new Error('Valid version numbers are required');
      }

      const version1Info = this.getVersion(featureName, version1);
      const version2Info = this.getVersion(featureName, version2);

      if (!version1Info) {
        throw new Error(`Version ${version1} not found for feature: ${featureName}`);
      }

      if (!version2Info) {
        throw new Error(`Version ${version2} not found for feature: ${featureName}`);
      }

      // Simple comparison based on timestamps
      const timeDiff = new Date(version2Info.timestamp) - new Date(version1Info.timestamp);
      
      // Check if data is different (simple JSON comparison)
      const data1Str = JSON.stringify(version1Info.data);
      const data2Str = JSON.stringify(version2Info.data);
      const dataChanged = data1Str !== data2Str;

      const result = {
        featureName: featureName,
        version1: version1,
        version2: version2,
        timeDifference: timeDiff, // milliseconds
        dataChanged: dataChanged,
        version1Info: version1Info,
        version2Info: version2Info
      };

      logger.debug(`Compared versions ${version1} and ${version2} for feature: ${featureName}`);
      return result;
    } catch (error) {
      logger.error(`Failed to compare versions for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get version metadata for a feature
   * @param {string} featureName - Name of the feature
   * @returns {Object|null} Version metadata or null if not found
   */
  getVersionMetadata(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const metadata = this.versionMetadata.get(featureName);
      if (!metadata) {
        logger.debug(`No version metadata found for feature: ${featureName}`);
        return null;
      }

      return { ...metadata }; // Return a copy
    } catch (error) {
      logger.error(`Failed to get version metadata for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a specific version of a feature
   * @param {string} featureName - Name of the feature
   * @param {number} version - Version number to delete
   * @returns {boolean} True if deleted, false if not found
   */
  deleteVersion(featureName, version) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      if (!version || version <= 0) {
        throw new Error('Valid version number is required');
      }

      const featureVersions = this.versionMetadata.get(featureName);
      if (!featureVersions) {
        logger.debug(`No versions found for feature: ${featureName}`);
        return false;
      }

      const initialLength = featureVersions.versions.length;
      featureVersions.versions = featureVersions.versions.filter(v => v.version !== version);

      const deleted = featureVersions.versions.length < initialLength;
      if (deleted) {
        logger.debug(`Deleted version ${version} for feature: ${featureName}`);
        
        // Update current version if necessary
        if (featureVersions.currentVersion === version && featureVersions.versions.length > 0) {
          const remainingVersions = featureVersions.versions.map(v => v.version);
          featureVersions.currentVersion = Math.max(...remainingVersions);
        }
      } else {
        logger.debug(`Version ${version} not found for feature: ${featureName}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Failed to delete version ${version} for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete all versions of a feature
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if deleted, false if not found
   */
  deleteFeatureVersions(featureName) {
    try {
      if (!featureName) {
        throw new Error('Feature name is required');
      }

      const result = this.versionMetadata.delete(featureName);
      if (result) {
        logger.debug(`Deleted all versions for feature: ${featureName}`);
      } else {
        logger.debug(`No versions found for feature: ${featureName}`);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to delete versions for feature ${featureName}:`, error.message);
      throw error;
    }
  }

  /**
   * Get statistics about feature versions
   * @returns {Object} Version statistics
   */
  getStats() {
    const stats = {
      totalFeatures: this.versionMetadata.size,
      totalVersions: 0,
      featuresWithMultipleVersions: 0
    };

    for (const [featureName, metadata] of this.versionMetadata.entries()) {
      stats.totalVersions += metadata.versions.length;
      if (metadata.versions.length > 1) {
        stats.featuresWithMultipleVersions++;
      }
    }

    return stats;
  }

  /**
   * Clear all version metadata
   */
  clear() {
    this.versionMetadata.clear();
    logger.info('Feature versioning cleared');
  }
}

// Export singleton instance
module.exports = new FeatureVersioning();