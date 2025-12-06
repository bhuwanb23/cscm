const kafkaClient = require('./kafkaClient');
const mqttClient = require('./mqttClient');
const logger = require('../utils/logger');
const { trackKafkaMessage, trackMqttMessage } = require('../utils/metrics');

/**
 * Messaging Layer
 * 
 * This module provides a unified interface for both Kafka and MQTT messaging systems.
 * It handles connection management, message publishing, and subscription handling.
 */

class MessagingLayer {
  constructor() {
    this.kafkaConnected = false;
    this.mqttConnected = false;
  }

  /**
   * Initialize messaging layer
   */
  async initialize() {
    try {
      // Only connect to Kafka if brokers are configured
      if (process.env.KAFKA_BROKERS && process.env.KAFKA_BROKERS.trim() !== '') {
        await kafkaClient.connectProducer();
        await kafkaClient.connectConsumer();
        this.kafkaConnected = true;
        logger.info('Kafka messaging initialized successfully');
      } else {
        logger.info('Kafka messaging disabled (no brokers configured)');
      }
      
      // Only connect to MQTT if URL is configured
      if (process.env.MQTT_URL && process.env.MQTT_URL.trim() !== '') {
        // MQTT connection is handled automatically by the client
        this.mqttConnected = true;
        logger.info('MQTT messaging initialized successfully');
      } else {
        logger.info('MQTT messaging disabled (no URL configured)');
      }
      
      logger.info('Messaging layer initialized successfully');
    } catch (error) {
      logger.warn('Failed to initialize messaging layer:', error.message);
      // Don't throw error, allow application to continue running
      // Messaging will be disabled but API will still work
    }
  }

  /**
   * Publish message to appropriate messaging system
   * @param {string} topic - Message topic
   * @param {Object} message - Message payload
   * @param {string} protocol - Messaging protocol ('kafka' or 'mqtt')
   */
  async publishMessage(topic, message, protocol = 'kafka') {
    try {
      if (protocol === 'kafka' && this.kafkaConnected) {
        await kafkaClient.sendMessage(topic, message);
        trackKafkaMessage(topic);
      } else if (protocol === 'mqtt' && this.mqttConnected) {
        mqttClient.publishMessage(topic, message);
        trackMqttMessage(topic);
      } else {
        // If messaging isn't connected, log a warning but don't throw an error
        logger.debug(`Messaging not connected, skipping message publish to ${topic} via ${protocol}`);
        return;
      }
    } catch (error) {
      logger.error(`Failed to publish message to ${protocol}:`, error);
      // Don't throw error, allow application to continue running
    }
  }

  /**
   * Subscribe to messages from appropriate messaging system
   * @param {string} topic - Message topic
   * @param {Function} callback - Callback function to handle messages
   * @param {string} protocol - Messaging protocol ('kafka' or 'mqtt')
   */
  async subscribeToTopic(topic, callback, protocol = 'kafka') {
    try {
      if (protocol === 'kafka' && this.kafkaConnected) {
        await kafkaClient.consumer.subscribe({ topic });
        await kafkaClient.consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            try {
              const parsedMessage = JSON.parse(message.value.toString());
              await callback(topic, parsedMessage);
            } catch (parseError) {
              logger.error('Failed to parse Kafka message:', parseError);
            }
          },
        });
      } else if (protocol === 'mqtt' && this.mqttConnected) {
        mqttClient.subscribeToTopic(topic);
        mqttClient.handleMessage(callback);
      } else {
        // If messaging isn't connected, log a warning but don't throw an error
        logger.debug(`Messaging not connected, skipping subscription to ${topic} via ${protocol}`);
        return;
      }
    } catch (error) {
      logger.error(`Failed to subscribe to topic ${topic} on ${protocol}:`, error);
      // Don't throw error, allow application to continue running
    }
  }

  /**
   * Gracefully shutdown messaging layer
   */
  async shutdown() {
    try {
      if (this.kafkaConnected) {
        await kafkaClient.disconnectProducer();
        await kafkaClient.disconnectConsumer();
        this.kafkaConnected = false;
      }
      
      if (this.mqttConnected) {
        mqttClient.client.end();
        this.mqttConnected = false;
      }
      
      logger.info('Messaging layer shutdown successfully');
    } catch (error) {
      logger.error('Failed to shutdown messaging layer:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new MessagingLayer();