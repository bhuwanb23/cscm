// Color Palette Constants
export const COLORS = {
  white: '#FFFFFF',
  slateLight: '#F8F9FA',
  slate: '#E9ECEF',
  slateDark: '#7F8C8D',
  charcoal: '#2C3E50',
  indigo: '#4A90E2',
  indigoLight: '#E3F2FD',
  success: '#6BCF7F',
  warning: '#FFD93D',
  danger: '#FF6B6B',
  dangerLight: '#FFE6E6',
  warningLight: '#FFF8E6',
  successLight: '#E6F4EA',
};

// Typography Constants
export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  h2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#2C3E50',
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#7F8C8D',
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#7F8C8D',
  },
};

// Shopkeeper Profile Data
export const SHOPKEEPER_PROFILE = {
  shopName: 'Urban Fashion Hub',
  ownerName: 'Alex Morgan',
  shopId: 'SK-78945',
  location: 'Downtown Mall, Suite B-12',
  category: 'Fashion',
  joinedDate: 'March 15, 2022',
  verificationStatus: true,
  connectedNodes: ['Warehouse A', 'Store Front', 'Marketplace', 'Distributor'],
  logo: null, // Will use placeholder if null
};

// Shop Information Data
export const SHOP_INFORMATION = {
  description: 'Trendy fashion retailer specializing in urban streetwear and accessories. Serving customers since 2015 with a focus on quality and style.',
  businessSize: {
    revenue: '$2.5M annually',
    skuCount: '1,250 SKUs',
    dailyOrders: '150 orders/day',
  },
  channels: [
    { name: 'POS System', connected: true },
    { name: 'Shopify', connected: true },
    { name: 'WooCommerce', connected: false },
    { name: 'Amazon', connected: true },
    { name: 'Offline Stores', connected: true },
  ],
  warehouses: ['Main Warehouse - Downtown', 'Backup Storage - North District'],
  fulfillmentPartners: ['FastShip Logistics', 'Express Delivery Co.'],
};

// Performance Metrics
export const PERFORMANCE_METRICS = [
  { id: 1, name: 'Stock Accuracy', value: 94.2, unit: '%', trend: 'up' },
  { id: 2, name: 'Fulfillment Speed', value: 18, unit: 'hrs', trend: 'down' },
  { id: 3, name: 'OOS Rate', value: 3.7, unit: '%', trend: 'down' },
  { id: 4, name: 'Overstock Risk', value: 12.4, unit: 'score', trend: 'down' },
  { id: 5, name: 'Forecast Accuracy', value: 87.3, unit: '%', trend: 'up' },
];

// Inventory Mesh Status
export const INVENTORY_MESH_STATUS = {
  activeAgents: [
    { name: 'Demand Agent', status: 'active' },
    { name: 'Supply Agent', status: 'active' },
    { name: 'Pricing Agent', status: 'active' },
    { name: 'Exception Agent', status: 'active' },
  ],
  syncStatus: {
    pos: { name: 'POS System', status: 'synced', lastSync: '2 mins ago' },
    ecommerce: { name: 'eCommerce', status: 'synced', lastSync: '5 mins ago' },
  },
  alerts: [
    { id: 1, type: 'low-stock', message: '32 SKUs below threshold', severity: 'warning' },
    { id: 2, type: 'high-risk', message: '15 high-risk SKUs identified', severity: 'warning' },
    { id: 3, type: 'pending-action', message: '8 pending replenishment actions', severity: 'info' },
  ],
};

// Sales & Demand Insights
export const SALES_INSIGHTS = {
  topSellingSKUs: [
    { id: 1, name: 'Streetwear Hoodie - Black', sales: 1240, trend: 'up' },
    { id: 2, name: 'Designer Sneakers', sales: 980, trend: 'up' },
    { id: 3, name: 'Leather Wallet - Brown', sales: 760, trend: 'stable' },
  ],
  slowMovingSKUs: [
    { id: 1, name: 'Summer Hat - Beige', inventory: 142, trend: 'down' },
    { id: 2, name: 'Denim Jacket - Light Wash', inventory: 89, trend: 'down' },
    { id: 3, name: 'Canvas Tote Bag', inventory: 67, trend: 'down' },
  ],
  aiPrediction: {
    trend: 'positive',
    confidence: 87,
    nextMonthProjection: '+12% sales growth',
  },
  replenishmentRecommendations: [
    { id: 1, sku: 'Streetwear Hoodie - Black', recommended: 200, urgency: 'high' },
    { id: 2, sku: 'Designer Sneakers', recommended: 150, urgency: 'medium' },
    { id: 3, sku: 'Summer Hat - Beige', recommended: 50, urgency: 'low' },
  ],
};

// Compliance & Risk Data
export const COMPLIANCE_RISK = {
  stockVariance: [
    { month: 'Jan', variance: 2.1 },
    { month: 'Feb', variance: 1.8 },
    { month: 'Mar', variance: 3.2 },
    { month: 'Apr', variance: 2.7 },
    { month: 'May', variance: 1.9 },
  ],
  expiryItems: [
    { id: 1, name: 'Seasonal Decor - Winter', expiryDate: 'Dec 2023', quantity: 42 },
    { id: 2, name: 'Promotional Calendars', expiryDate: 'Jan 2024', quantity: 120 },
  ],
  shrinkageInsights: {
    detected: 3,
    lastScan: '2 days ago',
    anomalies: [
      { id: 1, type: 'possible-theft', sku: 'Designer Watch', severity: 'high' },
      { id: 2, type: 'inventory-error', sku: 'Perfume Set', severity: 'medium' },
    ],
  },
};

// Team Members Data
export const TEAM_MEMBERS = [
  { id: 1, name: 'Jamie Smith', role: 'Store Manager', contact: 'jamie@urbanfashion.com', permissions: ['View', 'Edit'], lastActive: '2 hours ago' },
  { id: 2, name: 'Taylor Kim', role: 'Sales Associate', contact: 'taylor@urbanfashion.com', permissions: ['View'], lastActive: '5 hours ago' },
  { id: 3, name: 'Jordan Lee', role: 'Inventory Specialist', contact: 'jordan@urbanfashion.com', permissions: ['View', 'Edit', 'Ops'], lastActive: '1 hour ago' },
  { id: 4, name: 'Casey Brown', role: 'Finance Manager', contact: 'casey@urbanfashion.com', permissions: ['View', 'Finance'], lastActive: '1 day ago' },
];

// Settings & Integrations Data
export const SETTINGS_INTEGRATIONS = {
  apiKeys: [
    { id: 1, name: 'Primary API Key', status: 'active', lastUsed: '2 mins ago' },
    { id: 2, name: 'Analytics Key', status: 'active', lastUsed: '1 hour ago' },
  ],
  integrations: [
    { id: 1, name: 'POS System', status: 'connected', lastSync: '2 mins ago' },
    { id: 2, name: 'Warehouse Management', status: 'connected', lastSync: '5 mins ago' },
    { id: 3, name: 'eCommerce Platforms', status: 'connected', lastSync: '10 mins ago' },
    { id: 4, name: 'Accounting Software', status: 'disconnected', lastSync: 'N/A' },
  ],
  notificationPreferences: {
    email: true,
    sms: false,
    push: true,
    slack: false,
  },
  dataSync: {
    frequency: 'real-time',
    lastSync: '2 minutes ago',
    autoSync: true,
  },
};