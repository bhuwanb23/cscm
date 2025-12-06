# Feature Storage System

## Overview
The Feature Storage system provides in-memory storage for machine learning features with transformation capabilities and versioning support. This system is designed for local development and testing of ML models within the CSCM backend.

## Components

### 1. Feature Storage (`featureStorage.js`)
Manages in-memory storage of features with CRUD operations and transformation capabilities.

#### Key Methods:
- `storeFeature(featureName, data, metadata)`: Store a feature in memory
- `getFeature(featureName)`: Retrieve a feature from memory
- `updateFeature(featureName, data, metadata)`: Update an existing feature
- `deleteFeature(featureName)`: Delete a feature from memory
- `listFeatures()`: List all stored features
- `registerTransformation(transformName, transformFn)`: Register a transformation function
- `applyTransformation(featureName, transformName, params)`: Apply a transformation to a feature
- `listTransformations()`: List all registered transformations
- `clear()`: Clear all stored features and transformations
- `getStats()`: Get storage statistics

### 2. Feature Transformations (`featureTransformations.js`)
Provides common feature transformation functions for data preprocessing.

#### Available Transformations:
- `normalize(data, params)`: Normalize numerical values to 0-1 range
- `standardize(data, params)`: Standardize values using z-score normalization
- `scale(data, params)`: Scale values by a factor
- `logTransform(data, params)`: Apply logarithmic transformation
- `binning(data, params)`: Bin numerical values into discrete categories
- `encode(data, params)`: Encode categorical values (label or one-hot)
- `impute(data, params)`: Impute missing values (mean, median, mode, constant)

### 3. Feature Versioning (`featureVersioning.js`)
Manages versioning of features with metadata tracking.

#### Key Methods:
- `createVersion(featureName, data, metadata)`: Create a new version of a feature
- `getVersion(featureName, version)`: Get a specific version of a feature
- `getLatestVersion(featureName)`: Get the latest version of a feature
- `listVersions(featureName)`: List all versions of a feature
- `compareVersions(featureName, version1, version2)`: Compare two versions
- `getVersionMetadata(featureName)`: Get version metadata for a feature
- `deleteVersion(featureName, version)`: Delete a specific version
- `deleteFeatureVersions(featureName)`: Delete all versions of a feature
- `getStats()`: Get versioning statistics
- `clear()`: Clear all versioning data

## Usage Examples

### Storing Features
```javascript
const featureStorage = require('./features/featureStorage');

// Store sales data
const salesData = [100, 150, 200, 175, 300, 250];
featureStorage.storeFeature('weekly_sales', salesData, {
  description: 'Weekly sales data',
  source: 'POS_system',
  unit: 'USD'
});
```

### Applying Transformations
```javascript
const featureTransformations = require('./features/featureTransformations');

// Register and apply normalization
featureStorage.registerTransformation('normalize', featureTransformations.normalize);
const normalizedSales = featureStorage.applyTransformation('weekly_sales', 'normalize');
```

### Versioning Features
```javascript
const featureVersioning = require('./features/featureVersioning');

// Create versions
featureVersioning.createVersion('weekly_sales', salesData, {
  description: 'Initial sales data',
  createdBy: 'data_scientist'
});

featureVersioning.createVersion('weekly_sales', updatedSalesData, {
  description: 'Sales data with seasonal adjustment',
  createdBy: 'data_scientist'
});
```

## Testing
Run the feature storage tests with:
```bash
npm run test-features
```

Or run individual test suites:
```bash
npm test src/tests/features/featureStorage.test.js
npm test src/tests/features/featureTransformations.test.js
npm test src/tests/features/featureVersioning.test.js
```

## Best Practices

1. **Feature Naming**: Use descriptive, consistent names for features
2. **Metadata**: Always include relevant metadata with features
3. **Versioning**: Version features when significant changes occur
4. **Transformations**: Apply transformations consistently across training and inference
5. **Memory Management**: Clear storage when no longer needed to free memory
6. **Error Handling**: Always handle potential errors when working with features

## Limitations

1. **In-Memory Only**: Features are stored in memory and will be lost when the process exits
2. **Single Process**: Not suitable for distributed systems (use a database for production)
3. **Limited Persistence**: No built-in persistence mechanism (intended for local development)

## Next Steps

For production use, consider:
1. Replacing in-memory storage with a persistent database
2. Adding distributed caching for multi-process environments
3. Implementing more advanced versioning with diffs
4. Adding feature lineage tracking
5. Integrating with ML model registry systems