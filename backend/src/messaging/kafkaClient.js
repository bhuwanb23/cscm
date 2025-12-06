const { Kafka } = require('kafkajs');
const config = require('../config');
const logger = require('../utils/logger');
const { trackError } = require('../utils/metrics');

// Only create Kafka client if brokers are configured
let kafka, producer, consumer;

if (config.kafka.brokers.length > 0) {
  // Create Kafka client
  kafka = new Kafka({
    clientId: config.kafka.clientId,
    brokers: config.kafka.brokers
  });

  // Create producer
  producer = kafka.producer();

  // Create consumer
  consumer = kafka.consumer({ groupId: 'cscm-backend-group' });
}

// Connect producer
const connectProducer = async () => {
  if (!producer) {
    logger.info('Kafka producer skipped (no brokers configured)');
    return;
  }
  
  try {
    await producer.connect();
    logger.info('Kafka producer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka producer:', error);
    trackError('connection', 'kafka-producer');
    throw error;
  }
};

// Connect consumer
const connectConsumer = async () => {
  if (!consumer) {
    logger.info('Kafka consumer skipped (no brokers configured)');
    return;
  }
  
  try {
    await consumer.connect();
    logger.info('Kafka consumer connected');
  } catch (error) {
    logger.error('Failed to connect Kafka consumer:', error);
    trackError('connection', 'kafka-consumer');
    throw error;
  }
};

// Disconnect producer
const disconnectProducer = async () => {
  if (!producer) {
    logger.info('Kafka producer disconnect skipped (no brokers configured)');
    return;
  }
  
  try {
    await producer.disconnect();
    logger.info('Kafka producer disconnected');
  } catch (error) {
    logger.error('Failed to disconnect Kafka producer:', error);
    trackError('disconnection', 'kafka-producer');
  }
};

// Disconnect consumer
const disconnectConsumer = async () => {
  if (!consumer) {
    logger.info('Kafka consumer disconnect skipped (no brokers configured)');
    return;
  }
  
  try {
    await consumer.disconnect();
    logger.info('Kafka consumer disconnected');
  } catch (error) {
    logger.error('Failed to disconnect Kafka consumer:', error);
  }
};

// Send message to topic
const sendMessage = async (topic, message) => {
  if (!producer) {
    logger.debug('Kafka message send skipped (no brokers configured)');
    return;
  }
  
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    logger.info(`Message sent to topic ${topic}`);
  } catch (error) {
    logger.error(`Failed to send message to topic ${topic}:`, error);
    throw error;
  }
};

module.exports = {
  producer,
  consumer,
  connectProducer,
  connectConsumer,
  disconnectProducer,
  disconnectConsumer,
  sendMessage
};