/**
 * Shared metadata for the control plane UI: agent families, AI/ML endpoints,
 * table registry, and navigation routes. Pages import from here so the UI
 * mirrors the real system topology without hardcoding things twice.
 */

export const AGENT_FAMILIES = [
  {
    name: 'store',
    label: 'Store Agent',
    description: 'Per-store demand forecasting, inventory optimization, stock recommendations, continual learning.',
    subAgents: ['DemandForecaster', 'InventoryOptimizer', 'StockRecommender', 'ContinualLearner'],
  },
  {
    name: 'warehouse',
    label: 'Warehouse Agent',
    description: 'Picking, packing, batching, shipment consolidation and vision-based inspection.',
    subAgents: ['PickingOptimizer', 'PackingPlanner', 'BatchOptimizer', 'ShipmentConsolidator', 'VisionInspector'],
  },
  {
    name: 'transport',
    label: 'Transport Agent',
    description: 'Route optimization, fleet management, delivery scheduling, edge deployment.',
    subAgents: ['RouteOptimizer', 'FleetManager', 'DeliveryScheduler', 'RouteTracker', 'EdgeDeployer'],
  },
  {
    name: 'supplier',
    label: 'Supplier Agent',
    description: 'Risk assessment, performance tracking, backup supplier search, sourcing advice.',
    subAgents: ['RiskAssessor', 'RiskMetricsAnalyzer', 'PerformanceTracker', 'BackupSupplierFinder', 'SourcingAdvisor', 'SupplierCalibrator'],
  },
  {
    name: 'customer-demand',
    label: 'Customer Demand Agent',
    description: 'Trend analysis, customer segmentation, NLP summaries of demand signals.',
    subAgents: ['TrendAnalyzer', 'SegmentManager', 'NLPSummarizer'],
  },
  {
    name: 'central-planner',
    label: 'Central Planner Agent',
    description: 'Network-wide orchestration: warehouse assignment, delivery coordination, drift & anomaly detection.',
    subAgents: ['WarehouseAssigner', 'DeliveryCoordinator', 'DriftDetector', 'AnomalyAlerter', 'UncertaintyQuantifier', 'KnowledgeGraphQuerier'],
  },
  {
    name: 'simulation',
    label: 'Simulation Agent',
    description: 'User simulation, event generation, scenario running for demos and load tests.',
    subAgents: ['EventGenerator', 'ScenarioRunner'],
  },
];

/**
 * AI/ML domain routes proxied by the gateway at /api/v1/<route>.
 * Each entry: dashboard route, gateway prefix, sample endpoint + payload.
 */
export const AI_DOMAINS = [
  {
    key: 'demand-forecast',
    title: 'Demand Forecasting',
    prefix: 'demand',
    desc: 'Time-series demand prediction per store/product.',
    sample: { endpoint: '/demand/forecast', method: 'POST', body: { storeId: 'store-1', horizonDays: 7 } },
  },
  {
    key: 'demand-planning',
    title: 'Demand Planning',
    prefix: 'demand-planning',
    desc: 'Multi-echelon planning and replenishment plans.',
    sample: { endpoint: '/demand-planning/forecast', method: 'POST', body: { storeId: 'store-1', horizonWeeks: 4 } },
  },
  {
    key: 'inventory-opt',
    title: 'Inventory Optimization',
    prefix: 'inventory',
    desc: 'Reorder points, safety stock, MIP/RL policies.',
    sample: { endpoint: '/inventory/optimize', method: 'POST', body: { storeId: 'store-1', serviceLevel: 0.95 } },
  },
  {
    key: 'routing',
    title: 'Routing & Logistics',
    prefix: 'routing',
    desc: 'Vehicle routing, fleet assignment, ETA prediction.',
    sample: { endpoint: '/routing/optimize', method: 'POST', body: { origin: 'warehouse-1', destinations: ['store-1', 'store-2'] } },
  },
  {
    key: 'supplier-risk',
    title: 'Supplier Risk',
    prefix: 'supplier',
    desc: 'Supplier risk scoring and backup sourcing.',
    sample: { endpoint: '/supplier/risk', method: 'POST', body: { supplierId: 'supplier-1' } },
  },
  {
    key: 'customer',
    title: 'Customer Demand Analytics',
    prefix: 'customer',
    desc: 'Segmentation, trend and churn analysis.',
    sample: { endpoint: '/customer/analyze', method: 'POST', body: { segment: 'all' } },
  },
  {
    key: 'anomaly',
    title: 'Anomaly Detection',
    prefix: 'anomaly',
    desc: 'Streaming anomaly alerts across the mesh.',
    sample: { endpoint: '/anomaly/detect', method: 'POST', body: { metric: 'order_volume' } },
  },
  {
    key: 'nlp',
    title: 'NLP & LLM',
    prefix: 'nlp',
    desc: 'Summarization, entity extraction, Q&A over supply chain docs.',
    sample: { endpoint: '/nlp/sentiment', method: 'POST', body: { text: 'Weekly demand is trending up 12% in the north region...' } },
  },
  {
    key: 'kg',
    title: 'Knowledge Graph',
    prefix: 'kg',
    desc: 'Entity graph queries: stores, suppliers, products, routes.',
    sample: { endpoint: '/kg/query', method: 'POST', body: { query: 'suppliers of product milk' } },
  },
  {
    key: 'causal',
    title: 'Causal Inference',
    prefix: 'causal',
    desc: 'Uplift and causal impact of interventions.',
    sample: { endpoint: '/causal/analyze', method: 'POST', body: { treatment: 'promotion', outcome: 'sales' } },
  },
  {
    key: 'vision',
    title: 'Computer Vision',
    prefix: 'vision',
    desc: 'Shelf inspection, damage detection from warehouse cameras.',
    sample: { endpoint: '/vision/analyze', method: 'POST', body: { imageUrl: 'https://example.com/shelf.jpg' } },
  },
  {
    key: 'learning',
    title: 'Continual Learning',
    prefix: 'learning',
    desc: 'Online model updates and rollback.',
    sample: { endpoint: '/learning/status/demand-forecast', method: 'GET', body: null },
  },
  {
    key: 'uncertainty',
    title: 'Uncertainty Quantification',
    prefix: 'uncertainty',
    desc: 'Prediction intervals and risk bands.',
    sample: { endpoint: '/uncertainty/quantify', method: 'POST', body: { modelId: 'demand-forecast', predictions: [] } },
  },
  {
    key: 'monitoring',
    title: 'Model Monitoring',
    prefix: 'monitoring',
    desc: 'Drift, accuracy decay, model registry health.',
    sample: { endpoint: '/monitoring/drift', method: 'POST', body: { modelId: 'demand-forecast', reference: [], current: [] } },
  },
  {
    key: 'digital-twin',
    title: 'Digital Twin',
    prefix: 'digital-twin',
    desc: 'Simulated mesh state for what-if analysis.',
    sample: { endpoint: '/simulation/run', method: 'POST', body: { scenario: 'baseline', horizonDays: 7 } },
  },
  {
    key: 'coordination',
    title: 'Multi-agent Coordination',
    prefix: 'coordination',
    desc: 'Negotiation and task allocation across agents.',
    sample: { endpoint: '/coordination/plan', method: 'POST', body: { agents: [], objective: 'rebalance' } },
  },
  {
    key: 'explain',
    title: 'Explainability',
    prefix: 'explain',
    desc: 'SHAP/feature attributions for any prediction.',
    sample: { endpoint: '/explain/prediction', method: 'POST', body: { modelId: 'demand-forecast', recordId: 'store-1' } },
  },
];

/**
 * Database tables by domain (see backend/src/storage/migrations + schema).
 */
export const DB_TABLES = [
  { name: 'users', label: 'Users', desc: 'Accounts, bcrypt hashes, roles, lockout state.' },
  { name: 'inventory', label: 'Inventory', desc: 'Per store/product stock levels and reorder points.' },
  { name: 'orders', label: 'Orders', desc: 'Shopkeeper orders with status lifecycle.' },
  { name: 'shipments', label: 'Shipments', desc: 'Transporter shipments with location tracking.' },
];

/** Routes the gateway proxies where → target. Mirrors gateway/config.yaml. */
export const GATEWAY_ROUTES = [
  { prefix: '/api/v1/demand', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/demand-planning', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/routing', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/supplier', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/customer', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/anomaly', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/coordination', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/simulation', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/explain', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/nlp', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/kg', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/causal', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/vision', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/learning', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/uncertainty', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/monitoring', target: 'AI/ML :8000', auth: 'JWT + API key' },
  { prefix: '/api/v1/auth/*', target: 'Node backend :3000', auth: 'rate-limited public' },
  { prefix: '/api/v1/events/*', target: 'Node backend :3000', auth: 'optional JWT' },
  { prefix: '/api/v1/inventory/*', target: 'Node backend :3000', auth: 'JWT' },
  { prefix: '/api/v1/orders/*', target: 'Node backend :3000', auth: 'JWT' },
  { prefix: '/api/v1/shipments/*', target: 'Node backend :3000', auth: 'JWT' },
];

/** Mobile app screens per role (App/users/*). */
export const MOBILE_SCREENS = {
  shopkeeper: [
    'Dashboard', 'Inventory', 'StockRequests', 'Shipments', 'Analysis', 'Communication', 'Profile',
  ],
  transporter: ['Dashboard', 'Tasks', 'Navigation', 'Profile'],
  wholesaler: ['Dashboard', 'Orders', 'Inventory', 'Analytics', 'Profile'],
  mesh: ['Alerts', 'KnowledgeGraph', 'Drift', 'Network'],
};

export const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
export const GRAFANA_URL = process.env.GRAFANA_URL || 'http://localhost:3001';
