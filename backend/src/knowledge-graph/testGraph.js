#!/usr/bin/env node

/**
 * Knowledge Graph Test Script
 * 
 * This script tests the knowledge graph functionality.
 */

const knowledgeGraph = require('./graphStructure');
const entityModels = require('./entityModels');
const graphAlgorithms = require('./graphAlgorithms');

async function testKnowledgeGraph() {
  console.log('🧪 Testing Knowledge Graph...\n');
  
  try {
    // Clear any existing data
    knowledgeGraph.clear();
    
    console.log('✅ Knowledge graph cleared\n');
    
    // Test 1: Create entities
    console.log('📝 Test 1: Creating Entities');
    
    // Create SKUs
    entityModels.createSKU('SKU-APPLE-IPHONE-15', {
      name: 'Apple iPhone 15',
      category: 'Electronics',
      price: 999.99
    });
    console.log('  ✓ Created SKU: Apple iPhone 15');
    
    entityModels.createSKU('SKU-SAMSUNG-GALAXY-S24', {
      name: 'Samsung Galaxy S24',
      category: 'Electronics',
      price: 899.99
    });
    console.log('  ✓ Created SKU: Samsung Galaxy S24');
    
    entityModels.createSKU('SKU-GOOGLE-PIXEL-8', {
      name: 'Google Pixel 8',
      category: 'Electronics',
      price: 799.99
    });
    console.log('  ✓ Created SKU: Google Pixel 8');
    
    // Create Stores
    entityModels.createStore('STORE-NYC-001', {
      name: 'NYC Flagship Store',
      location: 'New York, NY',
      capacity: 5000
    });
    console.log('  ✓ Created Store: NYC Flagship Store');
    
    entityModels.createStore('STORE-LA-001', {
      name: 'LA Downtown Store',
      location: 'Los Angeles, CA',
      capacity: 3000
    });
    console.log('  ✓ Created Store: LA Downtown Store');
    
    // Create Suppliers
    entityModels.createSupplier('SUPPLIER-TECH-ELECTRONICS', {
      name: 'Tech Electronics Distributors',
      contact: 'contact@techelectronics.com',
      leadTime: 3
    });
    console.log('  ✓ Created Supplier: Tech Electronics Distributors');
    
    entityModels.createSupplier('SUPPLIER-MOBILE-WORLD', {
      name: 'Mobile World Supply',
      contact: 'orders@mobileworld.com',
      leadTime: 5
    });
    console.log('  ✓ Created Supplier: Mobile World Supply\n');
    
    // Test 2: Create relationships
    console.log('🔗 Test 2: Creating Relationships');
    
    // Create SKU-Store relationships (inventory)
    entityModels.createSKUStoreRelationship('SKU-APPLE-IPHONE-15', 'STORE-NYC-001', {
      quantity: 25,
      minStock: 10,
      maxStock: 50
    });
    console.log('  ✓ Created relationship: Apple iPhone 15 stocked at NYC Flagship Store');
    
    entityModels.createSKUStoreRelationship('SKU-SAMSUNG-GALAXY-S24', 'STORE-NYC-001', {
      quantity: 20,
      minStock: 10,
      maxStock: 40
    });
    console.log('  ✓ Created relationship: Samsung Galaxy S24 stocked at NYC Flagship Store');
    
    entityModels.createSKUStoreRelationship('SKU-GOOGLE-PIXEL-8', 'STORE-LA-001', {
      quantity: 30,
      minStock: 15,
      maxStock: 50
    });
    console.log('  ✓ Created relationship: Google Pixel 8 stocked at LA Downtown Store');
    
    // Create Store-Supplier relationships (procurement)
    entityModels.createStoreSupplierRelationship('STORE-NYC-001', 'SUPPLIER-TECH-ELECTRONICS', {
      preferred: true
    });
    console.log('  ✓ Created relationship: NYC Flagship Store procures from Tech Electronics Distributors');
    
    entityModels.createStoreSupplierRelationship('STORE-LA-001', 'SUPPLIER-MOBILE-WORLD', {
      preferred: true
    });
    console.log('  ✓ Created relationship: LA Downtown Store procures from Mobile World Supply');
    
    // Create SKU-Supplier relationships (supply)
    entityModels.createSKUSupplierRelationship('SKU-APPLE-IPHONE-15', 'SUPPLIER-TECH-ELECTRONICS', {
      cost: 799.99,
      leadTime: 3
    });
    console.log('  ✓ Created relationship: Apple iPhone 15 supplied by Tech Electronics Distributors');
    
    entityModels.createSKUSupplierRelationship('SKU-SAMSUNG-GALAXY-S24', 'SUPPLIER-MOBILE-WORLD', {
      cost: 699.99,
      leadTime: 5
    });
    console.log('  ✓ Created relationship: Samsung Galaxy S24 supplied by Mobile World Supply\n');
    
    // Test 3: Query relationships
    console.log('🔍 Test 3: Querying Relationships');
    
    // Get SKUs at NYC store
    const nycSkus = entityModels.getSKUsAtStore('STORE-NYC-001');
    console.log(`  ✓ SKUs at NYC Flagship Store: ${nycSkus.length}`);
    
    // Get stores with Apple iPhone 15
    const appleStores = entityModels.getStoresWithSKU('SKU-APPLE-IPHONE-15');
    console.log(`  ✓ Stores with Apple iPhone 15: ${appleStores.length}`);
    
    // Get suppliers for NYC store
    const nycSuppliers = entityModels.getSuppliersForStore('STORE-NYC-001');
    console.log(`  ✓ Suppliers for NYC Flagship Store: ${nycSuppliers.length}`);
    
    // Get suppliers for Apple iPhone 15
    const appleSuppliers = entityModels.getSuppliersForSKU('SKU-APPLE-IPHONE-15');
    console.log(`  ✓ Suppliers for Apple iPhone 15: ${appleSuppliers.length}\n`);
    
    // Test 4: Graph algorithms
    console.log('🧮 Test 4: Graph Algorithms');
    
    // Calculate centrality
    const centrality = graphAlgorithms.calculateCentrality();
    console.log(`  ✓ Calculated centrality for ${Object.keys(centrality).length} entities`);
    
    // Find most central entities
    const centralEntities = graphAlgorithms.findMostCentralEntities(3);
    console.log(`  ✓ Found ${centralEntities.length} most central entities`);
    
    // Find connected components
    const components = graphAlgorithms.findConnectedComponents();
    console.log(`  ✓ Found ${components.length} connected components`);
    
    // Find isolated entities
    const isolated = graphAlgorithms.findIsolatedEntities();
    console.log(`  ✓ Found ${isolated.length} isolated entities`);
    
    // Analyze supply chain clusters
    const clusters = graphAlgorithms.analyzeSupplyChainClusters();
    console.log(`  ✓ Analyzed ${clusters.length} supply chain clusters`);
    
    // Generate network summary
    const summary = graphAlgorithms.generateNetworkSummary();
    console.log(`  ✓ Generated network summary: ${JSON.stringify(summary.basicStats)}`);
    
    // Test 5: Graph statistics
    console.log('\n📊 Test 5: Graph Statistics');
    
    const stats = knowledgeGraph.getStats();
    console.log(`  ✓ Graph stats: ${JSON.stringify(stats)}`);
    
    // Test 6: Serialization
    console.log('\n💾 Test 6: Graph Serialization');
    
    const serialized = knowledgeGraph.toJSON();
    console.log(`  ✓ Serialized graph: ${serialized.nodes.length} nodes, ${serialized.edges.length} edges`);
    
    // Clear and load from JSON
    knowledgeGraph.clear();
    knowledgeGraph.fromJSON(serialized);
    console.log('  ✓ Cleared and reloaded graph from JSON');
    
    const restoredStats = knowledgeGraph.getStats();
    console.log(`  ✓ Restored graph stats: ${JSON.stringify(restoredStats)}`);
    
    console.log('\n🎉 All knowledge graph tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Knowledge graph test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testKnowledgeGraph();
}

module.exports = { testKnowledgeGraph };