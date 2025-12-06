const fs = require('fs');
const path = require('path');
const messagingLayer = require('../messaging');

/**
 * Warehouse Agent
 * 
 * This agent manages warehouse operations including picking, packing,
 * shipping, and inventory allocation.
 */

class WarehouseAgent {
  constructor(warehouseId) {
    this.warehouseId = warehouseId;
    this.state = {
      inventory: {},
      shipments: {},
      pickingQueue: [],
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', 'data', `warehouse_${warehouseId}_state.json`);
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
        console.log(`Warehouse Agent ${this.warehouseId}: State loaded successfully`);
      } else {
        console.log(`Warehouse Agent ${this.warehouseId}: No existing state found, using defaults`);
      }
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to load state:`, error.message);
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
      console.log(`Warehouse Agent ${this.warehouseId}: State saved successfully`);
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to save state:`, error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Initializing...`);
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        `shipment.request.${this.warehouseId}`, 
        this.handleShipmentRequest.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `inventory.allocation.${this.warehouseId}`, 
        this.handleInventoryAllocation.bind(this),
        'kafka'
      );
      
      console.log(`Warehouse Agent ${this.warehouseId}: Initialized successfully`);
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle shipment request messages
   */
  async handleShipmentRequest(topic, message) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Received shipment request`, message);
      
      // Add to picking queue
      const shipmentId = message.shipmentId || `SHIP-${Date.now()}`;
      this.state.shipments[shipmentId] = {
        ...message,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      this.state.pickingQueue.push({
        shipmentId: shipmentId,
        priority: message.priority || 'normal',
        items: message.items || []
      });
      
      this.saveState();
      
      // Process picking queue
      this.processPickingQueue();
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to handle shipment request:`, error.message);
    }
  }

  /**
   * Handle inventory allocation messages
   */
  async handleInventoryAllocation(topic, message) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Received inventory allocation`, message);
      
      // Update local inventory state
      if (message.productId && message.quantity !== undefined) {
        this.state.inventory[message.productId] = {
          ...this.state.inventory[message.productId],
          allocated: (this.state.inventory[message.productId]?.allocated || 0) + message.quantity,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to handle inventory allocation:`, error.message);
    }
  }

  /**
   * Process the picking queue
   */
  async processPickingQueue() {
    try {
      if (this.state.pickingQueue.length === 0) {
        return;
      }
      
      console.log(`Warehouse Agent ${this.warehouseId}: Processing ${this.state.pickingQueue.length} shipment requests`);
      
      // Sort by priority (high, normal, low)
      this.state.pickingQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
      
      // Process one item at a time
      const pickingTask = this.state.pickingQueue.shift();
      const shipmentId = pickingTask.shipmentId;
      
      console.log(`Warehouse Agent ${this.warehouseId}: Processing shipment ${shipmentId}`);
      
      // Update shipment status
      this.state.shipments[shipmentId].status = 'picking';
      this.saveState();
      
      // Simulate picking process (in a real implementation, this would interface with warehouse systems)
      await this.simulatePickingProcess(pickingTask);
      
      // Move to next stage
      this.state.shipments[shipmentId].status = 'packing';
      this.saveState();
      
      // Simulate packing process
      await this.simulatePackingProcess(pickingTask);
      
      // Mark as ready for shipping
      this.state.shipments[shipmentId].status = 'ready_for_shipping';
      this.state.shipments[shipmentId].readyAt = new Date().toISOString();
      this.saveState();
      
      // Publish shipment ready notification
      messagingLayer.publishMessage(
        `shipment.ready.${this.warehouseId}`,
        {
          shipmentId: shipmentId,
          warehouseId: this.warehouseId,
          status: 'ready_for_shipping',
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Warehouse Agent ${this.warehouseId}: Completed processing shipment ${shipmentId}`);
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to process picking queue:`, error.message);
    }
  }

  /**
   * Simulate picking process
   */
  async simulatePickingProcess(pickingTask) {
    return new Promise(resolve => {
      console.log(`Warehouse Agent ${this.warehouseId}: Simulating picking for shipment ${pickingTask.shipmentId}`);
      
      // Simulate time taken for picking
      setTimeout(() => {
        console.log(`Warehouse Agent ${this.warehouseId}: Picking completed for shipment ${pickingTask.shipmentId}`);
        resolve();
      }, 2000); // 2 seconds simulation
    });
  }

  /**
   * Simulate packing process
   */
  async simulatePackingProcess(pickingTask) {
    return new Promise(resolve => {
      console.log(`Warehouse Agent ${this.warehouseId}: Simulating packing for shipment ${pickingTask.shipmentId}`);
      
      // Simulate time taken for packing
      setTimeout(() => {
        console.log(`Warehouse Agent ${this.warehouseId}: Packing completed for shipment ${pickingTask.shipmentId}`);
        resolve();
      }, 1500); // 1.5 seconds simulation
    });
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      warehouseId: this.warehouseId,
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const warehouseId = process.argv[2] || 'default';
  const agent = new WarehouseAgent(warehouseId);
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log(`Warehouse Agent ${warehouseId} is running...`);
    
    // For demo purposes, simulate some shipment requests
    setInterval(() => {
      // Simulate random shipment requests
      const products = ['product_a', 'product_b', 'product_c'];
      const items = [];
      
      // Add 1-3 random products to shipment
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < itemCount; i++) {
        items.push({
          productId: products[Math.floor(Math.random() * products.length)],
          quantity: Math.floor(Math.random() * 10) + 1
        });
      }
      
      messagingLayer.publishMessage(
        `shipment.request.${warehouseId}`,
        {
          shipmentId: `SHIP-${Date.now()}`,
          items: items,
          priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)],
          destination: `STORE-${Math.floor(Math.random() * 5) + 1}`
        },
        'kafka'
      );
    }, 45000); // Every 45 seconds
  });
}

module.exports = WarehouseAgent;