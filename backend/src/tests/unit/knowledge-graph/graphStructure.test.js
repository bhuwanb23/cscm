/**
 * Unit tests for knowledge graph structure.
 */
// The module exports a singleton - we use it directly and clear between tests
const kg = require('../../../knowledge-graph/graphStructure');

describe('KnowledgeGraph', () => {
  beforeEach(() => {
    kg.clear();
  });

  describe('addEntity', () => {
    it('should add entity', () => {
      kg.addEntity('sku-1', 'sku', { name: 'Milk' });
      const entity = kg.getEntity('sku-1');
      expect(entity.type).toBe('sku');
      expect(entity.name).toBe('Milk');
    });

    it('should throw without ID', () => {
      expect(() => kg.addEntity('', 'sku')).toThrow('required');
    });

    it('should throw without type', () => {
      expect(() => kg.addEntity('sku-1', '')).toThrow('required');
    });
  });

  describe('addRelationship', () => {
    it('should add relationship', () => {
      kg.addEntity('s1', 'store');
      kg.addEntity('p1', 'product');
      kg.addRelationship('s1', 'p1', 'stocks');
      const rels = kg.getRelationships('s1');
      expect(rels.length).toBe(1);
      expect(rels[0].type).toBe('stocks');
    });

    it('should throw for missing entities', () => {
      expect(() => kg.addRelationship('x', 'y', 'rel')).toThrow('does not exist');
    });
  });

  describe('getEntity', () => {
    it('should return entity', () => {
      kg.addEntity('e1', 'type', { name: 'Test' });
      expect(kg.getEntity('e1').name).toBe('Test');
    });

    it('should return null for missing', () => {
      expect(kg.getEntity('nonexistent')).toBeNull();
    });
  });

  describe('getNeighbors', () => {
    it('should return neighbors', () => {
      kg.addEntity('a', 'type');
      kg.addEntity('b', 'type');
      kg.addRelationship('a', 'b', 'rel');
      const neighbors = kg.getNeighbors('a');
      expect(neighbors.length).toBe(1);
      expect(neighbors[0].id).toBe('b');
    });
  });

  describe('findShortestPath', () => {
    it('should find path', () => {
      kg.addEntity('a', 'type');
      kg.addEntity('b', 'type');
      kg.addEntity('c', 'type');
      kg.addRelationship('a', 'b', 'rel');
      kg.addRelationship('b', 'c', 'rel');
      const path = kg.findShortestPath('a', 'c');
      expect(path).toEqual(['a', 'b', 'c']);
    });

    it('should return null for no path', () => {
      kg.addEntity('a', 'type');
      kg.addEntity('b', 'type');
      const path = kg.findShortestPath('a', 'b');
      expect(path).toBeNull();
    });
  });

  describe('getEntitiesByType', () => {
    it('should filter by type', () => {
      kg.addEntity('s1', 'store');
      kg.addEntity('s2', 'store');
      kg.addEntity('p1', 'product');
      const stores = kg.getEntitiesByType('store');
      expect(stores.length).toBe(2);
    });
  });

  describe('removeEntity', () => {
    it('should remove entity', () => {
      kg.addEntity('e1', 'type');
      kg.removeEntity('e1');
      expect(kg.getEntity('e1')).toBeNull();
    });
  });

  describe('toJSON/fromJSON', () => {
    it('should serialize and deserialize', () => {
      kg.addEntity('a', 'type', { name: 'A' });
      kg.addEntity('b', 'type', { name: 'B' });
      kg.addRelationship('a', 'b', 'rel');
      const json = kg.toJSON();
      expect(json.nodes.length).toBe(2);
      expect(json.edges.length).toBe(1);

      kg.clear();
      kg.fromJSON(json);
      expect(kg.getEntity('a').name).toBe('A');
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      kg.addEntity('a', 'store');
      kg.addEntity('b', 'product');
      const stats = kg.getStats();
      expect(stats.nodeCount).toBe(2);
      expect(stats.entityTypes.store).toBe(1);
      expect(stats.entityTypes.product).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear graph', () => {
      kg.addEntity('a', 'type');
      kg.clear();
      expect(kg.getStats().nodeCount).toBe(0);
    });
  });
});
