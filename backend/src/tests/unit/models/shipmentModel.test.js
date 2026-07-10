/**
 * Unit tests for shipment model.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createShipment: jest.fn(),
  addShipmentItem: jest.fn(),
  getShipmentById: jest.fn(),
  updateShipmentStatus: jest.fn(),
  getShipmentsByStatus: jest.fn(),
  getShipmentsByLocation: jest.fn(),
}));

const ShipmentModel = require('../../../models/shipmentModel');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

describe('ShipmentModel', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create shipment', async () => {
      sqliteDatabase.createShipment.mockResolvedValue(1);
      const result = await ShipmentModel.create({ shipment_id: 'SHP-1', from_location: 'A', to_location: 'B' });
      expect(result.shipment_id).toBe('SHP-1');
    });

    it('should add items if provided', async () => {
      sqliteDatabase.createShipment.mockResolvedValue(1);
      sqliteDatabase.addShipmentItem.mockResolvedValue(1);
      await ShipmentModel.create({
        shipment_id: 'SHP-1', from_location: 'A', to_location: 'B',
        items: [{ product_id: 'P1', quantity: 5 }],
      });
      expect(sqliteDatabase.addShipmentItem).toHaveBeenCalled();
    });

    it('should throw without required fields', async () => {
      await expect(ShipmentModel.create({})).rejects.toThrow('required');
    });
  });

  describe('getById', () => {
    it('should return shipment', async () => {
      sqliteDatabase.getShipmentById.mockResolvedValue({ shipment_id: 'SHP-1' });
      const shipment = await ShipmentModel.getById('SHP-1');
      expect(shipment.shipment_id).toBe('SHP-1');
    });

    it('should throw without shipmentId', async () => {
      await expect(ShipmentModel.getById(null)).rejects.toThrow('required');
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      sqliteDatabase.updateShipmentStatus.mockResolvedValue(1);
      const result = await ShipmentModel.updateStatus('SHP-1', 'delivered');
      expect(result.status).toBe('delivered');
    });

    it('should throw without shipmentId', async () => {
      await expect(ShipmentModel.updateStatus(null, 'delivered')).rejects.toThrow('required');
    });
  });

  describe('getByStatus', () => {
    it('should return shipments', async () => {
      sqliteDatabase.getShipmentsByStatus.mockResolvedValue([{ shipment_id: 'SHP-1' }]);
      const shipments = await ShipmentModel.getByStatus('pending');
      expect(shipments.length).toBe(1);
    });
  });

  describe('getByLocation', () => {
    it('should return shipments', async () => {
      sqliteDatabase.getShipmentsByLocation.mockResolvedValue([{ shipment_id: 'SHP-1' }]);
      const shipments = await ShipmentModel.getByLocation('NYC');
      expect(shipments.length).toBe(1);
    });
  });
});
