/**
 * Aurora navigation registry — single source of truth shared by the
 * icon-rail sidebar and the command palette. Each item: [path, label, icon].
 */
export const NAV = [
  {
    group: 'Monitor',
    items: [
      ['/', 'Overview', 'home'],
      ['/services', 'Services', 'server'],
      ['/logs', 'Logs', 'fileText'],
      ['/events', 'Event stream', 'activity'],
    ],
  },
  {
    group: 'Database',
    items: [
      ['/db/tables', 'Tables', 'database'],
      ['/db/query', 'SQL console', 'terminal'],
      ['/db/backups', 'Backups', 'archive'],
      ['/db/migrations', 'Migrations', 'layers'],
    ],
  },
  {
    group: 'Business data',
    items: [
      ['/revenue', 'Revenue', 'trending'],
      ['/users', 'Users & roles', 'users'],
      ['/inventory', 'Inventory', 'package'],
      ['/orders', 'Orders', 'briefcase'],
      ['/shipments', 'Shipments', 'truck'],
    ],
  },
  {
    group: 'Agents (Node)',
    items: [
      ['/agents', 'Runtime control', 'cpu'],
      ['/agents/families', 'Families & sub-agents', 'gitBranch'],
      ['/knowledge-graph', 'Knowledge graph', 'share2'],
      ['/cache', 'Cache', 'zap'],
      ['/feature-store', 'Feature store', 'database'],
    ],
  },
  {
    group: 'AI/ML (Python)',
    items: [
      ['/ai', 'Model overview', 'sparkle'],
      ['/ai/playground', 'API playground', 'play'],
      ['/ai/demand-forecast', 'Demand forecast', 'trending'],
      ['/ai/demand-planning', 'Demand planning', 'calendar'],
      ['/ai/inventory-opt', 'Inventory optimization', 'package'],
      ['/ai/routing', 'Routing & logistics', 'truck'],
      ['/ai/supplier-risk', 'Supplier risk', 'alert'],
      ['/ai/customer', 'Customer demand', 'users'],
      ['/ai/anomaly', 'Anomaly detection', 'crosshair'],
      ['/ai/nlp', 'NLP & LLM', 'messageCircle'],
      ['/ai/kg', 'Knowledge graph', 'share2'],
      ['/ai/causal', 'Causal inference', 'gitBranch'],
      ['/ai/vision', 'Computer vision', 'camera'],
      ['/ai/learning', 'Continual learning', 'refresh'],
      ['/ai/uncertainty', 'Uncertainty', 'sliders'],
      ['/ai/monitoring', 'Model monitoring', 'activity'],
      ['/ai/digital-twin', 'Digital twin', 'copy'],
      ['/ai/coordination', 'Multi-agent coordination', 'cpu'],
      ['/ai/explain', 'Explainability', 'eye'],
    ],
  },
  {
    group: 'Platform',
    items: [
      ['/simulation', 'User simulation', 'compass'],
      ['/gateway/routing', 'Gateway routing', 'globe'],
      ['/gateway/circuits', 'Circuit breakers', 'shield'],
      ['/mobile', 'Mobile app screens', 'smartphone'],
      ['/settings', 'Settings', 'settings'],
      ['/docs', 'Docs & links', 'doc'],
    ],
  },
];

/** Flat list of { path, label, group } for search surfaces. */
export const FLAT_NAV = NAV.flatMap((g) =>
  g.items.map(([path, label, icon]) => ({ path, label, icon, group: g.group }))
);
