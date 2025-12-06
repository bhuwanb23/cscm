const redisClient = require('../../messaging/redisClient');

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Redis Messaging Tests', () => {
  // Skip these tests if Redis is not available
  test('should export redis client', () => {
    expect(redisClient).toBeDefined();
    expect(typeof redisClient.connect).toBe('function');
    expect(typeof redisClient.disconnect).toBe('function');
    expect(typeof redisClient.sendMessage).toBe('function');
    expect(typeof redisClient.subscribeToTopic).toBe('function');
  });

  test('should have getStatus method', () => {
    expect(typeof redisClient.getStatus).toBe('function');
  });
});