const { validateEvent } = require('../messaging/eventSchemas');

describe('Event Schema Validation', () => {
  describe('Telemetry Event', () => {
    it('should validate a correct telemetry event', () => {
      const event = {
        sourceId: 'sensor-001',
        timestamp: new Date().toISOString(),
        eventType: 'temperature_reading',
        payload: {
          temperature: 25.5,
          humidity: 60
        }
      };

      const result = validateEvent(event, 'telemetry');
      expect(result.isValid).toBe(true);
    });

    it('should reject telemetry event without required fields', () => {
      const event = {
        sourceId: 'sensor-001'
        // Missing timestamp and eventType
      };

      const result = validateEvent(event, 'telemetry');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Inventory Event', () => {
    it('should validate a correct inventory event', () => {
      const event = {
        productId: 'prod-123',
        storeId: 'store-456',
        quantity: 100,
        eventType: 'STOCK_UPDATE',
        timestamp: new Date().toISOString()
      };

      const result = validateEvent(event, 'inventory');
      expect(result.isValid).toBe(true);
    });

    it('should reject inventory event with invalid eventType', () => {
      const event = {
        productId: 'prod-123',
        storeId: 'store-456',
        quantity: 100,
        eventType: 'INVALID_TYPE',
        timestamp: new Date().toISOString()
      };

      const result = validateEvent(event, 'inventory');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Order Event', () => {
    it('should validate a correct order event', () => {
      const event = {
        orderId: 'order-789',
        customerId: 'customer-123',
        items: [
          {
            productId: 'prod-123',
            quantity: 2,
            price: 25.99
          }
        ],
        totalAmount: 51.98,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      const result = validateEvent(event, 'order');
      expect(result.isValid).toBe(true);
    });

    it('should reject order event without required fields', () => {
      const event = {
        orderId: 'order-789',
        customerId: 'customer-123'
        // Missing items, totalAmount, status, timestamp
      };

      const result = validateEvent(event, 'order');
      expect(result.isValid).toBe(false);
    });
  });
});