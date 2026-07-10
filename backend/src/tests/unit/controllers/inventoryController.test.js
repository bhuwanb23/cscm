/**
 * Unit tests for inventory controller.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  upsertInventory: jest.fn(),
  getInventoryByStore: jest.fn(),
  initialize: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const { getByStore, getItem, upsert, updateQuantity } = require('../../../api/controllers/inventoryController');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

function mockRes() {
  return { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
}

describe('Inventory Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getByStore', () => {
    it('should return inventory items', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', quantity: 10 }]);
      const req = { params: { storeId: 'S1' } };
      const res = mockRes();
      await getByStore(req, res);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject missing storeId', async () => {
      const req = { params: {} };
      const res = mockRes();
      await getByStore(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getItem', () => {
    it('should return single item', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1' }]);
      const req = { params: { storeId: 'S1', productId: 'P1' } };
      const res = mockRes();
      await getItem(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for missing item', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([]);
      const req = { params: { storeId: 'S1', productId: 'P99' } };
      const res = mockRes();
      await getItem(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('upsert', () => {
    it('should upsert inventory item', async () => {
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const req = { body: { product_id: 'P1', store_id: 'S1', quantity: 50 } };
      const res = mockRes();
      await upsert(req, res);
      expect(res.statusCode).toBe(201);
    });

    it('should reject missing fields', async () => {
      const req = { body: { quantity: 50 } };
      const res = mockRes();
      await upsert(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity', async () => {
      sqliteDatabase.getInventoryByStore.mockResolvedValue([{ product_id: 'P1', store_id: 'S1', quantity: 10 }]);
      sqliteDatabase.upsertInventory.mockResolvedValue(1);
      const req = { params: { storeId: 'S1', productId: 'P1' }, body: { quantity: 25 } };
      const res = mockRes();
      await updateQuantity(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should reject non-numeric quantity', async () => {
      const req = { params: { storeId: 'S1', productId: 'P1' }, body: { quantity: 'abc' } };
      const res = mockRes();
      await updateQuantity(req, res);
      expect(res.statusCode).toBe(400);
    });
  });
});
