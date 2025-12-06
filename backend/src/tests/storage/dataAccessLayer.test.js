const DataAccessLayer = require('../../storage/dataAccessLayer');

// Mock all models to avoid actual database connections
jest.mock('../../models/inventoryModel', () => ({
  upsert: jest.fn(),
  getByStore: jest.fn(),
  get: jest.fn(),
  updateQuantity: jest.fn(),
  reserveQuantity: jest.fn(),
  releaseReservedQuantity: jest.fn()
}));

jest.mock('../../models/orderModel', () => ({
  create: jest.fn(),
  addOrderItem: jest.fn(),
  getById: jest.fn(),
  updateStatus: jest.fn(),
  getByStore: jest.fn()
}));

jest.mock('../../models/shipmentModel', () => ({
  create: jest.fn(),
  addShipmentItem: jest.fn(),
  getById: jest.fn(),
  updateStatus: jest.fn(),
  getByStatus: jest.fn(),
  getByLocation: jest.fn()
}));

// Mock the sqliteDatabase to avoid actual database connections
jest.mock('../../storage/sqliteDatabase', () => ({
  initialize: jest.fn(),
  close: jest.fn()
}));

const InventoryModel = require('../../models/inventoryModel');
const OrderModel = require('../../models/orderModel');
const ShipmentModel = require('../../models/shipmentModel');
const sqliteDatabase = require('../../storage/sqliteDatabase');

describe('Data Access Layer Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should export DataAccessLayer', () => {
    expect(DataAccessLayer).toBeDefined();
    expect(typeof DataAccessLayer.initialize).toBe('function');
    expect(typeof DataAccessLayer.close).toBe('function');
  });

  test('should initialize data access layer', async () => {
    // Mock the database response
    sqliteDatabase.initialize.mockResolvedValue();
    
    await DataAccessLayer.initialize();
    
    expect(sqliteDatabase.initialize).toHaveBeenCalled();
  });

  test('should close data access layer', async () => {
    // Mock the database response
    sqliteDatabase.close.mockResolvedValue();
    
    await DataAccessLayer.close();
    
    expect(sqliteDatabase.close).toHaveBeenCalled();
  });

  // Inventory tests
  test('should upsert inventory through data access layer', async () => {
    const inventoryData = { product_id: 'TEST-PRODUCT', store_id: 'TEST-STORE' };
    InventoryModel.upsert.mockResolvedValue({ id: 1, ...inventoryData });
    
    const result = await DataAccessLayer.upsertInventory(inventoryData);
    
    expect(result).toEqual({ id: 1, ...inventoryData });
    expect(InventoryModel.upsert).toHaveBeenCalledWith(inventoryData);
  });

  test('should get inventory by store through data access layer', async () => {
    const mockInventory = [{ id: 1, product_id: 'TEST-PRODUCT', store_id: 'TEST-STORE' }];
    InventoryModel.getByStore.mockResolvedValue(mockInventory);
    
    const result = await DataAccessLayer.getInventoryByStore('TEST-STORE');
    
    expect(result).toEqual(mockInventory);
    expect(InventoryModel.getByStore).toHaveBeenCalledWith('TEST-STORE');
  });

  // Order tests
  test('should create order through data access layer', async () => {
    const orderData = { order_id: 'ORDER-001', store_id: 'TEST-STORE' };
    OrderModel.create.mockResolvedValue({ id: 1, ...orderData });
    
    const result = await DataAccessLayer.createOrder(orderData);
    
    expect(result).toEqual({ id: 1, ...orderData });
    expect(OrderModel.create).toHaveBeenCalledWith(orderData);
  });

  // Shipment tests
  test('should create shipment through data access layer', async () => {
    const shipmentData = { 
      shipment_id: 'SHIPMENT-001', 
      from_location: 'WAREHOUSE-001', 
      to_location: 'STORE-001' 
    };
    ShipmentModel.create.mockResolvedValue({ id: 1, ...shipmentData });
    
    const result = await DataAccessLayer.createShipment(shipmentData);
    
    expect(result).toEqual({ id: 1, ...shipmentData });
    expect(ShipmentModel.create).toHaveBeenCalledWith(shipmentData);
  });

  test('should get shipments by status through data access layer', async () => {
    const mockShipments = [{ id: 1, shipment_id: 'SHIPMENT-001', status: 'delivered' }];
    ShipmentModel.getByStatus.mockResolvedValue(mockShipments);
    
    const result = await DataAccessLayer.getShipmentsByStatus('delivered');
    
    expect(result).toEqual(mockShipments);
    expect(ShipmentModel.getByStatus).toHaveBeenCalledWith('delivered');
  });
});