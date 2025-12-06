const fs = require('fs');
const path = require('path');
const messagingLayer = require('../messaging');

/**
 * Store Agent
 * 
 * This agent manages store-level inventory, demand forecasting,
 * and restocking decisions.
 */

class StoreAgent {
  constructor(storeId) {
    this.storeId = storeId;
    this.state = {
      inventory: {},
      demandForecast: {},
      orders: [],
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', 'data', `store_${storeId}_state.json`);
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
        console.log(`Store Agent ${this.storeId}: State loaded successfully`);
      } else {
        console.log(`Store Agent ${this.storeId}: No existing state found, using defaults`);
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to load state:`, error.message);
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
      console.log(`Store Agent ${this.storeId}: State saved successfully`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to save state:`, error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log(`Store Agent ${this.storeId}: Initializing...`);
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        `inventory.update.${this.storeId}`, 
        this.handleInventoryUpdate.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `demand.forecast.${this.storeId}`, 
        this.handleDemandForecast.bind(this),
        'kafka'
      );
      
      console.log(`Store Agent ${this.storeId}: Initialized successfully`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle inventory update messages
   */
  async handleInventoryUpdate(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received inventory update`, message);
      
      // Update local inventory state
      if (message.productId && message.quantity !== undefined) {
        this.state.inventory[message.productId] = {
          ...this.state.inventory[message.productId],
          quantity: message.quantity,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle inventory update:`, error.message);
    }
  }

  /**
   * Handle demand forecast messages
   */
  async handleDemandForecast(topic, message) {
    try {
      console.log(`Store Agent ${this.storeId}: Received demand forecast`, message);
      
      // Update local demand forecast state
      if (message.productId && message.forecast) {
        this.state.demandForecast[message.productId] = {
          ...message.forecast,
          lastUpdated: new Date()
        };
        
        this.saveState();
        
        // Trigger restocking decision logic
        this.makeRestockingDecision(message.productId);
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to handle demand forecast:`, error.message);
    }
  }

  /**
   * Make restocking decisions based on inventory and demand forecast
   */
  makeRestockingDecision(productId) {
    try {
      const inventory = this.state.inventory[productId] || { quantity: 0 };
      const forecast = this.state.demandForecast[productId];
      
      if (!forecast) {
        console.log(`Store Agent ${this.storeId}: No forecast available for product ${productId}`);
        return;
      }
      
      // Simple restocking logic (in a real implementation, this would be more sophisticated)
      const currentStock = inventory.quantity || 0;
      const forecastedDemand = forecast.expectedDemand || 0;
      const safetyStock = forecast.safetyStock || 0;
      
      // If stock is below safety level, trigger restock
      if (currentStock < safetyStock) {
        const reorderQuantity = Math.max(forecastedDemand * 2, safetyStock * 2) - currentStock;
        
        console.log(`Store Agent ${this.storeId}: Low stock for product ${productId}. Requesting ${reorderQuantity} units`);
        
        // Publish restock request
        messagingLayer.publishMessage(
          'inventory.restock.request',
          {
            storeId: this.storeId,
            productId: productId,
            quantity: reorderQuantity,
            urgency: 'high'
          },
          'kafka'
        );
      }
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to make restocking decision:`, error.message);
    }
  }

  /**
   * Update inventory manually (for testing)
   */
  updateInventory(productId, quantity) {
    try {
      this.state.inventory[productId] = {
        ...this.state.inventory[productId],
        quantity: quantity,
        lastUpdated: new Date()
      };
      
      this.saveState();
      
      // Publish inventory update
      messagingLayer.publishMessage(
        `inventory.update.${this.storeId}`,
        {
          productId: productId,
          quantity: quantity,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Store Agent ${this.storeId}: Updated inventory for product ${productId} to ${quantity} units`);
    } catch (error) {
      console.error(`Store Agent ${this.storeId}: Failed to update inventory:`, error.message);
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      storeId: this.storeId,
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const storeId = process.argv[2] || 'default';
  const agent = new StoreAgent(storeId);
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log(`Store Agent ${storeId} is running...`);
    
    // For demo purposes, simulate some inventory updates
    setInterval(() => {
      // Simulate random inventory changes
      const products = ['product_a', 'product_b', 'product_c'];
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const randomQuantity = Math.floor(Math.random() * 100);
      
      agent.updateInventory(randomProduct, randomQuantity);
    }, 30000); // Every 30 seconds
  });
}

module.exports = StoreAgent;