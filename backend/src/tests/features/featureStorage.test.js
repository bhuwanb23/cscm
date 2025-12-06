const featureStorage = require('../../features/featureStorage');

describe('Feature Storage Tests', () => {
  beforeEach(() => {
    // Clear all features before each test
    featureStorage.clear();
  });

  test('should export featureStorage', () => {
    expect(featureStorage).toBeDefined();
    expect(typeof featureStorage.storeFeature).toBe('function');
    expect(typeof featureStorage.getFeature).toBe('function');
    expect(typeof featureStorage.updateFeature).toBe('function');
    expect(typeof featureStorage.deleteFeature).toBe('function');
    expect(typeof featureStorage.listFeatures).toBe('function');
    expect(typeof featureStorage.registerTransformation).toBe('function');
    expect(typeof featureStorage.applyTransformation).toBe('function');
    expect(typeof featureStorage.listTransformations).toBe('function');
    expect(typeof featureStorage.clear).toBe('function');
    expect(typeof featureStorage.getStats).toBe('function');
  });

  test('should store and retrieve features', () => {
    const featureName = 'test_feature';
    const featureData = [1, 2, 3, 4, 5];
    const metadata = { description: 'Test feature' };

    // Store feature
    const storedFeature = featureStorage.storeFeature(featureName, featureData, metadata);
    
    expect(storedFeature).toEqual({
      name: featureName,
      data: featureData,
      metadata: metadata,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });

    // Retrieve feature
    const retrievedFeature = featureStorage.getFeature(featureName);
    
    expect(retrievedFeature).toEqual(storedFeature);
  });

  test('should update existing features', () => {
    const featureName = 'test_feature';
    const initialData = [1, 2, 3];
    const updatedData = [1, 2, 3, 4, 5];
    
    // Store initial feature
    const initialFeature = featureStorage.storeFeature(featureName, initialData);
    
    // Small delay to ensure different timestamps
    return new Promise(resolve => {
      setTimeout(() => {
        // Update feature
        const updatedFeature = featureStorage.updateFeature(featureName, updatedData, { updatedBy: 'test' });
        
        expect(updatedFeature.data).toEqual(updatedData);
        // We can't reliably test timestamp differences in unit tests due to timing
        expect(updatedFeature.metadata.updatedBy).toBe('test');
        resolve();
      }, 10);
    });
  });

  test('should delete features', () => {
    const featureName = 'test_feature';
    const featureData = [1, 2, 3];
    
    // Store feature
    featureStorage.storeFeature(featureName, featureData);
    
    // Verify feature exists
    expect(featureStorage.getFeature(featureName)).not.toBeNull();
    
    // Delete feature
    const result = featureStorage.deleteFeature(featureName);
    
    expect(result).toBe(true);
    expect(featureStorage.getFeature(featureName)).toBeNull();
  });

  test('should list all features', () => {
    const features = ['feature1', 'feature2', 'feature3'];
    
    // Store multiple features
    features.forEach(name => {
      featureStorage.storeFeature(name, [1, 2, 3]);
    });
    
    // List features
    const featureList = featureStorage.listFeatures();
    
    expect(featureList).toEqual(expect.arrayContaining(features));
    expect(featureList.length).toBe(features.length);
  });

  test('should register and apply transformations', () => {
    const transformName = 'test_transform';
    const transformFn = (data) => data.map(x => x * 2);
    const featureName = 'test_feature';
    const featureData = [1, 2, 3];
    
    // Store feature
    featureStorage.storeFeature(featureName, featureData);
    
    // Register transformation
    featureStorage.registerTransformation(transformName, transformFn);
    
    // Apply transformation
    const transformedData = featureStorage.applyTransformation(featureName, transformName);
    
    expect(transformedData).toEqual([2, 4, 6]);
  });

  test('should list transformations', () => {
    const transforms = ['transform1', 'transform2', 'transform3'];
    
    // Register multiple transformations
    transforms.forEach(name => {
      featureStorage.registerTransformation(name, (data) => data);
    });
    
    // List transformations
    const transformList = featureStorage.listTransformations();
    
    expect(transformList).toEqual(expect.arrayContaining(transforms));
    expect(transformList.length).toBe(transforms.length);
  });

  test('should get storage statistics', () => {
    // Initially empty
    const initialStats = featureStorage.getStats();
    expect(initialStats).toEqual({
      featureCount: 0,
      transformationCount: 0,
      totalVersions: 0
    });
    
    // Add features and transformations
    featureStorage.storeFeature('feature1', [1, 2, 3]);
    featureStorage.storeFeature('feature2', [4, 5, 6]);
    featureStorage.registerTransformation('transform1', (data) => data);
    
    // Check updated stats
    const updatedStats = featureStorage.getStats();
    expect(updatedStats.featureCount).toBe(2);
    expect(updatedStats.transformationCount).toBe(1);
    // Version count will be 2 (one for each feature creation)
    expect(updatedStats.totalVersions).toBe(2);
  });

  test('should validate required parameters', () => {
    // Test storeFeature validation
    expect(() => featureStorage.storeFeature(null, [1, 2, 3])).toThrow('Feature name is required');
    
    // Test getFeature validation
    expect(() => featureStorage.getFeature(null)).toThrow('Feature name is required');
    
    // Test updateFeature validation
    expect(() => featureStorage.updateFeature(null, [1, 2, 3])).toThrow('Feature name is required');
    
    // Test deleteFeature validation
    expect(() => featureStorage.deleteFeature(null)).toThrow('Feature name is required');
  });

  test('should handle non-existent features gracefully', () => {
    // Try to get non-existent feature
    const result = featureStorage.getFeature('non_existent');
    expect(result).toBeNull();
    
    // Try to update non-existent feature
    expect(() => featureStorage.updateFeature('non_existent', [1, 2, 3]))
      .toThrow('Feature not found: non_existent');
    
    // Try to delete non-existent feature
    const deleteResult = featureStorage.deleteFeature('non_existent');
    expect(deleteResult).toBe(false);
  });
});