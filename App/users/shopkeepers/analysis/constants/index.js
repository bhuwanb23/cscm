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
  stockoutRisk: { label: 'Stockout Risk', suffix: '%', color: '#DC2626' },
  overstockValue: { label: 'Overstock Value', suffix: 'L', prefix: '₹', color: '#EA580C' },
  revenueLost: { label: 'Revenue Lost', suffix: 'L', prefix: '₹', color: '#B91C1C' },
  skuHealth: { label: 'SKU Health Score', suffix: '/100', color: '#16A34A' },
  forecastAccuracy: { label: 'Forecast Accuracy', suffix: '%', color: '#2563EB' },
  workingCapital: { label: 'Working Capital Blocked', suffix: 'L', prefix: '₹', color: '#7C3AED' },
  demandSpikes: { label: 'Demand Spike Alerts', suffix: '', color: '#F97316' },
  transferGain: { label: 'Transfer Gain Potential', suffix: 'L', prefix: '₹', color: '#0EA5E9' },
};