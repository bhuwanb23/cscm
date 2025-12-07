const fs = require('fs');
const path = require('path');
const messagingLayer = require('../../messaging');

/**
 * Central Planner Agent
 * 
 * This agent coordinates between different agents, makes high-level decisions,
 * and optimizes the overall supply chain.
 */

class CentralPlannerAgent {
  constructor() {
    this.state = {
      stores: {},
      warehouses: {},
      transporters: {},
      plans: {},
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', '..', 'data', 'central_planner_state.json');
    this.loadState();
  }

  /**
   * Load agent state from local storage
   */
  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(data);
        console.log('Central Planner Agent: State loaded successfully');
      } else {
        console.log('Central Planner Agent: No existing state found, using defaults');
      }
    } catch (error) {
      console.error('Central Planner Agent: Failed to load state:', error.message);
    }
  }

  /**
   * Save agent state to local storage
   */
  saveState() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.storagePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(this.storagePath, JSON.stringify(this.state, null, 2));
      console.log('Central Planner Agent: State saved successfully');
    } catch (error) {
      console.error('Central Planner Agent: Failed to save state:', error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log('Central Planner Agent: Initializing...');
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        'inventory.restock.request', 
        this.handleRestockRequest.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        'shipment.ready.*', 
        this.handleShipmentReady.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        'delivery.assigned.*', 
        this.handleDeliveryAssigned.bind(this),
        'kafka'
      );
      
      console.log('Central Planner Agent: Initialized successfully');
    } catch (error) {
      console.error('Central Planner Agent: Initialization failed:', error.message);
    }
  }

  /**
   * Handle restock request messages
   */
  async handleRestockRequest(topic, message) {
    try {
      console.log('Central Planner Agent: Received restock request', message);
      
      // Process restock request
      await this.processRestockRequest(message);
    } catch (error) {
      console.error('Central Planner Agent: Failed to handle restock request:', error.message);
    }
  }

  /**
   * Handle shipment ready messages
   */
  async handleShipmentReady(topic, message) {
    try {
      console.log('Central Planner Agent: Received shipment ready notification', message);
      
      // Process shipment ready notification
      await this.processShipmentReady(message);
    } catch (error) {
      console.error('Central Planner Agent: Failed to handle shipment ready notification:', error.message);
    }
  }

  /**
   * Handle delivery assigned messages
   */
  async handleDeliveryAssigned(topic, message) {
    try {
      console.log('Central Planner Agent: Received delivery assigned notification', message);
      
      // Process delivery assigned notification
      await this.processDeliveryAssigned(message);
    } catch (error) {
      console.error('Central Planner Agent: Failed to handle delivery assigned notification:', error.message);
    }
  }

  /**
   * Process restock request
   */
  async processRestockRequest(request) {
    try {
      const { storeId, productId, quantity, urgency } = request;
      
      console.log(`Central Planner Agent: Processing restock request for store ${storeId}, product ${productId}`);
      
      // Find nearest warehouse with sufficient inventory
      const warehouseId = await this.findNearestWarehouseWithInventory(productId, quantity, storeId);
      
      if (!warehouseId) {
        console.log(`Central Planner Agent: No warehouse found with sufficient inventory for product ${productId}`);
        return;
      }
      
      console.log(`Central Planner Agent: Found warehouse ${warehouseId} for restock request`);
      
      // Create shipment plan
      const planId = `PLAN-${Date.now()}`;
      this.state.plans[planId] = {
        type: 'restock',
        storeId: storeId,
        warehouseId: warehouseId,
        productId: productId,
        quantity: quantity,
        urgency: urgency,
        status: 'planned',
        createdAt: new Date().toISOString()
      };
      
      this.saveState();
      
      // Send shipment request to warehouse
      messagingLayer.publishMessage(
        `shipment.request.${warehouseId}`,
        {
          shipmentId: `SHIP-${Date.now()}`,
          items: [{ productId: productId, quantity: quantity }],
          priority: urgency,
          destination: storeId,
          source: warehouseId
        },
        'kafka'
      );
      
      // Update plan status
      this.state.plans[planId].status = 'executing';
      this.saveState();
      
      console.log(`Central Planner Agent: Restock plan ${planId} created and executed`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to process restock request:', error.message);
    }
  }

  /**
   * Process shipment ready notification
   */
  async processShipmentReady(notification) {
    try {
      const { shipmentId, warehouseId, status } = notification;
      
      console.log(`Central Planner Agent: Processing shipment ready notification for ${shipmentId}`);
      
      // Find associated plan
      const planId = Object.keys(this.state.plans).find(id => 
        this.state.plans[id].warehouseId === warehouseId && 
        this.state.plans[id].status === 'executing'
      );
      
      if (!planId) {
        console.log(`Central Planner Agent: No plan found for shipment ${shipmentId}`);
        return;
      }
      
      // Update plan status
      this.state.plans[planId].status = 'shipping';
      this.state.plans[planId].shipmentId = shipmentId;
      this.state.plans[planId].shippedAt = new Date().toISOString();
      this.saveState();
      
      // Assign delivery to transporter
      await this.assignDeliveryToTransporter(planId);
      
      console.log(`Central Planner Agent: Shipment ${shipmentId} ready and delivery assigned`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to process shipment ready notification:', error.message);
    }
  }

  /**
   * Process delivery assigned notification
   */
  async processDeliveryAssigned(notification) {
    try {
      const { deliveryId, transportId, status } = notification;
      
      console.log(`Central Planner Agent: Processing delivery assigned notification for ${deliveryId}`);
      
      // Find associated plan
      const planId = Object.keys(this.state.plans).find(id => 
        this.state.plans[id].status === 'shipping'
      );
      
      if (!planId) {
        console.log(`Central Planner Agent: No plan found for delivery ${deliveryId}`);
        return;
      }
      
      // Update plan status
      this.state.plans[planId].status = 'in_transit';
      this.state.plans[planId].deliveryId = deliveryId;
      this.state.plans[planId].inTransitAt = new Date().toISOString();
      this.saveState();
      
      console.log(`Central Planner Agent: Delivery ${deliveryId} assigned and plan updated`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to process delivery assigned notification:', error.message);
    }
  }

  /**
   * Find nearest warehouse with sufficient inventory
   */
  async findNearestWarehouseWithInventory(productId, quantity, storeId) {
    try {
      // In a real implementation, this would use geolocation data and inventory levels
      // For this prototype, we'll just return the first warehouse
      const warehouseIds = Object.keys(this.state.warehouses);
      if (warehouseIds.length > 0) {
        return warehouseIds[0];
      }
      
      // If no warehouses registered, create a default one
      const defaultWarehouseId = 'WAREHOUSE-DEFAULT';
      this.state.warehouses[defaultWarehouseId] = {
        id: defaultWarehouseId,
        location: { lat: 0, lng: 0 },
        inventory: {}
      };
      
      this.saveState();
      return defaultWarehouseId;
    } catch (error) {
      console.error('Central Planner Agent: Failed to find nearest warehouse:', error.message);
      return null;
    }
  }

  /**
   * Assign delivery to transporter
   */
  async assignDeliveryToTransporter(planId) {
    try {
      const plan = this.state.plans[planId];
      if (!plan) {
        console.error(`Central Planner Agent: Plan ${planId} not found`);
        return;
      }
      
      console.log(`Central Planner Agent: Assigning delivery for plan ${planId}`);
      
      // Find available transporter
      const transporterIds = Object.keys(this.state.transporters);
      if (transporterIds.length === 0) {
        // Create a default transporter if none exist
        const defaultTransporterId = 'TRANSPORTER-DEFAULT';
        this.state.transporters[defaultTransporterId] = {
          id: defaultTransporterId,
          vehicles: {},
          status: 'available'
        };
        transporterIds.push(defaultTransporterId);
      }
      
      // Assign to first available transporter
      const transporterId = transporterIds[0];
      
      // Send delivery assignment
      messagingLayer.publishMessage(
        `delivery.assignment.${transporterId}`,
        {
          deliveryId: `DELIVERY-${Date.now()}`,
          planId: planId,
          from: plan.warehouseId,
          to: plan.storeId,
          items: [{ productId: plan.productId, quantity: plan.quantity }],
          weight: plan.quantity * 0.5, // Assume 0.5kg per unit
          priority: plan.urgency
        },
        'kafka'
      );
      
      console.log(`Central Planner Agent: Delivery assigned to transporter ${transporterId}`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to assign delivery to transporter:', error.message);
    }
  }

  /**
   * Register a store with the central planner
   */
  registerStore(storeId, location) {
    try {
      this.state.stores[storeId] = {
        id: storeId,
        location: location,
        registeredAt: new Date().toISOString()
      };
      
      this.saveState();
      console.log(`Central Planner Agent: Registered store ${storeId}`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to register store:', error.message);
    }
  }

  /**
   * Register a warehouse with the central planner
   */
  registerWarehouse(warehouseId, location) {
    try {
      this.state.warehouses[warehouseId] = {
        id: warehouseId,
        location: location,
        registeredAt: new Date().toISOString()
      };
      
      this.saveState();
      console.log(`Central Planner Agent: Registered warehouse ${warehouseId}`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to register warehouse:', error.message);
    }
  }

  /**
   * Register a transporter with the central planner
   */
  registerTransporter(transporterId) {
    try {
      this.state.transporters[transporterId] = {
        id: transporterId,
        registeredAt: new Date().toISOString()
      };
      
      this.saveState();
      console.log(`Central Planner Agent: Registered transporter ${transporterId}`);
    } catch (error) {
      console.error('Central Planner Agent: Failed to register transporter:', error.message);
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const agent = new CentralPlannerAgent();
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log('Central Planner Agent is running...');
    
    // For demo purposes, register some entities
    agent.registerStore('STORE-1', { lat: 12.9716, lng: 77.5946 }); // Bangalore
    agent.registerStore('STORE-2', { lat: 13.0827, lng: 80.2707 }); // Chennai
    agent.registerWarehouse('WAREHOUSE-1', { lat: 17.3850, lng: 78.4867 }); // Hyderabad
    
    // For demo purposes, simulate some restock requests
    setInterval(() => {
      // Simulate random restock requests
      const storeIds = Object.keys(agent.state.stores);
      const productIds = ['product_a', 'product_b', 'product_c'];
      
      if (storeIds.length > 0) {
        const randomStoreId = storeIds[Math.floor(Math.random() * storeIds.length)];
        const randomProductId = productIds[Math.floor(Math.random() * productIds.length)];
        const randomQuantity = Math.floor(Math.random() * 50) + 10; // 10-60 units
        const urgencies = ['low', 'normal', 'high'];
        const randomUrgency = urgencies[Math.floor(Math.random() * urgencies.length)];
        
        messagingLayer.publishMessage(
          'inventory.restock.request',
          {
            storeId: randomStoreId,
            productId: randomProductId,
            quantity: randomQuantity,
            urgency: randomUrgency
          },
          'kafka'
        );
      }
    }, 90000); // Every 90 seconds
  });
}

module.exports = CentralPlannerAgent;