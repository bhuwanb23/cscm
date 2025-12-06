const knowledgeGraph = require('../../knowledge-graph/graphStructure');

describe('Knowledge Graph Structure Tests', () => {
  beforeEach(() => {
    // Clear the knowledge graph before each test
    knowledgeGraph.clear();
  });

  test('should export knowledgeGraph', () => {
    expect(knowledgeGraph).toBeDefined();
    expect(typeof knowledgeGraph.addEntity).toBe('function');
    expect(typeof knowledgeGraph.addRelationship).toBe('function');
    expect(typeof knowledgeGraph.getEntity).toBe('function');
    expect(typeof knowledgeGraph.getNeighbors).toBe('function');
    expect(typeof knowledgeGraph.getRelationships).toBe('function');
    expect(typeof knowledgeGraph.findShortestPath).toBe('function');
    expect(typeof knowledgeGraph.getEntitiesByType).toBe('function');
    expect(typeof knowledgeGraph.removeEntity).toBe('function');
    expect(typeof knowledgeGraph.getStats).toBe('function');
    expect(typeof knowledgeGraph.clear).toBe('function');
    expect(typeof knowledgeGraph.toJSON).toBe('function');
    expect(typeof knowledgeGraph.fromJSON).toBe('function');
  });

  test('should add and retrieve entities', () => {
    const entityId = 'test-entity';
    const entityType = 'sku';
    const metadata = { name: 'Test Product', price: 99.99 };

    // Add entity
    knowledgeGraph.addEntity(entityId, entityType, metadata);

    // Retrieve entity
    const entity = knowledgeGraph.getEntity(entityId);

    expect(entity).toEqual({
      id: entityId,
      type: entityType,
      name: 'Test Product',
      price: 99.99,
      createdAt: expect.any(String)
    });
  });

  test('should add and retrieve relationships', () => {
    // Add entities
    knowledgeGraph.addEntity('entity1', 'sku');
    knowledgeGraph.addEntity('entity2', 'store');

    // Add relationship
    knowledgeGraph.addRelationship('entity1', 'entity2', 'stocked_at', { quantity: 10 });

    // Retrieve relationships
    const relationships = knowledgeGraph.getRelationships('entity1');

    expect(relationships).toHaveLength(1);
    expect(relationships[0]).toEqual({
      from: 'entity1',
      to: 'entity2',
      type: 'stocked_at',
      metadata: { quantity: 10 },
      direction: 'outgoing'
    });
  });

  test('should find neighbors of an entity', () => {
    // Add entities
    knowledgeGraph.addEntity('entity1', 'sku');
    knowledgeGraph.addEntity('entity2', 'store');
    knowledgeGraph.addEntity('entity3', 'supplier');

    // Add relationships
    knowledgeGraph.addRelationship('entity1', 'entity2', 'stocked_at');
    knowledgeGraph.addRelationship('entity1', 'entity3', 'supplied_by');

    // Get neighbors
    const neighbors = knowledgeGraph.getNeighbors('entity1');

    expect(neighbors).toHaveLength(2);
    expect(neighbors.map(n => n.id)).toEqual(expect.arrayContaining(['entity2', 'entity3']));
  });

  test('should find shortest path between entities', () => {
    // Add entities
    knowledgeGraph.addEntity('A', 'sku');
    knowledgeGraph.addEntity('B', 'store');
    knowledgeGraph.addEntity('C', 'supplier');

    // Add relationships to create a path: A -> B -> C
    knowledgeGraph.addRelationship('A', 'B', 'stocked_at');
    knowledgeGraph.addRelationship('B', 'C', 'procures_from');

    // Find shortest path
    const path = knowledgeGraph.findShortestPath('A', 'C');

    expect(path).toEqual(['A', 'B', 'C']);
  });

  test('should get entities by type', () => {
    // Add entities of different types
    knowledgeGraph.addEntity('sku1', 'sku', { name: 'Product 1' });
    knowledgeGraph.addEntity('sku2', 'sku', { name: 'Product 2' });
    knowledgeGraph.addEntity('store1', 'store', { name: 'Store 1' });

    // Get entities by type
    const skus = knowledgeGraph.getEntitiesByType('sku');
    const stores = knowledgeGraph.getEntitiesByType('store');

    expect(skus).toHaveLength(2);
    expect(stores).toHaveLength(1);
    expect(skus[0].type).toBe('sku');
    expect(stores[0].type).toBe('store');
  });

  test('should remove entities', () => {
    // Add entity
    knowledgeGraph.addEntity('test-entity', 'sku');

    // Verify entity exists
    expect(knowledgeGraph.getEntity('test-entity')).not.toBeNull();

    // Remove entity
    knowledgeGraph.removeEntity('test-entity');

    // Verify entity is removed
    expect(knowledgeGraph.getEntity('test-entity')).toBeNull();
  });

  test('should get graph statistics', () => {
    // Initially empty
    const initialStats = knowledgeGraph.getStats();
    expect(initialStats).toEqual({
      nodeCount: 0,
      edgeCount: 0,
      entityTypes: {}
    });

    // Add entities and relationships
    knowledgeGraph.addEntity('sku1', 'sku');
    knowledgeGraph.addEntity('store1', 'store');
    knowledgeGraph.addRelationship('sku1', 'store1', 'stocked_at');

    // Check updated stats
    const updatedStats = knowledgeGraph.getStats();
    expect(updatedStats.nodeCount).toBe(2);
    expect(updatedStats.edgeCount).toBe(1);
    expect(updatedStats.entityTypes).toEqual({ sku: 1, store: 1 });
  });

  test('should serialize and deserialize graph', () => {
    // Add entities and relationships
    knowledgeGraph.addEntity('sku1', 'sku', { name: 'Test Product' });
    knowledgeGraph.addEntity('store1', 'store', { name: 'Test Store' });
    knowledgeGraph.addRelationship('sku1', 'store1', 'stocked_at', { quantity: 5 });

    // Serialize
    const serialized = knowledgeGraph.toJSON();

    expect(serialized.nodes).toHaveLength(2);
    expect(serialized.edges).toHaveLength(1);

    // Clear and deserialize
    knowledgeGraph.clear();
    expect(knowledgeGraph.getStats().nodeCount).toBe(0);

    knowledgeGraph.fromJSON(serialized);
    expect(knowledgeGraph.getStats().nodeCount).toBe(2);
    expect(knowledgeGraph.getStats().edgeCount).toBe(1);
  });

  test('should validate required parameters', () => {
    // Test addEntity validation
    expect(() => knowledgeGraph.addEntity(null, 'sku')).toThrow('Entity ID is required');
    expect(() => knowledgeGraph.addEntity('test', null)).toThrow('Entity type is required');

    // Test addRelationship validation
    expect(() => knowledgeGraph.addRelationship(null, 'to', 'type')).toThrow('Both fromEntityId and toEntityId are required');
    expect(() => knowledgeGraph.addRelationship('from', null, 'type')).toThrow('Both fromEntityId and toEntityId are required');
    expect(() => knowledgeGraph.addRelationship('from', 'to', null)).toThrow('Relationship type is required');

    // Test getEntity validation
    expect(() => knowledgeGraph.getEntity(null)).toThrow('Entity ID is required');
  });

  test('should handle non-existent entities gracefully', () => {
    // Try to get non-existent entity
    const result = knowledgeGraph.getEntity('non-existent');
    expect(result).toBeNull();

    // Try to get neighbors of non-existent entity
    const neighbors = knowledgeGraph.getNeighbors('non-existent');
    expect(neighbors).toEqual([]);

    // Try to get relationships of non-existent entity
    const relationships = knowledgeGraph.getRelationships('non-existent');
    expect(relationships).toEqual([]);
  });
});