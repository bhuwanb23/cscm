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
      // Add warehouse layout information for optimization
      warehouseLayout: {
        zones: {},
        aisles: {},
        pickLocations: {},
        packingStations: {}
      },
      // Add historical picking data for optimization
      pickingHistory: [],
      // Add packing information
      packingConfigurations: {},
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
      
      // Subscribe to warehouse layout updates
      await messagingLayer.subscribeToTopic(
        `warehouse.layout.${this.warehouseId}`, 
        this.handleWarehouseLayoutUpdate.bind(this),
        'kafka'
      );
      
      // Subscribe to picking completion notifications
      await messagingLayer.subscribeToTopic(
        `picking.completed.${this.warehouseId}`, 
        this.handlePickingCompletion.bind(this),
        'kafka'
      );
      
      // Subscribe to packing configuration updates
      await messagingLayer.subscribeToTopic(
        `packing.config.${this.warehouseId}`, 
        this.handlePackingConfigurationUpdate.bind(this),
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
        items: message.items || [],
        createdAt: new Date().toISOString()
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
   * Handle warehouse layout updates
   */
  async handleWarehouseLayoutUpdate(topic, message) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Received warehouse layout update`, message);
      
      // Update warehouse layout information
      if (message.zoneId) {
        this.state.warehouseLayout.zones[message.zoneId] = {
          ...message,
          lastUpdated: new Date()
        };
      }
      
      if (message.aisleId) {
        this.state.warehouseLayout.aisles[message.aisleId] = {
          ...message,
          lastUpdated: new Date()
        };
      }
      
      if (message.locationId) {
        this.state.warehouseLayout.pickLocations[message.locationId] = {
          ...message,
          lastUpdated: new Date()
        };
      }
      
      if (message.stationId) {
        this.state.warehouseLayout.packingStations[message.stationId] = {
          ...message,
          lastUpdated: new Date()
        };
      }
      
      this.saveState();
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to handle warehouse layout update:`, error.message);
    }
  }

  /**
   * Handle packing configuration updates
   */
  async handlePackingConfigurationUpdate(topic, message) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Received packing configuration update`, message);
      
      // Update packing configurations
      if (message.productId) {
        this.state.packingConfigurations[message.productId] = {
          ...message,
          lastUpdated: new Date()
        };
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to handle packing configuration update:`, error.message);
    }
  }

  /**
   * Handle picking completion notifications
   */
  async handlePickingCompletion(topic, message) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Received picking completion`, message);
      
      // Update picking history
      if (message.shipmentId) {
        this.state.pickingHistory.push({
          ...message,
          completedAt: new Date().toISOString()
        });
        
        // Keep only last 1000 picking records
        if (this.state.pickingHistory.length > 1000) {
          this.state.pickingHistory = this.state.pickingHistory.slice(-1000);
        }
        
        this.saveState();
      }
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to handle picking completion:`, error.message);
    }
  }

  /**
   * Process the picking queue with optimization
   */
  async processPickingQueue() {
    try {
      if (this.state.pickingQueue.length === 0) {
        return;
      }
      
      console.log(`Warehouse Agent ${this.warehouseId}: Processing ${this.state.pickingQueue.length} shipment requests`);
      
      // Optimize picking sequence
      const optimizedQueue = this.optimizePickingSequence([...this.state.pickingQueue]);
      
      // Process one item at a time
      const pickingTask = optimizedQueue.shift();
      const shipmentId = pickingTask.shipmentId;
      
      console.log(`Warehouse Agent ${this.warehouseId}: Processing shipment ${shipmentId}`);
      
      // Update shipment status
      this.state.shipments[shipmentId].status = 'picking';
      this.saveState();
      
      // Generate optimized picking route
      const pickingRoute = this.generateOptimizedPickingRoute(pickingTask);
      
      // Simulate picking process with optimized route
      await this.simulatePickingProcess(pickingTask, pickingRoute);
      
      // Move to next stage
      this.state.shipments[shipmentId].status = 'packing';
      this.saveState();
      
      // Generate optimized packing plan
      const packingPlan = this.generateOptimizedPackingPlan(pickingTask);
      
      // Simulate packing process with optimized plan
      await this.simulatePackingProcess(pickingTask, packingPlan);
      
      // Check for shipment consolidation opportunities
      const consolidatedShipment = this.checkShipmentConsolidationOpportunities(shipmentId, pickingTask);
      
      if (consolidatedShipment) {
        // If consolidated, update status accordingly
        this.state.shipments[shipmentId].status = 'consolidated';
        this.state.shipments[shipmentId].consolidatedWith = consolidatedShipment.shipmentId;
        this.saveState();
        
        console.log(`Warehouse Agent ${this.warehouseId}: Shipment ${shipmentId} consolidated with ${consolidatedShipment.shipmentId}`);
      } else {
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
      }
      
      console.log(`Warehouse Agent ${this.warehouseId}: Completed processing shipment ${shipmentId}`);
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to process picking queue:`, error.message);
    }
  }

  /**
   * Optimize picking sequence using shortest path algorithm
   */
  optimizePickingSequence(queue) {
    try {
      // Sort by priority first
      queue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
      
      // For same priority items, optimize by proximity and zone clustering
      // This is a simplified version - in a real implementation, this would use
      // more sophisticated algorithms like the AI/ML routing models
      
      // Group by zones if warehouse layout information is available
      const zoneGroups = {};
      queue.forEach(task => {
        // Determine zone for each item (simplified)
        const zoneId = this.determineZoneForItems(task.items);
        if (!zoneGroups[zoneId]) {
          zoneGroups[zoneId] = [];
        }
        zoneGroups[zoneId].push(task);
      });
      
      // Flatten groups back to optimized sequence
      const optimizedQueue = [];
      Object.values(zoneGroups).forEach(group => {
        // Within each zone, sort by aisle proximity
        group.sort((a, b) => this.calculateProximity(a.items, b.items));
        optimizedQueue.push(...group);
      });
      
      return optimizedQueue;
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to optimize picking sequence:`, error.message);
      // Return original queue sorted by priority
      return queue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
    }
  }

  /**
   * Determine zone for items based on warehouse layout
   */
  determineZoneForItems(items) {
    try {
      // Simplified zone determination
      // In a real implementation, this would use actual warehouse layout data
      if (items.length === 0) return 'zone-default';
      
      // Use first item to determine zone
      const firstItem = items[0];
      const productId = firstItem.productId;
      
      // Simple hash-based zone assignment
      const hash = [...productId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return `zone-${hash % 5}`; // Assume 5 zones
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to determine zone for items:`, error.message);
      return 'zone-default';
    }
  }

  /**
   * Calculate proximity between item sets
   */
  calculateProximity(itemsA, itemsB) {
    try {
      // Simplified proximity calculation
      // In a real implementation, this would use actual location data
      if (itemsA.length === 0 || itemsB.length === 0) return 0;
      
      // Use product IDs to calculate "proximity"
      const productIdA = itemsA[0].productId;
      const productIdB = itemsB[0].productId;
      
      // Simple string similarity as proxy for proximity
      const similarity = this.calculateStringSimilarity(productIdA, productIdB);
      return 1 - similarity; // Lower distance = higher similarity
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to calculate proximity:`, error.message);
      return 0;
    }
  }

  /**
   * Calculate string similarity (simplified)
   */
  calculateStringSimilarity(str1, str2) {
    // Simple approach: compare lengths and common characters
    const len1 = str1.length;
    const len2 = str2.length;
    const minLen = Math.min(len1, len2);
    const maxLen = Math.max(len1, len2);
    
    if (minLen === 0) return maxLen === 0 ? 1 : 0;
    
    let commonChars = 0;
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) {
        commonChars++;
      }
    }
    
    return commonChars / maxLen;
  }

  /**
   * Generate optimized picking route
   */
  generateOptimizedPickingRoute(pickingTask) {
    try {
      // In a real implementation, this would use the AI/ML routing models
      // For now, we'll generate a simple route based on item locations
      
      const items = pickingTask.items || [];
      const route = [];
      
      // Add warehouse layout information to route if available
      items.forEach(item => {
        // Get location information for item
        const locationInfo = this.getItemLocation(item.productId);
        
        route.push({
          productId: item.productId,
          quantity: item.quantity,
          location: locationInfo.location || 'unknown',
          zone: locationInfo.zone || 'unknown',
          aisle: locationInfo.aisle || 'unknown',
          estimatedPickTime: this.estimatePickTime(locationInfo)
        });
      });
      
      // Optimize route order (simplified)
      route.sort((a, b) => {
        // Sort by zone, then aisle, then location
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        if (a.aisle !== b.aisle) return a.aisle.localeCompare(b.aisle);
        return a.location.localeCompare(b.location);
      });
      
      return {
        taskId: pickingTask.shipmentId,
        route: route,
        totalEstimatedTime: route.reduce((sum, item) => sum + item.estimatedPickTime, 0),
        optimizationMethod: 'zone-aisle-location-sorting'
      };
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to generate optimized picking route:`, error.message);
      // Return basic route
      return {
        taskId: pickingTask.shipmentId,
        route: (pickingTask.items || []).map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        totalEstimatedTime: pickingTask.items ? pickingTask.items.length * 60 : 0, // Assume 1 minute per item
        optimizationMethod: 'basic-item-order'
      };
    }
  }

  /**
   * Generate optimized packing plan
   */
  generateOptimizedPackingPlan(pickingTask) {
    try {
      // Get packing configuration for items
      const items = pickingTask.items || [];
      const packingInstructions = [];
      
      // For each item, get packing configuration
      items.forEach(item => {
        const packingConfig = this.state.packingConfigurations[item.productId] || 
                             this.getDefaultPackingConfiguration(item.productId);
        
        packingInstructions.push({
          productId: item.productId,
          quantity: item.quantity,
          packingType: packingConfig.packingType || 'standard-box',
          dimensions: packingConfig.dimensions || { length: 10, width: 10, height: 10 },
          weight: packingConfig.weightPerUnit ? 
                  packingConfig.weightPerUnit * item.quantity : 
                  item.quantity * 0.5, // Default 0.5kg per unit
          specialHandling: packingConfig.specialHandling || 'none',
          estimatedPackingTime: this.estimatePackingTime(packingConfig, item.quantity)
        });
      });
      
      // Optimize packing sequence (fragile items first, heavier items at bottom, etc.)
      packingInstructions.sort((a, b) => {
        // Fragile items first
        if (a.specialHandling === 'fragile' && b.specialHandling !== 'fragile') return -1;
        if (b.specialHandling === 'fragile' && a.specialHandling !== 'fragile') return 1;
        
        // Heavier items first (for stability)
        return b.weight - a.weight;
      });
      
      // Calculate total package dimensions (simplified)
      const totalWeight = packingInstructions.reduce((sum, item) => sum + item.weight, 0);
      const estimatedVolume = packingInstructions.reduce((sum, item) => {
        const dims = item.dimensions;
        return sum + (dims.length * dims.width * dims.height * item.quantity);
      }, 0);
      
      // Simple cube root to estimate package dimensions
      const estimatedDim = Math.ceil(Math.cbrt(estimatedVolume));
      
      return {
        taskId: pickingTask.shipmentId,
        packingInstructions: packingInstructions,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalWeight: totalWeight,
        estimatedPackageDimensions: {
          length: estimatedDim,
          width: estimatedDim,
          height: estimatedDim
        },
        estimatedTotalPackingTime: packingInstructions.reduce((sum, item) => sum + item.estimatedPackingTime, 0),
        optimizationMethod: 'weight-fragility-sorting'
      };
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to generate optimized packing plan:`, error.message);
      // Return basic packing plan
      return {
        taskId: pickingTask.shipmentId,
        packingInstructions: (pickingTask.items || []).map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        totalItems: pickingTask.items ? pickingTask.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
        totalWeight: pickingTask.items ? pickingTask.items.length * 0.5 : 0,
        estimatedTotalPackingTime: pickingTask.items ? pickingTask.items.length * 120 : 0, // 2 minutes per item
        optimizationMethod: 'basic-item-order'
      };
    }
  }

  /**
   * Get default packing configuration for an item
   */
  getDefaultPackingConfiguration(productId) {
    try {
      // Simple default configuration based on product ID
      const hash = [...productId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      return {
        productId: productId,
        packingType: hash % 3 === 0 ? 'envelope' : (hash % 3 === 1 ? 'box' : 'pallet'),
        dimensions: {
          length: 10 + (hash % 20),
          width: 10 + (hash % 15),
          height: 5 + (hash % 10)
        },
        weightPerUnit: 0.1 + (hash % 10) * 0.1,
        specialHandling: hash % 7 === 0 ? 'fragile' : 'none'
      };
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to get default packing configuration:`, error.message);
      return {
        productId: productId,
        packingType: 'box',
        dimensions: { length: 10, width: 10, height: 10 },
        weightPerUnit: 0.5,
        specialHandling: 'none'
      };
    }
  }

  /**
   * Estimate packing time for items
   */
  estimatePackingTime(packingConfig, quantity) {
    try {
      // Base time per item
      let timePerItem = 30; // 30 seconds per item
      
      // Adjust for packing type
      switch (packingConfig.packingType) {
        case 'envelope':
          timePerItem = 20; // Faster for envelopes
          break;
        case 'pallet':
          timePerItem = 120; // Much longer for pallets
          break;
        default:
          timePerItem = 30; // Standard box
      }
      
      // Adjust for special handling
      if (packingConfig.specialHandling === 'fragile') {
        timePerItem += 15; // Extra time for fragile items
      }
      
      // Total time for all items
      const totalTime = timePerItem * quantity;
      
      // Add setup time
      const setupTime = 60; // 1 minute setup time per packing task
      
      return totalTime + setupTime;
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to estimate packing time:`, error.message);
      return quantity * 60; // Default to 1 minute per item
    }
  }

  /**
   * Get item location information
   */
  getItemLocation(productId) {
    try {
      // In a real implementation, this would query the warehouse management system
      // For now, we'll generate simulated location data
      
      // Simple hash-based location assignment
      const hash = [...productId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const zone = `zone-${hash % 5}`;
      const aisle = `aisle-${Math.floor(hash / 5) % 10}`;
      const location = `loc-${hash % 100}`;
      
      return {
        productId: productId,
        zone: zone,
        aisle: aisle,
        location: location
      };
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to get item location:`, error.message);
      return {
        productId: productId,
        zone: 'unknown',
        aisle: 'unknown',
        location: 'unknown'
      };
    }
  }

  /**
   * Estimate pick time for an item
   */
  estimatePickTime(locationInfo) {
    try {
      // Simple time estimation based on location complexity
      // In a real implementation, this would use historical data and ML models
      
      // Base time of 30 seconds per item
      let time = 30;
      
      // Add time based on zone (some zones might be harder to access)
      if (locationInfo.zone && locationInfo.zone.includes('4')) {
        time += 15; // Harder to reach zone
      }
      
      // Add time based on location specificity
      if (locationInfo.location && locationInfo.location.includes('9')) {
        time += 10; // Harder to find location
      }
      
      return time;
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to estimate pick time:`, error.message);
      return 60; // Default to 1 minute
    }
  }

  /**
   * Simulate picking process with optimized route
   */
  async simulatePickingProcess(pickingTask, pickingRoute) {
    return new Promise(resolve => {
      console.log(`Warehouse Agent ${this.warehouseId}: Simulating picking for shipment ${pickingTask.shipmentId}`);
      console.log(`Optimized route:`, pickingRoute);
      
      // Simulate time taken for picking based on route complexity
      const estimatedTime = pickingRoute.totalEstimatedTime || 120; // Default to 2 minutes
      
      setTimeout(() => {
        console.log(`Warehouse Agent ${this.warehouseId}: Picking completed for shipment ${pickingTask.shipmentId}`);
        
        // Publish picking completion
        messagingLayer.publishMessage(
          `picking.completed.${this.warehouseId}`,
          {
            shipmentId: pickingTask.shipmentId,
            warehouseId: this.warehouseId,
            route: pickingRoute,
            actualCompletionTime: new Date().toISOString()
          },
          'kafka'
        );
        
        resolve();
      }, Math.min(estimatedTime * 1000, 10000)); // Cap at 10 seconds for demo
    });
  }

  /**
   * Simulate packing process with optimized plan
   */
  async simulatePackingProcess(pickingTask, packingPlan) {
    return new Promise(resolve => {
      console.log(`Warehouse Agent ${this.warehouseId}: Simulating packing for shipment ${pickingTask.shipmentId}`);
      console.log(`Optimized packing plan:`, packingPlan);
      
      // Simulate time taken for packing based on plan complexity
      const estimatedTime = packingPlan.estimatedTotalPackingTime || 120; // Default to 2 minutes
      
      setTimeout(() => {
        console.log(`Warehouse Agent ${this.warehouseId}: Packing completed for shipment ${pickingTask.shipmentId}`);
        resolve();
      }, Math.min(estimatedTime * 1000, 15000)); // Cap at 15 seconds for demo
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

  /**
   * Check for shipment consolidation opportunities
   */
  checkShipmentConsolidationOpportunities(shipmentId, pickingTask) {
    try {
      // Check if there are other shipments ready for shipping to the same destination
      const currentTime = new Date();
      const consolidationWindowMinutes = 30; // Consolidate shipments within 30 minutes
      
      // Look for other shipments to the same destination
      const sameDestinationShipments = Object.values(this.state.shipments).filter(shipment => {
        // Must be ready for shipping
        if (shipment.status !== 'ready_for_shipping') return false;
        
        // Must be to the same destination
        if (shipment.destination !== pickingTask.destination) return false;
        
        // Must be within consolidation window
        const readyTime = new Date(shipment.readyAt);
        const timeDiffMinutes = (currentTime - readyTime) / (1000 * 60);
        
        return timeDiffMinutes <= consolidationWindowMinutes;
      });
      
      if (sameDestinationShipments.length > 0) {
        // Consolidate with the first matching shipment
        const consolidationTarget = sameDestinationShipments[0];
        
        // Update both shipments to reflect consolidation
        this.state.shipments[shipmentId].status = 'consolidated';
        this.state.shipments[shipmentId].consolidatedWith = consolidationTarget.shipmentId;
        
        // Update the target shipment to indicate it now contains consolidated items
        if (!this.state.shipments[consolidationTarget.shipmentId].consolidatedItems) {
          this.state.shipments[consolidationTarget.shipmentId].consolidatedItems = [];
        }
        
        this.state.shipments[consolidationTarget.shipmentId].consolidatedItems.push({
          originalShipmentId: shipmentId,
          items: pickingTask.items,
          consolidatedAt: new Date().toISOString()
        });
        
        this.saveState();
        
        return consolidationTarget;
      }
      
      return null;
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to check shipment consolidation opportunities:`, error.message);
      return null;
    }
  }

  /**
   * Handle consolidated shipment processing
   */
  async processConsolidatedShipment(consolidationTarget) {
    try {
      console.log(`Warehouse Agent ${this.warehouseId}: Processing consolidated shipment ${consolidationTarget.shipmentId}`);
      
      // Update status to indicate it's being processed as a consolidated shipment
      this.state.shipments[consolidationTarget.shipmentId].status = 'processing_consolidated';
      this.saveState();
      
      // In a real implementation, this would involve:
      // 1. Combining items from all consolidated shipments
      // 2. Regenerating packing plan for combined items
      // 3. Updating shipping labels and documentation
      // 4. Notifying all original shipment requesters
      
      // For simulation, we'll just mark it as ready for shipping after a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as ready for shipping
      this.state.shipments[consolidationTarget.shipmentId].status = 'ready_for_shipping';
      this.state.shipments[consolidationTarget.shipmentId].readyAt = new Date().toISOString();
      this.saveState();
      
      // Publish shipment ready notification
      messagingLayer.publishMessage(
        `shipment.ready.${this.warehouseId}`,
        {
          shipmentId: consolidationTarget.shipmentId,
          warehouseId: this.warehouseId,
          status: 'ready_for_shipping',
          timestamp: new Date().toISOString(),
          isConsolidated: true,
          consolidatedFrom: consolidationTarget.consolidatedItems?.map(item => item.originalShipmentId) || []
        },
        'kafka'
      );
      
      console.log(`Warehouse Agent ${this.warehouseId}: Consolidated shipment ${consolidationTarget.shipmentId} ready for shipping`);
    } catch (error) {
      console.error(`Warehouse Agent ${this.warehouseId}: Failed to process consolidated shipment:`, error.message);
    }
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