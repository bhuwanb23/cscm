const featureVersioning = require('../../features/featureVersioning');

describe('Feature Versioning Tests', () => {
  beforeEach(() => {
    // Clear all versioning data before each test
    featureVersioning.clear();
  });

  test('should export featureVersioning', () => {
    expect(featureVersioning).toBeDefined();
    expect(typeof featureVersioning.createVersion).toBe('function');
    expect(typeof featureVersioning.getVersion).toBe('function');
    expect(typeof featureVersioning.getLatestVersion).toBe('function');
    expect(typeof featureVersioning.listVersions).toBe('function');
    expect(typeof featureVersioning.compareVersions).toBe('function');
    expect(typeof featureVersioning.getVersionMetadata).toBe('function');
    expect(typeof featureVersioning.deleteVersion).toBe('function');
    expect(typeof featureVersioning.deleteFeatureVersions).toBe('function');
    expect(typeof featureVersioning.getStats).toBe('function');
    expect(typeof featureVersioning.clear).toBe('function');
  });

  test('should create and retrieve versions', () => {
    const featureName = 'test_feature';
    const dataV1 = [1, 2, 3];
    const dataV2 = [1, 2, 3, 4, 5];
    
    // Create first version
    const version1 = featureVersioning.createVersion(featureName, dataV1, {
      description: 'First version'
    });
    
    expect(version1).toEqual({
      version: 1,
      data: dataV1,
      timestamp: expect.any(String),
      metadata: expect.objectContaining({
        description: 'First version',
        createdBy: expect.any(String)
      })
    });
    
    // Create second version
    const version2 = featureVersioning.createVersion(featureName, dataV2, {
      description: 'Second version'
    });
    
    expect(version2.version).toBe(2);
    expect(version2.data).toEqual(dataV2);
    
    // Retrieve specific version
    const retrievedV1 = featureVersioning.getVersion(featureName, 1);
    expect(retrievedV1).toEqual(version1);
    
    // Retrieve latest version
    const latestVersion = featureVersioning.getLatestVersion(featureName);
    expect(latestVersion).toEqual(version2);
  });

  test('should list versions correctly', () => {
    const featureName = 'test_feature';
    const dataV1 = [1, 2, 3];
    const dataV2 = [4, 5, 6];
    const dataV3 = [7, 8, 9];
    
    // Create multiple versions
    featureVersioning.createVersion(featureName, dataV1);
    featureVersioning.createVersion(featureName, dataV2);
    featureVersioning.createVersion(featureName, dataV3);
    
    // List versions
    const versions = featureVersioning.listVersions(featureName);
    
    expect(versions.length).toBe(3);
    expect(versions[0].version).toBe(1);
    expect(versions[1].version).toBe(2);
    expect(versions[2].version).toBe(3);
  });

  test('should compare versions correctly', () => {
    const featureName = 'test_feature';
    const dataV1 = [1, 2, 3];
    const dataV2 = [1, 2, 3, 4];
    
    // Create versions
    featureVersioning.createVersion(featureName, dataV1);
    featureVersioning.createVersion(featureName, dataV2);
    
    // Compare versions
    const comparison = featureVersioning.compareVersions(featureName, 1, 2);
    
    expect(comparison).toEqual({
      featureName: featureName,
      version1: 1,
      version2: 2,
      timeDifference: expect.any(Number),
      dataChanged: true,
      version1Info: expect.any(Object),
      version2Info: expect.any(Object)
    });
    
    expect(comparison.timeDifference).toBeGreaterThanOrEqual(0);
  });

  test('should get version metadata', () => {
    const featureName = 'test_feature';
    const data = [1, 2, 3];
    
    // Create version
    featureVersioning.createVersion(featureName, data);
    
    // Get metadata
    const metadata = featureVersioning.getVersionMetadata(featureName);
    
    expect(metadata).toEqual({
      versions: expect.any(Array),
      currentVersion: 1,
      createdAt: expect.any(String)
    });
  });

  test('should delete versions correctly', () => {
    const featureName = 'test_feature';
    const dataV1 = [1, 2, 3];
    const dataV2 = [4, 5, 6];
    
    // Create versions
    featureVersioning.createVersion(featureName, dataV1);
    featureVersioning.createVersion(featureName, dataV2);
    
    // Verify versions exist
    expect(featureVersioning.listVersions(featureName).length).toBe(2);
    
    // Delete specific version
    const deleted = featureVersioning.deleteVersion(featureName, 1);
    
    expect(deleted).toBe(true);
    
    // Verify only one version remains
    const remainingVersions = featureVersioning.listVersions(featureName);
    expect(remainingVersions.length).toBe(1);
    expect(remainingVersions[0].version).toBe(2);
    
    // Delete all versions of feature
    const deletedAll = featureVersioning.deleteFeatureVersions(featureName);
    
    expect(deletedAll).toBe(true);
    expect(featureVersioning.listVersions(featureName).length).toBe(0);
  });

  test('should get statistics correctly', () => {
    // Initially empty
    const initialStats = featureVersioning.getStats();
    expect(initialStats).toEqual({
      totalFeatures: 0,
      totalVersions: 0,
      featuresWithMultipleVersions: 0
    });
    
    // Add versions
    featureVersioning.createVersion('feature1', [1, 2, 3]);
    featureVersioning.createVersion('feature1', [4, 5, 6]); // Second version of feature1
    featureVersioning.createVersion('feature2', [7, 8, 9]); // First version of feature2
    
    // Check updated stats
    const updatedStats = featureVersioning.getStats();
    expect(updatedStats).toEqual({
      totalFeatures: 2,
      totalVersions: 3,
      featuresWithMultipleVersions: 1 // Only feature1 has multiple versions
    });
  });

  test('should handle non-existent features gracefully', () => {
    // Try to get version of non-existent feature
    const version = featureVersioning.getVersion('non_existent', 1);
    expect(version).toBeNull();
    
    // Try to get latest version of non-existent feature
    const latest = featureVersioning.getLatestVersion('non_existent');
    expect(latest).toBeNull();
    
    // Try to list versions of non-existent feature
    const versions = featureVersioning.listVersions('non_existent');
    expect(versions).toEqual([]);
    
    // Try to get metadata of non-existent feature
    const metadata = featureVersioning.getVersionMetadata('non_existent');
    expect(metadata).toBeNull();
    
    // Try to delete version of non-existent feature
    const deleted = featureVersioning.deleteVersion('non_existent', 1);
    expect(deleted).toBe(false);
    
    // Try to delete all versions of non-existent feature
    const deletedAll = featureVersioning.deleteFeatureVersions('non_existent');
    expect(deletedAll).toBe(false);
  });

  test('should validate required parameters', () => {
    // Test createVersion validation
    expect(() => featureVersioning.createVersion(null, [1, 2, 3]))
      .toThrow('Feature name is required');
    
    // Test getVersion validation
    expect(() => featureVersioning.getVersion(null, 1))
      .toThrow('Feature name is required');
    
    expect(() => featureVersioning.getVersion('feature', 0))
      .toThrow('Valid version number is required');
    
    // Test compareVersions validation
    expect(() => featureVersioning.compareVersions(null, 1, 2))
      .toThrow('Feature name is required');
    
    expect(() => featureVersioning.compareVersions('feature', 0, 2))
      .toThrow('Valid version numbers are required');
  });
});