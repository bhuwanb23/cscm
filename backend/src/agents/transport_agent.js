const fs = require('fs');
const path = require('path');
const messagingLayer = require('../messaging');

/**
 * Transport Agent
 * 
 * This agent manages transportation logistics, route optimization,
 * delivery scheduling, and tracking mechanisms.
 */

class TransportAgent {
  constructor(transportId) {
    this.transportId = transportId;
    this.state = {
      vehicles: {},
      routes: {},
      deliveries: {},
      deliveryAnalytics: {},
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
      
      // Subscribe to traffic condition updates
      await messagingLayer.subscribeToTopic(
        `traffic.conditions.${this.transportId}`, 
        this.handleTrafficConditionUpdate.bind(this),
        'kafka'
      );
      
      // Subscribe to road condition updates
      await messagingLayer.subscribeToTopic(
        `road.conditions.${this.transportId}`, 
        this.handleRoadConditionUpdate.bind(this),
        'kafka'
      );
      
      // Subscribe to vehicle tracking updates
      await messagingLayer.subscribeToTopic(
        `vehicle.tracking.${this.transportId}`, 
        this.handleVehicleTrackingUpdate.bind(this),
        'kafka'
      );
      
      // Subscribe to delivery completion notifications
      await messagingLayer.subscribeToTopic(
        `delivery.completed.${this.transportId}`, 
        this.handleDeliveryCompletion.bind(this),
        'kafka'
      );
      
      console.log(`Transport Agent ${this.transportId}: Initialized successfully`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Initialization failed:`, error.message);
    }
  }

  /**
   * Handle vehicle tracking updates
   */
  async handleVehicleTrackingUpdate(topic, message) {
    try {
      console.log(`Transport Agent ${this.transportId}: Received vehicle tracking update`, message);
      
      // Update vehicle location and status
      if (message.vehicleId) {
        this.updateVehicleTracking(message.vehicleId, message);
        
        // Update delivery tracking information
        if (message.deliveryId) {
          this.updateDeliveryTracking(message.deliveryId, message);
        }
        
        // Publish tracking update to customers
        this.publishTrackingUpdate(message);
      }
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to handle vehicle tracking update:`, error.message);
    }
  }

  /**
   * Handle delivery completion notifications
   */
  async handleDeliveryCompletion(topic, message) {
    try {
      console.log(`Transport Agent ${this.transportId}: Received delivery completion`, message);
      
      // Update delivery status
      if (message.deliveryId) {
        const delivery = this.state.deliveries[message.deliveryId];
        if (delivery) {
          delivery.status = 'completed';
          delivery.actualCompletionTime = message.completionTime || new Date().toISOString();
          delivery.signature = message.signature;
          delivery.notes = message.notes;
          
          this.saveState();
          
          // Publish delivery completion notification
          messagingLayer.publishMessage(
            `delivery.completed.notification.${this.transportId}`,
            {
              deliveryId: message.deliveryId,
              vehicleId: delivery.vehicleId,
              status: 'completed',
              completionTime: delivery.actualCompletionTime,
              recipient: message.recipient,
              signature: message.signature,
              notes: message.notes,
              timestamp: new Date().toISOString()
            },
            'kafka'
          );
        }
      }
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to handle delivery completion:`, error.message);
    }
  }

  /**
   * Update vehicle tracking information
   */
  updateVehicleTracking(vehicleId, trackingData) {
    try {
      // Ensure vehicle exists
      if (!this.state.vehicles[vehicleId]) {
        this.state.vehicles[vehicleId] = {
          id: vehicleId,
          capacity: 100,
          currentLoad: 0,
          status: 'available',
          location: { lat: 0, lng: 0 }
        };
      }
      
      const vehicle = this.state.vehicles[vehicleId];
      
      // Update vehicle information
      vehicle.location = trackingData.location || vehicle.location;
      vehicle.status = trackingData.status || vehicle.status;
      vehicle.speed = trackingData.speed;
      vehicle.heading = trackingData.heading;
      vehicle.fuelLevel = trackingData.fuelLevel;
      vehicle.lastTracked = new Date().toISOString();
      
      // Update delivery information if provided
      if (trackingData.deliveryId) {
        const delivery = this.state.deliveries[trackingData.deliveryId];
        if (delivery) {
          delivery.currentLocation = trackingData.location;
          delivery.estimatedArrival = trackingData.estimatedArrival;
          delivery.lastTracked = new Date().toISOString();
        }
      }
      
      this.saveState();
      
      console.log(`Transport Agent ${this.transportId}: Updated tracking for vehicle ${vehicleId}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to update vehicle tracking:`, error.message);
    }
  }

  /**
   * Update delivery tracking information
   */
  updateDeliveryTracking(deliveryId, trackingData) {
    try {
      const delivery = this.state.deliveries[deliveryId];
      if (!delivery) {
        console.error(`Transport Agent ${this.transportId}: Delivery ${deliveryId} not found`);
        return;
      }
      
      // Update delivery tracking information
      delivery.currentLocation = trackingData.location || delivery.currentLocation;
      delivery.estimatedArrival = trackingData.estimatedArrival || delivery.estimatedArrival;
      delivery.distanceRemaining = trackingData.distanceRemaining;
      delivery.timeRemaining = trackingData.timeRemaining;
      delivery.lastTracked = new Date().toISOString();
      
      // Update status based on proximity to destination
      if (trackingData.proximityToDestination !== undefined) {
        if (trackingData.proximityToDestination < 0.1) { // Less than 100 meters
          delivery.status = 'arriving';
        } else if (trackingData.proximityToDestination < 1) { // Less than 1 km
          delivery.status = 'approaching';
        }
      }
      
      this.saveState();
      
      console.log(`Transport Agent ${this.transportId}: Updated tracking for delivery ${deliveryId}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to update delivery tracking:`, error.message);
    }
  }

  /**
   * Publish tracking update to customers
   */
  publishTrackingUpdate(trackingData) {
    try {
      // Only publish significant updates to avoid spam
      if (this.shouldPublishTrackingUpdate(trackingData)) {
        messagingLayer.publishMessage(
          `delivery.tracking.update`,
          {
            deliveryId: trackingData.deliveryId,
            vehicleId: trackingData.vehicleId,
            location: trackingData.location,
            estimatedArrival: trackingData.estimatedArrival,
            distanceRemaining: trackingData.distanceRemaining,
            timeRemaining: trackingData.timeRemaining,
            status: trackingData.status,
            timestamp: new Date().toISOString()
          },
          'kafka'
        );
        
        console.log(`Transport Agent ${this.transportId}: Published tracking update for delivery ${trackingData.deliveryId}`);
      }
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to publish tracking update:`, error.message);
    }
  }

  /**
   * Determine if tracking update should be published
   */
  shouldPublishTrackingUpdate(trackingData) {
    try {
      // Don't publish if no delivery ID
      if (!trackingData.deliveryId) return false;
      
      const delivery = this.state.deliveries[trackingData.deliveryId];
      if (!delivery) return false;
      
      // Check if this is a significant update
      const lastPublished = delivery.lastTrackingPublished || new Date(0);
      const currentTime = new Date();
      const timeSinceLastPublish = (currentTime - lastPublished) / 1000; // Seconds
      
      // Publish if:
      // 1. More than 5 minutes since last publish, OR
      // 2. Location has changed significantly (more than 500m), OR
      // 3. Status has changed, OR
      // 4. It's been more than 30 seconds since last tracking update
      const significantTimePassed = timeSinceLastPublish > 300; // 5 minutes
      const locationChangedSignificantly = this.hasLocationChangedSignificantly(delivery, trackingData);
      const statusChanged = delivery.lastPublishedStatus !== trackingData.status;
      const regularUpdateInterval = timeSinceLastPublish > 30; // 30 seconds
      
      const shouldPublish = significantTimePassed || locationChangedSignificantly || statusChanged || regularUpdateInterval;
      
      if (shouldPublish) {
        delivery.lastTrackingPublished = currentTime.toISOString();
        delivery.lastPublishedStatus = trackingData.status;
        this.saveState();
      }
      
      return shouldPublish;
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to determine if tracking update should be published:`, error.message);
      return true; // Default to publishing if in doubt
    }
  }

  /**
   * Check if location has changed significantly
   */
  hasLocationChangedSignificantly(delivery, trackingData) {
    try {
      if (!delivery.currentLocation || !trackingData.location) return true;
      
      const distance = this.calculateDistance(delivery.currentLocation, trackingData.location);
      return distance > 0.5; // More than 500 meters
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to check location change significance:`, error.message);
      return true; // Default to significant change if in doubt
    }
  }

  /**
   * Send proactive notifications to customers
   */
  sendProactiveNotifications() {
    try {
      const currentTime = new Date();
      
      // Check each delivery for proactive notification opportunities
      Object.values(this.state.deliveries).forEach(delivery => {
        if (delivery.status === 'scheduled' && delivery.schedule) {
          // Check if delivery is approaching
          const estimatedArrival = new Date(delivery.schedule.estimatedCompletion);
          const timeUntilArrival = (estimatedArrival - currentTime) / 1000; // Seconds
          
          // Send notification 1 hour before estimated arrival
          if (timeUntilArrival > 3500 && timeUntilArrival < 3700) { // ~1 hour
            this.sendDeliveryNotification(delivery, 'approaching', {
              estimatedArrival: estimatedArrival.toISOString(),
              timeUntilArrival: timeUntilArrival
            });
          }
          
          // Send notification 30 minutes before estimated arrival
          if (timeUntilArrival > 1700 && timeUntilArrival < 1900) { // ~30 minutes
            this.sendDeliveryNotification(delivery, 'arriving_soon', {
              estimatedArrival: estimatedArrival.toISOString(),
              timeUntilArrival: timeUntilArrival
            });
          }
        }
      });
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to send proactive notifications:`, error.message);
    }
  }

  /**
   * Send delivery notification to customer
   */
  sendDeliveryNotification(delivery, notificationType, details) {
    try {
      messagingLayer.publishMessage(
        `customer.notification.${delivery.deliveryId}`,
        {
          deliveryId: delivery.deliveryId,
          notificationType: notificationType,
          details: details,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Transport Agent ${this.transportId}: Sent ${notificationType} notification for delivery ${delivery.deliveryId}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to send delivery notification:`, error.message);
    }
  }

  /**
   * Handle exception events during delivery
   */
  handleDeliveryException(deliveryId, exceptionType, details) {
    try {
      const delivery = this.state.deliveries[deliveryId];
      if (!delivery) {
        console.error(`Transport Agent ${this.transportId}: Delivery ${deliveryId} not found`);
        return;
      }
      
      // Log exception
      if (!delivery.exceptions) {
        delivery.exceptions = [];
      }
      
      delivery.exceptions.push({
        type: exceptionType,
        details: details,
        timestamp: new Date().toISOString()
      });
      
      // Update delivery status based on exception type
      switch (exceptionType) {
        case 'delay':
          delivery.status = 'delayed';
          break;
        case 'traffic':
          delivery.status = 'traffic_delay';
          break;
        case 'vehicle_issue':
          delivery.status = 'vehicle_issue';
          break;
        case 'recipient_unavailable':
          delivery.status = 'recipient_unavailable';
          break;
        default:
          delivery.status = 'exception';
      }
      
      this.saveState();
      
      // Notify stakeholders
      messagingLayer.publishMessage(
        `delivery.exception.${this.transportId}`,
        {
          deliveryId: deliveryId,
          exceptionType: exceptionType,
          details: details,
          status: delivery.status,
          timestamp: new Date().toISOString()
        },
        'kafka'
      );
      
      console.log(`Transport Agent ${this.transportId}: Handled ${exceptionType} exception for delivery ${deliveryId}`);
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to handle delivery exception:`, error.message);
    }
  }

  /**
   * Generate delivery analytics and insights
   */
  generateDeliveryAnalytics() {
    try {
      const analytics = {
        totalDeliveries: 0,
        completedDeliveries: 0,
        delayedDeliveries: 0,
        onTimeDeliveries: 0,
        averageDeliveryTime: 0,
        totalDistance: 0,
        fuelConsumed: 0,
        exceptions: 0,
        timestamp: new Date().toISOString()
      };
      
      let totalDeliveryTime = 0;
      let deliveryCount = 0;
      
      Object.values(this.state.deliveries).forEach(delivery => {
        analytics.totalDeliveries++;
        
        if (delivery.status === 'completed') {
          analytics.completedDeliveries++;
          
          // Calculate delivery time
          if (delivery.assignedAt && delivery.actualCompletionTime) {
            const assignedTime = new Date(delivery.assignedAt);
            const completionTime = new Date(delivery.actualCompletionTime);
            const deliveryTime = (completionTime - assignedTime) / 1000; // Seconds
            totalDeliveryTime += deliveryTime;
            deliveryCount++;
          }
          
          // Check if on-time
          if (delivery.schedule && delivery.actualCompletionTime) {
            const scheduledCompletion = new Date(delivery.schedule.estimatedCompletion);
            const actualCompletion = new Date(delivery.actualCompletionTime);
            
            if (actualCompletion <= scheduledCompletion) {
              analytics.onTimeDeliveries++;
            } else {
              analytics.delayedDeliveries++;
            }
          }
        }
        
        // Add distance
        if (delivery.schedule && delivery.schedule.totalDistance) {
          analytics.totalDistance += delivery.schedule.totalDistance;
        }
        
        // Count exceptions
        if (delivery.exceptions && delivery.exceptions.length > 0) {
          analytics.exceptions += delivery.exceptions.length;
        }
      });
      
      // Calculate averages
      if (deliveryCount > 0) {
        analytics.averageDeliveryTime = totalDeliveryTime / deliveryCount;
      }
      
      // Estimate fuel consumption (simplified)
      analytics.fuelConsumed = analytics.totalDistance * 0.1; // 0.1 liters per km
      
      // Save analytics
      this.state.deliveryAnalytics = analytics;
      this.saveState();
      
      // Publish analytics
      messagingLayer.publishMessage(
        `delivery.analytics.${this.transportId}`,
        analytics,
        'kafka'
      );
      
      console.log(`Transport Agent ${this.transportId}: Generated delivery analytics`);
      return analytics;
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to generate delivery analytics:`, error.message);
      return null;
    }
  }

  /**
   * Calculate distance between two geographical points (Haversine formula)
   */
  calculateDistance(point1, point2) {
    try {
      const R = 6371; // Earth radius in kilometers
      const dLat = (point2.lat - point1.lat) * Math.PI / 180;
      const dLon = (point2.lng - point1.lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const d = R * c; // Distance in kilometers
      return d;
    } catch (error) {
      console.error(`Transport Agent ${this.transportId}: Failed to calculate distance:`, error.message);
      return 0;
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
  });
}

module.exports = TransportAgent;