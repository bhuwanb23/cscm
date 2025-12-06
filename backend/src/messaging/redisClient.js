const redis = require('redis');
const logger = require('../utils/logger');
const { trackKafkaMessage } = require('../utils/metrics'); // Reusing this for Redis tracking

/**
 * Redis Client
 * 
 * This module provides a Redis client for local pub/sub messaging.
 * It handles connection management, message publishing, and subscription handling.
 */

class RedisClient {
  constructor() {
    this.client = null;
    this.subscriber = null;
    this.isConnected = false;
  }

  /**
   * Connect to Redis server
   */
  async connect() {
    try {
      // Create publisher client
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
      });

      // Create subscriber client (Redis requires separate connections for pub/sub)
      this.subscriber = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
      });

      // Handle connection events
      this.client.on('connect', () => {
        logger.info('Redis publisher connected successfully');
      });

      this.client.on('error', (err) => {
        logger.error('Redis publisher error:', err);
      });

      this.subscriber.on('connect', () => {
        logger.info('Redis subscriber connected successfully');
      });

      this.subscriber.on('error', (err) => {
        logger.error('Redis subscriber error:', err);
      });

      // Connect both clients
      await this.client.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      logger.info('Redis messaging initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis messaging:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from Redis server
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.quit();
      }
      
      if (this.subscriber) {
        await this.subscriber.quit();
      }
      
      this.isConnected = false;
      logger.info('Redis messaging disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect Redis messaging:', error.message);
      throw error;
    }
  }

  /**
   * Publish message to a topic
   * @param {string} topic - Message topic
   * @param {Object} message - Message payload
   */
  async sendMessage(topic, message) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      // Serialize message
      const serializedMessage = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString(),
        source: 'redis'
      });

      // Publish to Redis
      await this.client.publish(topic, serializedMessage);
      
      // Track message for metrics
      trackKafkaMessage(topic); // Reusing this function for tracking
      
      logger.debug(`Message published to topic ${topic}`);
    } catch (error) {
      logger.error(`Failed to publish message to topic ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Subscribe to a topic
   * @param {string} topic - Message topic
   * @param {Function} callback - Callback function to handle messages
   */
  async subscribeToTopic(topic, callback) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis client not connected');
      }

      // Subscribe to topic
      await this.subscriber.subscribe(topic, async (message) => {
        try {
          // Parse message
          const parsedMessage = JSON.parse(message);
          
          // Call callback with topic and message
          await callback(topic, parsedMessage);
        } catch (parseError) {
          logger.error(`Failed to parse Redis message from topic ${topic}:`, parseError.message);
        }
      });

      logger.debug(`Subscribed to topic ${topic}`);
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Get connection status
   * @returns {boolean} - Connection status
   */
  getStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
module.exports = new RedisClient();