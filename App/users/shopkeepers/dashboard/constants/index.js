export const DASHBOARD_CONSTANTS = {
  STOCK_LEVELS: {
    GOOD: { color: '#22C55E', label: 'Good' },
    LOW: { color: '#EAB308', label: 'Low' },
    CRITICAL: { color: '#EF4444', label: 'Critical' },
  },
  
  SHIPMENT_STATUS: {
    IN_TRANSIT: { color: '#FEF3C7', textColor: '#92400E', label: 'In Transit' },
    PREPARING: { color: '#DBEAFE', textColor: '#1E40AF', label: 'Preparing' },
    DELIVERED: { color: '#D1FAE5', textColor: '#065F46', label: 'Delivered' },
  },
  
  ALERT_TYPES: {
    CRITICAL: { color: '#FEE2E2', borderColor: '#EF4444', iconColor: '#EF4444' },
    WARNING: { color: '#FEF3C7', borderColor: '#EAB308', iconColor: '#EAB308' },
    SUCCESS: { color: '#D1FAE5', borderColor: '#22C55E', iconColor: '#22C55E' },
  },
  
  CHART_COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#22C55E',
    TERTIARY: '#A855F7',
  },
  
  QUICK_ACTIONS: [
    {
      id: 'request-stock',
      title: 'Request Stock',
      icon: 'add-circle',
      color: '#4A90E2',
    },
    {
      id: 'confirm-delivery',
      title: 'Confirm Delivery',
      icon: 'checkmark-circle',
      color: '#22C55E',
    },
  ],
  
  TOP_SELLING_ITEMS: [
    { name: 'Wireless Headphones', sold: 142, color: '#3B82F6' },
    { name: 'Phone Cases', sold: 98, color: '#22C55E' },
    { name: 'Power Banks', sold: 76, color: '#A855F7' },
  ],
  
  CHART_DATA: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [45, 52, 38, 67, 73, 89, 95],
  },
};
