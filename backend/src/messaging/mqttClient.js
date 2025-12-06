const mqtt = require('mqtt');
const config = require('../config');
const logger = require('../utils/logger');

// Create MQTT client
const client = mqtt.connect(config.mqtt.url);

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

// Publish message
const publishMessage = (topic, message) => {
  if (client.connected) {
    client.publish(topic, JSON.stringify(message));
    logger.info(`Message published to topic ${topic}`);
  } else {
    logger.warn('MQTT client not connected, unable to publish message');
  }
};

// Subscribe to topic
const subscribeToTopic = (topic) => {
  client.subscribe(topic, (err) => {
    if (err) {
      logger.error(`Failed to subscribe to topic ${topic}:`, err);
    } else {
      logger.info(`Subscribed to topic ${topic}`);
    }
  });
};

// Handle incoming messages
const handleMessage = (callback) => {
  client.on('message', (topic, message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      callback(topic, parsedMessage);
    } catch (error) {
      logger.error('Failed to parse MQTT message:', error);
    }
  });
};

module.exports = {
  client,
  publishMessage,
  subscribeToTopic,
  handleMessage
};