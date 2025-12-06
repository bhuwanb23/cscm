const ShipmentModel = require('../../models/shipmentModel');

// Mock the sqliteDatabase to avoid actual database connections
jest.mock('../../storage/sqliteDatabase', () => ({
  createShipment: jest.fn(),
  addShipmentItem: jest.fn(),
  updateShipmentStatus: jest.fn(),
  getShipmentsByStatus: jest.fn()
}));

const sqliteDatabase = require('../../storage/sqliteDatabase');

describe('Shipment Model Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should export ShipmentModel', () => {
    expect(ShipmentModel).toBeDefined();
    expect(typeof ShipmentModel.create).toBe('function');
    expect(typeof ShipmentModel.addShipmentItem).toBe('function');
    expect(typeof ShipmentModel.getById).toBe('function');
    expect(typeof ShipmentModel.updateStatus).toBe('function');
    expect(typeof ShipmentModel.getByStatus).toBe('function');
    expect(typeof ShipmentModel.getByLocation).toBe('function');
  });

  test('should create shipment', async () => {
    // Mock the database response
    sqliteDatabase.createShipment.mockResolvedValue(1);
    sqliteDatabase.addShipmentItem.mockResolvedValue(1);
    
    const shipmentData = {
      shipment_id: 'SHIPMENT-001',
      order_id: 'ORDER-001',
      from_location: 'WAREHOUSE-001',
      to_location: 'STORE-001',
      status: 'shipped',
      carrier: 'FedEx',
      tracking_number: '1234567890',
      estimated_delivery: '2023-12-31T00:00:00Z',
      items: [
        {
          product_id: 'PRODUCT-1',
          quantity: 2
        }
      ]
    };
    
    const result = await ShipmentModel.create(shipmentData);
    
    expect(result).toEqual({
      id: 1,
      shipment_id: 'SHIPMENT-001',
      order_id: 'ORDER-001',
      from_location: 'WAREHOUSE-001',
      to_location: 'STORE-001',
      status: 'shipped',
      carrier: 'FedEx',
      tracking_number: '1234567890',
      estimated_delivery: '2023-12-31T00:00:00Z'
    });
    
    expect(sqliteDatabase.createShipment).toHaveBeenCalledWith({
      shipment_id: 'SHIPMENT-001',
      order_id: 'ORDER-001',
      from_location: 'WAREHOUSE-001',
      to_location: 'STORE-001',
      status: 'shipped',
      carrier: 'FedEx',
      tracking_number: '1234567890',
      estimated_delivery: '2023-12-31T00:00:00Z'
    });
    
    expect(sqliteDatabase.addShipmentItem).toHaveBeenCalledWith({
      shipment_id: 'SHIPMENT-001',
      product_id: 'PRODUCT-1',
      quantity: 2
    });
  });

  test('should validate required fields for create', async () => {
    const shipmentData = {
      order_id: 'ORDER-001',
      status: 'shipped'
    };
    
    await expect(ShipmentModel.create(shipmentData))
      .rejects
      .toThrow('Shipment ID, From Location, and To Location are required');
  });

  test('should add shipment item', async () => {
    // Mock the database response
    sqliteDatabase.addShipmentItem.mockResolvedValue(1);
    
    const itemData = {
      shipment_id: 'SHIPMENT-001',
      product_id: 'PRODUCT-1',
      quantity: 2
    };
    
    const result = await ShipmentModel.addShipmentItem(itemData);
    
    expect(result).toEqual({
      id: 1,
      shipment_id: 'SHIPMENT-001',
      product_id: 'PRODUCT-1',
      quantity: 2
    });
    
    expect(sqliteDatabase.addShipmentItem).toHaveBeenCalledWith({
      shipment_id: 'SHIPMENT-001',
      product_id: 'PRODUCT-1',
      quantity: 2
    });
  });

  test('should validate required fields for addShipmentItem', async () => {
    const itemData = {
      quantity: 2
    };
    
    await expect(ShipmentModel.addShipmentItem(itemData))
      .rejects
      .toThrow('Shipment ID and Product ID are required');
  });

  test('should update shipment status', async () => {
    // Mock the database response
    sqliteDatabase.updateShipmentStatus.mockResolvedValue(1);
    
    const result = await ShipmentModel.updateStatus('SHIPMENT-001', 'delivered', {
      actual_delivery: '2023-12-31T00:00:00Z'
    });
    
    expect(result).toEqual({
      shipment_id: 'SHIPMENT-001',
      status: 'delivered',
      changes: 1
    });
    
    expect(sqliteDatabase.updateShipmentStatus).toHaveBeenCalledWith(
      'SHIPMENT-001',
      'delivered',
      { actual_delivery: '2023-12-31T00:00:00Z' }
    );
  });

  test('should validate required fields for updateStatus', async () => {
    await expect(ShipmentModel.updateStatus(null, 'delivered'))
      .rejects
      .toThrow('Shipment ID is required');
      
    await expect(ShipmentModel.updateStatus('SHIPMENT-001', null))
      .rejects
      .toThrow('Status is required');
  });

  test('should get shipments by status', async () => {
    // Mock the database response
    const mockShipments = [
      { id: 1, shipment_id: 'SHIPMENT-001', status: 'delivered' },
      { id: 2, shipment_id: 'SHIPMENT-002', status: 'delivered' }
    ];
    sqliteDatabase.getShipmentsByStatus.mockResolvedValue(mockShipments);
    
    const result = await ShipmentModel.getByStatus('delivered');
    
    expect(result).toEqual(mockShipments);
    expect(sqliteDatabase.getShipmentsByStatus).toHaveBeenCalledWith('delivered');
  });

  test('should validate status for getByStatus', async () => {
    await expect(ShipmentModel.getByStatus(null))
      .rejects
      .toThrow('Status is required');
  });
});