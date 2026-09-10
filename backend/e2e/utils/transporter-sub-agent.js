/**
 * Transporter Sub-Agent
 * Implements transporter-specific E2E test workflows
 */

const BaseSubAgent = require('../utils/sub-agent-base');
const testData = require('../config/test-data');

class TransporterSubAgent extends BaseSubAgent {
  constructor(userId = 'transport_test_1') {
    super('transporter', userId);
    this.transporterId = userId;
  }

  /**
   * Load transporter-specific data
   */
  async loadRoleSpecificData() {
    try {
      // Load active deliveries
      const deliveries = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
      this.state.deliveries = deliveries.data;
      
      // Load completed deliveries
      const completed = await this.apiClient.gatewayGet('/api/v1/shipments/status/delivered');
      this.state.completedDeliveries = completed.data;
    } catch (error) {
      console.log('No existing transporter data, using test fixtures');
      this.state.deliveries = testData.shipments.filter(s => s.status === 'in_transit');
      this.state.completedDeliveries = testData.shipments.filter(s => s.status === 'delivered');
    }
  }

  /**
   * Test 1: Dashboard Workflow
   */
  async testDashboardWorkflow() {
    console.log('Testing transporter dashboard workflow');
    
    // Login
    await this.login();
    
    // Load active deliveries
    const deliveries = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
    this.validateResponse(deliveries, ['shipments']);
    
    // Get travel time estimate
    const travelTime = await this.apiClient.gatewayPost('/api/v1/routing/travel-time', {
      origin: 'warehouse_test_1',
      destination: 'shop_test_1',
      vehicle_type: 'van'
    });
    this.validateResponse(travelTime, ['estimated_minutes', 'confidence_interval']);
    
    // Get anomaly alerts
    const alerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts');
    this.validateResponse(alerts, ['alerts']);
    
    console.log('Dashboard workflow test completed');
  }

  /**
   * Test 2: Task Management Workflow
   */
  async testTaskWorkflow() {
    console.log('Testing transporter task management workflow');
    
    // Get active deliveries (tasks)
    const activeDeliveries = await this.apiClient.gatewayGet('/api/v1/shipments/status/in_transit');
    this.validateResponse(activeDeliveries, ['shipments']);
    
    if (activeDeliveries.data.shipments.length > 0) {
      const shipmentId = activeDeliveries.data.shipments[0].shipment_id;
      
      // Get shipment details
      const shipment = await this.apiClient.gatewayGet(`/api/v1/shipments/${shipmentId}`);
      this.validateResponse(shipment, ['shipment_id', 'status', 'items']);
      
      // Mark delivery as completed
      const completed = await this.apiClient.gatewayPatch(
        `/api/v1/shipments/${shipmentId}/status`,
        { status: 'delivered' }
      );
      this.validateResponse(completed, ['shipment_id', 'status']);
      
      // Get route status
      const routeStatus = await this.apiClient.gatewayGet(`/api/v1/routing/status/${shipmentId}`);
      this.validateResponse(routeStatus, ['route_id', 'status', 'progress_pct']);
    }
    
    // Get completed deliveries
    const completedDeliveries = await this.apiClient.gatewayGet('/api/v1/shipments/status/delivered');
    this.validateResponse(completedDeliveries, ['shipments']);
    
    console.log('Task management workflow test completed');
  }

  /**
   * Test 3: Navigation Workflow
   */
  async testNavigationWorkflow() {
    console.log('Testing transporter navigation workflow');
    
    // Get route optimization
    const routeOpt = await this.apiClient.gatewayPost('/api/v1/routing/optimize', {
      shipments: ['SHIP_TEST_001'],
      depot: 'warehouse_test_1',
      capacity: 2000
    });
    this.validateResponse(routeOpt, ['routes', 'model_version']);
    
    // Get ETA for route
    const eta = await this.apiClient.gatewayPost('/api/v1/routing/eta', {
      route_id: 'ROUTE_TEST_001',
      current_location: 'warehouse_test_1',
      destination: 'shop_test_1'
    });
    this.validateResponse(eta, ['arrival_time', 'confidence']);
    
    // Get travel time
    const travelTime = await this.apiClient.gatewayPost('/api/v1/routing/travel-time', {
      origin: 'warehouse_test_1',
      destination: 'shop_test_1',
      vehicle_type: 'van'
    });
    this.validateResponse(travelTime, ['estimated_minutes', 'confidence_interval']);
    
    // Get GNN route planning
    const gnnRoute = await this.apiClient.gatewayPost('/api/v1/routing/gnn-route', {
      shipments: ['SHIP_TEST_001'],
      constraints: {
        max_distance: 50,
        time_window: 480
      }
    });
    this.validateResponse(gnnRoute, ['routes', 'model_version']);
    
    // Get route status
    const routeStatus = await this.apiClient.gatewayGet('/api/v1/routing/status/ROUTE_TEST_001');
    this.validateResponse(routeStatus, ['route_id', 'status', 'current_location', 'eta_minutes']);
    
    console.log('Navigation workflow test completed');
  }

  /**
   * Test 4: Profile Workflow
   */
  async testProfileWorkflow() {
    console.log('Testing transporter profile workflow');
    
    // Get profile
    const profile = await this.apiClient.gatewayGet('/api/v1/auth/profile');
    this.validateResponse(profile, ['user']);
    
    // Get shipments by location
    const locationShipments = await this.apiClient.gatewayGet('/api/v1/shipments/location/warehouse_test_1');
    this.validateResponse(locationShipments, ['shipments']);
    
    // Get delivery history
    const completed = await this.apiClient.gatewayGet('/api/v1/shipments/status/delivered');
    this.validateResponse(completed, ['shipments']);
    
    console.log('Profile workflow test completed');
  }

  /**
   * Get test methods for transporter
   */
  getTestMethods() {
    return [
      'testDashboardWorkflow',
      'testTaskWorkflow',
      'testNavigationWorkflow',
      'testProfileWorkflow'
    ];
  }
}

module.exports = TransporterSubAgent;
