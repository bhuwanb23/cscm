#!/usr/bin/env node

/**
 * SQLite Database Demo Script
 * 
 * This script demonstrates the SQLite database functionality with a realistic scenario.
 */

const sqliteDatabase = require('./sqliteDatabase');

async function demoSqliteDatabase() {
  console.log('🚀 Starting SQLite Database Demo...\n');
  
  try {
    // Initialize database
    await sqliteDatabase.initialize();
    console.log('✅ Database initialized successfully\n');
    
    // Demo: Store inventory management
    console.log('🏪 Store Inventory Management Demo');
    console.log('----------------------------------');
    
    // Add products to store inventory
    const storeId = 'STORE-NYC-001';
    
    const products = [
      {
        product_id: 'SKU-APPLE-IPHONE-15',
        store_id: storeId,
        quantity: 50,
        reserved_quantity: 5,
        min_stock_level: 20,
        max_stock_level: 100,
        unit_cost: 799.99,
        selling_price: 999.99
      },
      {
        product_id: 'SKU-SAMSUNG-GALAXY-S24',
        store_id: storeId,
        quantity: 30,
        reserved_quantity: 2,
        min_stock_level: 15,
        max_stock_level: 60,
        unit_cost: 699.99,
        selling_price: 899.99
      },
      {
        product_id: 'SKU-GOOGLE-PIXEL-8',
        store_id: storeId,
        quantity: 25,
        reserved_quantity: 0,
        min_stock_level: 10,
        max_stock_level: 50,
        unit_cost: 599.99,
        selling_price: 799.99
      }
    ];
    
    // Upsert all products
    for (const product of products) {
      const id = await sqliteDatabase.upsertInventory(product);
      console.log(`📦 Added/Updated inventory for ${product.product_id} with ID: ${id}`);
    }
    
    console.log('');
    
    // Retrieve and display inventory
    const inventoryItems = await sqliteDatabase.getInventoryByStore(storeId);
    console.log(`📋 Current inventory for ${storeId}:`);
    inventoryItems.forEach(item => {
      const available = item.quantity - item.reserved_quantity;
      console.log(`  ${item.product_id}: ${item.quantity} units (${available} available, ${item.reserved_quantity} reserved)`);
    });
    
    console.log('');
    
    // Demo: Order processing
    console.log('🛒 Order Processing Demo');
    console.log('------------------------');
    
    // Create an order
    const orderData = {
      order_id: 'ORDER-2025-0001',
      store_id: storeId,
      customer_id: 'CUST-12345',
      total_amount: 1899.98,
      status: 'confirmed'
    };
    
    const orderId = await sqliteDatabase.createOrder(orderData);
    console.log(`📝 Created order ${orderData.order_id} with ID: ${orderId}`);
    
    // Add order items
    const orderItems = [
      {
        order_id: 'ORDER-2025-0001',
        product_id: 'SKU-APPLE-IPHONE-15',
        quantity: 1,
        unit_price: 999.99,
        total_price: 999.99
      },
      {
        order_id: 'ORDER-2025-0001',
        product_id: 'SKU-GOOGLE-PIXEL-8',
        quantity: 1,
        unit_price: 799.99,
        total_price: 799.99
      }
    ];
    
    for (const item of orderItems) {
      const orderItemId = await sqliteDatabase.addOrderItem(item);
      console.log(`➕ Added item ${item.product_id} to order with ID: ${orderItemId}`);
    }
    
    console.log('');
    
    // Demo: Shipment processing
    console.log('🚚 Shipment Processing Demo');
    console.log('---------------------------');
    
    // Create a shipment for the order
    const shipmentData = {
      shipment_id: 'SHIP-2025-0001',
      order_id: 'ORDER-2025-0001',
      from_location: 'WAREHOUSE-NYC-01',
      to_location: storeId,
      status: 'processing',
      carrier: 'FedEx',
      tracking_number: '1234567890'
    };
    
    const shipmentId = await sqliteDatabase.createShipment(shipmentData);
    console.log(`🚛 Created shipment ${shipmentData.shipment_id} with ID: ${shipmentId}`);
    
    // Add shipment items
    const shipmentItems = [
      {
        shipment_id: 'SHIP-2025-0001',
        product_id: 'SKU-APPLE-IPHONE-15',
        quantity: 1
      },
      {
        shipment_id: 'SHIP-2025-0001',
        product_id: 'SKU-GOOGLE-PIXEL-8',
        quantity: 1
      }
    ];
    
    for (const item of shipmentItems) {
      const shipmentItemId = await sqliteDatabase.addShipmentItem(item);
      console.log(`📦 Added item ${item.product_id} to shipment with ID: ${shipmentItemId}`);
    }
    
    // Update shipment status to shipped
    await sqliteDatabase.updateShipmentStatus('SHIP-2025-0001', 'shipped');
    console.log(`🚢 Shipment ${shipmentData.shipment_id} status updated to: shipped`);
    
    // Later, update shipment status to delivered
    await sqliteDatabase.updateShipmentStatus('SHIP-2025-0001', 'delivered', {
      actual_delivery: new Date().toISOString()
    });
    console.log(`🏠 Shipment ${shipmentData.shipment_id} status updated to: delivered`);
    
    console.log('');
    
    // Retrieve delivered shipments
    const deliveredShipments = await sqliteDatabase.getShipmentsByStatus('delivered');
    console.log(`📦 Delivered shipments:`);
    deliveredShipments.forEach(shipment => {
      console.log(`  ${shipment.shipment_id}: ${shipment.order_id} delivered to ${shipment.to_location}`);
    });
    
    // Close database
    await sqliteDatabase.close();
    console.log('\n✅ Database closed successfully');
    
    console.log('\n🎉 SQLite database demo completed successfully!');
    console.log('💡 This demonstrates a complete inventory, order, and shipment workflow using SQLite.');
    
  } catch (error) {
    console.error('❌ SQLite database demo failed:', error.message);
    process.exit(1);
  }
}

// Run demo if script is executed directly
if (require.main === module) {
  demoSqliteDatabase();
}

module.exports = { demoSqliteDatabase };