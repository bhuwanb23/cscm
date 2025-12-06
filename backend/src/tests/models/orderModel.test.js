const OrderModel = require('../../models/orderModel');

// Mock the sqliteDatabase to avoid actual database connections
jest.mock('../../storage/sqliteDatabase', () => ({
  createOrder: jest.fn(),
  addOrderItem: jest.fn()
}));

const sqliteDatabase = require('../../storage/sqliteDatabase');

describe('Order Model Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should export OrderModel', () => {
    expect(OrderModel).toBeDefined();
    expect(typeof OrderModel.create).toBe('function');
    expect(typeof OrderModel.addOrderItem).toBe('function');
    expect(typeof OrderModel.getById).toBe('function');
    expect(typeof OrderModel.updateStatus).toBe('function');
    expect(typeof OrderModel.getByStore).toBe('function');
  });

  test('should create order', async () => {
    // Mock the database response
    sqliteDatabase.createOrder.mockResolvedValue(1);
    sqliteDatabase.addOrderItem.mockResolvedValue(1);
    
    const orderData = {
      order_id: 'ORDER-001',
      store_id: 'TEST-STORE',
      customer_id: 'CUSTOMER-001',
      total_amount: 100.0,
      status: 'confirmed',
      items: [
        {
          product_id: 'PRODUCT-1',
          quantity: 2,
          unit_price: 50.0,
          total_price: 100.0
        }
      ]
    };
    
    const result = await OrderModel.create(orderData);
    
    expect(result).toEqual({
      id: 1,
      order_id: 'ORDER-001',
      store_id: 'TEST-STORE',
      customer_id: 'CUSTOMER-001',
      total_amount: 100.0,
      status: 'confirmed'
    });
    
    expect(sqliteDatabase.createOrder).toHaveBeenCalledWith({
      order_id: 'ORDER-001',
      store_id: 'TEST-STORE',
      customer_id: 'CUSTOMER-001',
      total_amount: 100.0,
      status: 'confirmed'
    });
    
    expect(sqliteDatabase.addOrderItem).toHaveBeenCalledWith({
      order_id: 'ORDER-001',
      product_id: 'PRODUCT-1',
      quantity: 2,
      unit_price: 50.0,
      total_price: 100.0
    });
  });

  test('should validate required fields for create', async () => {
    const orderData = {
      customer_id: 'CUSTOMER-001',
      total_amount: 100.0
    };
    
    await expect(OrderModel.create(orderData))
      .rejects
      .toThrow('Order ID and Store ID are required');
  });

  test('should add order item', async () => {
    // Mock the database response
    sqliteDatabase.addOrderItem.mockResolvedValue(1);
    
    const itemData = {
      order_id: 'ORDER-001',
      product_id: 'PRODUCT-1',
      quantity: 2,
      unit_price: 50.0
    };
    
    const result = await OrderModel.addOrderItem(itemData);
    
    expect(result).toEqual({
      id: 1,
      order_id: 'ORDER-001',
      product_id: 'PRODUCT-1',
      quantity: 2,
      unit_price: 50.0,
      total_price: 100.0
    });
    
    expect(sqliteDatabase.addOrderItem).toHaveBeenCalledWith({
      order_id: 'ORDER-001',
      product_id: 'PRODUCT-1',
      quantity: 2,
      unit_price: 50.0,
      total_price: 100.0
    });
  });

  test('should validate required fields for addOrderItem', async () => {
    const itemData = {
      quantity: 2,
      unit_price: 50.0
    };
    
    await expect(OrderModel.addOrderItem(itemData))
      .rejects
      .toThrow('Order ID and Product ID are required');
  });
});