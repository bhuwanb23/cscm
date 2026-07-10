/**
 * Integration tests for shipments API.
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const config = require('../../config');

jest.mock('../../storage/sqliteDatabase', () => {
  const shipments = {};
  return {
    createShipment: jest.fn(async (shipment) => {
      shipments[shipment.shipment_id] = { id: Object.keys(shipments).length + 1, ...shipment, items: [] };
      return shipments[shipment.shipment_id].id;
    }),
    addShipmentItem: jest.fn(async (item) => {
      if (shipments[item.shipment_id]) shipments[item.shipment_id].items.push(item);
      return 1;
    }),
    getShipmentById: jest.fn(async (id) => shipments[id] || null),
    updateShipmentStatus: jest.fn(async (id, status) => {
      if (shipments[id]) shipments[id].status = status;
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
    upsertInventory: jest.fn(),
    getInventoryByStore: jest.fn(),
    createUser: jest.fn(),
    findUserByUsername: jest.fn(),
    findUserById: jest.fn(),
    createOrder: jest.fn(),
    addOrderItem: jest.fn(),
    getOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    getOrdersByStore: jest.fn(),
  };
});

const app = require('../../api/server');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Shipments Integration', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  it('should create, get, update status, and list shipments', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/v1/shipments')
      .set('Authorization', authHeader)
      .send({
        shipment_id: 'INT-SHP-1',
        from_location: 'NYC',
        to_location: 'LA',
        items: [{ product_id: 'P1', quantity: 5 }],
      })
      .expect(201);

    expect(createRes.body.success).toBe(true);

    // Get by ID
    const getRes = await request(app)
      .get('/api/v1/shipments/INT-SHP-1')
      .set('Authorization', authHeader)
      .expect(200);

    expect(getRes.body.data.shipment_id).toBe('INT-SHP-1');

    // Update status
    const updateRes = await request(app)
      .patch('/api/v1/shipments/INT-SHP-1/status')
      .set('Authorization', authHeader)
      .send({ status: 'in_transit' })
      .expect(200);

    expect(updateRes.body.success).toBe(true);

    // List by status
    const byStatusRes = await request(app)
      .get('/api/v1/shipments/status/in_transit')
      .set('Authorization', authHeader)
      .expect(200);

    expect(byStatusRes.body.data.length).toBe(1);

    // List by location
    const byLocationRes = await request(app)
      .get('/api/v1/shipments/location/NYC')
      .set('Authorization', authHeader)
      .expect(200);

    expect(byLocationRes.body.data.length).toBe(1);
  });
});
