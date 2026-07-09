const request = require('supertest');

jest.mock('../../storage/sqliteDatabase', () => {
  const shipments = {};
  return {
    createShipment: jest.fn(async (shipment) => {
      shipments[shipment.shipment_id] = { id: 1, ...shipment };
      return 1;
    }),
    addShipmentItem: jest.fn(async () => 1),
    getShipmentById: jest.fn(async (shipmentId) => {
      return shipments[shipmentId] || null;
    }),
    updateShipmentStatus: jest.fn(async (shipmentId, status) => {
      if (shipments[shipmentId]) shipments[shipmentId].status = status;
      return 1;
    }),
    getShipmentsByStatus: jest.fn(async (status) => {
      return Object.values(shipments).filter(s => s.status === status);
    }),
    getShipmentsByLocation: jest.fn(async (location) => {
      return Object.values(shipments).filter(s => s.from_location === location || s.to_location === location);
    }),
    initialize: jest.fn(),
    close: jest.fn(),
    createTables: jest.fn(),
    upsertInventory: jest.fn(),
    getInventoryByStore: jest.fn(),
    createOrder: jest.fn(),
    addOrderItem: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrdersByStore: jest.fn(),
    createUser: jest.fn(),
    findUserByUsername: jest.fn(),
    findUserById: jest.fn()
  };
});

const jwt = require('jsonwebtoken');
const config = require('../../config');

const app = require('../../api/server');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Shipments API', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  describe('POST /api/v1/shipments', () => {
    it('should create a shipment', async () => {
      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', authHeader)
        .send({ shipment_id: 'SHP-001', from_location: 'Warehouse-A', to_location: 'Store-001' })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', authHeader)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/shipments/:shipmentId', () => {
    it('should get a shipment by ID', async () => {
      const res = await request(app)
        .get('/api/v1/shipments/SHP-001')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent shipment', async () => {
      const res = await request(app)
        .get('/api/v1/shipments/SHP-XXX')
        .set('Authorization', authHeader)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/shipments/:shipmentId/status', () => {
    it('should update shipment status', async () => {
      const res = await request(app)
        .patch('/api/v1/shipments/SHP-001/status')
        .set('Authorization', authHeader)
        .send({ status: 'in_transit' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/shipments/status/:status', () => {
    it('should list shipments by status', async () => {
      const res = await request(app)
        .get('/api/v1/shipments/status/in_transit')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/shipments/location/:location', () => {
    it('should list shipments by location', async () => {
      const res = await request(app)
        .get('/api/v1/shipments/location/Warehouse-A')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
