const graphAlgorithms = require('../../knowledge-graph/graphAlgorithms');
const knowledgeGraph = require('../../knowledge-graph/graphStructure');
const entityModels = require('../../knowledge-graph/entityModels');

describe('Graph Algorithms Tests', () => {
  beforeEach(() => {
    // Clear the knowledge graph before each test
    knowledgeGraph.clear();
  });

  test('should export graphAlgorithms', () => {
    expect(graphAlgorithms).toBeDefined();
    expect(typeof graphAlgorithms.findConnectedComponents).toBe('function');
    expect(typeof graphAlgorithms.calculateCentrality).toBe('function');
    expect(typeof graphAlgorithms.findMostCentralEntities).toBe('function');
    expect(typeof graphAlgorithms.findIsolatedEntities).toBe('function');
    expect(typeof graphAlgorithms.findBridgeEntities).toBe('function');
    expect(typeof graphAlgorithms.analyzeSupplyChainClusters).toBe('function');
    expect(typeof graphAlgorithms.findCriticalPaths).toBe('function');
    expect(typeof graphAlgorithms.generateNetworkSummary).toBe('function');
  });

  test('should find connected components', () => {
    // Create a connected component
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');

    // Find connected components
    const components = graphAlgorithms.findConnectedComponents();

    // Should have one connected component with 3 entities
    expect(components).toHaveLength(1);
    expect(components[0]).toHaveLength(3);
    expect(components[0]).toEqual(expect.arrayContaining(['SKU-TEST-001', 'STORE-TEST-001', 'SUPPLIER-TEST-001']));
  });

  test('should calculate centrality', () => {
    // Create entities with different connection patterns
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    
    // SKU connects to both store and supplier (higher centrality)
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    
    // Calculate centrality
    const centrality = graphAlgorithms.calculateCentrality();

    // SKU should have higher centrality than store and supplier
    expect(centrality['SKU-TEST-001'].degree).toBeGreaterThan(centrality['STORE-TEST-001'].degree);
    expect(centrality['SKU-TEST-001'].degree).toBeGreaterThan(centrality['SUPPLIER-TEST-001'].degree);
  });

  test('should find most central entities', () => {
    // Create entities with different connection patterns
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    
    // SKU connects to both store and supplier (higher centrality)
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    
    // Find most central entities
    const centralEntities = graphAlgorithms.findMostCentralEntities(2);

    // Should return 2 entities, with SKU being the most central
    expect(centralEntities).toHaveLength(2);
    expect(centralEntities[0].id).toBe('SKU-TEST-001');
  });

  test('should find isolated entities', () => {
    // Create connected entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    
    // Create isolated entity
    entityModels.createSupplier('SUPPLIER-TEST-001');

    // Find isolated entities
    const isolated = graphAlgorithms.findIsolatedEntities();

    // Should find one isolated entity (the supplier)
    expect(isolated).toHaveLength(1);
    expect(isolated[0].id).toBe('SUPPLIER-TEST-001');
  });

  test('should find bridge entities', () => {
    // Create entities that form a bridge-like structure
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    
    // SKU connects to both store and supplier (acting as a bridge)
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    
    // Find bridge entities
    const bridges = graphAlgorithms.findBridgeEntities();

    // SKU should be identified as a bridge entity
    expect(bridges.some(bridge => bridge.id === 'SKU-TEST-001')).toBe(true);
  });

  test('should analyze supply chain clusters', () => {
    // Create a supply chain cluster
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');

    // Analyze clusters
    const clusters = graphAlgorithms.analyzeSupplyChainClusters();

    // Should have one cluster with 3 entities
    expect(clusters).toHaveLength(1);
    expect(clusters[0].size).toBe(3);
    expect(clusters[0].entityTypes).toEqual({ sku: 1, store: 1, supplier: 1 });
  });

  test('should find critical paths', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    
    // Create relationships
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');

    // Find critical paths from SKU to supplier
    const paths = graphAlgorithms.findCriticalPaths('sku', 'supplier');

    // Should find at least one path
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  test('should generate network summary', () => {
    // Create a small network
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');

    // Generate network summary
    const summary = graphAlgorithms.generateNetworkSummary();

    // Check that summary contains expected sections
    expect(summary).toHaveProperty('basicStats');
    expect(summary).toHaveProperty('networkMetrics');
    expect(summary).toHaveProperty('keyEntities');
    expect(summary).toHaveProperty('supplyChainInsights');

    // Check basic stats
    expect(summary.basicStats.nodeCount).toBe(3);
    expect(summary.basicStats.edgeCount).toBe(2);
  });

  test('should handle empty graph gracefully', () => {
    // Test all algorithms on empty graph
    const components = graphAlgorithms.findConnectedComponents();
    expect(components).toHaveLength(0);

    const centrality = graphAlgorithms.calculateCentrality();
    expect(Object.keys(centrality)).toHaveLength(0);

    const isolated = graphAlgorithms.findIsolatedEntities();
    expect(isolated).toHaveLength(0);

    const bridges = graphAlgorithms.findBridgeEntities();
    expect(bridges).toHaveLength(0);

    const clusters = graphAlgorithms.analyzeSupplyChainClusters();
    expect(clusters).toHaveLength(0);

    const summary = graphAlgorithms.generateNetworkSummary();
    expect(summary.basicStats.nodeCount).toBe(0);
    expect(summary.basicStats.edgeCount).toBe(0);
  });
});