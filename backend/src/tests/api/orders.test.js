const request = require('supertest');

jest.mock('../../storage/sqliteDatabase', () => {
  const orders = {};
  return {
    createOrder: jest.fn(async (order) => {
      orders[order.order_id] = { id: 1, ...order };
      return 1;
    }),
    addOrderItem: jest.fn(async () => 1),
    getOrderById: jest.fn(async (orderId) => {
      return orders[orderId] || null;
    }),
    updateOrderStatus: jest.fn(async (orderId, status) => {
      if (orders[orderId]) orders[orderId].status = status;
      return 1;
    }),
    getOrdersByStore: jest.fn(async (storeId) => {
      return Object.values(orders).filter(o => o.store_id === storeId);
    }),
    initialize: jest.fn(),
    close: jest.fn(),
    createTables: jest.fn(),
    upsertInventory: jest.fn(),
    getInventoryByStore: jest.fn(),
    createUser: jest.fn(),
    findUserByUsername: jest.fn(),
    findUserById: jest.fn(),
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

describe('Orders API', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  describe('POST /api/v1/orders', () => {
    it('should create an order', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({ order_id: 'ORD-001', store_id: 'STORE-001', items: [{ product_id: 'P1', quantity: 2, unit_price: 10 }] })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', authHeader)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders/:orderId', () => {
    it('should get an order by ID', async () => {
      const res = await request(app)
        .get('/api/v1/orders/ORD-001')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app)
        .get('/api/v1/orders/ORD-XXX')
        .set('Authorization', authHeader)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/v1/orders/:orderId/status', () => {
    it('should update order status', async () => {
      const res = await request(app)
        .patch('/api/v1/orders/ORD-001/status')
        .set('Authorization', authHeader)
        .send({ status: 'shipped' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without status', async () => {
      const res = await request(app)
        .patch('/api/v1/orders/ORD-001/status')
        .set('Authorization', authHeader)
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/orders/store/:storeId', () => {
    it('should list orders by store', async () => {
      const res = await request(app)
        .get('/api/v1/orders/store/STORE-001')
        .set('Authorization', authHeader)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
