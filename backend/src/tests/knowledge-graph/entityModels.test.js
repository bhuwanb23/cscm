const entityModels = require('../../knowledge-graph/entityModels');
const knowledgeGraph = require('../../knowledge-graph/graphStructure');

describe('Entity Models Tests', () => {
  beforeEach(() => {
    // Clear the knowledge graph before each test
    knowledgeGraph.clear();
  });

  test('should export entityModels', () => {
    expect(entityModels).toBeDefined();
    expect(typeof entityModels.createSKU).toBe('function');
    expect(typeof entityModels.createStore).toBe('function');
    expect(typeof entityModels.createSupplier).toBe('function');
    expect(typeof entityModels.createSKUStoreRelationship).toBe('function');
    expect(typeof entityModels.createStoreSupplierRelationship).toBe('function');
    expect(typeof entityModels.createSKUSupplierRelationship).toBe('function');
    expect(typeof entityModels.getSKUsAtStore).toBe('function');
    expect(typeof entityModels.getStoresWithSKU).toBe('function');
    expect(typeof entityModels.getSuppliersForStore).toBe('function');
    expect(typeof entityModels.getSuppliersForSKU).toBe('function');
    expect(typeof entityModels.getSKUsFromSupplier).toBe('function');
    expect(typeof entityModels.findSupplyChainPath).toBe('function');
  });

  test('should create SKU entities', () => {
    const skuId = 'SKU-TEST-001';
    const attributes = { name: 'Test Product', category: 'Electronics', price: 99.99 };

    // Create SKU
    entityModels.createSKU(skuId, attributes);

    // Retrieve entity
    const entity = knowledgeGraph.getEntity(skuId);

    expect(entity).toEqual({
      id: skuId,
      type: 'sku',
      name: 'Test Product',
      category: 'Electronics',
      price: 99.99,
      createdAt: expect.any(String)
    });
  });

  test('should create Store entities', () => {
    const storeId = 'STORE-TEST-001';
    const attributes = { name: 'Test Store', location: 'New York, NY', capacity: 5000 };

    // Create Store
    entityModels.createStore(storeId, attributes);

    // Retrieve entity
    const entity = knowledgeGraph.getEntity(storeId);

    expect(entity).toEqual({
      id: storeId,
      type: 'store',
      name: 'Test Store',
      location: 'New York, NY',
      capacity: 5000,
      createdAt: expect.any(String)
    });
  });

  test('should create Supplier entities', () => {
    const supplierId = 'SUPPLIER-TEST-001';
    const attributes = { name: 'Test Supplier', contact: 'contact@test.com', leadTime: 3 };

    // Create Supplier
    entityModels.createSupplier(supplierId, attributes);

    // Retrieve entity
    const entity = knowledgeGraph.getEntity(supplierId);

    expect(entity).toEqual({
      id: supplierId,
      type: 'supplier',
      name: 'Test Supplier',
      contact: 'contact@test.com',
      leadTime: 3,
      createdAt: expect.any(String)
    });
  });

  test('should create SKU-Store relationships', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');

    // Create relationship
    const attributes = { quantity: 50, minStock: 10, maxStock: 100 };
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001', attributes);

    // Check relationship
    const relationships = knowledgeGraph.getRelationships('SKU-TEST-001');
    expect(relationships).toHaveLength(1);
    expect(relationships[0].type).toBe('stocked_at');
    expect(relationships[0].metadata).toEqual({
      quantity: 50,
      minStock: 10,
      maxStock: 100,
      lastRestocked: null
    });
  });

  test('should create Store-Supplier relationships', () => {
    // Create entities
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');

    // Create relationship
    const attributes = { contractStart: '2023-01-01', preferred: true };
    entityModels.createStoreSupplierRelationship('STORE-TEST-001', 'SUPPLIER-TEST-001', attributes);

    // Check relationship
    const relationships = knowledgeGraph.getRelationships('STORE-TEST-001');
    expect(relationships).toHaveLength(1);
    expect(relationships[0].type).toBe('procures_from');
    expect(relationships[0].metadata).toEqual({
      contractStart: '2023-01-01',
      contractEnd: null,
      preferred: true
    });
  });

  test('should create SKU-Supplier relationships', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');

    // Create relationship
    const attributes = { cost: 79.99, moq: 10, leadTime: 5 };
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001', attributes);

    // Check relationship
    const relationships = knowledgeGraph.getRelationships('SKU-TEST-001');
    expect(relationships).toHaveLength(1);
    expect(relationships[0].type).toBe('supplied_by');
    expect(relationships[0].metadata).toEqual({
      cost: 79.99,
      moq: 10,
      leadTime: 5
    });
  });

  test('should get SKUs at store', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001', { name: 'Product 1' });
    entityModels.createSKU('SKU-TEST-002', { name: 'Product 2' });
    entityModels.createStore('STORE-TEST-001');

    // Create relationships
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-002', 'STORE-TEST-001');

    // Get SKUs at store
    const skus = entityModels.getSKUsAtStore('STORE-TEST-001');

    expect(skus).toHaveLength(2);
    expect(skus.map(sku => sku.id)).toEqual(expect.arrayContaining(['SKU-TEST-001', 'SKU-TEST-002']));
  });

  test('should get stores with SKU', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001', { name: 'Store 1' });
    entityModels.createStore('STORE-TEST-002', { name: 'Store 2' });

    // Create relationships
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-001');
    entityModels.createSKUStoreRelationship('SKU-TEST-001', 'STORE-TEST-002');

    // Get stores with SKU
    const stores = entityModels.getStoresWithSKU('SKU-TEST-001');

    expect(stores).toHaveLength(2);
    expect(stores.map(store => store.id)).toEqual(expect.arrayContaining(['STORE-TEST-001', 'STORE-TEST-002']));
  });

  test('should get suppliers for store', () => {
    // Create entities
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001', { name: 'Supplier 1' });
    entityModels.createSupplier('SUPPLIER-TEST-002', { name: 'Supplier 2' });

    // Create relationships
    entityModels.createStoreSupplierRelationship('STORE-TEST-001', 'SUPPLIER-TEST-001');
    entityModels.createStoreSupplierRelationship('STORE-TEST-001', 'SUPPLIER-TEST-002');

    // Get suppliers for store
    const suppliers = entityModels.getSuppliersForStore('STORE-TEST-001');

    expect(suppliers).toHaveLength(2);
    expect(suppliers.map(supplier => supplier.id)).toEqual(expect.arrayContaining(['SUPPLIER-TEST-001', 'SUPPLIER-TEST-002']));
  });

  test('should get suppliers for SKU', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001', { name: 'Supplier 1' });
    entityModels.createSupplier('SUPPLIER-TEST-002', { name: 'Supplier 2' });

    // Create relationships
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-002');

    // Get suppliers for SKU
    const suppliers = entityModels.getSuppliersForSKU('SKU-TEST-001');

    expect(suppliers).toHaveLength(2);
    expect(suppliers.map(supplier => supplier.id)).toEqual(expect.arrayContaining(['SUPPLIER-TEST-001', 'SUPPLIER-TEST-002']));
  });

  test('should get SKUs from supplier', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001', { name: 'Product 1' });
    entityModels.createSKU('SKU-TEST-002', { name: 'Product 2' });
    entityModels.createSupplier('SUPPLIER-TEST-001');

    // Create relationships
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    entityModels.createSKUSupplierRelationship('SKU-TEST-002', 'SUPPLIER-TEST-001');

    // Get SKUs from supplier
    const skus = entityModels.getSKUsFromSupplier('SUPPLIER-TEST-001');

    expect(skus).toHaveLength(2);
    expect(skus.map(sku => sku.id)).toEqual(expect.arrayContaining(['SKU-TEST-001', 'SKU-TEST-002']));
  });

  test('should find supply chain path', () => {
    // Create entities
    entityModels.createSKU('SKU-TEST-001');
    entityModels.createStore('STORE-TEST-001');
    entityModels.createSupplier('SUPPLIER-TEST-001');

    // Create relationships to form a path
    entityModels.createSKUSupplierRelationship('SKU-TEST-001', 'SUPPLIER-TEST-001');
    // Note: In a real supply chain, we might have more complex paths

    // Find path (this will just test that the function works)
    const path = entityModels.findSupplyChainPath('SKU-TEST-001', 'SUPPLIER-TEST-001');
    
    // Since we're using a simple graph, we expect a direct path
    expect(path).toEqual(['SKU-TEST-001', 'SUPPLIER-TEST-001']);
  });
});