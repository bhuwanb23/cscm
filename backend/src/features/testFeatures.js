#!/usr/bin/env node

/**
 * Feature Storage Test Script
 * 
 * This script tests the feature storage functionality.
 */

const featureStorage = require('./featureStorage');
const featureTransformations = require('./featureTransformations');
const featureVersioning = require('./featureVersioning');

async function testFeatureStorage() {
  console.log('🧪 Testing Feature Storage...\n');
  
  try {
    // Clear any existing data
    featureStorage.clear();
    featureVersioning.clear();
    
    console.log('✅ Feature storage cleared\n');
    
    // Test 1: Store features
    console.log('📝 Test 1: Storing Features');
    
    // Store a simple numerical feature
    const salesData = [100, 150, 200, 175, 300, 250];
    featureStorage.storeFeature('sales_data', salesData, {
      description: 'Weekly sales data',
      source: 'POS_system',
      unit: 'USD'
    });
    console.log('  ✓ Stored sales_data feature');
    
    // Store a complex object feature
    const storeProfile = {
      store_id: 'STORE-001',
      location: 'New York',
      size: 5000,
      staff_count: 25,
      opening_hours: '9AM-9PM'
    };
    featureStorage.storeFeature('store_profile', storeProfile, {
      description: 'Store profile information',
      source: 'Store_database'
    });
    console.log('  ✓ Stored store_profile feature');
    
    // Store a categorical feature
    const productCategories = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'];
    featureStorage.storeFeature('product_categories', productCategories, {
      description: 'Product categories',
      source: 'Product_catalog'
    });
    console.log('  ✓ Stored product_categories feature\n');
    
    // Test 2: Retrieve features
    console.log('🔍 Test 2: Retrieving Features');
    
    const retrievedSales = featureStorage.getFeature('sales_data');
    console.log(`  ✓ Retrieved sales_data: ${JSON.stringify(retrievedSales.data)}`);
    
    const retrievedProfile = featureStorage.getFeature('store_profile');
    console.log(`  ✓ Retrieved store_profile: ${JSON.stringify(retrievedProfile.data)}`);
    
    // Test 3: Update features
    console.log('\n✏️ Test 3: Updating Features');
    
    // Update sales data
    const updatedSalesData = [...salesData, 400]; // Add new week
    featureStorage.updateFeature('sales_data', updatedSalesData, {
      description: 'Weekly sales data (updated)',
      last_updated_by: 'test_script'
    });
    console.log('  ✓ Updated sales_data feature');
    
    // Test 4: Feature transformations
    console.log('\n⚙️ Test 4: Feature Transformations');
    
    // Register transformations
    featureStorage.registerTransformation('normalize', featureTransformations.normalize);
    featureStorage.registerTransformation('standardize', featureTransformations.standardize);
    featureStorage.registerTransformation('scale', featureTransformations.scale);
    
    console.log('  ✓ Registered transformation functions');
    
    // Apply normalization to sales data
    const normalizedSales = featureStorage.applyTransformation('sales_data', 'normalize');
    console.log(`  ✓ Applied normalization: ${JSON.stringify(normalizedSales)}`);
    
    // Apply standardization to sales data
    const standardizedSales = featureStorage.applyTransformation('sales_data', 'standardize');
    console.log(`  ✓ Applied standardization: ${JSON.stringify(standardizedSales.slice(0, 3))}...`);
    
    // Apply scaling to sales data
    const scaledSales = featureStorage.applyTransformation('sales_data', 'scale', { factor: 0.1 });
    console.log(`  ✓ Applied scaling (0.1x): ${JSON.stringify(scaledSales)}`);
    
    // Test 5: Feature versioning
    console.log('\n🗂️ Test 5: Feature Versioning');
    
    // Create versions
    featureVersioning.createVersion('sales_data', salesData, {
      description: 'Initial sales data',
      createdBy: 'test_script'
    });
    console.log('  ✓ Created version 1 of sales_data');
    
    featureVersioning.createVersion('sales_data', updatedSalesData, {
      description: 'Sales data with additional week',
      createdBy: 'test_script'
    });
    console.log('  ✓ Created version 2 of sales_data');
    
    // Get version history
    const versionHistory = featureVersioning.listVersions('sales_data');
    console.log(`  ✓ Retrieved version history (${versionHistory.length} versions)`);
    
    // Get latest version
    const latestVersion = featureVersioning.getLatestVersion('sales_data');
    console.log(`  ✓ Latest version: ${latestVersion.version}`);
    
    // Compare versions
    const comparison = featureVersioning.compareVersions('sales_data', 1, 2);
    console.log(`  ✓ Compared versions: data changed = ${comparison.dataChanged}`);
    
    // Test 6: List features and transformations
    console.log('\n📋 Test 6: Listing Features and Transformations');
    
    const features = featureStorage.listFeatures();
    console.log(`  ✓ Features: ${features.join(', ')}`);
    
    const transformations = featureStorage.listTransformations();
    console.log(`  ✓ Transformations: ${transformations.join(', ')}`);
    
    // Test 7: Storage statistics
    console.log('\n📊 Test 7: Storage Statistics');
    
    const stats = featureStorage.getStats();
    console.log(`  ✓ Storage stats: ${JSON.stringify(stats)}`);
    
    const versionStats = featureVersioning.getStats();
    console.log(`  ✓ Versioning stats: ${JSON.stringify(versionStats)}`);
    
    console.log('\n🎉 All feature storage tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Feature storage test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testFeatureStorage();
}

module.exports = { testFeatureStorage };