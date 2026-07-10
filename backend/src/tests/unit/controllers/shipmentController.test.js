/**
 * Unit tests for shipment controller.
 */
jest.mock('../../../storage/sqliteDatabase', () => ({
  createShipment: jest.fn(),
  addShipmentItem: jest.fn(),
  getShipmentById: jest.fn(),
  updateShipmentStatus: jest.fn(),
  getShipmentsByStatus: jest.fn(),
  getShipmentsByLocation: jest.fn(),
}));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const { create, getById, updateStatus, getByStatus, getByLocation } = require('../../../api/controllers/shipmentController');
const sqliteDatabase = require('../../../storage/sqliteDatabase');

function mockRes() {
  return { statusCode: null, body: null, status(c) { this.statusCode = c; return this; }, json(d) { this.body = d; return this; } };
}

describe('Shipment Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create shipment', async () => {
      sqliteDatabase.createShipment.mockResolvedValue(1);
      const req = { body: { shipment_id: 'SHP-1', from_location: 'A', to_location: 'B' } };
      const res = mockRes();
      await create(req, res);
      expect(res.statusCode).toBe(201);
    });

    it('should reject missing fields', async () => {
      const req = { body: {} };
      const res = mockRes();
      await create(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getById', () => {
    it('should return shipment', async () => {
      sqliteDatabase.getShipmentById.mockResolvedValue({ shipment_id: 'SHP-1' });
      const req = { params: { shipmentId: 'SHP-1' } };
      const res = mockRes();
      await getById(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should return 404', async () => {
      sqliteDatabase.getShipmentById.mockResolvedValue(null);
      const req = { params: { shipmentId: 'SHP-99' } };
      const res = mockRes();
      await getById(req, res);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('updateStatus', () => {
    it('should update status', async () => {
      sqliteDatabase.updateShipmentStatus.mockResolvedValue(1);
      const req = { params: { shipmentId: 'SHP-1' }, body: { status: 'in_transit' } };
      const res = mockRes();
      await updateStatus(req, res);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing status', async () => {
      const req = { params: { shipmentId: 'SHP-1' }, body: {} };
      const res = mockRes();
      await updateStatus(req, res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('getByStatus', () => {
    it('should return shipments by status', async () => {
      sqliteDatabase.getShipmentsByStatus.mockResolvedValue([{ shipment_id: 'SHP-1' }]);
      const req = { params: { status: 'pending' } };
      const res = mockRes();
      await getByStatus(req, res);
      expect(res.body.success).toBe(true);
    });
  });

  describe('getByLocation', () => {
    it('should return shipments by location', async () => {
      sqliteDatabase.getShipmentsByLocation.mockResolvedValue([{ shipment_id: 'SHP-1' }]);
      const req = { params: { location: 'NYC' } };
      const res = mockRes();
      await getByLocation(req, res);
      expect(res.body.success).toBe(true);
    });
  });
});
