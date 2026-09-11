/**
 * Database Connection Test
 * Tests PostgreSQL connectivity from the backend
 */

const createDatabase = require('../src/storage/database');

async function testDatabaseConnection() {
  console.log('=== Testing Database Connection ===\n');

  try {
    console.log('Creating database instance...');
    const database = createDatabase();

    console.log('Initializing database...');
    await database.initialize();
    console.log('✅ Database initialized successfully');

    // Test basic operations
    console.log('\nTesting basic database operations...');

    // Test upsert inventory
    console.log('Testing upsertInventory...');
    const inventoryId = await database.upsertInventory({
      product_id: 'TEST_PRODUCT',
      store_id: 'TEST_STORE',
      quantity: 100,
      unit_cost: 10.50,
      selling_price: 15.00
    });
    console.log(`✅ Upserted inventory with ID: ${inventoryId}`);

    // Test get inventory
    console.log('Testing getInventoryByStore...');
    const inventory = await database.getInventoryByStore('TEST_STORE');
    console.log(`✅ Retrieved ${inventory.length} inventory items`);
    console.log('   Sample:', JSON.stringify(inventory[0], null, 2));

    // Test create order
    console.log('Testing createOrder...');
    const orderId = await database.createOrder({
      order_id: 'TEST_ORDER',
      store_id: 'TEST_STORE',
      total_amount: 100.00,
      status: 'pending'
    });
    console.log(`✅ Created order with ID: ${orderId}`);

    // Test get order
    console.log('Testing getOrderById...');
    const order = await database.getOrderById('TEST_ORDER');
    console.log(`✅ Retrieved order:`, JSON.stringify(order, null, 2));

    // Test create shipment
    console.log('Testing createShipment...');
    const shipmentId = await database.createShipment({
      shipment_id: 'TEST_SHIPMENT',
      order_id: 'TEST_ORDER',
      from_location: 'WAREHOUSE_A',
      to_location: 'TEST_STORE',
      status: 'pending'
    });
    console.log(`✅ Created shipment with ID: ${shipmentId}`);

    // Test get shipment
    console.log('Testing getShipmentById...');
    const shipment = await database.getShipmentById('TEST_SHIPMENT');
    console.log(`✅ Retrieved shipment:`, JSON.stringify(shipment, null, 2));

    console.log('\n=== Database Connection Test: PASSED ===');
    return { success: true, message: 'All database operations successful' };

  } catch (error) {
    console.error('\n=== Database Connection Test: FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message };
  } finally {
    // Clean up
    try {
      const database = createDatabase();
      await database.close();
      console.log('\n✅ Database connection closed');
    } catch (error) {
      console.error('Error closing database:', error.message);
    }
  }
}

// Run test
if (require.main === module) {
  testDatabaseConnection()
    .then((result) => {
      if (result.success) {
        console.log('\n✅ Test completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Test failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Test failed with exception:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
