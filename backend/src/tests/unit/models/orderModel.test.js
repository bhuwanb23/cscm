/**
 * Unit tests for order model.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createOrder: jest.fn(),
  addOrderItem: jest.fn(),
  getOrderById: jest.fn(),
  updateOrderStatus: jest.fn(),
  getOrdersByStore: jest.fn(),
}));

const OrderModel = require('../../../models/orderModel');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

describe('OrderModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create order', async () => {
      sqliteDatabase.createOrder.mockResolvedValue(1);
      const result = await OrderModel.create({ order_id: 'ORD-1', store_id: 'S1' });
      expect(result.order_id).toBe('ORD-1');
    });

    it('should add items if provided', async () => {
      sqliteDatabase.createOrder.mockResolvedValue(1);
      sqliteDatabase.addOrderItem.mockResolvedValue(1);
      await OrderModel.create({
        order_id: 'ORD-1', store_id: 'S1',
        items: [{ product_id: 'P1', quantity: 2, unit_price: 10 }],
      });
      expect(sqliteDatabase.addOrderItem).toHaveBeenCalled();
    });

    it('should throw without required fields', async () => {
      await expect(OrderModel.create({})).rejects.toThrow('required');
    });
  });

  describe('getById', () => {
    it('should return order', async () => {
      sqliteDatabase.getOrderById.mockResolvedValue({ order_id: 'ORD-1' });
      const order = await OrderModel.getById('ORD-1');
      expect(order.order_id).toBe('ORD-1');
    });

    it('should throw without orderId', async () => {
      await expect(OrderModel.getById(null)).rejects.toThrow('required');
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      sqliteDatabase.updateOrderStatus.mockResolvedValue(1);
      const result = await OrderModel.updateStatus('ORD-1', 'shipped');
      expect(result.status).toBe('shipped');
    });

    it('should throw without orderId', async () => {
      await expect(OrderModel.updateStatus(null, 'shipped')).rejects.toThrow('required');
    });
  });

  describe('getByStore', () => {
    it('should return orders', async () => {
      sqliteDatabase.getOrdersByStore.mockResolvedValue([{ order_id: 'ORD-1' }]);
      const orders = await OrderModel.getByStore('S1');
      expect(orders.length).toBe(1);
    });
  });
});
