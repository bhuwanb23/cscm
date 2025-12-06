const InventoryModel = require('../../models/inventoryModel');

// Mock the sqliteDatabase to avoid actual database connections
jest.mock('../../storage/sqliteDatabase', () => ({
  upsertInventory: jest.fn(),
  getInventoryByStore: jest.fn()
}));

const sqliteDatabase = require('../../storage/sqliteDatabase');

describe('Inventory Model Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should export InventoryModel', () => {
    expect(InventoryModel).toBeDefined();
    expect(typeof InventoryModel.upsert).toBe('function');
    expect(typeof InventoryModel.getByStore).toBe('function');
    expect(typeof InventoryModel.get).toBe('function');
    expect(typeof InventoryModel.updateQuantity).toBe('function');
    expect(typeof InventoryModel.reserveQuantity).toBe('function');
    expect(typeof InventoryModel.releaseReservedQuantity).toBe('function');
  });

  test('should upsert inventory item', async () => {
    // Mock the database response
    sqliteDatabase.upsertInventory.mockResolvedValue(1);
    
    const inventoryData = {
      product_id: 'TEST-PRODUCT',
      store_id: 'TEST-STORE',
      quantity: 100
    };
    
    const result = await InventoryModel.upsert(inventoryData);
    
    expect(result).toEqual({
      id: 1,
      product_id: 'TEST-PRODUCT',
      store_id: 'TEST-STORE',
      quantity: 100,
      reserved_quantity: 0,
      min_stock_level: 0,
      max_stock_level: 0,
      unit_cost: 0.0,
      selling_price: 0.0
    });
    
    expect(sqliteDatabase.upsertInventory).toHaveBeenCalledWith({
      product_id: 'TEST-PRODUCT',
      store_id: 'TEST-STORE',
      quantity: 100,
      reserved_quantity: 0,
      min_stock_level: 0,
      max_stock_level: 0,
      unit_cost: 0.0,
      selling_price: 0.0
    });
  });

  test('should validate required fields for upsert', async () => {
    const inventoryData = {
      quantity: 100
    };
    
    await expect(InventoryModel.upsert(inventoryData))
      .rejects
      .toThrow('Product ID and Store ID are required');
  });

  test('should get inventory by store', async () => {
    // Mock the database response
    const mockInventory = [
      { id: 1, product_id: 'PRODUCT-1', store_id: 'TEST-STORE', quantity: 50 },
      { id: 2, product_id: 'PRODUCT-2', store_id: 'TEST-STORE', quantity: 30 }
    ];
    sqliteDatabase.getInventoryByStore.mockResolvedValue(mockInventory);
    
    const result = await InventoryModel.getByStore('TEST-STORE');
    
    expect(result).toEqual(mockInventory);
    expect(sqliteDatabase.getInventoryByStore).toHaveBeenCalledWith('TEST-STORE');
  });

  test('should validate store ID for get by store', async () => {
    await expect(InventoryModel.getByStore(null))
      .rejects
      .toThrow('Store ID is required');
  });

  test('should get specific inventory item', async () => {
    // Mock the database response
    const mockInventory = [
      { id: 1, product_id: 'PRODUCT-1', store_id: 'TEST-STORE', quantity: 50 },
      { id: 2, product_id: 'PRODUCT-2', store_id: 'TEST-STORE', quantity: 30 }
    ];
    sqliteDatabase.getInventoryByStore.mockResolvedValue(mockInventory);
    
    const result = await InventoryModel.get('PRODUCT-1', 'TEST-STORE');
    
    expect(result).toEqual({ id: 1, product_id: 'PRODUCT-1', store_id: 'TEST-STORE', quantity: 50 });
    expect(sqliteDatabase.getInventoryByStore).toHaveBeenCalledWith('TEST-STORE');
  });

  test('should return null for non-existent inventory item', async () => {
    // Mock the database response
    sqliteDatabase.getInventoryByStore.mockResolvedValue([]);
    
    const result = await InventoryModel.get('NON-EXISTENT', 'TEST-STORE');
    
    expect(result).toBeNull();
  });

  test('should validate required fields for get', async () => {
    await expect(InventoryModel.get(null, 'TEST-STORE'))
      .rejects
      .toThrow('Product ID and Store ID are required');
  });
});