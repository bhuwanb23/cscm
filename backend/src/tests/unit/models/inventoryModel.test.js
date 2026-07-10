/**
 * Unit tests for inventory model.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  upsertInventory: jest.fn(),
  getInventoryByStore: jest.fn(),
}));

const InventoryModel = require('../../../models/inventoryModel');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

describe('InventoryModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upsert', () => {
    it('should upsert item', async () => {
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const result = await InventoryModel.upsert({ product_id: 'P1', store_id: 'S1', quantity: 10 });
      expect(result.id).toBe(1);
      expect(result.product_id).toBe('P1');
    });

    it('should throw without required fields', async () => {
      await expect(InventoryModel.upsert({})).rejects.toThrow('required');
    });
  });

  describe('getByStore', () => {
    it('should return items', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1' }]);
      const items = await InventoryModel.getByStore('S1');
      expect(items.length).toBe(1);
    });

    it('should throw without storeId', async () => {
      await expect(InventoryModel.getByStore(null)).rejects.toThrow('required');
    });
  });

  describe('get', () => {
    it('should return single item', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1' }]);
      const item = await InventoryModel.get('P1', 'S1');
      expect(item.product_id).toBe('P1');
    });

    it('should return null for missing item', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([]);
      const item = await InventoryModel.get('P99', 'S1');
      expect(item).toBeNull();
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 10 }]);
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const result = await InventoryModel.updateQuantity('P1', 'S1', 25);
      expect(result.quantity).toBe(25);
    });

    it('should throw for non-numeric quantity', async () => {
      await expect(InventoryModel.updateQuantity('P1', 'S1', 'abc')).rejects.toThrow('number');
    });

    it('should throw for missing item', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([]);
      await expect(InventoryModel.updateQuantity('P99', 'S1', 10)).rejects.toThrow('not found');
    });
  });

  describe('reserveQuantity', () => {
    it('should reserve quantity', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 100, reserved_quantity: 10 }]);
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const result = await InventoryModel.reserveQuantity('P1', 'S1', 20);
      expect(result.reserved_quantity).toBe(30);
    });

    it('should throw for insufficient inventory', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 5, reserved_quantity: 3 }]);
      await expect(InventoryModel.reserveQuantity('P1', 'S1', 10)).rejects.toThrow('Insufficient');
    });
  });

  describe('releaseReservedQuantity', () => {
    it('should release reserved quantity', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 100, reserved_quantity: 30 }]);
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const result = await InventoryModel.releaseReservedQuantity('P1', 'S1', 10);
      expect(result.reserved_quantity).toBe(20);
    });

    it('should throw for over-release', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 100, reserved_quantity: 5 }]);
      await expect(InventoryModel.releaseReservedQuantity('P1', 'S1', 10)).rejects.toThrow('Cannot release');
    });
  });
});
