const mqtt = require('mqtt');
const config = require('../config');
const logger = require('../utils/logger');

// Only create MQTT client if URL is configured
let client;

if (config.mqtt.url && config.mqtt.url.trim() !== '') {
  // Create MQTT client
  client = mqtt.connect(config.mqtt.url);

  // Handle connection
  client.on('connect', () => {
    logger.info('MQTT client connected to broker');
  });

  // Handle errors
  client.on('error', (error) => {
    logger.error('MQTT client error:', error);
  });

  // Handle disconnect
  client.on('close', () => {
    logger.info('MQTT client disconnected from broker');
  });
} else {
  logger.info('MQTT client skipped (no URL configured)');
  client = {
    connected: false,
    publish: () => {},
    subscribe: () => {},
    on: () => {},
    end: () => {}
  };
}

// Publish message
const publishMessage = (topic, message) => {
  if (client.connected) {
    client.publish(topic, JSON.stringify(message));
    logger.info(`Message published to topic ${topic}`);
  } else {
    logger.debug('MQTT client not connected, unable to publish message');
  }
};

// Subscribe to topic
const subscribeToTopic = (topic) => {
  if (client.connected) {
    client.subscribe(topic, (err) => {
      if (err) {
        logger.error(`Failed to subscribe to topic ${topic}:`, err);
      } else {
        logger.info(`Subscribed to topic ${topic}`);
      }
    });
  } else {
    logger.debug('MQTT client not connected, unable to subscribe to topic');
  }
};

// Handle incoming messages
const handleMessage = (callback) => {
  if (client.connected) {
    client.on('message', (topic, message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        callback(topic, parsedMessage);
      } catch (error) {
        logger.error('Failed to parse MQTT message:', error);
      }
    });
  } else {
    logger.debug('MQTT client not connected, unable to handle messages');
  }
};

module.exports = {
  client,
  publishMessage,
  subscribeToTopic,
  handleMessage
};