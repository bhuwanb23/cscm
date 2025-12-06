const fs = require('fs');
const path = require('path');
const messagingLayer = require('../messaging');

/**
 * Transport Agent
 * 
 * This agent manages transportation operations including route optimization,
 * delivery scheduling, and tracking updates.
 */

class TransportAgent {
  constructor(transportId) {
    this.transportId = transportId;
    this.state = {
      vehicles: {},
      routes: {},
      deliveries: {},
      lastUpdated: new Date()
    };
    this.storagePath = path.join(__dirname, '..', '..', 'data', `transport_${transportId}_state.json`);
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
        console.log(`Transport Agent ${this.transportId}: State loaded successfully`);
      } else {
        console.log(`Transport Agent ${this.transportId}: No existing state found, using defaults`);
      }
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to load state:`, error.message);
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
      console.log(`Transport Agent ${this.transportId}: State saved successfully`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to save state:`, error.message);
    }
  }

  /**
   * Initialize the agent and connect to messaging layer
   */
  async initialize() {
    try {
      console.log(`Transport Agent ${this.transportId}: Initializing...`);
      
      // Subscribe to relevant topics
      await messagingLayer.subscribeToTopic(
        `delivery.assignment.${this.transportId}`, 
        this.handleDeliveryAssignment.bind(this),
        'kafka'
      );
      
      await messagingLayer.subscribeToTopic(
        `route.optimization.request`, 
        this.handleRouteOptimizationRequest.bind(this),
        'kafka'
      );
      
      console.log(`Transport Agent ${this.transportId}: Initialized successfully`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle delivery assignment messages
   */
  async handleDeliveryAssignment(topic, message) {
    try {
      console.log(`Transport Agent ${this.transportId}: Received delivery assignment`, message);
      
      // Add to deliveries
      const deliveryId = message.deliveryId || `DELIVERY-${Date.now()}`;
      this.state.deliveries[deliveryId] = {
        ...message,
        status: 'assigned',
        assignedAt: new Date().toISOString()
      };
      
      this.saveState();
      
      // Assign to vehicle (simple round-robin assignment)
      this.assignDeliveryToVehicle(deliveryId);
      
      // Publish delivery assignment confirmation
      messagingLayer.publishMessage(
        `delivery.assigned.${this.transportId}`,
        {
          deliveryId: deliveryId,
          transportId: this.transportId,
          status: 'assigned',
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to handle delivery assignment:`, error.message);
    }
  }

  /**
   * Handle route optimization request messages
   */
  async handleRouteOptimizationRequest(topic, message) {
    try {
      console.log(`Transport Agent ${this.transportId}: Received route optimization request`, message);
      
      // Create or update route
      const routeId = message.routeId || `ROUTE-${Date.now()}`;
      this.state.routes[routeId] = {
        ...message,
        status: 'optimizing',
        createdAt: new Date().toISOString()
      };
      
      this.saveState();
      
      // Perform route optimization (simplified)
      await this.optimizeRoute(routeId);
      
      // Update route status
      this.state.routes[routeId].status = 'optimized';
      this.state.routes[routeId].optimizedAt = new Date().toISOString();
      this.saveState();
      
      // Publish optimized route
      messagingLayer.publishMessage(
        `route.optimized.${this.transportId}`,
        {
          routeId: routeId,
          transportId: this.transportId,
          stops: this.state.routes[routeId].stops,
          estimatedTime: this.state.routes[routeId].estimatedTime,
          distance: this.state.routes[routeId].distance,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to handle route optimization request:`, error.message);
    }
  }

  /**
   * Assign delivery to a vehicle
   */
  assignDeliveryToVehicle(deliveryId) {
    try {
      const delivery = this.state.deliveries[deliveryId];
      if (!delivery) {
        console.error(`Transport Agent ${this.transportId}: Delivery ${deliveryId} not found`);
        return;
      }
      
      // Simple vehicle assignment logic
      // In a real implementation, this would consider vehicle capacity, location, etc.
      const vehicleIds = Object.keys(this.state.vehicles);
      if (vehicleIds.length === 0) {
        // Create a default vehicle if none exist
        const defaultVehicleId = 'VEHICLE-DEFAULT';
        this.state.vehicles[defaultVehicleId] = {
          id: defaultVehicleId,
          capacity: 100,
          currentLoad: 0,
          status: 'available',
          location: { lat: 0, lng: 0 }
        };
        vehicleIds.push(defaultVehicleId);
      }
      
      // Assign to first available vehicle
      const vehicleId = vehicleIds[0];
      const vehicle = this.state.vehicles[vehicleId];
      
      // Update vehicle load
      vehicle.currentLoad += delivery.weight || 10; // Default weight of 10
      vehicle.status = 'assigned';
      
      // Update delivery with vehicle assignment
      delivery.vehicleId = vehicleId;
      delivery.status = 'scheduled';
      
      this.saveState();
      
      console.log(`Transport Agent ${this.transportId}: Assigned delivery ${deliveryId} to vehicle ${vehicleId}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to assign delivery to vehicle:`, error.message);
    }
  }

  /**
   * Optimize route for deliveries
   */
  async optimizeRoute(routeId) {
    return new Promise(resolve => {
      try {
        console.log(`Transport Agent ${this.transportId}: Optimizing route ${routeId}`);
        
        const route = this.state.routes[routeId];
        if (!route) {
          console.error(`Transport Agent ${this.transportId}: Route ${routeId} not found`);
          resolve();
          return;
        }
        
        // Simulate route optimization process
        setTimeout(() => {
          // Simple route optimization (in a real implementation, this would use complex algorithms)
          const stops = route.stops || [];
          
          // Just sort stops by some criteria (simplified)
          stops.sort((a, b) => {
            // Sort by proximity to depot (simplified)
            const distanceA = Math.sqrt(Math.pow(a.location.lat, 2) + Math.pow(a.location.lng, 2));
            const distanceB = Math.sqrt(Math.pow(b.location.lat, 2) + Math.pow(b.location.lng, 2));
            return distanceA - distanceB;
          });
          
          // Calculate estimated time and distance (simplified)
          let totalDistance = 0;
          let totalTime = 0;
          
          for (let i = 0; i < stops.length - 1; i++) {
            const stopA = stops[i];
            const stopB = stops[i + 1];
            
            // Calculate distance between stops (Euclidean distance)
            const distance = Math.sqrt(
              Math.pow(stopB.location.lat - stopA.location.lat, 2) +
              Math.pow(stopB.location.lng - stopA.location.lng, 2)
            );
            
            totalDistance += distance;
            totalTime += distance * 10; // Assume 10 minutes per unit distance
          }
          
          // Update route with optimized data
          route.stops = stops;
          route.estimatedTime = totalTime;
          route.distance = totalDistance;
          
          console.log(`Transport Agent ${this.transportId}: Route ${routeId} optimized with ${stops.length} stops`);
          resolve();
        }, 3000); // 3 seconds simulation
      } catch (error) {
        console.error(`Transport Agent ${this.transportId}: Failed to optimize route:`, error.message);
        resolve();
      }
    });
  }

  /**
   * Update vehicle status
   */
  updateVehicleStatus(vehicleId, status, location = null) {
    try {
      if (!this.state.vehicles[vehicleId]) {
        this.state.vehicles[vehicleId] = {
          id: vehicleId,
          capacity: 100,
          currentLoad: 0,
          status: 'available',
          location: { lat: 0, lng: 0 }
        };
      }
      
      this.state.vehicles[vehicleId].status = status;
      if (location) {
        this.state.vehicles[vehicleId].location = location;
      }
      
      this.state.vehicles[vehicleId].lastUpdated = new Date().toISOString();
      this.saveState();
      
      console.log(`Transport Agent ${this.transportId}: Updated vehicle ${vehicleId} status to ${status}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to update vehicle status:`, error.message);
    }
  }

  /**
   * Get current agent state
   */
  getState() {
    return {
      transportId: this.transportId,
      ...this.state
    };
  }
}

// If run directly, start the agent
if (require.main === module) {
  const transportId = process.argv[2] || 'default';
  const agent = new TransportAgent(transportId);
  
  // Initialize agent
  agent.initialize().then(() => {
    console.log(`Transport Agent ${transportId} is running...`);
    
    // For demo purposes, simulate some delivery assignments
    setInterval(() => {
      // Simulate random delivery assignments
      const locations = [
        { lat: 12.9716, lng: 77.5946 }, // Bangalore
        { lat: 13.0827, lng: 80.2707 }, // Chennai
        { lat: 17.3850, lng: 78.4867 }, // Hyderabad
        { lat: 18.5204, lng: 73.8567 }, // Pune
        { lat: 19.0760, lng: 72.8777 }  // Mumbai
      ];
      
      const stops = [];
      const stopCount = Math.floor(Math.random() * 4) + 2; // 2-5 stops
      
      for (let i = 0; i < stopCount; i++) {
        stops.push({
          id: `STOP-${Date.now()}-${i}`,
          location: locations[Math.floor(Math.random() * locations.length)],
          estimatedArrival: new Date(Date.now() + (i * 3600000)).toISOString(), // 1 hour apart
          type: ['pickup', 'delivery'][Math.floor(Math.random() * 2)]
        });
      }
      
      messagingLayer.publishMessage(
        `delivery.assignment.${transportId}`,
        {
          deliveryId: `DELIVERY-${Date.now()}`,
          weight: Math.floor(Math.random() * 50) + 10, // 10-60 kg
          stops: stops,
          priority: ['high', 'normal', 'low'][Math.floor(Math.random() * 3)]
        },
        'kafka'
      );
    }, 60000); // Every minute
  });
}

module.exports = TransportAgent;