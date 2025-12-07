const fs = require('fs');
const path = require('path');
const messagingLayer = require('../../messaging');

/**
 * Simulation Agent
 * 
 * This agent generates simulated data for testing and demonstration purposes.
 * It simulates real-world events like inventory changes, demand fluctuations,
 * and supply chain disruptions.
 */

class SimulationAgent {
  constructor() {
    this.state = {
      scenarios: {},
      activeScenario: null,
      simulationSpeed: 1000, // milliseconds between events
      isRunning: false,
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', '..', 'data', 'simulation_state.json');
    this.loadState();
    this.eventInterval = null;
  }

  /**
   * Load agent state from local storage
   */
  loadState() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.state = JSON.parse(data);
        console.log('Simulation Agent: State loaded successfully');
      } else {
        console.log('Simulation Agent: No existing state found, using defaults');
      }
    } catch (error) {
      console.error('Simulation Agent: Failed to load state:', error.message);
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
      console.log('Simulation Agent: State saved successfully');
    } catch (error) {
      console.error('Simulation Agent: Failed to save state:', error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log('Simulation Agent: Initializing...');
      
      // Subscribe to control topics
      await messagingLayer.subscribeToTopic(
        'simulation.control', 
        this.handleControlMessage.bind(this),
        'kafka'
      );
      
      console.log('Simulation Agent: Initialized successfully');
    } catch (error) {
      console.error('Simulation Agent: Initialization failed:', error.message);
    }
  }

  /**
   * Handle control messages
   */
  async handleControlMessage(topic, message) {
    try {
      console.log('Simulation Agent: Received control message', message);
      
      switch (message.command) {
        case 'start':
          this.startSimulation(message.scenarioId);
          break;
        case 'stop':
          this.stopSimulation();
          break;
        case 'pause':
          this.pauseSimulation();
          break;
        case 'resume':
          this.resumeSimulation();
          break;
        case 'set_speed':
          this.setSimulationSpeed(message.speed);
          break;
        case 'load_scenario':
          this.loadScenario(message.scenarioId);
          break;
        default:
          console.log(`Simulation Agent: Unknown command ${message.command}`);
      }
    } catch (error) {
      console.error('Simulation Agent: Failed to handle control message:', error.message);
    }
  }

  /**
   * Start simulation
   */
  startSimulation(scenarioId = null) {
    try {
      if (this.state.isRunning) {
        console.log('Simulation Agent: Simulation is already running');
        return;
      }
      
      // Load scenario if specified
      if (scenarioId) {
        this.loadScenario(scenarioId);
      }
      
      // If no active scenario, use default
      if (!this.state.activeScenario) {
        this.loadDefaultScenario();
      }
      
      this.state.isRunning = true;
      this.saveState();
      
      // Start simulation loop
      this.eventInterval = setInterval(() => {
        this.generateSimulationEvent();
      }, this.state.simulationSpeed);
      
      console.log('Simulation Agent: Simulation started');
      
      // Publish simulation start notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'started',
          scenario: this.state.activeScenario,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to start simulation:', error.message);
    }
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    try {
      if (!this.state.isRunning) {
        console.log('Simulation Agent: Simulation is not running');
        return;
      }
      
      clearInterval(this.eventInterval);
      this.state.isRunning = false;
      this.saveState();
      
      console.log('Simulation Agent: Simulation stopped');
      
      // Publish simulation stop notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'stopped',
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to stop simulation:', error.message);
    }
  }

  /**
   * Pause simulation
   */
  pauseSimulation() {
    try {
      if (!this.state.isRunning) {
        console.log('Simulation Agent: Simulation is not running');
        return;
      }
      
      clearInterval(this.eventInterval);
      this.state.isRunning = false;
      this.saveState();
      
      console.log('Simulation Agent: Simulation paused');
      
      // Publish simulation pause notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'paused',
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to pause simulation:', error.message);
    }
  }

  /**
   * Resume simulation
   */
  resumeSimulation() {
    try {
      if (this.state.isRunning) {
        console.log('Simulation Agent: Simulation is already running');
        return;
      }
      
      if (!this.state.activeScenario) {
        console.log('Simulation Agent: No active scenario to resume');
        return;
      }
      
      this.state.isRunning = true;
      this.saveState();
      
      // Resume simulation loop
      this.eventInterval = setInterval(() => {
        this.generateSimulationEvent();
      }, this.state.simulationSpeed);
      
      console.log('Simulation Agent: Simulation resumed');
      
      // Publish simulation resume notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'resumed',
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to resume simulation:', error.message);
    }
  }

  /**
   * Set simulation speed
   */
  setSimulationSpeed(speed) {
    try {
      this.state.simulationSpeed = speed;
      this.saveState();
      
      // If simulation is running, restart the interval with new speed
      if (this.state.isRunning) {
        clearInterval(this.eventInterval);
        this.eventInterval = setInterval(() => {
          this.generateSimulationEvent();
        }, this.state.simulationSpeed);
      }
      
      console.log(`Simulation Agent: Simulation speed set to ${speed}ms`);
      
      // Publish speed change notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'speed_changed',
          speed: speed,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to set simulation speed:', error.message);
    }
  }

  /**
   * Load scenario
   */
  loadScenario(scenarioId) {
    try {
      // Check if scenario exists
      if (!this.state.scenarios[scenarioId]) {
        console.log(`Simulation Agent: Scenario ${scenarioId} not found`);
        return false;
      }
      
      this.state.activeScenario = scenarioId;
      this.saveState();
      
      console.log(`Simulation Agent: Loaded scenario ${scenarioId}`);
      
      // Publish scenario load notification
      messagingLayer.publishMessage(
        'simulation.status',
        {
          status: 'scenario_loaded',
          scenario: scenarioId,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      return true;
    } catch (error) {
      console.error('Simulation Agent: Failed to load scenario:', error.message);
      return false;
    }
  }

  /**
   * Load default scenario
   */
  loadDefaultScenario() {
    try {
      const defaultScenarioId = 'default_supply_chain';
      
      // Create default scenario if it doesn't exist
      if (!this.state.scenarios[defaultScenarioId]) {
        this.state.scenarios[defaultScenarioId] = {
          id: defaultScenarioId,
          name: 'Default Supply Chain Simulation',
          description: 'Basic supply chain simulation with stores, warehouses, and transporters',
          entities: {
            stores: ['STORE-1', 'STORE-2', 'STORE-3'],
            warehouses: ['WAREHOUSE-1', 'WAREHOUSE-2'],
            transporters: ['TRANSPORTER-1']
          },
          eventTypes: [
            'inventory_update',
            'demand_spike',
            'supplier_delay',
            'quality_issue'
          ],
          parameters: {
            base_inventory_level: 100,
            demand_variance: 0.2,
            supplier_reliability: 0.95
          }
        };
      }
      
      this.state.activeScenario = defaultScenarioId;
      this.saveState();
      
      console.log('Simulation Agent: Loaded default scenario');
    } catch (error) {
      console.error('Simulation Agent: Failed to load default scenario:', error.message);
    }
  }

  /**
   * Generate simulation event
   */
  generateSimulationEvent() {
    try {
      if (!this.state.activeScenario) {
        console.log('Simulation Agent: No active scenario');
        return;
      }
      
      const scenario = this.state.scenarios[this.state.activeScenario];
      if (!scenario) {
        console.log('Simulation Agent: Active scenario not found');
        return;
      }
      
      // Select random event type
      const eventType = scenario.eventTypes[Math.floor(Math.random() * scenario.eventTypes.length)];
      
      // Generate event based on type
      switch (eventType) {
        case 'inventory_update':
          this.generateInventoryUpdateEvent(scenario);
          break;
        case 'demand_spike':
          this.generateDemandSpikeEvent(scenario);
          break;
        case 'supplier_delay':
          this.generateSupplierDelayEvent(scenario);
          break;
        case 'quality_issue':
          this.generateQualityIssueEvent(scenario);
          break;
        default:
          console.log(`Simulation Agent: Unknown event type ${eventType}`);
      }
    } catch (error) {
      console.error('Simulation Agent: Failed to generate simulation event:', error.message);
    }
  }

  /**
   * Generate inventory update event
   */
  generateInventoryUpdateEvent(scenario) {
    try {
      // Select random store and product
      const storeId = scenario.entities.stores[Math.floor(Math.random() * scenario.entities.stores.length)];
      const productIds = ['product_a', 'product_b', 'product_c', 'product_d'];
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      
      // Generate random inventory change
      const baseLevel = scenario.parameters.base_inventory_level || 100;
      const variance = scenario.parameters.demand_variance || 0.2;
      const change = Math.floor(baseLevel * (Math.random() * variance * 2 - variance));
      const newQuantity = Math.max(0, baseLevel + change);
      
      console.log(`Simulation Agent: Generating inventory update for ${storeId}, product ${productId}: ${newQuantity}`);
      
      // Publish inventory update
      messagingLayer.publishMessage(
        `inventory.update.${storeId}`,
        {
          productId: productId,
          quantity: newQuantity,
          timestamp: new Date().toISOString(),
          source: 'simulation'
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to generate inventory update event:', error.message);
    }
  }

  /**
   * Generate demand spike event
   */
  generateDemandSpikeEvent(scenario) {
    try {
      // Select random store and product
      const storeId = scenario.entities.stores[Math.floor(Math.random() * scenario.entities.stores.length)];
      const productIds = ['product_a', 'product_b', 'product_c', 'product_d'];
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      
      // Generate demand forecast with spike
      const baseDemand = 50;
      const spikeMultiplier = Math.random() * 3 + 2; // 2-5x spike
      const expectedDemand = Math.floor(baseDemand * spikeMultiplier);
      const safetyStock = Math.floor(expectedDemand * 0.2);
      
      console.log(`Simulation Agent: Generating demand spike for ${storeId}, product ${productId}: ${expectedDemand}`);
      
      // Publish demand forecast
      messagingLayer.publishMessage(
        `demand.forecast.${storeId}`,
        {
          productId: productId,
          forecast: {
            expectedDemand: expectedDemand,
            safetyStock: safetyStock,
            confidence: 0.85,
            period: 'next_24_hours'
          },
          timestamp: new Date().toISOString(),
          source: 'simulation'
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to generate demand spike event:', error.message);
    }
  }

  /**
   * Generate supplier delay event
   */
  generateSupplierDelayEvent(scenario) {
    try {
      // Select random warehouse
      const warehouseId = scenario.entities.warehouses[Math.floor(Math.random() * scenario.entities.warehouses.length)];
      
      // Generate delay information
      const delayMinutes = Math.floor(Math.random() * 120) + 30; // 30-150 minutes delay
      const affectedProducts = ['product_a', 'product_b', 'product_c'];
      const productCount = Math.floor(Math.random() * 3) + 1; // 1-3 products
      const affectedItems = [];
      
      for (let i = 0; i < productCount; i++) {
        affectedItems.push({
          productId: affectedProducts[Math.floor(Math.random() * affectedProducts.length)],
          quantity: Math.floor(Math.random() * 100) + 50 // 50-150 units
        });
      }
      
      console.log(`Simulation Agent: Generating supplier delay for ${warehouseId}: ${delayMinutes} minutes`);
      
      // Publish supplier delay alert
      messagingLayer.publishMessage(
        'alerts',
        {
          type: 'supplier_delay',
          warehouseId: warehouseId,
          delayMinutes: delayMinutes,
          affectedItems: affectedItems,
          severity: 'warning',
          timestamp: new Date().toISOString(),
          source: 'simulation'
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to generate supplier delay event:', error.message);
    }
  }

  /**
   * Generate quality issue event
   */
  generateQualityIssueEvent(scenario) {
    try {
      // Select random store
      const storeId = scenario.entities.stores[Math.floor(Math.random() * scenario.entities.stores.length)];
      
      // Generate quality issue information
      const affectedProducts = ['product_a', 'product_b', 'product_c'];
      const productId = affectedProducts[Math.floor(Math.random() * affectedProducts.length)];
      const affectedQuantity = Math.floor(Math.random() * 30) + 10; // 10-40 units
      const issueType = ['expiration', 'damage', 'contamination'][Math.floor(Math.random() * 3)];
      
      console.log(`Simulation Agent: Generating quality issue for ${storeId}, product ${productId}: ${issueType}`);
      
      // Publish quality issue alert
      messagingLayer.publishMessage(
        'alerts',
        {
          type: 'quality_issue',
          storeId: storeId,
          productId: productId,
          quantity: affectedQuantity,
          issueType: issueType,
          severity: 'moderate',
          timestamp: new Date().toISOString(),
          source: 'simulation'
        },
        'kafka'
      );
    } catch (error) {
      console.error('Simulation Agent: Failed to generate quality issue event:', error.message);
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
  const agent = new SimulationAgent();
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log('Simulation Agent is running...');
    
    // Start simulation after a short delay
    setTimeout(() => {
      agent.startSimulation();
    }, 5000);
  });
}

module.exports = SimulationAgent;