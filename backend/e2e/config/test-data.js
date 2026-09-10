/**
 * Test Data Fixtures
 * Consistent test data for E2E testing
 */

module.exports = {
  // Shopkeeper test data
  shopkeepers: [
    {
      id: 'shop_test_1',
      name: 'Test Shop Alpha',
      email: 'shop1@test.cscm',
      location: 'Location A',
      address: '123 Test Street, City A',
      phone: '+1234567890'
    },
    {
      id: 'shop_test_2',
      name: 'Test Shop Beta',
      email: 'shop2@test.cscm',
      location: 'Location B',
      address: '456 Test Avenue, City B',
      phone: '+1234567891'
    }
  ],

  // Transporter test data
  transporters: [
    {
      id: 'transport_test_1',
      name: 'Test Driver Alpha',
      email: 'driver1@test.cscm',
      vehicle: 'Van 001',
      vehicleType: 'van',
      licensePlate: 'TEST-001',
      capacity: 500
    },
    {
      id: 'transport_test_2',
      name: 'Test Driver Beta',
      email: 'driver2@test.cscm',
      vehicle: 'Truck 001',
      vehicleType: 'truck',
      licensePlate: 'TEST-002',
      capacity: 2000
    }
  ],

  // Wholesaler test data
  wholesalers: [
    {
      id: 'wholesale_test_1',
      name: 'Test Wholesaler Alpha',
      email: 'wholesale1@test.cscm',
      warehouses: ['warehouse_test_1', 'warehouse_test_2'],
      location: 'Distribution Center A'
    }
  ],

  // Warehouse test data
  warehouses: [
    {
      id: 'warehouse_test_1',
      name: 'Test Warehouse Alpha',
      location: 'Warehouse Zone A',
      capacity: 10000,
      manager: 'Manager Test A'
    },
    {
      id: 'warehouse_test_2',
      name: 'Test Warehouse Beta',
      location: 'Warehouse Zone B',
      capacity: 15000,
      manager: 'Manager Test B'
    }
  ],

  // Inventory test data
  inventory: [
    {
      sku_id: 'SKU_TEST_001',
      product_name: 'Test Product Alpha',
      store_id: 'shop_test_1',
      quantity: 100,
      reorder_point: 20,
      unit_cost: 10.50,
      category: 'electronics'
    },
    {
      sku_id: 'SKU_TEST_002',
      product_name: 'Test Product Beta',
      store_id: 'shop_test_1',
      quantity: 50,
      reorder_point: 15,
      unit_cost: 25.00,
      category: 'clothing'
    },
    {
      sku_id: 'SKU_TEST_003',
      product_name: 'Test Product Gamma',
      store_id: 'shop_test_2',
      quantity: 75,
      reorder_point: 25,
      unit_cost: 15.75,
      category: 'food'
    },
    {
      sku_id: 'SKU_TEST_004',
      product_name: 'Test Product Delta',
      store_id: 'warehouse_test_1',
      quantity: 500,
      reorder_point: 100,
      unit_cost: 8.25,
      category: 'household'
    }
  ],

  // Order test data
  orders: [
    {
      order_id: 'ORDER_TEST_001',
      store_id: 'shop_test_1',
      status: 'pending',
      items: [
        { sku_id: 'SKU_TEST_001', quantity: 10 },
        { sku_id: 'SKU_TEST_002', quantity: 5 }
      ],
      total_amount: 180.00,
      created_at: new Date().toISOString()
    },
    {
      order_id: 'ORDER_TEST_002',
      store_id: 'shop_test_2',
      status: 'processing',
      items: [
        { sku_id: 'SKU_TEST_003', quantity: 20 }
      ],
      total_amount: 315.00,
      created_at: new Date().toISOString()
    }
  ],

  // Shipment test data
  shipments: [
    {
      shipment_id: 'SHIP_TEST_001',
      order_id: 'ORDER_TEST_001',
      status: 'in_transit',
      origin: 'warehouse_test_1',
      destination: 'shop_test_1',
      transporter_id: 'transport_test_1',
      estimated_delivery: new Date(Date.now() + 86400000).toISOString(),
      items: [
        { sku_id: 'SKU_TEST_001', quantity: 10 },
        { sku_id: 'SKU_TEST_002', quantity: 5 }
      ]
    },
    {
      shipment_id: 'SHIP_TEST_002',
      order_id: 'ORDER_TEST_002',
      status: 'delivered',
      origin: 'warehouse_test_1',
      destination: 'shop_test_2',
      transporter_id: 'transport_test_2',
      estimated_delivery: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { sku_id: 'SKU_TEST_003', quantity: 20 }
      ]
    }
  ],

  // Supplier test data
  suppliers: [
    {
      supplier_id: 'SUPPLIER_TEST_1',
      name: 'Test Supplier Alpha',
      location: 'Supplier Region A',
      risk_score: 0.3,
      performance_score: 0.85
    },
    {
      supplier_id: 'SUPPLIER_TEST_2',
      name: 'Test Supplier Beta',
      location: 'Supplier Region B',
      risk_score: 0.5,
      performance_score: 0.75
    }
  ],

  // AI/ML test data
  aiMlTestData: {
    demandForecast: {
      sku_id: 'SKU_TEST_001',
      store_id: 'shop_test_1',
      forecast_horizon: 30,
      historical_days: 90
    },
    inventoryOptimization: {
      sku_id: 'SKU_TEST_001',
      store_id: 'shop_test_1',
      current_quantity: 100,
      holding_cost: 0.1,
      ordering_cost: 50
    },
    routingOptimization: {
      shipments: ['SHIP_TEST_001'],
      depot: 'warehouse_test_1',
      capacity: 2000
    },
    anomalyDetection: {
      data_type: 'inventory',
      entity_id: 'shop_test_1',
      time_range: '7d'
    }
  },

  // Authentication test data
  authData: {
    shopkeeper: {
      email: 'shopkeeper@test.cscm',
      password: 'test123',
      role: 'shopkeeper'
    },
    transporter: {
      email: 'transporter@test.cscm',
      password: 'test123',
      role: 'transporter'
    },
    wholesaler: {
      email: 'wholesaler@test.cscm',
      password: 'test123',
      role: 'wholesaler'
    }
  },

  // Performance test data
  performanceData: {
    loadTestUsers: 10,
    requestsPerSecond: 100,
    testDuration: 300,
    concurrentShopkeepers: 5,
    concurrentTransporters: 3,
    concurrentWholesalers: 2
  },

  // Helper function to get test data by ID
  getData(type, id) {
    const data = this[type];
    if (!data) return null;
    return data.find(item => item.id === id || item[type.slice(0, -1) + '_id'] === id);
  },

  // Helper function to get all test data of a type
  getAllData(type) {
    return this[type] || [];
  }
};
