const KnowledgeGraphQuerier = require('../../../../agents/central-planner/sub-agents/KnowledgeGraphQuerier');

describe('KnowledgeGraphQuerier', () => {
  let apiService;
  let querier;
  const plannerId = '001';

  beforeEach(() => {
    apiService = {
      kgQuery: jest.fn()
    };
    querier = new KnowledgeGraphQuerier(plannerId, apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(querier.name).toBe('KnowledgeGraphQuerier');
      expect(querier.parentId).toBe(`CP-${plannerId}`);
      expect(querier.apiService).toBe(apiService);
      expect(querier.plannerId).toBe(plannerId);
    });
  });

  describe('query', () => {
    const querySpec = { type: 'entity_search', term: 'supplier' };

    it('should send query and return mapped result on success', async () => {
      const apiResult = {
        entities: [{ id: 'E1' }],
        relationships: [{ from: 'E1', to: 'E2' }],
        paths: [['E1', 'E2']],
        model_version: 'v2'
      };
      apiService.kgQuery.mockResolvedValue(apiResult);

      const result = await querier.query(querySpec);

      expect(apiService.kgQuery).toHaveBeenCalledWith({ query: querySpec });
      expect(result).toEqual(apiResult);
    });

    it('should return fallback when API throws', async () => {
      apiService.kgQuery.mockRejectedValue(new Error('API down'));

      const result = await querier.query(querySpec);

      expect(result).toEqual({
        entities: [],
        relationships: [],
        paths: [],
        model_version: 'fallback'
      });
    });

    it('should throw when querySpec is missing', async () => {
      await expect(querier.query(null)).rejects.toThrow('querySpec is required');
      expect(apiService.kgQuery).not.toHaveBeenCalled();
    });

    it('should default missing arrays to empty in mapped result', async () => {
      apiService.kgQuery.mockResolvedValue({ model_version: 'v3' });

      const result = await querier.query(querySpec);

      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
      expect(result.paths).toEqual([]);
      expect(result.model_version).toBe('v3');
    });
  });

  describe('findRelated', () => {
    const entityId = 'SUP-1';
    const entityType = 'supplier';

    it('should send entity_id, entity_type, depth and return related list', async () => {
      apiService.kgQuery.mockResolvedValue({
        related: [{ id: 'X' }, { id: 'Y' }],
        total: 2,
        model_version: 'v1'
      });

      const result = await querier.findRelated(entityId, entityType, 3);

      expect(apiService.kgQuery).toHaveBeenCalledWith({
        entity_id: entityId,
        entity_type: entityType,
        depth: 3
      });
      expect(result).toEqual({
        related: [{ id: 'X' }, { id: 'Y' }],
        total: 2,
        model_version: 'v1'
      });
    });

    it('should default depth to 2', async () => {
      apiService.kgQuery.mockResolvedValue({ related: [], total: 0 });

      await querier.findRelated(entityId, entityType);

      expect(apiService.kgQuery).toHaveBeenCalledWith({
        entity_id: entityId,
        entity_type: entityType,
        depth: 2
      });
    });

    it('should return fallback when API throws', async () => {
      apiService.kgQuery.mockRejectedValue(new Error('API down'));

      const result = await querier.findRelated(entityId, entityType);

      expect(result).toEqual({ related: [], total: 0, model_version: 'fallback' });
    });

    it('should throw when entityId missing', async () => {
      await expect(querier.findRelated(null, entityType)).rejects.toThrow('entityId is required');
    });

    it('should throw when entityType missing', async () => {
      await expect(querier.findRelated(entityId, null)).rejects.toThrow('entityType is required');
    });
  });

  describe('getSupplierGraph', () => {
    const supplierId = 'SUP-100';

    it('should send supplier_graph query and return mapped result on success', async () => {
      apiService.kgQuery.mockResolvedValue({
        entities: [{ id: 'SUP-100' }],
        relationships: [],
        paths: [],
        model_version: 'v1'
      });

      const result = await querier.getSupplierGraph(supplierId);

      expect(apiService.kgQuery).toHaveBeenCalledWith({
        query_type: 'supplier_graph',
        supplier_id: supplierId
      });
      expect(result.entities).toEqual([{ id: 'SUP-100' }]);
      expect(result.model_version).toBe('v1');
    });

    it('should return fallback when API throws', async () => {
      apiService.kgQuery.mockRejectedValue(new Error('API down'));

      const result = await querier.getSupplierGraph(supplierId);

      expect(result).toEqual({
        entities: [],
        relationships: [],
        paths: [],
        model_version: 'fallback'
      });
    });

    it('should throw when supplierId is missing', async () => {
      await expect(querier.getSupplierGraph(null)).rejects.toThrow('supplierId is required');
    });
  });

  describe('_fallbackQuery', () => {
    it('should return empty query fallback', () => {
      expect(querier._fallbackQuery()).toEqual({
        entities: [],
        relationships: [],
        paths: [],
        model_version: 'fallback'
      });
    });
  });

  describe('_fallbackRelated', () => {
    it('should return empty related fallback', () => {
      expect(querier._fallbackRelated()).toEqual({
        related: [],
        total: 0,
        model_version: 'fallback'
      });
    });
  });
});
