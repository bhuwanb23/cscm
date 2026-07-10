/**
 * Integration tests for orders API.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../config');

jest.mock('../../storage/sqliteDatabase', () => {
  const orders = {};
  return {
    createOrder: jest.fn(async (order) => {
      orders[order.order_id] = { id: Object.keys(orders).length + 1, ...order, items: [] };
      return orders[order.order_id].id;
    }),
    addOrderItem: jest.fn(async (item) => {
      if (orders[item.order_id]) orders[item.order_id].items.push(item);
      return 1;
    }),
    getOrderById: jest.fn(async (orderId) => orders[orderId] || null),
    updateOrderStatus: jest.fn(async (orderId, status) => {
      if (orders[orderId]) orders[orderId].status = status;
      return 1;
    }),
    getOrdersByStore: jest.fn(async (storeId) => {
      return Object.values(orders).filter(o => o.store_id === storeId);
    }),
    initialize: jest.fn(),
    close: jest.fn(),
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
    updateShipmentStatus: jest.fn(),
  };
});

const app = require('../../api/server');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Orders Integration', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  it('should create, get, update status, and list orders', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', authHeader)
      .send({
        order_id: 'INT-ORD-1',
        store_id: 'INT-S1',
        items: [{ product_id: 'P1', quantity: 2, unit_price: 10 }],
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);

    // Get by ID
    const getRes = await request(app)
      .get('/api/v1/orders/INT-ORD-1')
      .set('Authorization', authHeader)
      .expect(200);

    expect(getRes.body.data.order_id).toBe('INT-ORD-1');

    // Update status
    const updateRes = await request(app)
      .patch('/api/v1/orders/INT-ORD-1/status')
      .set('Authorization', authHeader)
      .send({ status: 'shipped' })
      .expect(200);

    expect(updateRes.body.success).toBe(true);

    // List by store
    const listRes = await request(app)
      .get('/api/v1/orders/store/INT-S1')
      .set('Authorization', authHeader)
      .expect(200);

    expect(listRes.body.data.length).toBe(1);
  });
});
