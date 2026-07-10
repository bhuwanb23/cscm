/**
 * Unit tests for event controller.
 */
const { publishTelemetryEvent, publishInventoryEvent, publishOrderEvent } = require('../../../api/controllers/eventController');
const { mockReqResNext } = require('../helpers');

jest.mock('../../../messaging', () => ({
  publishMessage: jest.fn().mockResolvedValue(),
}));
jest.mock('../../../messaging/eventSchemas', () => ({
  validateEvent: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
}));
jest.mock('../../../utils/logger', () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() }));

const messagingLayer = require('../../../messaging');
const { validateEvent } = require('../../../messaging/eventSchemas');

describe('Event Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateEvent.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('publishTelemetryEvent', () => {
    it('should publish telemetry event', async () => {
      const { req, res } = mockReqResNext({
        body: { sourceId: 'sensor-1', eventType: 'temperature', payload: { temp: 25 } },
      });

      await publishTelemetryEvent(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(messagingLayer.publishMessage).toHaveBeenCalled();
    });

    it('should reject missing fields', async () => {
      const { req, res } = mockReqResNext({ body: {} });

      await publishTelemetryEvent(req, res);

      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid event schema', async () => {
      validateEvent.mockReturnValue({ isValid: false, errors: ['bad format'] });
      const { req, res } = mockReqResNext({
        body: { sourceId: 's1', eventType: 'temp' },
      });

      await publishTelemetryEvent(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('publishInventoryEvent', () => {
    it('should publish inventory event', async () => {
      const { req, res } = mockReqResNext({
        body: { productId: 'P1', storeId: 'S1', quantity: 10, eventType: 'restock' },
      });

      await publishInventoryEvent(req, res);

      expect(res.statusCode).toBe(201);
      expect(messagingLayer.publishMessage).toHaveBeenCalledWith('inventory.events', expect.any(Object));
    });

    it('should reject missing fields', async () => {
      const { req, res } = mockReqResNext({ body: { productId: 'P1' } });

      await publishInventoryEvent(req, res);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('publishOrderEvent', () => {
    it('should publish order event', async () => {
      const { req, res } = mockReqResNext({
        body: {
          orderId: 'ORD-1', customerId: 'C1', items: [{ product_id: 'P1', quantity: 2 }],
          totalAmount: 50, status: 'created',
        },
      });

      await publishOrderEvent(req, res);

      expect(res.statusCode).toBe(201);
      expect(messagingLayer.publishMessage).toHaveBeenCalledWith('orders.events', expect.any(Object));
    });

    it('should reject missing fields', async () => {
      const { req, res } = mockReqResNext({ body: { orderId: 'ORD-1' } });

      await publishOrderEvent(req, res);

      expect(res.statusCode).toBe(400);
    });
  });
});
