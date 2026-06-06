// Endpoint catalog for the CSCM mobile app.
//
// Each entry maps a logical action (used by useApiQuery and ad-hoc calls)
// to the concrete HTTP method and path served by the Node.js gateway on
// :8080. Paths mirror the backend's apiService methods
// (backend/src/agents/<family>/services/apiService.js).
//
// `pathParams` is a list of `{name, source}` pairs for path templating;
// `useApiQuery` substitutes them in order from the call's `params` arg.
//
// `expectedKeys` is a soft schema hint: the app should treat responses
// as opaque JSON and use these for null-safety in the adapter layer.

function make(path, method, expectedKeys, pathParams, queryParams) {
  return Object.freeze({
    path,
    method,
    expectedKeys: Object.freeze(expectedKeys || []),
    pathParams: Object.freeze(pathParams || []),
    queryParams: Object.freeze(queryParams || []),
  });
}

export const STORE = Object.freeze({
  demandForecast: make('/api/v1/demand/forecast', 'POST',
    ['sku_id', 'store_id', 'forecast_dates', 'forecast_values', 'model_version', 'timestamp'],
    []),
  batchDemandForecast: make('/api/v1/demand/batch-forecast', 'POST',
    ['job_id', 'status', 'submitted_count'],
    []),
  getBatchForecastJobStatus: make('/api/v1/demand/forecast-job/{jobId}', 'GET',
    ['job_id', 'status', 'results'],
    [{ name: 'jobId', source: 'jobId' }]),
  inventoryOptimization: make('/api/v1/inventory/optimize', 'POST',
    ['sku_id', 'store_id', 'reorder_quantity', 'safety_stock', 'recommendations', 'model_version'],
    []),
  anomalyDetection: make('/api/v1/anomaly/detect', 'POST',
    ['anomalies', 'alerts', 'model_version'],
    []),
  strategicUpdate: make('/api/v1/learning/strategic-update', 'POST',
    ['model_version', 'training_metrics', 'updated_at'],
    []),
});

export const WAREHOUSE = Object.freeze({
  inventoryOptimization: STORE.inventoryOptimization,
  routingOptimization: make('/api/v1/routing/optimize', 'POST',
    ['routes', 'model_version'],
    []),
  anomalyDetection: STORE.anomalyDetection,
  batchOptimize: make('/api/v1/inventory/batch-optimize', 'POST',
    ['recommendations', 'results', 'total_savings', 'model_version'],
    []),
  visionAnalyze: make('/api/v1/vision/analyze', 'POST',
    ['detections', 'inventory_estimate', 'quality_issues', 'score', 'model_version'],
    []),
});

export const TRANSPORT = Object.freeze({
  routingOptimization: WAREHOUSE.routingOptimization,
  routingEta: make('/api/v1/routing/eta', 'POST',
    ['arrival_time', 'confidence', 'model_version'],
    []),
  travelTime: make('/api/v1/routing/travel-time', 'POST',
    ['estimated_minutes', 'confidence_interval', 'model_version'],
    []),
  gnnRoutePlanning: make('/api/v1/routing/gnn-route', 'POST',
    ['routes', 'model_version'],
    []),
  anomalyDetection: STORE.anomalyDetection,
  routeStatus: make('/api/v1/routing/status/{routeId}', 'GET',
    ['route_id', 'status', 'current_location', 'eta_minutes', 'progress_pct', 'model_version'],
    [{ name: 'routeId', source: 'routeId' }]),
  edgeDeploy: make('/api/v1/routing/edge/deploy', 'POST',
    ['deployment_id', 'status', 'endpoint_url', 'model_version'],
    []),
  edgeUndeploy: make('/api/v1/routing/edge/deploy/{deploymentId}', 'DELETE',
    ['deployment_id', 'status', 'model_version'],
    [{ name: 'deploymentId', source: 'deploymentId' }]),
});

export const SUPPLIER = Object.freeze({
  supplierRiskAssessment: make('/api/v1/supplier/risk', 'POST',
    ['supplier_id', 'risk_score', 'risk_level', 'model_version'],
    []),
  sourcingRecommendations: make('/api/v1/supplier/recommendations/{supplierId}', 'GET',
    ['recommended', 'confidence', 'reason', 'alternatives', 'model_version'],
    [{ name: 'supplierId', source: 'supplierId' }]),
  supplierSurvival: make('/api/v1/supplier/survival', 'POST',
    ['survival_probability', 'risk_factors', 'model_version'],
    []),
  supplierGraphRisk: make('/api/v1/supplier/graph-risk', 'POST',
    ['risk_score', 'network_position', 'dependencies', 'model_version'],
    []),
  anomalyDetection: STORE.anomalyDetection,
  supplierCalibrate: make('/api/v1/supplier/calibrate', 'POST',
    ['calibration_score', 'threshold_adjustments', 'model_version'],
    []),
  supplierBackup: make('/api/v1/supplier/backup', 'POST',
    ['backups', 'total_candidates', 'model_version'],
    []),
  supplierRiskMetrics: make('/api/v1/supplier/risk-metrics', 'POST',
    ['time_range', 'total_assessments', 'avg_risk_score', 'distribution', 'trends', 'model_version'],
    []),
});

export const CUSTOMER_DEMAND = Object.freeze({
  demandForecast: STORE.demandForecast,
  causalInference: make('/api/v1/causal/analyze', 'POST',
    ['treatment_effect', 'confidence_interval', 'model_version'],
    []),
  naturalLanguageProcessing: make('/api/v1/nlp/query', 'POST',
    ['intent', 'entities', 'sentiment', 'model_version'],
    []),
  customerTrends: make('/api/v1/customer/trends/{customerSegment}', 'GET',
    ['segment', 'trend', 'confidence', 'model_version'],
    [{ name: 'customerSegment', source: 'customerSegment' }]),
  segmentSimilarity: make('/api/v1/customer/segment-similarity', 'POST',
    ['similarity', 'shared_characteristics', 'model_version'],
    []),
  sentimentAnalysis: make('/api/v1/nlp/sentiment', 'POST',
    ['sentiment_score', 'sentiment_label', 'confidence', 'key_phrases', 'model_version'],
    []),
});

export const CENTRAL_PLANNER = Object.freeze({
  demandForecast: STORE.demandForecast,
  inventoryOptimization: STORE.inventoryOptimization,
  routingOptimization: WAREHOUSE.routingOptimization,
  supplierRiskAssessment: SUPPLIER.supplierRiskAssessment,
  coordinationPlan: make('/api/v1/coordination/plan', 'POST',
    ['plan_id', 'status', 'steps', 'model_version'],
    []),
  coordinationStatus: make('/api/v1/coordination/status/{planId}', 'GET',
    ['status', 'model_version'],
    [{ name: 'planId', source: 'planId' }]),
  anomalyAlertList: make('/api/v1/anomaly/alerts', 'GET',
    ['alerts', 'total', 'limit', 'offset', 'model_version'],
    [], ['status', 'limit', 'offset']),
  anomalyAlert: make('/api/v1/anomaly/alerts/{alertId}', 'GET',
    ['alert_id', 'severity', 'status', 'model_version'],
    [{ name: 'alertId', source: 'alertId' }]),
  anomalyAlertAcknowledge: make('/api/v1/anomaly/alerts/{alertId}/acknowledge', 'POST',
    ['alert_id', 'status', 'acknowledged_by', 'acknowledged_at', 'model_version'],
    [{ name: 'alertId', source: 'alertId' }]),
  kgQuery: make('/api/v1/kg/query', 'POST',
    ['entities', 'relationships', 'paths', 'model_version'],
    []),
  driftCheck: make('/api/v1/monitoring/drift', 'POST',
    ['drift_detected', 'drift_score', 'affected_features', 'model_version'],
    []),
  safetyStock: make('/api/v1/uncertainty/safety-stock', 'POST',
    ['safety_stock', 'uncertainty_bounds', 'confidence_level', 'model_version'],
    []),
});

export const SIMULATION = Object.freeze({
  digitalTwinSimulation: make('/api/v1/simulation/run', 'POST',
    ['simulation_id', 'status', 'results', 'model_version'],
    []),
  demandForecast: STORE.demandForecast,
  inventoryOptimization: STORE.inventoryOptimization,
  simulationRun: make('/api/v1/simulation/run', 'POST',
    ['simulation_id', 'status', 'summary', 'model_version'],
    []),
  simulationDiscreteEvent: make('/api/v1/simulation/discrete-event-sim', 'POST',
    ['events', 'duration', 'summary', 'model_version'],
    []),
  simulationResults: make('/api/v1/simulation/results/{simulationId}', 'GET',
    ['status', 'model_version'],
    [{ name: 'simulationId', source: 'simulationId' }]),
  simulationNetworkSim: make('/api/v1/simulation/network-sim', 'POST',
    ['nodes', 'edges', 'metrics', 'model_version'],
    []),
  simulationWhatIf: make('/api/v1/simulation/policy-impact', 'POST',
    ['impact', 'confidence', 'model_version'],
    []),
});

export const AUTH = Object.freeze({
  register: make('/api/v1/auth/register', 'POST',
    ['token', 'user'],
    []),
  login: make('/api/v1/auth/login', 'POST',
    ['token', 'user'],
    []),
  profile: make('/api/v1/auth/profile', 'GET',
    ['user'],
    []),
});

export const INVENTORY_CRUD = Object.freeze({
  listByStore: make('/api/v1/inventory/{storeId}', 'GET',
    ['items'],
    [{ name: 'storeId', source: 'storeId' }]),
  getItem: make('/api/v1/inventory/{storeId}/{productId}', 'GET',
    ['sku_id', 'store_id', 'quantity', 'reorder_point'],
    [{ name: 'storeId', source: 'storeId' }, { name: 'productId', source: 'productId' }]),
  createOrUpdate: make('/api/v1/inventory', 'POST',
    ['sku_id', 'store_id', 'quantity'],
    []),
  updateQuantity: make('/api/v1/inventory/{storeId}/{productId}/quantity', 'PUT',
    ['sku_id', 'store_id', 'quantity'],
    [{ name: 'storeId', source: 'storeId' }, { name: 'productId', source: 'productId' }]),
});

export const ORDERS = Object.freeze({
  create: make('/api/v1/orders', 'POST',
    ['order_id', 'status'],
    []),
  get: make('/api/v1/orders/{orderId}', 'GET',
    ['order_id', 'store_id', 'status', 'items'],
    [{ name: 'orderId', source: 'orderId' }]),
  updateStatus: make('/api/v1/orders/{orderId}/status', 'PATCH',
    ['order_id', 'status'],
    [{ name: 'orderId', source: 'orderId' }]),
  listByStore: make('/api/v1/orders/store/{storeId}', 'GET',
    ['orders'],
    [{ name: 'storeId', source: 'storeId' }]),
});

export const SHIPMENTS = Object.freeze({
  create: make('/api/v1/shipments', 'POST',
    ['shipment_id', 'status'],
    []),
  get: make('/api/v1/shipments/{shipmentId}', 'GET',
    ['shipment_id', 'status', 'origin', 'destination'],
    [{ name: 'shipmentId', source: 'shipmentId' }]),
  updateStatus: make('/api/v1/shipments/{shipmentId}/status', 'PATCH',
    ['shipment_id', 'status'],
    [{ name: 'shipmentId', source: 'shipmentId' }]),
  listByStatus: make('/api/v1/shipments/status/{status}', 'GET',
    ['shipments'],
    [{ name: 'status', source: 'status' }]),
  listByLocation: make('/api/v1/shipments/location/{location}', 'GET',
    ['shipments'],
    [{ name: 'location', source: 'location' }]),
});

export const ENDPOINTS = Object.freeze({
  STORE,
  WAREHOUSE,
  TRANSPORT,
  SUPPLIER,
  CUSTOMER_DEMAND,
  CENTRAL_PLANNER,
  SIMULATION,
  AUTH,
  INVENTORY_CRUD,
  ORDERS,
  SHIPMENTS,
});

export const ROLE_ENDPOINTS = Object.freeze({
  shopkeeper: Object.freeze({
    ...STORE,
    ...CENTRAL_PLANNER,
    ...INVENTORY_CRUD,
    ...ORDERS,
    ...SHIPMENTS,
    ...CUSTOMER_DEMAND,
  }),
  transporter: Object.freeze({
    ...TRANSPORT,
    ...CENTRAL_PLANNER,
    ...SHIPMENTS,
  }),
  wholesaler: Object.freeze({
    ...SUPPLIER,
    ...INVENTORY_CRUD,
    ...ORDERS,
    ...SHIPMENTS,
  }),
  mesh: Object.freeze({
    ...CENTRAL_PLANNER,
    ...SIMULATION,
  }),
});

function resolvePath(template, params) {
  if (!template.includes('{')) return template;
  if (!params || typeof params !== 'object') return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    if (value === undefined || value === null) return match;
    return encodeURIComponent(String(value));
  });
}

export function lookupEndpoint(family, action) {
  const group = ENDPOINTS[family];
  if (!group) return null;
  const entry = group[action];
  if (!entry) return null;
  return entry;
}

export function resolveCall(family, action, params) {
  const entry = lookupEndpoint(family, action);
  if (!entry) {
    throw new Error(`Unknown endpoint: ${family}.${action}`);
  }
  const path = resolvePath(entry.path, params);
  const queryParams = {};
  if (params && entry.queryParams.length) {
    entry.queryParams.forEach((name) => {
      if (params[name] !== undefined) queryParams[name] = params[name];
    });
  }
  return { path, method: entry.method, queryParams, hasBody: entry.method !== 'GET' && entry.method !== 'DELETE' };
}
