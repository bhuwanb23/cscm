/**
 * Unit tests for order controller.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createOrder: jest.fn(),
  addOrderItem: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  getOrdersByStore: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const { create, getById, updateStatus, getByStore } = require('../../../api/controllers/orderController');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

function mockRes() {
  return { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
}

describe('Order Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create order', async () => {
      sqliteDatabase.createOrder.mockResolvedValue(1);
      const req = { body: { order_id: 'ORD-1', store_id: 'S1' } };
      const res = mockRes();
      await create(req, res);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing fields', async () => {
      const req = { body: {} };
      const res = mockRes();
      await create(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getById', () => {
    it('should return order', async () => {
      sqliteDatabase.getOrderById.mockResolvedValue({ order_id: 'ORD-1', status: 'pending' });
      const req = { params: { orderId: 'ORD-1' } };
      const res = mockRes();
      await getById(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for missing order', async () => {
      sqliteDatabase.getOrderById.mockResolvedValue(null);
      const req = { params: { orderId: 'ORD-99' } };
      const res = mockRes();
      await getById(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      sqliteDatabase.updateOrderStatus.mockResolvedValue(1);
      const req = { params: { orderId: 'ORD-1' }, body: { status: 'shipped' } };
      const res = mockRes();
      await updateStatus(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing status', async () => {
      const req = { params: { orderId: 'ORD-1' }, body: {} };
      const res = mockRes();
      await updateStatus(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getByStore', () => {
    it('should return orders by store', async () => {
      sqliteDatabase.getOrdersByStore.mockResolvedValue([{ order_id: 'ORD-1' }]);
      const req = { params: { storeId: 'S1' }, query: {} };
      const res = mockRes();
      await getByStore(req, res);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
