export const ANALYSIS_MODULES = [
  { id: 'inventory', label: 'Inventory Mesh' },
  { id: 'forecast', label: 'Demand Forecast' },
  { id: 'risk', label: 'Risk Engine' },
  { id: 'rebalancing', label: 'Rebalancing Simulation' },
  { id: 'procurement', label: 'Procurement Planning' },
];

export const ANALYSIS_TABS = [
  'Inventory Health',
  'Demand Forecast',
  'Rebalancing',
  'Channel Sync',
  'SKU Intelligence',
  'Procurement',
  'Risk & Alerts',
  'Digital Twins Explorer',
];

export const METRIC_CONFIG = {
  stockoutRisk: { label: 'Stockout Risk', suffix: '%', color: '#EF4444' },
  overstockValue: { label: 'Overstock Value', suffix: 'L', prefix: '₹', color: '#F97316' },
  revenueLost: { label: 'Revenue Lost', suffix: 'L', prefix: '₹', color: '#DC2626' },
  skuHealth: { label: 'SKU Health Score', suffix: '/100', color: '#10B981' },
  forecastAccuracy: { label: 'Forecast Accuracy', suffix: '%', color: '#3B82F6' },
  workingCapital: { label: 'Working Capital Blocked', suffix: 'L', prefix: '₹', color: '#8B5CF6' },
  demandSpikes: { label: 'Demand Spike Alerts', suffix: '', color: '#F59E0B' },
  transferGain: { label: 'Transfer Gain Potential', suffix: 'L', prefix: '₹', color: '#06B6D4' },
};