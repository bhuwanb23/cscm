/**
 * Unit tests for feature storage.
 */
// Create a fresh instance for each test
const FeatureStorage = require('../../../features/featureStorage');

describe('FeatureStorage', () => {
  beforeEach(() => {
    FeatureStorage.clear();
  });

  describe('storeFeature', () => {
    it('should store feature', () => {
      const result = FeatureStorage.storeFeature('test_feature', { value: 42 });
      expect(result.name).toBe('test_feature');
      expect(result.data.value).toBe(42);
    });

    it('should throw without name', () => {
      expect(() => FeatureStorage.storeFeature('', {})).toThrow('required');
    });
  });

  describe('getFeature', () => {
    it('should retrieve feature', () => {
      FeatureStorage.storeFeature('f1', { value: 1 });
      const feature = FeatureStorage.getFeature('f1');
      expect(feature.data.value).toBe(1);
    });

    it('should return null for missing', () => {
      expect(FeatureStorage.getFeature('nonexistent')).toBeNull();
    });
  });

  describe('updateFeature', () => {
    it('should update feature', () => {
      FeatureStorage.storeFeature('f1', { value: 1 });
      const updated = FeatureStorage.updateFeature('f1', { value: 2 });
      expect(updated.data.value).toBe(2);
    });

    it('should throw for missing feature', () => {
      expect(() => FeatureStorage.updateFeature('nonexistent', {})).toThrow('not found');
    });
  });

  describe('deleteFeature', () => {
    it('should delete feature', () => {
      FeatureStorage.storeFeature('f1', { value: 1 });
      const result = FeatureStorage.deleteFeature('f1');
      expect(result).toBe(true);
      expect(FeatureStorage.getFeature('f1')).toBeNull();
    });
  });

  describe('listFeatures', () => {
    it('should list all features', () => {
      FeatureStorage.storeFeature('f1', {});
      FeatureStorage.storeFeature('f2', {});
      const list = FeatureStorage.listFeatures();
      expect(list.length).toBe(2);
    });
  });

  describe('getFeatureVersionHistory', () => {
    it('should return version history', () => {
      FeatureStorage.storeFeature('f1', { v: 1 });
      FeatureStorage.updateFeature('f1', { v: 2 });
      const history = FeatureStorage.getFeatureVersionHistory('f1');
      expect(history.length).toBe(2);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
    });
  });

  describe('registerTransformation', () => {
    it('should register transformation', () => {
      FeatureStorage.registerTransformation('double', (data) => data.value * 2);
      expect(FeatureStorage.listTransformations()).toContain('double');
    });

    it('should throw for non-function', () => {
      expect(() => FeatureStorage.registerTransformation('bad', 'not a function')).toThrow('function');
    });
  });

  describe('applyTransformation', () => {
    it('should apply transformation', () => {
      FeatureStorage.registerTransformation('double', (data) => ({ value: data.value * 2 }));
      FeatureStorage.storeFeature('f1', { value: 5 });
      const result = FeatureStorage.applyTransformation('f1', 'double');
      expect(result.value).toBe(10);
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      FeatureStorage.storeFeature('f1', {});
      FeatureStorage.clear();
      expect(FeatureStorage.listFeatures().length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      FeatureStorage.storeFeature('f1', {});
      const stats = FeatureStorage.getStats();
      expect(stats.featureCount).toBe(1);
    });
  });
});
