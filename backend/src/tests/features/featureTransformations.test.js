const featureTransformations = require('../../features/featureTransformations');

describe('Feature Transformations Tests', () => {
  test('should export all transformation functions', () => {
    expect(featureTransformations).toBeDefined();
    expect(typeof featureTransformations.normalize).toBe('function');
    expect(typeof featureTransformations.standardize).toBe('function');
    expect(typeof featureTransformations.scale).toBe('function');
    expect(typeof featureTransformations.logTransform).toBe('function');
    expect(typeof featureTransformations.binning).toBe('function');
    expect(typeof featureTransformations.encode).toBe('function');
    expect(typeof featureTransformations.impute).toBe('function');
  });

  test('should normalize data correctly', () => {
    // Test array normalization
    const data = [10, 20, 30, 40, 50];
    const normalized = featureTransformations.normalize(data);
    
    expect(normalized).toEqual([0, 0.25, 0.5, 0.75, 1]);
    
    // Test object normalization
    const objData = { a: 10, b: 20, c: 30 };
    const normalizedObj = featureTransformations.normalize(objData);
    
    expect(normalizedObj).toEqual({ a: 0, b: 0.5, c: 1 });
    
    // Test edge case: all same values
    const sameValues = [5, 5, 5, 5];
    const normalizedSame = featureTransformations.normalize(sameValues);
    
    expect(normalizedSame).toEqual([0, 0, 0, 0]);
  });

  test('should standardize data correctly', () => {
    // Test array standardization
    const data = [10, 20, 30, 40, 50];
    const standardized = featureTransformations.standardize(data);
    
    // Check that mean is approximately 0 and std dev is approximately 1
    const mean = standardized.reduce((sum, val) => sum + val, 0) / standardized.length;
    const variance = standardized.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / standardized.length;
    const stdDev = Math.sqrt(variance);
    
    expect(mean).toBeCloseTo(0, 10);
    expect(stdDev).toBeCloseTo(1, 10);
    
    // Test object standardization
    const objData = { a: 10, b: 20, c: 30 };
    const standardizedObj = featureTransformations.standardize(objData);
    
    // For object, we check that numerical values are standardized
    // Since we have values 10, 20, 30, the standardized values should be:
    // mean = 20, stdDev = sqrt(((10-20)^2 + (20-20)^2 + (30-20)^2)/3) = sqrt(200/3) ≈ 8.165
    // a = (10-20)/8.165 ≈ -1.225, b = (20-20)/8.165 = 0, c = (30-20)/8.165 ≈ 1.225
    expect(standardizedObj.a).toBeCloseTo(-1.225, 2);
    expect(standardizedObj.b).toBeCloseTo(0, 2);
    expect(standardizedObj.c).toBeCloseTo(1.225, 2);
  });

  test('should scale data correctly', () => {
    // Test array scaling
    const data = [1, 2, 3, 4, 5];
    const scaled = featureTransformations.scale(data, { factor: 2 });
    
    expect(scaled).toEqual([2, 4, 6, 8, 10]);
    
    // Test object scaling
    const objData = { a: 1, b: 2, c: 3 };
    const scaledObj = featureTransformations.scale(objData, { factor: 0.5 });
    
    expect(scaledObj).toEqual({ a: 0.5, b: 1, c: 1.5 });
    
    // Test default scaling (factor = 1)
    const defaultScaled = featureTransformations.scale(data);
    
    expect(defaultScaled).toEqual(data);
  });

  test('should log transform data correctly', () => {
    // Test array log transformation
    const data = [1, Math.E, Math.E * Math.E]; // [1, e, e^2]
    const logTransformed = featureTransformations.logTransform(data);
    
    expect(logTransformed).toEqual([0, 1, 2]);
    
    // Test object log transformation
    const objData = { a: 1, b: Math.E, c: Math.E * Math.E };
    const logTransformedObj = featureTransformations.logTransform(objData);
    
    expect(logTransformedObj).toEqual({ a: 0, b: 1, c: 2 });
    
    // Test with different base
    const logBase10 = featureTransformations.logTransform([1, 10, 100], { base: 10 });
    
    expect(logBase10).toEqual([0, 1, 2]);
  });

  test('should bin data correctly', () => {
    // Test array binning
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const binned = featureTransformations.binning(data, { bins: 3 });
    
    // Values should be assigned to bins 0, 1, or 2
    expect(binned.every(val => [0, 1, 2].includes(val))).toBe(true);
    
    // Test with custom labels
    const labeledBins = featureTransformations.binning(data, { 
      bins: 3, 
      labels: ['low', 'medium', 'high'] 
    });
    
    expect(labeledBins.every(val => ['low', 'medium', 'high'].includes(val))).toBe(true);
    
    // Test object binning
    const objData = { a: 1, b: 5, c: 9 };
    const binnedObj = featureTransformations.binning(objData, { bins: 3 });
    
    expect(binnedObj).toEqual({ a: 0, b: 1, c: 2 });
  });

  test('should encode data correctly', () => {
    // Test label encoding
    const data = ['cat', 'dog', 'cat', 'bird', 'dog'];
    const labelEncoded = featureTransformations.encode(data, { method: 'label' });
    
    // Should map each unique value to an integer
    expect(labelEncoded.length).toBe(data.length);
    expect(new Set(labelEncoded).size).toBe(new Set(data).size); // Same number of unique values
    
    // Test one-hot encoding
    const oneHotEncoded = featureTransformations.encode(data, { method: 'onehot' });
    
    // Should create binary vectors
    expect(oneHotEncoded.length).toBe(data.length);
    expect(oneHotEncoded[0].length).toBe(3); // 3 unique values
    expect(oneHotEncoded[0]).toEqual([1, 0, 0]); // First value should be [1, 0, 0]
    
    // Test object encoding
    const objData = { a: 'cat', b: 'dog', c: 'cat' };
    const labelEncodedObj = featureTransformations.encode(objData, { method: 'label' });
    
    expect(Object.keys(labelEncodedObj).length).toBe(3);
  });

  test('should impute missing data correctly', () => {
    // Test mean imputation
    const data = [1, 2, null, 4, 5];
    const meanImputed = featureTransformations.impute(data, { strategy: 'mean' });
    
    const mean = (1 + 2 + 4 + 5) / 4; // Mean of non-null values
    expect(meanImputed).toEqual([1, 2, mean, 4, 5]);
    
    // Test median imputation
    const medianImputed = featureTransformations.impute(data, { strategy: 'median' });
    
    const sorted = [1, 2, 4, 5].sort((a, b) => a - b);
    const median = (sorted[1] + sorted[2]) / 2; // Median of non-null values
    expect(medianImputed).toEqual([1, 2, median, 4, 5]);
    
    // Test constant imputation
    const constantImputed = featureTransformations.impute(data, { 
      strategy: 'constant', 
      fillValue: 99 
    });
    
    expect(constantImputed).toEqual([1, 2, 99, 4, 5]);
    
    // Test object imputation
    const objData = { a: 1, b: null, c: 3 };
    const objImputed = featureTransformations.impute(objData, { strategy: 'mean' });
    
    const objMean = (1 + 3) / 2;
    expect(objImputed).toEqual({ a: 1, b: objMean, c: 3 });
  });

  test('should handle edge cases and errors', () => {
    // Test normalization with non-numerical data
    expect(() => featureTransformations.normalize(['a', 'b', 'c']))
      .toThrow('All elements must be numbers for normalization');
    
    // Test log transform with negative values
    expect(() => featureTransformations.logTransform([-1, 0, 1]))
      .toThrow('All elements must be positive numbers for log transformation');
    
    // Test unsupported encoding method
    expect(() => featureTransformations.encode([1, 2, 3], { method: 'unsupported' }))
      .toThrow('Unsupported encoding method: unsupported');
    
    // Test unsupported imputation strategy
    expect(() => featureTransformations.impute([1, 2, 3], { strategy: 'unsupported' }))
      .toThrow('Unsupported imputation strategy: unsupported');
  });
});