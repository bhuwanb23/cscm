const ShipmentConsolidator = require('../../../../backend/src/agents/warehouse/sub-agents/ShipmentConsolidator');

const mockApiService = {};

describe('ShipmentConsolidator', () => {
  let consolidator;

  beforeEach(() => {
    jest.clearAllMocks();
    consolidator = new ShipmentConsolidator('WH-01', mockApiService);
  });

  describe('constructor', () => {
    it('should set warehouseId and call super with correct args', () => {
      expect(consolidator.name).toBe('ShipmentConsolidator');
      expect(consolidator.parentId).toBe('Warehouse-WH-01');
      expect(consolidator.apiService).toBe(mockApiService);
      expect(consolidator.warehouseId).toBe('WH-01');
    });
  });

  describe('checkOpportunities', () => {
    const pickingTask = {
      items: [{ productId: 'A' }, { productId: 'B' }],
      destination: 'NYC'
    };

    it('should return consolidation candidate when routes match', () => {
      const pending = {
        'SHIP-2': {
          items: [{ productId: 'C' }],
          destination: 'NYC',
          status: 'picking'
        }
      };

      const result = consolidator.checkOpportunities('SHIP-1', pickingTask, pending);

      expect(result).toEqual({
        shipmentId: 'SHIP-2',
        combinedItems: [
          { productId: 'A' }, { productId: 'B' },
          { productId: 'C' }
        ],
        destination: 'NYC',
        savings: {
          pickingTimeSaved: 15,
          packagingSaved: 1
        }
      });
    });

    it('should skip same shipmentId', () => {
      const pending = {
        'SHIP-1': {
          items: [{ productId: 'C' }],
          destination: 'NYC',
          status: 'picking'
        }
      };

      const result = consolidator.checkOpportunities('SHIP-1', pickingTask, pending);
      expect(result).toBeNull();
    });

    it('should skip shipments that are not picking or packing', () => {
      const pending = {
        'SHIP-2': {
          items: [{ productId: 'C' }],
          destination: 'NYC',
          status: 'delivered'
        }
      };

      const result = consolidator.checkOpportunities('SHIP-1', pickingTask, pending);
      expect(result).toBeNull();
    });

    it('should skip shipments with different destinations', () => {
      const pending = {
        'SHIP-2': {
          items: [{ productId: 'C' }],
          destination: 'LAX',
          status: 'picking'
        }
      };

      const result = consolidator.checkOpportunities('SHIP-1', pickingTask, pending);
      expect(result).toBeNull();
    });

    it('should return null when pickingTask is null', () => {
      const result = consolidator.checkOpportunities('SHIP-1', null, {});
      expect(result).toBeNull();
    });

    it('should return null when pickingTask has no items', () => {
      const result = consolidator.checkOpportunities('SHIP-1', { items: [] }, {});
      expect(result).toBeNull();
    });

    it('should return null when no pending shipments match', () => {
      const result = consolidator.checkOpportunities('SHIP-1', pickingTask, {});
      expect(result).toBeNull();
    });

    it('should match on second destination when first matches', () => {
      const task = {
        items: [{ productId: 'A' }],
        destination: 'CHI'
      };
      const pending = {
        'SHIP-2': {
          items: [{ productId: 'B' }],
          destination: 'CHI',
          status: 'packing'
        }
      };

      const result = consolidator.checkOpportunities('SHIP-1', task, pending);
      expect(result.shipmentId).toBe('SHIP-2');
    });
  });

  describe('processConsolidated', () => {
    it('should return an object with consolidated true and spread target', () => {
      const target = {
        shipmentId: 'SHIP-2',
        combinedItems: [{ productId: 'A' }],
        destination: 'NYC',
        savings: { pickingTimeSaved: 15, packagingSaved: 1 }
      };

      const result = consolidator.processConsolidated(target);

      expect(result).toEqual({
        consolidated: true,
        ...target
      });
    });
  });

  describe('_extractDestinations', () => {
    it('should return array with destination when present', () => {
      expect(consolidator._extractDestinations({ destination: 'NYC' })).toEqual(['NYC']);
    });

    it('should return empty array when no destination', () => {
      expect(consolidator._extractDestinations({})).toEqual([]);
    });
  });

  describe('_isSameDestinationRoute', () => {
    it('should return true when destinations overlap', () => {
      expect(consolidator._isSameDestinationRoute(['NYC', 'LAX'], ['NYC'])).toBe(true);
    });

    it('should return false when no overlap', () => {
      expect(consolidator._isSameDestinationRoute(['NYC'], ['LAX'])).toBe(false);
    });

    it('should return false when first array is empty', () => {
      expect(consolidator._isSameDestinationRoute([], ['NYC'])).toBe(false);
    });

    it('should return false when second array is empty', () => {
      expect(consolidator._isSameDestinationRoute(['NYC'], [])).toBe(false);
    });
  });

  describe('_estimateSavings', () => {
    it('should calculate savings based on item count', () => {
      const taskA = { items: [{ id: 1 }, { id: 2 }, { id: 3 }] };
      const taskB = { items: [{ id: 4 }, { id: 5 }] };

      const result = consolidator._estimateSavings(taskA, taskB);

      expect(result).toEqual({
        pickingTimeSaved: 30,
        packagingSaved: 1
      });
    });

    it('should handle tasks with no items', () => {
      const result = consolidator._estimateSavings({ items: [] }, { items: [] });
      expect(result).toEqual({
        pickingTimeSaved: 0,
        packagingSaved: 1
      });
    });
  });
});
