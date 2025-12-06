#!/usr/bin/env node

/**
 * Redis Messaging Test Script
 * 
 * This script tests the Redis messaging functionality.
 */

const redisClient = require('./redisClient');
const logger = require('../utils/logger');

async function testRedisMessaging() {
  console.log('Testing Redis Messaging...');
  
  try {
    // Connect to Redis
    await redisClient.connect();
    
    if (!redisClient.getStatus()) {
      console.error('Failed to connect to Redis');
      process.exit(1);
    }
    
    console.log('✓ Connected to Redis successfully');
    
    // Test message publishing
    const testMessage = {
      productId: 'TEST-PRODUCT',
      storeId: 'TEST-STORE',
      quantity: 100,
      reason: 'test_message'
    };
    
    await redisClient.sendMessage('inventory.update.TEST-STORE', testMessage);
    console.log('✓ Published test message to inventory.update.TEST-STORE');
    
    // Test subscription
    await redisClient.subscribeToTopic('inventory.update.TEST-STORE', (topic, message) => {
      console.log(`✓ Received message on topic ${topic}:`, message);
    });
    
    console.log('✓ Subscribed to inventory.update.TEST-STORE');
    
    // Wait a bit to see if we receive our own message
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Disconnect
    await redisClient.disconnect();
    console.log('✓ Disconnected from Redis');
    
    console.log('\n🎉 Redis messaging test completed successfully!');
    
  } catch (error) {
    console.error('Redis messaging test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testRedisMessaging();
}

module.exports = { testRedisMessaging };