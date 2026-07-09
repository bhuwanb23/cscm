const request = require('supertest');

jest.mock('../../storage/sqliteDatabase', () => {
  const store = {};
  return {
    upsertInventory: jest.fn(async (item) => {
      const key = `${item.store_id}:${item.product_id}`;
      store[key] = { id: 1, ...item };
      return 1;
    }),
    getInventoryByStore: jest.fn(async (storeId) => {
      return Object.values(store).filter(i => i.store_id === storeId);
    }),
    initialize: jest.fn(),
    close: jest.fn(),
    createTables: jest.fn(),
    createUser: jest.fn(),
    findUserByUsername: jest.fn(),
    findUserById: jest.fn(),
    createOrder: jest.fn(),
    addOrderItem: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrdersByStore: jest.fn(),
    createShipment: jest.fn(),
    addShipmentItem: jest.fn(),
    getShipmentById: jest.fn(),
    getShipmentsByStatus: jest.fn(),
    getShipmentsByLocation: jest.fn(),
    updateShipmentStatus: jest.fn()
  };
});

const jwt = require('jsonwebtoken');
const config = require('../../config');

const app = require('../../api/server');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Inventory API', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  describe('GET /api/v1/inventory/:storeId', () => {
    it('should list inventory for a store', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/STORE-001')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(app)
        .get('/api/v1/inventory/STORE-001')
        .expect(401);
    });
  });

  describe('POST /api/v1/inventory', () => {
    it('should upsert an inventory item', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', authHeader)
        .send({ product_id: 'PROD-001', store_id: 'STORE-001', quantity: 100 })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', authHeader)
        .send({ quantity: 100 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
