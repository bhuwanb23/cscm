const request = require('supertest');

jest.mock('../../messaging', () => ({
  publishMessage: jest.fn().mockResolvedValue(undefined),
  subscribeToTopic: jest.fn().mockResolvedValue(undefined),
  initialize: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../storage/sqliteDatabase', () => ({
  initialize: jest.fn(),
  close: jest.fn(),
  createTables: jest.fn(),
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
  createShipment: jest.fn(),
  addShipmentItem: jest.fn(),
  getShipmentById: jest.fn(),
  getShipmentsByStatus: jest.fn(),
  getShipmentsByLocation: jest.fn(),
  updateShipmentStatus: jest.fn()
}));

const jwt = require('jsonwebtoken');
const config = require('../../config');
const app = require('../../api/server');
const messagingLayer = require('../../messaging');

function authToken() {
  return jwt.sign({ id: 1, username: 'test', role: 'user' }, config.auth.jwtSecret);
}

describe('Events API', () => {
  const token = authToken();
  const authHeader = `Bearer ${token}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/events/telemetry', () => {
    it('should publish a valid telemetry event', async () => {
      const eventBody = {
        sourceId: 'SENSOR-001',
        eventType: 'temperature_reading',
        payload: { temperature: 22.5, humidity: 45 },
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/v1/events/telemetry')
        .set('Authorization', authHeader)
        .send(eventBody)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/telemetry/i);
      expect(res.body.data.sourceId).toBe('SENSOR-001');
      expect(res.body.data.eventType).toBe('temperature_reading');
      expect(res.body.data.timestamp).toBeDefined();
      expect(messagingLayer.publishMessage).toHaveBeenCalledWith('telemetry.events', expect.objectContaining({
        sourceId: 'SENSOR-001',
        eventType: 'temperature_reading'
      }));
    });

    it('should reject telemetry event without sourceId', async () => {
      const res = await request(app)
        .post('/api/v1/events/telemetry')
        .set('Authorization', authHeader)
        .send({ eventType: 'temperature_reading', payload: {} })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/sourceId/);
    });

    it('should reject telemetry event without eventType', async () => {
      const res = await request(app)
        .post('/api/v1/events/telemetry')
        .set('Authorization', authHeader)
        .send({ sourceId: 'SENSOR-001', payload: {} })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/eventType/);
    });

    it('should reject telemetry event with invalid schema', async () => {
      const res = await request(app)
        .post('/api/v1/events/telemetry')
        .set('Authorization', authHeader)
        .send({ sourceId: 'SENSOR-001', eventType: 'reading', payload: 'should-be-object' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it('should return 500 when messaging layer throws', async () => {
      messagingLayer.publishMessage.mockRejectedValueOnce(new Error('messaging down'));

      const res = await request(app)
        .post('/api/v1/events/telemetry')
        .set('Authorization', authHeader)
        .send({
          sourceId: 'SENSOR-001',
          eventType: 'temperature_reading',
          payload: { temperature: 22.5 },
          timestamp: new Date().toISOString()
        })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/events/inventory', () => {
    const validInventory = {
      productId: 'PROD-001',
      storeId: 'STORE-001',
      quantity: 50,
      eventType: 'STOCK_UPDATE',
      timestamp: new Date().toISOString()
    };

    it('should publish a valid inventory event', async () => {
      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send(validInventory)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.productId).toBe('PROD-001');
      expect(res.body.data.storeId).toBe('STORE-001');
      expect(res.body.data.quantity).toBe(50);
      expect(messagingLayer.publishMessage).toHaveBeenCalledWith('inventory.events', expect.objectContaining({
        productId: 'PROD-001',
        storeId: 'STORE-001',
        quantity: 50
      }));
    });

    it('should reject inventory event missing productId', async () => {
      const { productId, ...withoutProductId } = validInventory;
      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send(withoutProductId)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject inventory event missing storeId', async () => {
      const { storeId, ...withoutStoreId } = validInventory;
      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send(withoutStoreId)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject inventory event missing quantity', async () => {
      const { quantity, ...withoutQuantity } = validInventory;
      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send(withoutQuantity)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject inventory event with invalid eventType', async () => {
      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send({ ...validInventory, eventType: 'INVALID_TYPE' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 500 when inventory messaging fails', async () => {
      messagingLayer.publishMessage.mockRejectedValueOnce(new Error('kafka down'));

      const res = await request(app)
        .post('/api/v1/events/inventory')
        .set('Authorization', authHeader)
        .send(validInventory)
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/events/orders', () => {
    const validOrder = {
      orderId: 'ORD-001',
      customerId: 'CUST-001',
      items: [{ productId: 'PROD-001', quantity: 2, price: 10 }],
      totalAmount: 20,
      status: 'PENDING',
      timestamp: new Date().toISOString()
    };

    it('should publish a valid order event', async () => {
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(validOrder)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('ORD-001');
      expect(messagingLayer.publishMessage).toHaveBeenCalledWith('orders.events', expect.objectContaining({
        orderId: 'ORD-001',
        totalAmount: 20
      }));
    });

    it('should reject order event missing orderId', async () => {
      const { orderId, ...withoutOrderId } = validOrder;
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(withoutOrderId)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject order event missing customerId', async () => {
      const { customerId, ...withoutCustomerId } = validOrder;
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(withoutCustomerId)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject order event missing items', async () => {
      const { items, ...withoutItems } = validOrder;
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(withoutItems)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject order event missing totalAmount', async () => {
      const { totalAmount, ...withoutAmount } = validOrder;
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(withoutAmount)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject order event missing status', async () => {
      const { status, ...withoutStatus } = validOrder;
      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(withoutStatus)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should return 500 when order messaging fails', async () => {
      messagingLayer.publishMessage.mockRejectedValueOnce(new Error('messaging failure'));

      const res = await request(app)
        .post('/api/v1/events/orders')
        .set('Authorization', authHeader)
        .send(validOrder)
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated telemetry request', async () => {
      await request(app)
        .post('/api/v1/events/telemetry')
        .send({ sourceId: 'x', eventType: 'y', timestamp: new Date().toISOString() })
        .expect(401);
    });

    it('should reject unauthenticated inventory request', async () => {
      await request(app)
        .post('/api/v1/events/inventory')
        .send({ productId: 'p', storeId: 's', quantity: 1, eventType: 'STOCK_UPDATE' })
        .expect(401);
    });

    it('should reject unauthenticated order request', async () => {
      await request(app)
        .post('/api/v1/events/orders')
        .send({ orderId: 'o', customerId: 'c', items: [], totalAmount: 0, status: 'PENDING', timestamp: new Date().toISOString() })
        .expect(401);
    });
  });
});
