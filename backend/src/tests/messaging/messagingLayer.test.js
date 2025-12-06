const messagingLayer = require('../../messaging');

// Mock the clients to avoid actual connections
jest.mock('../../messaging/kafkaClient', () => ({
  connectProducer: jest.fn(),
  connectConsumer: jest.fn(),
  sendMessage: jest.fn(),
  disconnectProducer: jest.fn(),
  disconnectConsumer: jest.fn(),
  consumer: {
    subscribe: jest.fn(),
    run: jest.fn()
  }
}));

jest.mock('../../messaging/mqttClient', () => ({
  publishMessage: jest.fn(),
  subscribeToTopic: jest.fn(),
  handleMessage: jest.fn(),
  client: {
    end: jest.fn()
  }
}));

// Mock Redis client
jest.mock('../../messaging/redisClient', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  sendMessage: jest.fn(),
  subscribeToTopic: jest.fn(),
  getStatus: jest.fn(() => false)
}));

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock metrics tracking
jest.mock('../../utils/metrics', () => ({
  trackKafkaMessage: jest.fn(),
  trackMqttMessage: jest.fn()
}));

describe('Messaging Layer Tests', () => {
  test('should export messaging layer instance', () => {
    expect(messagingLayer).toBeDefined();
    expect(typeof messagingLayer.initialize).toBe('function');
    expect(typeof messagingLayer.publishMessage).toBe('function');
    expect(typeof messagingLayer.subscribeToTopic).toBe('function');
    expect(typeof messagingLayer.shutdown).toBe('function');
  });

  test('should track connection status', () => {
    expect(messagingLayer.kafkaConnected).toBe(false);
    expect(messagingLayer.mqttConnected).toBe(false);
    expect(messagingLayer.redisConnected).toBe(false);
  });

  test('should initialize without errors', async () => {
    await expect(messagingLayer.initialize()).resolves.toBeUndefined();
  });
});