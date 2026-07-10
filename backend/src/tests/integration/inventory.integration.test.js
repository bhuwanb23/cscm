/**
 * Integration tests for inventory API.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../config');

jest.mock('../../storage/sqliteDatabase', () => {
  const store = {};
  return {
    upsertInventory: jest.fn(async (item) => {
      const key = `${item.store_id}:${item.product_id}`;
      store[key] = { id: Object.keys(store).length + 1, ...item };
      return store[key].id;
    }),
    getInventoryByStore: jest.fn(async (storeId) => {
      return Object.values(store).filter(i => i.store_id === storeId);
    }),
    initialize: jest.fn(),
    close: jest.fn(),
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
    updateShipmentStatus: jest.fn(),
  };
});

const app = require('../../api/server');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Inventory Integration', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  it('should upsert, get by store, and get item', async () => {
    // Upsert
    const upsertRes = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', authHeader)
      .send({ product_id: 'INT-P1', store_id: 'INT-S1', quantity: 50 })
      .expect(201);

    expect(upsertRes.body.success).toBe(true);

    // Get by store
    const listRes = await request(app)
      .get('/api/v1/inventory/INT-S1')
      .set('Authorization', authHeader)
      .expect(200);

    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].product_id).toBe('INT-P1');
  });

  it('should reject without auth', async () => {
    await request(app)
      .get('/api/v1/inventory/INT-S1')
      .expect(401);
  });

  it('should reject upsert with missing fields', async () => {
    await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', authHeader)
      .send({ quantity: 50 })
      .expect(400);
  });
});
