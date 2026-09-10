/**
 * Mesh Console Sub-Agent
 * Implements mesh console-specific E2E test workflows
 */

const BaseSubAgent = require('../utils/sub-agent-base');
const testData = require('../config/test-data');

class MeshConsoleSubAgent extends BaseSubAgent {
  constructor(userId = 'mesh_test_1') {
    super('mesh', userId);
  }

  /**
   * Load mesh console-specific data
   */
  async loadRoleSpecificData() {
    try {
      // Load alerts
      const alerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts');
      this.state.alerts = alerts.data;
      
      // Load knowledge graph
      const kg = await this.apiClient.gatewayPost('/api/v1/kg/query', {
        query_type: 'all_entities'
      });
      this.state.knowledgeGraph = kg.data;
    } catch (error) {
      console.log('No existing mesh data, using test fixtures');
      this.state.alerts = { alerts: [], total: 0 };
      this.state.knowledgeGraph = { entities: [], relationships: [] };
    }
  }

  /**
   * Test 1: Alerts Workflow
   */
  async testAlertsWorkflow() {
    console.log('Testing mesh console alerts workflow');
    
    // Get all anomaly alerts
    const alerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts');
    this.validateResponse(alerts, ['alerts', 'total']);
    
    // Filter alerts by status
    const activeAlerts = await this.apiClient.gatewayGet('/api/v1/anomaly/alerts', {
      status: 'active'
    });
    this.validateResponse(activeAlerts, ['alerts']);
    
    if (alerts.data.alerts.length > 0) {
      const alertId = alerts.data.alerts[0].alert_id;
      
      // Get specific alert details
      const alertDetails = await this.apiClient.gatewayGet(`/api/v1/anomaly/alerts/${alertId}`);
      this.validateResponse(alertDetails, ['alert_id', 'severity', 'status']);
      
      // Acknowledge alert
      const acknowledged = await this.apiClient.gatewayPost(
        `/api/v1/anomaly/alerts/${alertId}/acknowledge`,
        { acknowledged_by: this.userId }
      );
      this.validateResponse(acknowledged, ['alert_id', 'status', 'acknowledged_at']);
    }
    
    console.log('Alerts workflow test completed');
  }

  /**
   * Test 2: Knowledge Graph Workflow
   */
  async testKnowledgeGraphWorkflow() {
    console.log('Testing mesh console knowledge graph workflow');
    
    // Query knowledge graph
    const kgQuery = await this.apiClient.gatewayPost('/api/v1/kg/query', {
      query_type: 'entity_relationships',
      entity_type: 'store',
      entity_id: 'shop_test_1'
    });
    this.validateResponse(kgQuery, ['entities', 'relationships']);
    
    // Query specific entity
    const entityQuery = await this.apiClient.gatewayPost('/api/v1/kg/query', {
      query_type: 'entity_details',
      entity_id: 'shop_test_1'
    });
    this.validateResponse(entityQuery, ['entities']);
    
    // Query graph paths
    const pathQuery = await this.apiClient.gatewayPost('/api/v1/kg/query', {
      query_type: 'shortest_path',
      from_entity: 'warehouse_test_1',
      to_entity: 'shop_test_1'
    });
    this.validateResponse(pathQuery, ['paths']);
    
    console.log('Knowledge graph workflow test completed');
  }

  /**
   * Test 3: Drift Monitoring Workflow
   */
  async testDriftWorkflow() {
    console.log('Testing mesh console drift monitoring workflow');
    
    // Check model drift
    const drift = await this.apiClient.gatewayPost('/api/v1/monitoring/drift', {
      model_type: 'demand_forecasting',
      model_version: '1.0'
    });
    this.validateResponse(drift, ['drift_detected', 'drift_score']);
    
    // Check model performance
    const performance = await this.apiClient.gatewayPost('/api/v1/monitoring/performance', {
      model_type: 'demand_forecasting'
    });
    this.validateResponse(performance, ['metrics', 'performance_score']);
    
    // Get model status
    const modelStatus = await this.apiClient.gatewayGet('/api/v1/monitoring/status');
    this.validateResponse(modelStatus, ['models', 'status']);
    
    console.log('Drift monitoring workflow test completed');
  }

  /**
   * Test 4: Network Topology Workflow
   */
  async testNetworkWorkflow() {
    console.log('Testing mesh console network topology workflow');
    
    // Run network simulation
    const networkSim = await this.apiClient.gatewayPost('/api/v1/simulation/network-sim', {
      nodes: ['shop_test_1', 'shop_test_2', 'warehouse_test_1', 'warehouse_test_2'],
      edges: [
        { from: 'warehouse_test_1', to: 'shop_test_1', capacity: 1000 },
        { from: 'warehouse_test_1', to: 'shop_test_2', capacity: 500 },
        { from: 'warehouse_test_2', to: 'shop_test_1', capacity: 800 }
      ]
    });
    this.validateResponse(networkSim, ['nodes', 'edges', 'metrics']);
    
    // Run discrete event simulation
    const eventSim = await this.apiClient.gatewayPost('/api/v1/simulation/discrete-event-sim', {
      events: [
        { type: 'order', entity: 'shop_test_1', quantity: 10 },
        { type: 'delivery', entity: 'warehouse_test_1', quantity: 10 }
      ],
      duration: 3600
    });
    this.validateResponse(eventSim, ['events', 'summary']);
    
    // Run what-if analysis
    const whatIf = await this.apiClient.gatewayPost('/api/v1/simulation/policy-impact', {
      policy: 'increase_inventory',
      parameters: { increase_percentage: 20 }
    });
    this.validateResponse(whatIf, ['impact', 'confidence']);
    
    console.log('Network topology workflow test completed');
  }

  /**
   * Get test methods for mesh console
   */
  getTestMethods() {
    return [
      'testAlertsWorkflow',
      'testKnowledgeGraphWorkflow',
      'testDriftWorkflow',
      'testNetworkWorkflow'
    ];
  }
}

module.exports = MeshConsoleSubAgent;
