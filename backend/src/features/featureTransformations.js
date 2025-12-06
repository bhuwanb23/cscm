/**
 * Feature Transformations
 * 
 * This module provides simple feature transformation functions for the CSCM backend.
 * These transformations can be applied to features stored in the feature storage.
 */

const logger = require('../utils/logger');

/**
 * Normalize numerical feature values to a range between 0 and 1
 * @param {Array|Object} data - Feature data to normalize
 * @param {Object} params - Normalization parameters
 * @returns {Array|Object} Normalized data
 */
function normalize(data, params = {}) {
  try {
    // Handle array of numbers
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Check if all elements are numbers
      const allNumbers = data.every(val => typeof val === 'number' && !isNaN(val));
      if (!allNumbers) {
        throw new Error('All elements must be numbers for normalization');
      }
      
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      
      if (range === 0) {
        // All values are the same, return array of zeros
        return data.map(() => 0);
      }
      
      return data.map(val => (val - min) / range);
    }
    
    // Handle object with numerical properties
    if (typeof data === 'object' && data !== null) {
      const result = {};
      const values = Object.values(data).filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length === 0) return data;
      
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      if (range === 0) {
        // All values are the same
        for (const [key, val] of Object.entries(data)) {
          result[key] = typeof val === 'number' && !isNaN(val) ? 0 : val;
        }
        return result;
      }
      
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'number' && !isNaN(val)) {
          result[key] = (val - min) / range;
        } else {
          result[key] = val;
        }
      }
      
      return result;
    }
    
    // Handle single number
    if (typeof data === 'number' && !isNaN(data)) {
      return data; // Single value normalization doesn't make sense without context
    }
    
    throw new Error('Unsupported data type for normalization');
  } catch (error) {
    logger.error('Normalization failed:', error.message);
    throw error;
  }
}

/**
 * Standardize numerical feature values (z-score normalization)
 * @param {Array|Object} data - Feature data to standardize
 * @param {Object} params - Standardization parameters
 * @returns {Array|Object} Standardized data
 */
function standardize(data, params = {}) {
  try {
    // Handle array of numbers
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Check if all elements are numbers
      const allNumbers = data.every(val => typeof val === 'number' && !isNaN(val));
      if (!allNumbers) {
        throw new Error('All elements must be numbers for standardization');
      }
      
      // Calculate mean
      const sum = data.reduce((acc, val) => acc + val, 0);
      const mean = sum / data.length;
      
      // Calculate standard deviation
      const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
      const stdDev = Math.sqrt(variance);
      
      if (stdDev === 0) {
        // All values are the same, return array of zeros
        return data.map(() => 0);
      }
      
      return data.map(val => (val - mean) / stdDev);
    }
    
    // Handle object with numerical properties
    if (typeof data === 'object' && data !== null) {
      const values = Object.values(data).filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length === 0) return data;
      
      // Calculate mean
      const sum = values.reduce((acc, val) => acc + val, 0);
      const mean = sum / values.length;
      
      // Calculate standard deviation
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const result = {};
      
      if (stdDev === 0) {
        // All values are the same
        for (const [key, val] of Object.entries(data)) {
          result[key] = typeof val === 'number' && !isNaN(val) ? 0 : val;
        }
        return result;
      }
      
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'number' && !isNaN(val)) {
          result[key] = (val - mean) / stdDev;
        } else {
          result[key] = val;
        }
      }
      
      return result;
    }
    
    // Handle single number
    if (typeof data === 'number' && !isNaN(data)) {
      return data; // Single value standardization doesn't make sense without context
    }
    
    throw new Error('Unsupported data type for standardization');
  } catch (error) {
    logger.error('Standardization failed:', error.message);
    throw error;
  }
}

/**
 * Scale numerical feature values by a factor
 * @param {Array|Object} data - Feature data to scale
 * @param {Object} params - Scaling parameters (factor)
 * @returns {Array|Object} Scaled data
 */
function scale(data, params = {}) {
  try {
    const factor = params.factor || 1;
    
    // Handle array of numbers
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Check if all elements are numbers
      const allNumbers = data.every(val => typeof val === 'number' && !isNaN(val));
      if (!allNumbers) {
        throw new Error('All elements must be numbers for scaling');
      }
      
      return data.map(val => val * factor);
    }
    
    // Handle object with numerical properties
    if (typeof data === 'object' && data !== null) {
      const result = {};
      
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'number' && !isNaN(val)) {
          result[key] = val * factor;
        } else {
          result[key] = val;
        }
      }
      
      return result;
    }
    
    // Handle single number
    if (typeof data === 'number' && !isNaN(data)) {
      return data * factor;
    }
    
    throw new Error('Unsupported data type for scaling');
  } catch (error) {
    logger.error('Scaling failed:', error.message);
    throw error;
  }
}

/**
 * Log transform numerical feature values
 * @param {Array|Object} data - Feature data to log transform
 * @param {Object} params - Log transformation parameters (base)
 * @returns {Array|Object} Log transformed data
 */
function logTransform(data, params = {}) {
  try {
    const base = params.base || Math.E; // Natural log by default
    const logFn = base === Math.E ? Math.log : (val) => Math.log(val) / Math.log(base);
    
    // Handle array of numbers
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Check if all elements are positive numbers
      const allPositiveNumbers = data.every(val => typeof val === 'number' && !isNaN(val) && val > 0);
      if (!allPositiveNumbers) {
        throw new Error('All elements must be positive numbers for log transformation');
      }
      
      return data.map(val => logFn(val));
    }
    
    // Handle object with numerical properties
    if (typeof data === 'object' && data !== null) {
      const result = {};
      
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'number' && !isNaN(val) && val > 0) {
          result[key] = logFn(val);
        } else if (typeof val === 'number' && !isNaN(val) && val <= 0) {
          throw new Error(`Log transformation requires positive values. Found: ${val} for key ${key}`);
        } else {
          result[key] = val;
        }
      }
      
      return result;
    }
    
    // Handle single positive number
    if (typeof data === 'number' && !isNaN(data) && data > 0) {
      return logFn(data);
    } else if (typeof data === 'number' && !isNaN(data) && data <= 0) {
      throw new Error(`Log transformation requires positive values. Found: ${data}`);
    }
    
    throw new Error('Unsupported data type for log transformation');
  } catch (error) {
    logger.error('Log transformation failed:', error.message);
    throw error;
  }
}

/**
 * Bin numerical feature values into discrete categories
 * @param {Array|Object} data - Feature data to bin
 * @param {Object} params - Binning parameters (bins, labels)
 * @returns {Array|Object} Binned data
 */
function binning(data, params = {}) {
  try {
    const bins = params.bins || 5;
    const labels = params.labels || null;
    
    // Handle array of numbers
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Check if all elements are numbers
      const allNumbers = data.every(val => typeof val === 'number' && !isNaN(val));
      if (!allNumbers) {
        throw new Error('All elements must be numbers for binning');
      }
      
      // Calculate min and max
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      
      if (range === 0) {
        // All values are the same
        const label = labels && labels[0] ? labels[0] : 0;
        return data.map(() => label);
      }
      
      // Calculate bin width
      const binWidth = range / bins;
      
      // Assign bins
      return data.map(val => {
        const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
        return labels && labels[binIndex] ? labels[binIndex] : binIndex;
      });
    }
    
    // Handle object with numerical properties
    if (typeof data === 'object' && data !== null) {
      const values = Object.values(data).filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length === 0) return data;
      
      // Calculate min and max
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      const result = {};
      
      if (range === 0) {
        // All values are the same
        const label = labels && labels[0] ? labels[0] : 0;
        for (const [key, val] of Object.entries(data)) {
          if (typeof val === 'number' && !isNaN(val)) {
            result[key] = label;
          } else {
            result[key] = val;
          }
        }
        return result;
      }
      
      // Calculate bin width
      const binWidth = range / bins;
      
      // Assign bins
      for (const [key, val] of Object.entries(data)) {
        if (typeof val === 'number' && !isNaN(val)) {
          const binIndex = Math.min(Math.floor((val - min) / binWidth), bins - 1);
          result[key] = labels && labels[binIndex] ? labels[binIndex] : binIndex;
        } else {
          result[key] = val;
        }
      }
      
      return result;
    }
    
    // Handle single number
    if (typeof data === 'number' && !isNaN(data)) {
      // For a single value, we can't really bin it meaningfully without context
      return data;
    }
    
    throw new Error('Unsupported data type for binning');
  } catch (error) {
    logger.error('Binning failed:', error.message);
    throw error;
  }
}

/**
 * Encode categorical feature values
 * @param {Array|Object} data - Feature data to encode
 * @param {Object} params - Encoding parameters (method)
 * @returns {Array|Object} Encoded data
 */
function encode(data, params = {}) {
  try {
    const method = params.method || 'label'; // 'label' or 'onehot'
    
    // Handle array of values
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      if (method === 'label') {
        // Label encoding: assign a unique integer to each unique value
        const uniqueValues = [...new Set(data)];
        const valueToLabel = {};
        uniqueValues.forEach((val, index) => {
          valueToLabel[val] = index;
        });
        
        return data.map(val => valueToLabel[val]);
      } else if (method === 'onehot') {
        // One-hot encoding: create binary columns for each unique value
        const uniqueValues = [...new Set(data)];
        const valueToIndex = {};
        uniqueValues.forEach((val, index) => {
          valueToIndex[val] = index;
        });
        
        return data.map(val => {
          const encoded = new Array(uniqueValues.length).fill(0);
          encoded[valueToIndex[val]] = 1;
          return encoded;
        });
      } else {
        throw new Error(`Unsupported encoding method: ${method}`);
      }
    }
    
    // Handle object with properties
    if (typeof data === 'object' && data !== null) {
      if (method === 'label') {
        // Label encoding for object values
        const allValues = Object.values(data);
        const uniqueValues = [...new Set(allValues)];
        const valueToLabel = {};
        uniqueValues.forEach((val, index) => {
          valueToLabel[val] = index;
        });
        
        const result = {};
        for (const [key, val] of Object.entries(data)) {
          result[key] = valueToLabel[val];
        }
        return result;
      } else if (method === 'onehot') {
        // One-hot encoding for object values
        const allValues = Object.values(data);
        const uniqueValues = [...new Set(allValues)];
        const valueToIndex = {};
        uniqueValues.forEach((val, index) => {
          valueToIndex[val] = index;
        });
        
        const result = {};
        for (const [key, val] of Object.entries(data)) {
          const encoded = new Array(uniqueValues.length).fill(0);
          encoded[valueToIndex[val]] = 1;
          result[key] = encoded;
        }
        return result;
      } else {
        throw new Error(`Unsupported encoding method: ${method}`);
      }
    }
    
    // Handle single value
    if (method === 'label') {
      return 0; // Single value gets label 0
    } else if (method === 'onehot') {
      return [1]; // Single value gets one-hot encoding [1]
    } else {
      throw new Error(`Unsupported encoding method: ${method}`);
    }
  } catch (error) {
    logger.error('Encoding failed:', error.message);
    throw error;
  }
}

/**
 * Impute missing values in feature data
 * @param {Array|Object} data - Feature data with missing values
 * @param {Object} params - Imputation parameters (strategy, fillValue)
 * @returns {Array|Object} Data with imputed values
 */
function impute(data, params = {}) {
  try {
    const strategy = params.strategy || 'mean'; // 'mean', 'median', 'mode', 'constant'
    const fillValue = params.fillValue || 0;
    
    // Handle array of values
    if (Array.isArray(data)) {
      if (data.length === 0) return data;
      
      // Filter out null/undefined values for calculations
      const validValues = data.filter(val => val !== null && val !== undefined);
      
      if (validValues.length === 0) {
        // All values are missing, fill with constant
        return data.map(() => fillValue);
      }
      
      let fillVal;
      
      if (strategy === 'mean') {
        const sum = validValues.reduce((acc, val) => {
          if (typeof val !== 'number' || isNaN(val)) {
            throw new Error('Mean imputation requires numerical values');
          }
          return acc + val;
        }, 0);
        fillVal = sum / validValues.length;
      } else if (strategy === 'median') {
        if (validValues.some(val => typeof val !== 'number' || isNaN(val))) {
          throw new Error('Median imputation requires numerical values');
        }
        const sorted = [...validValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        fillVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      } else if (strategy === 'mode') {
        const frequency = {};
        validValues.forEach(val => {
          frequency[val] = (frequency[val] || 0) + 1;
        });
        fillVal = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
      } else if (strategy === 'constant') {
        fillVal = fillValue;
      } else {
        throw new Error(`Unsupported imputation strategy: ${strategy}`);
      }
      
      return data.map(val => (val === null || val === undefined) ? fillVal : val);
    }
    
    // Handle object with properties
    if (typeof data === 'object' && data !== null) {
      // Filter out null/undefined values for calculations
      const validEntries = Object.entries(data).filter(([_, val]) => val !== null && val !== undefined);
      const validValues = validEntries.map(([_, val]) => val);
      
      let fillVal;
      
      if (validValues.length === 0) {
        // All values are missing, fill with constant
        fillVal = fillValue;
      } else if (strategy === 'mean') {
        const numericValues = validValues.filter(val => typeof val === 'number' && !isNaN(val));
        if (numericValues.length === 0) {
          throw new Error('Mean imputation requires numerical values');
        }
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        fillVal = sum / numericValues.length;
      } else if (strategy === 'median') {
        const numericValues = validValues.filter(val => typeof val === 'number' && !isNaN(val));
        if (numericValues.length === 0) {
          throw new Error('Median imputation requires numerical values');
        }
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        fillVal = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      } else if (strategy === 'mode') {
        const frequency = {};
        validValues.forEach(val => {
          frequency[val] = (frequency[val] || 0) + 1;
        });
        fillVal = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
      } else if (strategy === 'constant') {
        fillVal = fillValue;
      } else {
        throw new Error(`Unsupported imputation strategy: ${strategy}`);
      }
      
      const result = {};
      for (const [key, val] of Object.entries(data)) {
        result[key] = (val === null || val === undefined) ? fillVal : val;
      }
      return result;
    }
    
    // Handle single value
    if (data === null || data === undefined) {
      return fillValue;
    }
    
    return data;
  } catch (error) {
    logger.error('Imputation failed:', error.message);
    throw error;
  }
}

// Export all transformation functions
module.exports = {
  normalize,
  standardize,
  scale,
  logTransform,
  binning,
  encode,
  impute
};