#!/usr/bin/env node

/**
 * SQLite Database Test Script
 * 
 * This script tests the SQLite database functionality.
 */

const sqliteDatabase = require('./sqliteDatabase');
const path = require('path');

async function testSqliteDatabase() {
  console.log('Testing SQLite Database...');
  
  try {
    // Initialize database
    await sqliteDatabase.initialize();
    console.log('✓ Database initialized successfully');
    
    // Test inserting inventory item
    const inventoryItem = {
      product_id: 'TEST-PRODUCT-001',
      store_id: 'TEST-STORE-001',
      quantity: 100,
      reserved_quantity: 10,
      min_stock_level: 20,
      max_stock_level: 200,
      unit_cost: 15.50,
      selling_price: 25.99
    };
    
    const inventoryId = await sqliteDatabase.upsertInventory(inventoryItem);
    console.log(`✓ Inserted inventory item with ID: ${inventoryId}`);
    
    // Test retrieving inventory items
    const inventoryItems = await sqliteDatabase.getInventoryByStore('TEST-STORE-001');
    console.log(`✓ Retrieved ${inventoryItems.length} inventory items`);
    
    // Test creating order
    const orderData = {
      order_id: 'ORDER-001',
      store_id: 'TEST-STORE-001',
      customer_id: 'CUSTOMER-001',
      total_amount: 129.95,
      status: 'confirmed'
    };
    
    const orderId = await sqliteDatabase.createOrder(orderData);
    console.log(`✓ Created order with ID: ${orderId}`);
    
    // Test adding order item
    const orderItem = {
      order_id: 'ORDER-001',
      product_id: 'TEST-PRODUCT-001',
      quantity: 5,
      unit_price: 25.99,
      total_price: 129.95
    };
    
    const orderItemId = await sqliteDatabase.addOrderItem(orderItem);
    console.log(`✓ Added order item with ID: ${orderItemId}`);
    
    // Test creating shipment
    const shipmentData = {
      shipment_id: 'SHIPMENT-001',
      order_id: 'ORDER-001',
      from_location: 'WAREHOUSE-001',
      to_location: 'TEST-STORE-001',
      status: 'shipped',
      carrier: 'FedEx',
      tracking_number: '1234567890',
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days from now
    };
    
    const shipmentId = await sqliteDatabase.createShipment(shipmentData);
    console.log(`✓ Created shipment with ID: ${shipmentId}`);
    
    // Test adding shipment item
    const shipmentItem = {
      shipment_id: 'SHIPMENT-001',
      product_id: 'TEST-PRODUCT-001',
      quantity: 5
    };
    
    const shipmentItemId = await sqliteDatabase.addShipmentItem(shipmentItem);
    console.log(`✓ Added shipment item with ID: ${shipmentItemId}`);
    
    // Test updating shipment status
    const updatedRows = await sqliteDatabase.updateShipmentStatus('SHIPMENT-001', 'delivered', {
      actual_delivery: new Date().toISOString()
    });
    console.log(`✓ Updated shipment status, ${updatedRows} rows affected`);
    
    // Test retrieving shipments by status
    const deliveredShipments = await sqliteDatabase.getShipmentsByStatus('delivered');
    console.log(`✓ Retrieved ${deliveredShipments.length} delivered shipments`);
    
    // Close database
    await sqliteDatabase.close();
    console.log('✓ Database closed successfully');
    
    console.log('\n🎉 SQLite database test completed successfully!');
    
  } catch (error) {
    console.error('SQLite database test failed:', error.message);
    process.exit(1);
  }
}

// Run test if script is executed directly
if (require.main === module) {
  testSqliteDatabase();
}

module.exports = { testSqliteDatabase };