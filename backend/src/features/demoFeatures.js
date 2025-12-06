#!/usr/bin/env node

/**
 * Feature Storage Demo Script
 * 
 * This script demonstrates the feature storage functionality with a realistic supply chain scenario.
 */

const featureStorage = require('./featureStorage');
const featureTransformations = require('./featureTransformations');
const featureVersioning = require('./featureVersioning');

async function demoFeatureStorage() {
  console.log('🚀 Starting Feature Storage Demo...\n');
  
  try {
    // Clear any existing data
    featureStorage.clear();
    featureVersioning.clear();
    
    console.log('✅ Feature storage cleared\n');
    
    // Demo: Store supply chain features
    console.log('🏪 Supply Chain Feature Storage Demo');
    console.log('-----------------------------------');
    
    // Store inventory levels feature
    const inventoryLevels = {
      'STORE-NYC-001': { sku_apple_iphone_15: 25, sku_samsung_galaxy_s24: 18, sku_google_pixel_8: 30 },
      'STORE-LA-001': { sku_apple_iphone_15: 32, sku_samsung_galaxy_s24: 22, sku_google_pixel_8: 28 },
      'STORE-CHI-001': { sku_apple_iphone_15: 19, sku_samsung_galaxy_s24: 15, sku_google_pixel_8: 35 }
    };
    
    featureStorage.storeFeature('store_inventory_levels', inventoryLevels, {
      description: 'Current inventory levels across stores',
      source: 'Inventory_management_system',
      unit: 'units',
      created_by: 'Supply_Chain_Optimization_Team'
    });
    console.log('📦 Stored store inventory levels feature');
    
    // Store sales data feature
    const salesData = [120, 150, 180, 140, 200, 250, 180, 160, 190, 220];
    featureStorage.storeFeature('weekly_sales_trend', salesData, {
      description: 'Weekly sales trend for flagship products',
      source: 'Point_of_Sale_System',
      unit: 'USD',
      timeframe: 'Last_10_weeks',
      created_by: 'Analytics_Team'
    });
    console.log('💰 Stored weekly sales trend feature');
    
    // Store supplier lead times
    const supplierLeadTimes = [3, 5, 2, 7, 4, 3, 6, 2, 4, 5];
    featureStorage.storeFeature('supplier_lead_times', supplierLeadTimes, {
      description: 'Historical supplier lead times',
      source: 'Procurement_System',
      unit: 'days',
      supplier_count: 10,
      created_by: 'Procurement_Team'
    });
    console.log('🚚 Stored supplier lead times feature\n');
    
    // Demo: Feature transformations
    console.log('⚙️ Feature Transformations Demo');
    console.log('----------------------------');
    
    // Register transformations
    featureStorage.registerTransformation('normalize', featureTransformations.normalize);
    featureStorage.registerTransformation('standardize', featureTransformations.standardize);
    featureStorage.registerTransformation('scale', featureTransformations.scale);
    featureStorage.registerTransformation('impute', featureTransformations.impute);
    
    console.log('✅ Registered transformation functions');
    
    // Apply normalization to sales data
    const normalizedSales = featureStorage.applyTransformation('weekly_sales_trend', 'normalize');
    console.log(`📈 Normalized sales data: [${normalizedSales.map(x => x.toFixed(2)).join(', ')}]`);
    
    // Apply standardization to supplier lead times
    const standardizedLeadTimes = featureStorage.applyTransformation('supplier_lead_times', 'standardize');
    console.log(`📊 Standardized lead times: [${standardizedLeadTimes.map(x => x.toFixed(2)).join(', ')}]`);
    
    // Apply scaling to sales data
    const scaledSales = featureStorage.applyTransformation('weekly_sales_trend', 'scale', { factor: 0.01 });
    console.log(`💼 Scaled sales data (¢ to $): [${scaledSales.join(', ')}]\n`);
    
    // Demo: Feature versioning
    console.log('🗂️ Feature Versioning Demo');
    console.log('----------------------');
    
    // Create versions of sales data
    featureVersioning.createVersion('weekly_sales_trend', salesData, {
      description: 'Initial sales data',
      version_notes: 'Baseline data from POS system',
      created_by: 'Analytics_Team'
    });
    console.log('📄 Created version 1 of weekly_sales_trend');
    
    // Simulate updated data with a new week
    const updatedSalesData = [...salesData, 240];
    featureVersioning.createVersion('weekly_sales_trend', updatedSalesData, {
      description: 'Sales data with additional week',
      version_notes: 'Includes latest week sales',
      created_by: 'Analytics_Team'
    });
    console.log('📄 Created version 2 of weekly_sales_trend');
    
    // Create versions of inventory levels
    featureVersioning.createVersion('store_inventory_levels', inventoryLevels, {
      description: 'Initial inventory levels',
      version_notes: 'Snapshot at beginning of month',
      created_by: 'Supply_Chain_Optimization_Team'
    });
    console.log('📄 Created version 1 of store_inventory_levels');
    
    // Get version history
    const salesVersionHistory = featureVersioning.listVersions('weekly_sales_trend');
    console.log(`📋 Sales data version history: ${salesVersionHistory.length} versions`);
    
    // Get latest version
    const latestSalesVersion = featureVersioning.getLatestVersion('weekly_sales_trend');
    console.log(`🆕 Latest sales data version: ${latestSalesVersion.version}`);
    
    // Compare versions
    const versionComparison = featureVersioning.compareVersions('weekly_sales_trend', 1, 2);
    console.log(`🔄 Version comparison: data changed = ${versionComparison.dataChanged}`);
    
    // Demo: List features and transformations
    console.log('\n📋 Feature and Transformation Summary');
    console.log('---------------------------------');
    
    const features = featureStorage.listFeatures();
    console.log(`📂 Stored features: ${features.join(', ')}`);
    
    const transformations = featureStorage.listTransformations();
    console.log(`🔧 Available transformations: ${transformations.join(', ')}`);
    
    // Demo: Storage statistics
    console.log('\n📊 Storage Statistics');
    console.log('------------------');
    
    const stats = featureStorage.getStats();
    console.log(`📈 Feature storage stats: ${JSON.stringify(stats)}`);
    
    const versionStats = featureVersioning.getStats();
    console.log(`🗂️ Feature versioning stats: ${JSON.stringify(versionStats)}`);
    
    console.log('\n🎉 Feature storage demo completed successfully!');
    console.log('💡 This demonstrates a complete feature storage workflow for supply chain analytics.');
    
  } catch (error) {
    console.error('❌ Feature storage demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if script is executed directly
if (require.main === module) {
  demoFeatureStorage();
}

module.exports = { demoFeatureStorage };