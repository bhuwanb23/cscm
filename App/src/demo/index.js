export const MESH_DEFAULT_DRIFT = {
  model: 'DemandForecaster',
  baseline_accuracy: 0.91,
  current_accuracy: 0.79,
  drift_score: 0.13,
  threshold: 0.10,
  detected_at: '2024-12-15T10:30:00Z',
  affected_clusters: ['Bengaluru', 'Mumbai-South'],
  recommended_action: 'Retrain DemandForecaster on last 14 days.',
};

export const MESH_DEFAULT_GRAPH = {
  nodes: [
    { id: 'shopkeeper-1', type: 'shopkeeper', label: 'Fresh Mart' },
    { id: 'shopkeeper-2', type: 'shopkeeper', label: 'City Grocer' },
    { id: 'wholesaler-1', type: 'wholesaler', label: 'CSCM Wholesale' },
    { id: 'warehouse-1', type: 'warehouse', label: 'Warehouse A' },
    { id: 'transporter-1', type: 'transporter', label: 'FedEx Express' },
    { id: 'transporter-2', type: 'transporter', label: 'DHL Logistics' },
    { id: 'planner-1', type: 'central-planner', label: 'Central Planner' },
  ],
  edges: [
    { from: 'shopkeeper-1', to: 'wholesaler-1', relationship: 'orders_from' },
    { from: 'shopkeeper-2', to: 'wholesaler-1', relationship: 'orders_from' },
    { from: 'wholesaler-1', to: 'warehouse-1', relationship: 'stocks_at' },
    { from: 'warehouse-1', to: 'transporter-1', relationship: 'ships_via' },
    { from: 'warehouse-1', to: 'transporter-2', relationship: 'ships_via' },
    { from: 'transporter-1', to: 'shopkeeper-1', relationship: 'delivers_to' },
    { from: 'transporter-2', to: 'shopkeeper-2', relationship: 'delivers_to' },
    { from: 'planner-1', to: 'wholesaler-1', relationship: 'coordinates' },
  ],
};

export const MESH_DEFAULT_ALERTS = [
  { id: 'A-001', severity: 'critical', title: 'Drift Detected in DemandForecaster', source: 'central-planner', description: 'Prediction accuracy dropped 12% in last 4h on Bengaluru cluster.', created_at: '2024-12-15T10:30:00Z', acknowledged: false },
  { id: 'A-002', severity: 'high', title: 'InventoryOptimizer Divergence', source: 'central-planner', description: 'Three warehouses reporting conflicting reorder recommendations.', created_at: '2024-12-15T09:15:00Z', acknowledged: false },
  { id: 'A-003', severity: 'medium', title: 'EventGenerator Latency Spike', source: 'central-planner', description: 'p95 latency > 800ms in EU region for past 30 min.', created_at: '2024-12-15T08:45:00Z', acknowledged: false },
  { id: 'A-004', severity: 'low', title: 'Warehouse B Storage Threshold', source: 'central-planner', description: 'Storage utilization crossed 85% in Warehouse B.', created_at: '2024-12-15T07:20:00Z', acknowledged: true },
];

export const MESH_DEFAULT_NODES = [
  { id: 's1', type: 'shopkeeper', label: 'Fresh Mart', status: 'active', region: 'South' },
  { id: 's2', type: 'shopkeeper', label: 'City Grocer', status: 'active', region: 'North' },
  { id: 's3', type: 'shopkeeper', label: 'Quick Stop', status: 'inactive', region: 'East' },
  { id: 'w1', type: 'wholesaler', label: 'CSCM Wholesale', status: 'active', region: 'HQ' },
  { id: 'wh1', type: 'warehouse', label: 'Warehouse A', status: 'active', region: 'South', utilization: 0.78 },
  { id: 'wh2', type: 'warehouse', label: 'Warehouse B', status: 'warning', region: 'West', utilization: 0.92 },
  { id: 't1', type: 'transporter', label: 'FedEx Express', status: 'active', region: 'Pan-India' },
  { id: 't2', type: 'transporter', label: 'DHL Logistics', status: 'active', region: 'Pan-India' },
  { id: 'p1', type: 'central-planner', label: 'Central Planner', status: 'active', region: 'HQ' },
];

export const SHOPKEEPER_FALLBACK_STOCK_LEVELS = { good: 124, low: 18, critical: 7 };

export const SHOPKEEPER_FALLBACK_SHIPMENTS = [
  { id: 'SH001', items: 'Electronics & Accessories', eta: 'Today, 3:00 PM', status: 'in_transit' },
  { id: 'SH002', items: 'Home & Garden', eta: 'Tomorrow, 10:00 AM', status: 'preparing' },
];

export const SHOPKEEPER_FALLBACK_ALERTS = [
  { id: 1, type: 'critical', title: 'Critical Stock Level', message: 'iPhone 14 cases below minimum threshold', time: '2 minutes ago' },
  { id: 2, type: 'warning', title: 'Delivery Delay', message: 'Shipment #SH003 delayed by 2 hours', time: '15 minutes ago' },
  { id: 3, type: 'success', title: 'Stock Replenished', message: 'Wireless headphones restocked successfully', time: '1 hour ago' },
];

export const SHOPKEEPER_DEFAULT_METRICS = {
  stockoutRisk: 18,
  overstockValue: 24.5,
  revenueLost: 3.2,
  skuHealth: 82,
  forecastAccuracy: 91,
  workingCapital: 47.3,
  demandSpikes: 6,
  inventoryTurnover: 9.1,
  transferGain: 1.4,
};

export const SHOPKEEPER_DONE_METRICS = {
  stockoutRisk: 21,
  overstockValue: 26.9,
  revenueLost: 2.7,
  skuHealth: 84,
  forecastAccuracy: 92,
  workingCapital: 45.1,
  demandSpikes: 8,
  inventoryTurnover: 9.4,
  transferGain: 1.9,
};

export const SHOPKEEPER_DEFAULT_INSIGHTS = [
  'SKU X is selling 3x faster in Bangalore; transfer 20 units from Chennai.',
  'Weekend spike of 2.1x expected on beverages; increase PO by 18%.',
  'Ageing inventory in Warehouse B: 43 SKUs beyond 90 days.',
  '16 SKUs not synced across D2C, Meesho, Amazon \u2013 channel risk.',
];

export const TRANSPORTER_DEFAULT_DRIVER = {
  name: 'John Smith',
  driverId: 'DRV001',
  email: 'john.smith@transporter.com',
  licenseNumber: 'DL1234567890',
  licenseExpiry: '2025-12-31',
  phone: '+1 (555) 123-4567',
  emergencyContact: '+1 (555) 987-6543',
  experience: 5,
  preferredRoutes: 'City Center, Downtown',
};

export const TRANSPORTER_DEFAULT_VEHICLE = {
  type: 'Delivery Van',
  registration: 'ABC-123-XYZ',
  capacity: '1.5 tons',
  lastService: '2024-09-15',
  nextService: '2025-03-15',
  insuranceExpiry: '2025-06-30',
};

export const TRANSPORTER_DEFAULT_STATS = { completedDeliveries: 127, onTimeRate: 96, rating: 4.8 };

export const TRANSPORTER_DEFAULT_STOPS = [
  { id: 's1', name: 'Warehouse A', address: '123 Storage St', status: 'completed' },
  { id: 's2', name: 'Customer Location', address: '456 Delivery Ave', status: 'current' },
  { id: 's3', name: 'Return Point', address: '789 Return Rd', status: 'pending' },
];

export const TRANSPORTER_DEFAULT_TURNS = [
  { instruction: 'Head north on Main St', distance: '200 m', icon: 'arrow-up' },
  { instruction: 'Turn right onto Oak Ave', distance: '1.2 km', icon: 'turn-right' },
  { instruction: 'Continue straight', distance: '800 m', icon: 'arrow-forward' },
  { instruction: 'Turn left onto Pine Rd', distance: '450 m', icon: 'turn-left' },
];

export const TRANSPORTER_DEFAULT_TASKS = [
  {
    id: '1', status: 'inProgress', priority: 'high', orderId: '#CSCM-8921', eta: '14 min',
    pickup: { time: '09:30 AM', location: 'Warehouse A, Zone 4', completed: true },
    delivery: { time: '10:45 AM - 11:15 AM', location: 'TechSolutions HQ, 4500 Innovation Dr.', city: 'San Francisco, CA 94103', completed: false },
    packages: 5, specialHandling: null,
  },
  {
    id: '2', status: 'pending', priority: 'normal', orderId: '#CSCM-9004', window: '12:00 PM',
    origin: { location: 'Central Logistics Hub, Gate 4', specialHandling: 'Fragile' },
    dueIn: '2h 15m',
  },
  {
    id: '3', status: 'scheduled', priority: 'normal', orderId: '#CSCM-9155', window: '02:30 PM',
    destination: { location: 'Green Valley Market', notes: 'Rear entrance delivery only' },
    tags: ['Cold Chain', 'Signature'],
  },
  {
    id: '4', status: 'completed', priority: 'normal', orderId: '#CSCM-8810', completedTime: '08:45 AM', deliveredTo: 'Reception',
  },
];

export const TRANSPORTER_NEXT_TASK = {
  priority: 'High',
  distance: '2.4 miles away',
  eta: '10:45 AM',
  storeName: 'Whole Foods Market',
  storeAddress: '1200 Broadway, Seattle, WA',
  orderId: '#ORD-9921',
  packages: '15 Boxes',
  weight: '320 lbs',
  type: 'DELIVERY',
};

export const TRANSPORTER_QUICK_STATS = {
  pendingDeliveries: 12,
  pendingDeliveriesProgress: 45,
  scheduledPickups: 4,
  scheduledPickupsProgress: 25,
};

export const TRANSPORTER_ROUTE_PROGRESS = { completed: 4, total: 16 };

export const TRANSPORTER_ALERTS_SECTION = [
  { id: 'a1', type: 'warning', title: 'Traffic Delay Detected', description: 'Estimated +15 mins on I-5 South. Rerouting recommended.' },
  { id: 'a2', type: 'info', title: 'New Pickup Added', description: 'Stop added to route: TechHub Logistics (Order #993)', hasViewDetails: true },
];

export const TRANSPORTER_UPCOMING_STOPS = [
  { id: 's1', time: '11:30', period: 'AM', name: 'Starbucks Reserve', type: 'Delivery', details: '3 Boxes', completed: false },
  { id: 's2', time: '12:15', period: 'PM', name: 'Amazon Hub Locker', type: 'Pickup', details: '12 Packages', completed: false },
  { id: 's3', time: '01:45', period: 'PM', name: 'Best Buy Warehouse', type: 'Delivery', details: 'Pallet', completed: true },
];

export const WHOLESALER_DEFAULT_STATS = {
  todayOrders: 28,
  pendingFulfillment: 14,
  lowStockItems: 7,
  monthlyRevenue: 184250,
  fulfillmentRate: 94,
};

export const WHOLESALER_DEFAULT_TOP_RETAILERS = [
  { id: 'r1', name: 'Fresh Mart', orders: 24, value: 45200 },
  { id: 'r2', name: 'City Grocer', orders: 18, value: 38400 },
  { id: 'r3', name: 'Quick Stop', orders: 15, value: 31200 },
];

export const WHOLESALER_DEFAULT_RECENT_ORDERS = [
  { id: 'WO-1001', retailer: 'Fresh Mart', items: 12, value: 4250, status: 'pending' },
  { id: 'WO-1002', retailer: 'City Grocer', items: 8, value: 3120, status: 'approved' },
  { id: 'WO-1003', retailer: 'Quick Stop', items: 15, value: 5680, status: 'dispatched' },
];

export const WHOLESALER_DEFAULT_INVENTORY = [
  { id: 'W-001', name: 'Basmati Rice', sku: 'RIC-BAS-50', quantity: 240, reorder_point: 100, category: 'Grains', price: 28.50 },
  { id: 'W-002', name: 'Sunflower Oil', sku: 'OIL-SUN-15', quantity: 12, reorder_point: 50, category: 'Oils', price: 42.00 },
  { id: 'W-003', name: 'Sugar', sku: 'SUG-REF-25', quantity: 180, reorder_point: 80, category: 'Sweeteners', price: 18.75 },
  { id: 'W-004', name: 'Tea Bags', sku: 'TEA-BAG-100', quantity: 8, reorder_point: 30, category: 'Beverages', price: 65.00 },
];

export const WHOLESALER_DEFAULT_SHIPMENTS = [
  { id: 'WS-2001', retailer: 'Fresh Mart', items: 12, status: 'in_transit', eta: 'Today 3:30 PM', carrier: 'FedEx', tracking: 'TRK-9821' },
  { id: 'WS-2002', retailer: 'City Grocer', items: 8, status: 'dispatched', eta: 'Tomorrow 10:00 AM', carrier: 'DHL', tracking: 'TRK-9822' },
  { id: 'WS-2003', retailer: 'Quick Stop', items: 15, status: 'delivered', eta: 'Delivered yesterday', carrier: 'UPS', tracking: 'TRK-9820' },
];

export const WHOLESALER_DEFAULT_ORDERS = [
  { id: 'WO-1001', retailer: 'Fresh Mart', items: 12, value: 4250, status: 'pending', priority: 'high', date: '2024-12-15' },
  { id: 'WO-1002', retailer: 'City Grocer', items: 8, value: 3120, status: 'approved', priority: 'normal', date: '2024-12-15' },
  { id: 'WO-1003', retailer: 'Quick Stop', items: 15, value: 5680, status: 'dispatched', priority: 'urgent', date: '2024-12-14' },
  { id: 'WO-1004', retailer: 'Fresh Mart', items: 6, value: 2150, status: 'delivered', priority: 'normal', date: '2024-12-13' },
];

export const WHOLESALER_DEFAULT_BUSINESS = {
  businessName: 'CSCM Wholesale Distribution',
  contactPerson: 'Rajesh Kumar',
  email: 'rajesh@cscm-wholesale.com',
  phone: '+91 98765 43210',
  gstin: 'GSTIN-22AAAAA0000A1Z5',
  address: 'Plot 45, Industrial Area Phase 2, Bangalore 560058',
  pan: 'AAACM1234N',
  yearsInBusiness: 12,
};

export const WHOLESALER_DEFAULT_PROFILE_STATS = {
  totalRetailers: 84,
  monthlyOrders: 312,
  fulfillmentRate: 94,
  avgDeliveryTime: '2.4 hrs',
};

export const SHOPKEEPER_ACTIVE_STATUSES = ['in_transit', 'arriving_soon', 'out_for_delivery', 'delayed'];

export const SHOPKEEPER_CHANNELS = [
  { id: 1, name: 'Shopify', connected: true, lastSync: '2h ago' },
  { id: 2, name: 'Amazon FBA', connected: true, lastSync: '2h ago' },
  { id: 3, name: 'WooCommerce', connected: false, lastSync: 'N/A' },
];

export const SHOPKEEPER_WAREHOUSES = [
  { id: 1, name: 'West Retail', capacity: 42, location: 'CA' },
  { id: 2, name: 'East Coast Hub', capacity: 85, location: 'NY' },
];

export const WHOLESALER_ORDER_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

export const WHOLESALER_PRIORITY_COLORS = { urgent: '#EF4444', high: '#F59E0B', normal: '#3B82F6', low: '#6B7280' };

export const WHOLESALER_SHIPMENT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

export const MESH_ALERT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unacknowledged', label: 'Active' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
];

export const MESH_TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shopkeeper', label: 'Shops' },
  { id: 'wholesaler', label: 'Wholesalers' },
  { id: 'warehouse', label: 'Warehouses' },
  { id: 'transporter', label: 'Transporters' },
];
