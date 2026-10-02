const request = require('supertest');

jest.mock('../../storage/sqliteDatabase', () => {
  const store = {};
  const mockObj = {
    upsertInventory: jest.fn(async (item) => {
      const key = `${item.store_id}:${item.product_id}`;
      store[key] = { id: 1, ...item };
      return 1;
    }),
    getInventoryByStore: jest.fn(async (storeId) => {
      return Object.values(store).filter((i) => i.store_id === storeId);
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
    updateShipmentStatus: jest.fn(),
  };
  // database.js destructures { SQLiteDatabase } and instantiates it.
  class SQLiteDatabase {
    constructor() {
      Object.assign(this, mockObj);
    }
  }
  const instance = new SQLiteDatabase();
  instance.SQLiteDatabase = SQLiteDatabase;
  return instance;
});

const jwt = require('jsonwebtoken');
const config = require('../../config');

const app = require('../../api/server');

function authToken() {
  return jwt.sign(
    { id: 1, username: 'test', role: 'user' },
    config.auth.jwtSecret,
    { expiresIn: '1h', issuer: config.auth.jwtIssuer, audience: config.auth.jwtAudience, algorithm: config.auth.jwtAlgorithm }
  );
}

// Inventory is store-scoped, so tests that act on a store need a token whose
// subject is bound to that store. `shopkeeper_001` maps to STORE001 by the
// username convention in middleware/storeAccess.
function storeToken(storeNumber) {
  const n = String(storeNumber).padStart(3, '0');
  return jwt.sign(
    { id: Number(n), username: `shopkeeper_${n}`, role: 'shopkeeper', storeId: `STORE${n}` },
    config.auth.jwtSecret,
    { expiresIn: '1h', issuer: config.auth.jwtIssuer, audience: config.auth.jwtAudience, algorithm: config.auth.jwtAlgorithm }
  );
}

describe('Inventory API', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;
  const store1Header = `Bearer ${storeToken(1)}`;

  describe('GET /api/v1/inventory/:storeId', () => {
    it('should list inventory for a store', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/STORE001')
        .set('Authorization', store1Header)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject without auth', async () => {
      await request(app).get('/api/v1/inventory/STORE001').expect(401);
    });

    // REGRESSION (security): authentication alone must not grant access to
    // another store's stock. Before the store-ownership guard this returned
    // 200 with the other store's inventory.
    it('should forbid a shopkeeper reading another store inventory', async () => {
      await request(app)
        .get('/api/v1/inventory/STORE002')
        .set('Authorization', store1Header)
        .expect(403);
    });

    it('should forbid a shopkeeper rewriting another store quantity', async () => {
      await request(app)
        .put('/api/v1/inventory/STORE002/PROD-001/quantity')
        .set('Authorization', store1Header)
        .send({ quantity: 999 })
        .expect(403);
    });

    it('should forbid a store-scoped role with no resolvable store', async () => {
      await request(app)
        .get('/api/v1/inventory/STORE001')
        .set('Authorization', authHeader) // role 'user', no store mapping
        .expect(403);
    });
  });

  describe('POST /api/v1/inventory', () => {
    it('should upsert an inventory item', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', store1Header)
        .send({ product_id: 'PROD-001', store_id: 'STORE001', quantity: 100 })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/inventory')
        .set('Authorization', store1Header)
        .send({ quantity: 100 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
